from app.database.mongodb import users_collection
from app.utils.security import (hash_password, verify_password, create_access_token, verify_access_token)

def register_user(name: str, email: str, password: str):
    # Check if the user already exists
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return {"error": "User already exists"}

    # Hash the password
    hashed_password = hash_password(password)

    # Create a new user document
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password
    }

    # Insert the new user into the database
    users_collection.insert_one(new_user)

    return {"message": "User registered successfully"}

def login_user(email: str, password: str):
    # Find the user by email
    user = users_collection.find_one({"email": email})
    if not user:
        return {"error": "Invalid email or password"}

    # Verify the password
    if not verify_password(password, user["password"]):
        return {"error": "Invalid email or password"}

    # Create an access token
    access_token = create_access_token({"sub": str(user["_id"])})

    return {"access_token": access_token, "token_type": "bearer"}