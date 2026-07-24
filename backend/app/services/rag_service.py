from datetime import datetime

from fastapi import HTTPException, status
import os

from app.database.mongodb import resumes_collection
from app.services.embedding_service import embed_query, generate_embedding
from app.services.faiss_service import load_faiss_index, search_faiss_index, create_faiss_index, save_faiss_index
from app.services.gemini_service import ask_gemini
from app.services.prompt_service import build_ats_prompt, build_chat_prompt, build_summary_prompt, build_job_match_prompt, build_interview_prompt
from app.database.mongodb import chats_collection
import re

GLOBAL_KEYWORDS = [
    "best",
    "strongest",
    "compare",
    "summary",
    "summarize",
    "overall",
    "strength",
    "weakness",
    "rank",
    "all projects",
    "ats",
    "compliance",
    "analyze",
    "feedback",
    "review",
    "critique"
]

GLOBAL_PATTERNS = [
    r"\b(summarize|summary|overview|synopsis|outline)\b",
    r"\b(who is|tell me about)\s+(yourself|myself|the candidate|the applicant|your profile|my profile)\b",
    r"\b(profile|bio)\b",
    r"\b(years of experience|total experience|overall experience)\b",
    r"\b(skills|technologies|tools|languages)\s+(overall|list|summary|are their)\b",
    r"\b(education|background|degrees)\s+(overall|list|summary|are their)\b",
    r"\b(entire|whole|full|all)\b.*\b(resume|cv|profile)\b",
    r"^(what|who|tell|give|generate)\b.*\b(candidate|applicant|resume|cv)\b",
    r"\b(project|projects)\b.*\b(best|most|impressive|significant|evaluate|summary)\b",
    r"\b(best|most impressive|most significant)\s+(project|projects|work)\b"
]

def should_use_full_resume(query: str) -> bool:
    query_lower = query.lower().strip()
    for keyword in GLOBAL_KEYWORDS:
        if keyword in query_lower:
            return True
    for pattern in GLOBAL_PATTERNS:
        if re.search(pattern, query_lower):
            return True
    return False

TOP_K = int(os.getenv("TOP_K", 5))

INDEX_FOLDER = "indexes"

def format_chat_history(chat_history):
    text = ""
    for chat in reversed(chat_history):
        response_snippet = chat['response']
        if len(response_snippet) > 300:
            response_snippet = response_snippet[:300] + "..."
        text += f"User: {chat['query']}\n"
        text += f"Assistant: {response_snippet}\n"
    return text.strip()

def get_or_create_faiss_index(user_id: str, resume_data: dict):
    index_path = os.path.join(INDEX_FOLDER, f"{user_id}.index")
    if os.path.exists(index_path):
        return load_faiss_index(index_path)
        
    print("FAISS index not found on disk. Dynamically rebuilding from MongoDB chunks...")
    child_chunks = resume_data.get("child_chunks")
    if not child_chunks:
        chunks = resume_data.get("chunks")
        if not chunks:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No chunks found to rebuild FAISS index.")
        child_texts = chunks
    else:
        child_texts = [child["text"] for child in child_chunks]
        
    try:
        embeddings = generate_embedding(child_texts)
        index = create_faiss_index(embeddings)
        os.makedirs(INDEX_FOLDER, exist_ok=True)
        save_faiss_index(index, index_path)
        print("FAISS index rebuilt and saved successfully.")
        return index
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dynamically rebuild FAISS index: {str(e)}"
        )

