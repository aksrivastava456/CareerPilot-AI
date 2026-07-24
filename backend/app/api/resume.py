from fastapi import (APIRouter, File, UploadFile, Depends, HTTPException, status)

from app.services.upload_service import save_resume
from app.utils.dependencies import get_current_user
from app.services.rag_service import summarize_resume, analyze_resume

from app.database.mongodb import resumes_collection
import os

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload")
def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    return save_resume(file, str(current_user["_id"]))

@router.post("/summarize")
def get_resume_summary(current_user: dict = Depends(get_current_user)):
    return summarize_resume(str(current_user["_id"]))

@router.post("/analyze")
def get_resume_analysis(current_user: dict = Depends(get_current_user)):
    return analyze_resume(str(current_user["_id"]))

@router.get("/status")
def get_resume_status(current_user: dict = Depends(get_current_user)):
    resume_data = resumes_collection.find_one({"user_id": str(current_user["_id"])})
    if resume_data:
        file_path = resume_data.get("file_path", "")
        filename = os.path.basename(file_path) if file_path else "resume.pdf"
        return {"uploaded": True, "filename": filename}
    return {"uploaded": False}