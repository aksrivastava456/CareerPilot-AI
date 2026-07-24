from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.utils.security import verify_access_token
from app.database.mongodb import users_collection
from bson import ObjectId
from bson.errors import InvalidId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except InvalidId:
        raise credentials_exception
    if user is None:
        raise credentials_exception

    return user