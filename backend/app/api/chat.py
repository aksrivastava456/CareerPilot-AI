from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.rag_service import chat_with_resume
from app.utils.dependencies import get_current_user
from app.database.mongodb import chats_collection

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    question: str

@router.post("/")
def chat(chat_request: ChatRequest, current_user: dict = Depends(get_current_user)):
    answer = chat_with_resume(str(current_user["_id"]), chat_request.question)
    if not answer:
        raise HTTPException(status_code=404, detail="No answer found.")
    return {"answer": answer}

@router.delete("/clear")
def clear_chat_history(current_user: dict = Depends(get_current_user)):
    uid = current_user["_id"]
    uid_str = str(uid)
    
    # Delete matching either string user_id or ObjectId user_id
    res = chats_collection.delete_many({
        "$or": [
            {"user_id": uid_str},
            {"user_id": uid}
        ]
    })
    return {"message": "Chat history cleared successfully", "deleted_count": res.deleted_count}

@router.get("/history")
def get_chat_history(current_user: dict = Depends(get_current_user)):
    uid = current_user["_id"]
    uid_str = str(uid)
    
    # Fetch chronologically matching either string or ObjectId
    chats = list(chats_collection.find({
        "$or": [
            {"user_id": uid_str},
            {"user_id": uid}
        ]
    }).sort("created_at", -1).limit(20))
    chats.reverse()
    
    formatted_history = []
    for chat in chats:
        # Use "query" key from MongoDB schema instead of "question"
        formatted_history.append({"role": "user", "content": chat.get("query", "")})
        
        ai_resp = chat.get("response", "")
        if isinstance(ai_resp, dict):
            ai_resp = ai_resp.get("response", "")
        formatted_history.append({"role": "assistant", "content": ai_resp})
        
    return {"history": formatted_history}