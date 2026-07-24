from google import genai
import os
from google.genai.errors import ClientError
from fastapi import HTTPException, status

api_keys_str = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
API_KEYS = [key.strip() for key in api_keys_str.split(",") if key.strip()]

current_key_index = 0

def get_current_client():
    global current_key_index
    if not API_KEYS:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No Gemini API configured in .env")
    key = API_KEYS[current_key_index]
    return genai.Client(api_key=key)

def rotate_key():
    global current_key_index
    if len(API_KEYS) > 1:
        current_key_index = (current_key_index + 1) % len(API_KEYS)
        print(f"Switched to Gemini Key {current_key_index + 1}/{len(API_KEYS)}")

def ask_gemini(prompt):
    attempts = len(API_KEYS)
    
    for attempt in range(attempts):
        try:
            client = get_current_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except ClientError as e:
            # If it's a rate limit or daily quota error, rotate and retry
            if e.code == 429:
                print(f"WARNING: Key index {current_key_index} hit quota limits. Rotating...")
                rotate_key()
                
                # If we have tried all keys and they are all exhausted
                if attempt == attempts - 1:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="All configured Gemini API keys have exceeded their quotas. Please try again later."
                    )
                continue
                
            # If it's another client error (e.g. bad request), raise it immediately
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Error using Gemini: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(e)}"
            )