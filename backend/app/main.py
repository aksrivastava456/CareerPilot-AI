from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.resume import router as resume_router
from app.api.chat import router as chat_router
from app.api.jobs import router as jobs_router
from app.api.interview import router as interview_router

app = FastAPI(
    title="CareerPilot AI",
    version="1.0.0",
)

import os

# Get allowed origins from environment (comma-separated) or fallback to defaults
origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://career-pilot-ai-virid.vercel.app"
]

for origin in default_origins:
    if origin not in origins:
        origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(chat_router)
app.include_router(jobs_router)
app.include_router(interview_router)

@app.get("/")
def root():
    return {"message": "Welcome to CareerPilot AI!"}
