from fastapi import (APIRouter, Depends, HTTPException, status)
from pydantic import BaseModel

from app.utils.dependencies import get_current_user
from app.services.rag_service import generate_interview_questions

router = APIRouter(prefix="/interview", tags=["Interview"])

class InterviewRequest(BaseModel):
    job_description: str

@router.post("/questions")
def get_interview_questions(interview_request: InterviewRequest, current_user: dict = Depends(get_current_user)):
    questions = generate_interview_questions(str(current_user["_id"]), interview_request.job_description)
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No interview questions found.")
    return {"interview_questions": questions}