from datetime import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "rfps.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rfps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                notes TEXT,
                summary TEXT,
                extracted_text TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def create_rfp(filename: str, notes: str, summary: str, extracted_text: str) -> int:
    created_at = datetime.utcnow().isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO rfps (filename, notes, summary, extracted_text, created_at) VALUES (?, ?, ?, ?, ?)",
            (filename, notes, summary, extracted_text, created_at),
        )
        conn.commit()
        return cursor.lastrowid


def get_rfp_by_id(rfp_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM rfps WHERE id = ?", (rfp_id,)).fetchone()
    if row is None:
        return None
    return {
        "id": row["id"],
        "filename": row["filename"],
        "notes": row["notes"],
        "summary": row["summary"],
        "extracted_text": row["extracted_text"],
        "created_at": row["created_at"],
    }

#اضافة علشان يقدر يبحث بداخل العقود

def get_all_rfps() -> list:
    with get_connection() as conn:
        rows = conn.execute("SELECT id, filename, notes, summary, created_at FROM rfps ORDER BY id DESC").fetchall()
    return [
        {"id": row["id"], "filename": row["filename"], "notes": row["notes"], "summary": row["summary"], "created_at": row["created_at"]}
        for row in rows
    ]

# Initialize the database when imported
init_db()
