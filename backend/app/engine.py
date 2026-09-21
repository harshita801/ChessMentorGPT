import chess

def analyze_fen(fen_string: str) -> dict:
    try:
        board = chess.Board(fen_string)
        
        # Calculate basic material count
        piece_values = {
            chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
            chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0
        }
        
        white_material = sum(len(board.pieces(piece_type, chess.WHITE)) * val for piece_type, val in piece_values.items())
        black_material = sum(len(board.pieces(piece_type, chess.BLACK)) * val for piece_type, val in piece_values.items())
        
        return {
            "is_valid": True,
            "turn": "White" if board.turn == chess.WHITE else "Black",
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
            "is_stalemate": board.is_stalemate(),
            "legal_moves": [board.san(move) for move in board.legal_moves],
            "material_balance": {
                "white": white_material,
                "black": black_material,
                "difference": white_material - black_material
            }
        }
    except ValueError:
        return {"is_valid": False, "error": "Invalid FEN string"}