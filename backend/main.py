import os
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ChessMentorGPT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_KEY) if GROQ_KEY else None

class EngineRequest(BaseModel):
    fen: str
    player_elo: int = 800

class QueryRequest(BaseModel):
    prompt: str
    fen: str = ""

def analyze_board_position(fen_str: str) -> str:
    try:
        board = chess.Board(fen_str)
    except Exception:
        return "Standard starting position."

    active_color = "White" if board.turn == chess.WHITE else "Black"
    winner_color = "Black" if board.turn == chess.WHITE else "White"

    if board.is_checkmate():
        return f"GAME OVER! Checkmate! {winner_color} HAS WON THE GAME! 🎉"
    if board.is_stalemate() or board.is_game_over():
        return "GAME OVER! The match ended in a draw! 🤝"

    legal_moves = [board.san(m) for m in board.legal_moves]
    captures = [board.san(m) for m in board.legal_moves if board.is_capture(m)]
    checks = [board.san(m) for m in board.legal_moves if board.gives_check(m)]
    
    analysis = f"Active Turn: {active_color}. Strategic Legal Options: {', '.join(legal_moves[:6])}."
    if board.is_check():
        analysis += f" CRITICAL WARNING: {active_color}'s King is in CHECK!"
    if captures:
        analysis += f" Available Captures: {', '.join(captures[:4])}."
    if checks:
        analysis += f" Attacking Checks: {', '.join(checks[:3])}."
        
    return analysis

@app.post("/api/engine-move")
def get_engine_move(req: EngineRequest):
    try:
        board = chess.Board(req.fen)
        if board.is_game_over():
            return {"error": "Game over", "result": board.result()}

        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return {"error": "No legal moves available"}

        tactical_moves = [m for m in legal_moves if board.is_capture(m) or board.gives_check(m)]
        tactical_chance = min(max((req.player_elo - 500) / 1000.0, 0.2), 0.85)

        if tactical_moves and random.random() < tactical_chance:
            chosen_move = random.choice(tactical_moves)
        else:
            chosen_move = random.choice(legal_moves)

        return {"move": chosen_move.uci()}
    except Exception as e:
        print(f"Engine move error: {e}")
        try:
            board = chess.Board(req.fen)
            moves = list(board.legal_moves)
            if moves:
                return {"move": moves[0].uci()}
        except Exception:
            pass
        return {"error": str(e)}

@app.post("/api/query")
def process_query(req: QueryRequest):
    position_analysis = analyze_board_position(req.fen)

    if not client or not GROQ_KEY:
        print("❌ GROQ_API_KEY is missing from backend/.env!")
        return {"llm_response": "Coach note: Please ensure GROQ_API_KEY is defined in your backend .env file."}

    sys_instruction = (
        "You are ChessMentorGPT, an energetic, warm, and highly engaging chess coach. "
        "Your mission is to talk to the player naturally like a friendly human mentor, answer their questions, and help them learn chess.\n\n"
        "STRICT COACHING GUIDELINES:\n"
        "1. Write in complete, natural human sentences. Finish every thought cleanly.\n"
        "2. Never output raw notation dumps, engine FEN data, or code backticks.\n"
        "3. If asked about a tactic/trick (e.g., Fork, Pin, En Passant, Scholar's Mate), explain what it is and how to use it clearly.\n"
        "4. If asked 'which move should I make?' or 'what to do next?', look at the Strategic Legal Options provided and suggest ONE good move idea in plain words.\n"
        "5. Keep responses concise (2 to 3 full sentences)."
    )

    user_messages = [
        {"role": "system", "content": sys_instruction},
        {
            "role": "user",
            "content": f"PLAYER MESSAGE: '{req.prompt}'\n\n(Current Board Context: {position_analysis})"
        }
    ]

    # Models list to fall back sequentially if a rate limit or model drop occurs
    models_to_try = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-20b"
    ]

    for model_name in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=user_messages,
                temperature=0.7,
                max_tokens=400,  # Increased token limit to eliminate cut-offs
            )
            res = completion.choices[0].message.content
            if res and res.strip():
                return {"llm_response": res.strip()}
        except Exception as err:
            print(f"⚠️ Groq Model ({model_name}) error: {err}")

    # Friendly conversational fallback instead of raw code output
    return {
        "llm_response": "I'm right here with you! Take a look at controlling the center or developing one of your knights or bishops toward an active square."
    }