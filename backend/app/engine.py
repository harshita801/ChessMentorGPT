import os
import chess
import chess.engine

# Update this path to point directly to your local Stockfish executable file
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", r"C:\path\to\your\stockfish.exe")

def get_engine():
    """Initializes Stockfish once as a singleton and keeps it warm in memory."""
    if not hasattr(get_engine, "_engine") or get_engine._engine is None:
        try:
            get_engine._engine = chess.engine.SimpleEngine.spawn(STOCKFISH_PATH)
        except Exception as e:
            raise RuntimeError(f"Failed to spawn Stockfish engine at {STOCKFISH_PATH}: {e}")
    return get_engine._engine

def analyze_fen(fen_string: str) -> dict:
    """
    Analyzes a FEN string, returning board state, legality, material counts, 
    legal moves in SAN/UCI, and a quick engine evaluation score.
    """
    try:
        board = chess.Board(fen_string)
        
        # Calculate basic material count
        piece_values = {
            chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
            chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0
        }
        
        white_material = sum(len(board.pieces(piece_type, chess.WHITE)) * val for piece_type, val in piece_values.items())
        black_material = sum(len(board.pieces(piece_type, chess.BLACK)) * val for piece_type, val in piece_values.items())
        
        # Get a quick engine evaluation score (in centipawns) if the game is ongoing
        eval_score = None
        if not board.is_game_over():
            try:
                engine = get_engine()
                info = engine.analyse(board, chess.engine.Limit(time=0.1))
                score = info.get("score")
                if score:
                    eval_score = score.white().score(mate_score=10000)
            except Exception:
                pass

        return {
            "is_valid": True,
            "fen": board.fen(),
            "turn": "White" if board.turn == chess.WHITE else "Black",
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
            "is_stalemate": board.is_stalemate(),
            "legal_moves_san": [board.san(move) for move in board.legal_moves],
            "legal_moves_uci": [move.uci() for move in board.legal_moves],
            "material_balance": {
                "white": white_material,
                "black": black_material,
                "difference": white_material - black_material
            },
            "evaluation_cp": eval_score
        }
    except ValueError:
        return {"is_valid": False, "error": "Invalid FEN string"}

def get_best_move(fen_string: str, time_limit: float = 0.5):
    """Asks Stockfish for the best move in UCI format for the given FEN position."""
    board = chess.Board(fen_string)
    if board.is_game_over():
        return None
        
    engine = get_engine()
    result = engine.play(board, chess.engine.Limit(time=time_limit))
    return result.move