import numpy as np
from fastapi import HTTPException, status
from google.genai.errors import ClientError
from app.services.gemini_service import get_current_client, rotate_key, API_KEYS

def generate_embedding(chunks):
    if not chunks:
        return np.array([], dtype=np.float32)
        
    attempts = len(API_KEYS)
    for attempt in range(attempts):
        try:
            client = get_current_client()
            response = client.models.embed_content(
                model="text-embedding-004",
                contents=chunks
            )
            embeddings = [e.values for e in response.embeddings]
            return np.array(embeddings, dtype=np.float32)
        except ClientError as e:
            if e.code == 429:
                print("Quota exceeded for embedding. Rotating key...")
                rotate_key()
                if attempt == attempts - 1:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="All Gemini API keys exceeded quota for embeddings."
                    )
                continue
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Gemini Embedding Error: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Embedding Error: {str(e)}"
            )

def embed_query(query: str):
    attempts = len(API_KEYS)
    for attempt in range(attempts):
        try:
            client = get_current_client()
            response = client.models.embed_content(
                model="text-embedding-004",
                contents=query
            )
            return np.array([response.embeddings[0].values], dtype=np.float32)
        except ClientError as e:
            if e.code == 429:
                print("Quota exceeded for embedding. Rotating key...")
                rotate_key()
                if attempt == attempts - 1:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="All Gemini API keys exceeded quota for query embedding."
                    )
                continue
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Gemini Query Embedding Error: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Query Embedding Error: {str(e)}"
            )