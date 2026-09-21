import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    STOCKFISH_PATH: str = os.getenv("STOCKFISH_PATH", "")

settings = Settings()