from fastapi import UploadFile, HTTPException, status
import os, shutil

from app.database.mongodb import resumes_collection

from app.services.pdf_service import extract_text_from_pdf
from app.services.parsing_service import parse_sections
from app.services.embedding_service import generate_embedding
from app.services.faiss_service import create_faiss_index, save_faiss_index

UPLOAD_FOLDER = "uploads"
INDEX_FOLDER = "indexes"

def save_resume(file: UploadFile, user_id: str):
    if (file.content_type != "application/pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Only PDF files are allowed.")
    user_folder = os.path.join(UPLOAD_FOLDER, user_id)
    os.makedirs(user_folder, exist_ok=True)
    file_path = os.path.join(user_folder, "resume.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_data = extract_text_from_pdf(file_path)
    if not resume_data.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the PDF. Please upload a PDF with selectable text."
        )
    
    sections = parse_sections(resume_data)
    from app.services.chunk_service import create_parent_child_chunks
    parent_chunks, child_chunks = create_parent_child_chunks(sections)
    
    # We generate embeddings and build FAISS index on child chunks
    child_texts = [child["text"] for child in child_chunks]
    embeddings = generate_embedding(child_texts)
    index = create_faiss_index(embeddings)
    
    index_folder = os.path.join(INDEX_FOLDER, f"{user_id}.index")
    os.makedirs(INDEX_FOLDER, exist_ok=True)
    save_faiss_index(index, index_folder)
    
    resumes_collection.update_one(
        {"user_id": user_id},
        {"$set" : {
            "user_id": user_id,
            "file_path": file_path,
            "resume_text": resume_data,
            "sections": sections,
            "parent_chunks": parent_chunks,
            "child_chunks": child_chunks,
            "chunks": child_texts,  # backwards compatible fallback
            "faiss_index": index_folder
        }}, upsert=True
    )
    return {"message": "Resume uploaded and processed successfully."}