def retrieve_context_from_resume(user_id: str, user_query: str, k=5):
    resume_data = resumes_collection.find_one({"user_id": user_id})
    if not resume_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found for the given user ID.")
    
    parent_chunks = resume_data.get("parent_chunks")
    child_chunks = resume_data.get("child_chunks")
    
    # Backwards compatibility fallback if parent/child structures don't exist in MongoDB yet
    if not parent_chunks or not child_chunks:
        chunks = resume_data.get("chunks")
        if not chunks:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No chunks found for the given user ID.")
        
        index = get_or_create_faiss_index(user_id, resume_data)
        query_embedding = embed_query(user_query)
        top_k_indices = search_faiss_index(index, query_embedding, k=TOP_K)
        
        relevant_chunks = [chunks[i] for i in top_k_indices if 0 <= i < len(chunks)]
        if not relevant_chunks:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No relevant chunks found for the given query.")
        return "\n\n".join(relevant_chunks)
    
    index = get_or_create_faiss_index(user_id, resume_data)
    query_embedding = embed_query(user_query)
    top_k_indices = search_faiss_index(index, query_embedding, k=TOP_K)

    print("=" * 50)
    print("FAISS hit indices:", top_k_indices)
    
    # Map retrieved child chunks to their unique parent chunks
    retrieved_parent_indices = []
    for i in top_k_indices:
        if 0 <= i < len(child_chunks):
            parent_idx = child_chunks[i]["parent_idx"]
            if parent_idx not in retrieved_parent_indices:
                retrieved_parent_indices.append(parent_idx)
                
    relevant_parents = []
    for idx in retrieved_parent_indices:
        if 0 <= idx < len(parent_chunks):
            relevant_parents.append(parent_chunks[idx])
            print(f"Retrieved Parent Section {idx}: {parent_chunks[idx][:200]}...")
            
    print("=" * 50)
    
    if not relevant_parents:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No relevant parent chunks found for the given query.")
        
    context = "\n\n".join(relevant_parents)
    return context

def chat_with_resume(user_id: str, user_query: str):
    if should_use_full_resume(user_query):
        resume_data = resumes_collection.find_one({"user_id": user_id})
        if not resume_data or not resume_data.get("resume_text"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found or empty.")
        context = resume_data["resume_text"]
    else:
        context = retrieve_context_from_resume(user_id, user_query)

    history = list(chats_collection.find({"user_id": user_id}).sort("created_at", -1).limit(3))
    history_text = format_chat_history(history)

    print("=" * 50)
    print(context)
    print("=" * 50)

    prompt = build_chat_prompt(context, user_query, history_text)
    response_text = ask_gemini(prompt)

    chats_collection.insert_one({
        "user_id": user_id,
        "query": user_query,
        "response": response_text,
        "created_at": datetime.utcnow()
    })

    return {"response": response_text}

def summarize_resume(user_id: str):
    resume_data = resumes_collection.find_one({"user_id": user_id})
    if not resume_data or not resume_data.get("resume_text"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found or empty.")
    context = resume_data["resume_text"]

    prompt = build_summary_prompt(context)
    response_text = ask_gemini(prompt)

    # Save action to chat history
    chats_collection.insert_one({
        "user_id": user_id,
        "query": "Summarize my resume",
        "response": response_text,
        "created_at": datetime.utcnow()
    })

    return {"summary": response_text}

def match_resume_to_job(user_id: str, job_description: str):
    resume_data = resumes_collection.find_one({"user_id": user_id})
    if not resume_data or not resume_data.get("resume_text"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found or empty.")
    context = resume_data["resume_text"]

    prompt = build_job_match_prompt(context, job_description)
    response_text = ask_gemini(prompt)

    return {"job_match": response_text}

def generate_interview_questions(user_id: str, job_description: str):
    resume_data = resumes_collection.find_one({"user_id": user_id})
    if not resume_data or not resume_data.get("resume_text"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found or empty.")
    context = resume_data["resume_text"]

    prompt = build_interview_prompt(context, job_description)
    response_text = ask_gemini(prompt)

    return {"interview_questions": response_text}

def analyze_resume(user_id: str):
    resume_data = resumes_collection.find_one({"user_id": user_id})
    if not resume_data or not resume_data.get("resume_text"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found or empty.")
    context = resume_data["resume_text"]

    prompt = build_ats_prompt(context)
    response_text = ask_gemini(prompt)

    # Save action to chat history
    chats_collection.insert_one({
        "user_id": user_id,
        "query": "Analyze ATS",
        "response": response_text,
        "created_at": datetime.utcnow()
    })

    return {"analysis": response_text}