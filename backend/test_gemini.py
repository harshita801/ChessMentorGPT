import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print("1. Key found in .env:", "YES" if key else "NO")

if key:
    try:
        client = genai.Client(api_key=key)
        res = client.models.generate_content(
            model='gemini-3.6-flash',
            contents='Say hello in one word'
        )
        print("2. API Response:", res.text.strip())
        print("✅ GEMINI IS WORKING PERFECTLY!")
    except Exception as e:
        print("❌ API CALL FAILED:", e)