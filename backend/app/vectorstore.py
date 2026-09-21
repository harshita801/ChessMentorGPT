import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from sentence_transformers import SentenceTransformer

# Initialize local persistent storage
chroma_client = chromadb.PersistentClient(path="./data/processed/chroma_db")

# Initialize local embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

class LocalEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        embeddings = embedding_model.encode(input)
        return embeddings.tolist()

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="chess_knowledge",
    embedding_function=LocalEmbeddingFunction()
)

def add_documents(docs: list[str], ids: list[str], metadatas: list[dict] = None):
    collection.add(
        documents=docs,
        ids=ids,
        metadatas=metadatas
    )

def query_similar(query_text: str, n_results: int = 3):
    return collection.query(
        query_texts=[query_text],
        n_results=n_results
    )