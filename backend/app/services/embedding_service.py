from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(chunks):
    return model.encode(chunks, convert_to_numpy=True)

def embed_query(query: str):
    return model.encode([query], convert_to_numpy=True)