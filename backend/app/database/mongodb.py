from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME")]
users_collection = db["users"]
resumes_collection = db["resumes"]
chats_collection = db["chats"]