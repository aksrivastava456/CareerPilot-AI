from langchain_text_splitters import RecursiveCharacterTextSplitter

def create_parent_child_chunks(sections: dict[str, str], child_chunk_size=150, child_chunk_overlap=30):
    """
    Parent-Child Retrieval.
    Parent chunks are the full parsed sections (e.g., Projects, Experience).
    Child chunks are smaller sub-chunks from each section for precise semantic vector search.
    """
    parent_chunks = []
    child_chunks = []
    
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=child_chunk_size,
        chunk_overlap=child_chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    
    for section_name, content in sections.items():
        parent_text = f"[Section: {section_name.title()}]\n{content}"
        parent_idx = len(parent_chunks)
        parent_chunks.append(parent_text)
        
        sub_chunks = child_splitter.split_text(content)
        for sub in sub_chunks:
            child_text = f"[{section_name.title()}] {sub}"
            child_chunks.append({
                "text": child_text,
                "parent_idx": parent_idx
            })
            
    return parent_chunks, child_chunks

