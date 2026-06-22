from datetime import datetime
import json
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
        # Additive migration for existing databases created before structured
        # overview extraction existed. Safe to run on every startup.
        try:
            conn.execute("ALTER TABLE rfps ADD COLUMN information TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        conn.commit()


def create_rfp(filename: str, notes: str, summary: str, extracted_text: str, information: dict | None = None) -> int:
    created_at = datetime.utcnow().isoformat()
    information_json = json.dumps(information) if information is not None else None
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO rfps (filename, notes, summary, extracted_text, created_at, information) VALUES (?, ?, ?, ?, ?, ?)",
            (filename, notes, summary, extracted_text, created_at, information_json),
        )
        conn.commit()
        return cursor.lastrowid


def get_rfp_by_id(rfp_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM rfps WHERE id = ?", (rfp_id,)).fetchone()
    if row is None:
        return None
    try:
        information = json.loads(row["information"]) if row["information"] else None
    except (json.JSONDecodeError, TypeError):
        information = None
    return {
        "id": row["id"],
        "filename": row["filename"],
        "notes": row["notes"],
        "summary": row["summary"],
        "extracted_text": row["extracted_text"],
        "created_at": row["created_at"],
        "information": information,
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
