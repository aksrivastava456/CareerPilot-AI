from fastapi import (APIRouter, HTTPException, status, Depends, File, UploadFile)
from pydantic import BaseModel

from app.utils.dependencies import get_current_user
from app.services.rag_service import match_resume_to_job

router = APIRouter(prefix="/jobs", tags=["Jobs"])

class JobRequest(BaseModel):
    job_description: str

@router.post("/match")
def match_job(job_request: JobRequest, current_user: dict = Depends(get_current_user)):
    job_match = match_resume_to_job(str(current_user["_id"]), job_request.job_description)
    if not job_match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No job match found.")
    return {"job_match": job_match}