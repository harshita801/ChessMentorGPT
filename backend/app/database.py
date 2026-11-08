import sqlite3

def init_db():
    """Initializes the SQLite database table for user ratings starting at 0."""
    conn = sqlite3.connect("chessmentor.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            rating INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

def get_user_rating(username: str = "player") -> int:
    """Fetches the user's rating, creating a default record of 0 if they don't exist yet."""
    init_db()
    conn = sqlite3.connect("chessmentor.db")
    cursor = conn.cursor()
    cursor.execute("SELECT rating FROM user_progress WHERE username = ?", (username,))
    row = cursor.fetchone()
    
    if row is None:
        cursor.execute("INSERT INTO user_progress (username, rating) VALUES (?, ?)", (username, 0))
        conn.commit()
        rating = 0
    else:
        rating = row[0]
    conn.close()
    return rating

def update_user_rating(new_rating: int, username: str = "player"):
    """Updates and saves the user's rating in the database."""
    conn = sqlite3.connect("chessmentor.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE user_progress SET rating = ? WHERE username = ?", (new_rating, username))
    conn.commit()
    conn.close()