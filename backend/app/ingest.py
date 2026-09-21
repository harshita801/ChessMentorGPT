from chromadb.utils import embedding_functions

# Use standard sentence-transformers instead of the heavy ONNX tarball
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
) 