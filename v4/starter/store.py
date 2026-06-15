from datetime import datetime
import sqlite3
from pathlib import Path

# Use a dedicated auth database to preserve existing legacy lesson9.db content.
DB_PATH = Path(__file__).resolve().parent / "auth.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                hashed_password TEXT NOT NULL,
                role TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def row_to_user(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "hashed_password": row["hashed_password"],
        "role": row["role"],
        "created_at": row["created_at"],
    }


def get_user_by_email(email: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    return row_to_user(row)


def create_user(username: str, email: str, hashed_password: str, role: str | None = None) -> dict:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO users (username, email, hashed_password, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (username, email, hashed_password, role, datetime.utcnow().isoformat()),
        )
        conn.commit()
    user = get_user_by_email(email)
    if user is None:
        raise RuntimeError("Failed to create user")
    return user


# Initialize the database when this module is imported.
init_db()
