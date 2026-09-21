import os
from groq import Groq

def generate_rag_response(prompt: str, context_documents: list) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Groq API Key is missing. Please check your .env file."

    client = Groq(api_key=api_key)
    
    # Combine retrieved document snippets into context
    context_str = "\n---\n".join(context_documents) if context_documents else "No context found."
    
    system_prompt = (
        "You are ChessMentorGPT, an expert AI chess coach. "
        "Answer the user's question using the provided context from chess literature and guidelines. "
        "Provide clear, actionable, and structured advice."
    )
    
    user_prompt = f"Context:\n{context_str}\n\nUser Question: {prompt}"

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error connecting to Groq API: {str(e)}"