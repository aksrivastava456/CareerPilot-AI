# 🚀 CareerPilot AI

![React](https://img.shields.io/badge/React-19-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![FAISS](https://img.shields.io/badge/FAISS-VectorDB-orange)
![Gemini](https://img.shields.io/badge/Google-Gemini-blueviolet)
![Docker](https://img.shields.io/badge/Docker-Deployed-2496ED)

An AI-powered career assistant that leverages Retrieval-Augmented Generation (RAG) to provide personalized resume insights, ATS evaluation, job matching, and interview preparation.

## 🌐 Live Demo

**Frontend:** https://career-pilot-ai-virid.vercel.app/

**Backend:** https://careerpilot-backend-2tvx.onrender.com

---

# ✨ Features

- 🔐 Secure JWT Authentication
- 📄 Resume Upload (PDF)
- 🤖 Resume-Aware AI Chat
- 📊 ATS Resume Analysis (formatting, keywords, checklists)
- 🎯 Job Description Matching (comparative analysis and scorecard)
- 📝 Resume Summarization
- 💼 AI Practice Interview Question Generator
- 🧠 Retrieval-Augmented Generation (RAG) with automatic FAISS index reconstruction
- 💬 Chat History Management
- 📂 User-specific Resume Storage

---

# 🏗️ System Architecture

```
                               +--------------------+
                               |     React + Vite   |
                               +----------+---------+
                                          |
                                          ▼
                               +--------------------+
                               |  FastAPI Backend   |
                               +----+----------+----+
                                    |          |
            +-----------------------+          +-----------------------+
            |                                                          |
            ▼                                                          ▼
  +------------------+                                       +-------------------+
  |  MongoDB Atlas   |                                       |   AI Services &   |
  |  (Cloud NoSQL)   |                                       |   RAG Pipeline    |
  +------------------+                                       +---------+---------+
  | - User Accounts  |                                                 |
  | - Chat History   |                                                 ▼
  | - Plaintext PDF  |                                       +-------------------+
  | - Parent/Children|                                       |   PyMuPDF (fitz)  |
  |   Text Chunks    |                                       |  Text Extraction  |
  +------------------+                                       +---------+---------+
                                                                       |
                                                                       ▼
                                                             +-------------------+
                                                             |   Gemini Embed    |
                                                             |  API (Vectoring)  |
                                                             +---------+---------+
                                                                       |
                                                                       ▼
                                                             +-------------------+
                                                             |    FAISS Index    |
                                                             |  (Semantic Index) |
                                                             +---------+---------+
                                                                       |
                                                                       ▼
                                                             +-------------------+
                                                             |    Gemini LLM     |
                                                             |   Response Gen    |
                                                             +---------+---------+
                                                                       |
                                                                       ▼
                                                             +-------------------+
                                                             |    AI Response    |
                                                             +-------------------+
```

---

# 🧠 RAG Pipeline

1. User uploads a resume (PDF format).
2. PDF text is extracted using **PyMuPDF (fitz)**.
3. Resume text is split into semantic parent and child chunks.
4. Google Gemini Embedding API (`gemini-embedding-001`) generates vector embeddings.
5. Embeddings are stored in a FAISS vector index.
6. During chat:
   - User query is embedded.
   - Top relevant chunks are matched against the FAISS index.
   - Retrieved context + recent chat history are compiled.
7. Gemini generates a context-aware response.

---

# 🛠 Tech Stack

## Frontend
- **React.js** (JavaScript)
- **Vite** (Build Tool)
- **React Router** (Client Routing)
- **React Markdown** (Native markdown parsing)
- **Vanilla CSS** (Custom premium stylesheets)
- **Fetch API** (Native HTTP client)

## Backend
- **FastAPI** (Python)
- **MongoDB Atlas** (Cloud NoSQL Database)
- **PyMongo** (MongoDB Python Client)
- **JWT Authentication** (python-jose, passlib, bcrypt)
- **FAISS** (Facebook AI Similarity Search - CPU edition)
- **Google Gemini API** (google-genai SDK)
- **Gemini Embedding API** (`gemini-embedding-001`)
- **PyMuPDF (fitz)** (PDF Text Extraction)

## Deployment
- **Frontend** → Vercel (with client-side SPA redirects)
- **Backend** → Render (Docker container deployment)
- **Database** → MongoDB Atlas
- **Containerization** → Docker (python:3.12-slim base)

---

# 📁 Project Structure

```
CareerPilot-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/         # Home, Login, Chat, Jobs, Profile
│   │   ├── utils/         # Auth helper utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── vercel.json        # Single Page App routing configuration
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/           # APIRouters (auth, resume, chat, jobs, interview)
│   │   ├── database/      # MongoDB connection initializer
│   │   ├── services/      # AI, embedding, RAG, FAISS, PDF parsing, uploads
│   │   ├── utils/         # Security, JWT generation, dependency validators
│   │   └── main.py        # FastAPI server entry point
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
├── deployment_guide.md
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/aksrivastava456/CareerPilot-AI.git
cd CareerPilot-AI
```

---

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate
# Windows Command Prompt: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start local server
uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start local dev server
npm run dev
```

---

# 🔑 Environment Variables

## Backend (`backend/.env`)

```ini
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=careerpilot
JWT_SECRET_KEY=your_secure_jwt_secret_key
GEMINI_API_KEYS=your_gemini_api_key
TOP_K=5
```

## Frontend (`frontend/.env`)

```ini
VITE_API_URL=http://localhost:8000
```

---

# 📌 Core Functionalities

## Resume Upload
- Upload PDF resumes
- Parse and extract text using PyMuPDF (fitz)
- Store user-specific resumes in MongoDB
- Generate vector embeddings
- Persist FAISS vector index for efficient semantic retrieval.

---

## Resume Chat
Ask questions like:
- Summarize my experience.
- What are my strongest skills?
- Which projects relate to backend development?
- Do I know React?
- Explain my projects.

---

## ATS Analysis
Provides:
- Overall ATS Score
- Missing Keywords
- Strengths
- Weaknesses
- Suggestions for Improvement

---

## Job Match
Upload a Job Description to receive:
- Match Percentage
- Matching Skills
- Missing Skills
- Personalized Recommendations

---

## Interview Question Generator
Generates interview questions based on:
- Resume content
- Stated skills and projects
- Target Role requirements

---

# 🚀 API Endpoints

## Authentication
- POST `/auth/register`
- POST `/auth/login`

## Resume
- POST `/resume/upload`
- GET `/resume/status`
- POST `/resume/summarize`
- POST `/resume/analyze`

## AI Chat
- POST `/chat/`
- DELETE `/chat/clear`
- GET `/chat/history`

## Job Matcher
- POST `/jobs/match`

## Interview Generator
- POST `/interview/questions`
---

# 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected API Routes
- User-specific Resume Access
- Environment Variable Management

---

# 📈 Future Improvements

- Redis caching
- Background job processing
- Resume version comparison
- Cover letter generation
- AI career roadmap
- Multi-resume management
- Company-specific interview preparation
- CI/CD with GitHub Actions

---

# 👨💻 Author

**Ashutosh Kumar**
- GitHub: [aksrivastava456](https://github.com/aksrivastava456)
- LinkedIn: [Ashutosh Kumar](https://linkedin.com/in/ashutosh-kumar-943b1a201)
