from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth_schema import UserRegister, UserLogin
from app.services.auth_service import register_user, login_user

from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister):
    result = register_user(user.name, user.email, user.password)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    result = login_user(form_data.username, form_data.password)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=result["error"])
    return result

@router.get("/profile")
def get_profile(current_user = Depends(get_current_user)):
    return {
        "name": current_user["name"],
        "email": current_user["email"]
    }