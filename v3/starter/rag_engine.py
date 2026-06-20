# =============================================================
#  RFPilot v3 — starter/rag_engine.py
#  RAG Pipeline: chunk → embed → store → retrieve → generate
#
#  Embedding model : OpenAI text-embedding-ada-002 (1536 dims)
#  Vector store    : PostgreSQL + pgvector (<=> cosine distance)
#  Chat model      : GPT-4o
# =============================================================

import os
import re
import uuid
from typing import Optional
from openai import OpenAI
from sqlalchemy import text
from sqlalchemy.orm import Session

import models

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
EMBEDDING_MODEL = "text-embedding-ada-002"  # must match Vector(1536) in models.py
CHAT_MODEL      = "gpt-4o"
CHUNK_SIZE      = 220   # words per chunk
CHUNK_OVERLAP   = 40    # word overlap between consecutive chunks


# ─────────────────────────────────────────────
#  1. Chunking — split raw text into overlapping word windows
# ─────────────────────────────────────────────

def chunk_text(raw_text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    cleaned = re.sub(r"\s+", " ", raw_text).strip()
    words   = cleaned.split()
    chunks  = []
    start   = 0
    while start < len(words):
        piece = " ".join(words[start : start + chunk_size])
        if piece.strip():
            chunks.append(piece)
        start += chunk_size - overlap
    return chunks


# ─────────────────────────────────────────────
#  2. Embedding — single OpenAI call per chunk
# ─────────────────────────────────────────────

def embed_text(text_to_embed: str) -> list[float]:
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text_to_embed.replace("\n", " "),
    )
    return response.data[0].embedding


# ─────────────────────────────────────────────
#  3. Ingestion — chunk + embed + store in document_chunks
# ─────────────────────────────────────────────

def ingest_document(
    db: Session,
    rfp_id: uuid.UUID,
    rfp_document_id: uuid.UUID,
    raw_text: str,
) -> list[models.DocumentChunk]:
    # Delete any prior chunks for this document before re-ingesting
    db.query(models.DocumentChunk).filter_by(rfp_document_id=rfp_document_id).delete()
    db.commit()

    pieces = chunk_text(raw_text)
    saved  = []

    for idx, piece in enumerate(pieces):
        vector = embed_text(piece)
        chunk  = models.DocumentChunk(
            rfp_document_id=rfp_document_id,
            rfp_id=rfp_id,
            chunk_index=idx,
            content=piece,
            embedding=vector,
            token_count=len(piece.split()),
        )
        db.add(chunk)
        saved.append(chunk)

    db.commit()
    return saved


# ─────────────────────────────────────────────
#  4. Retrieval — pgvector cosine similarity search
#     <=> operator = cosine distance (0=identical)
#     similarity   = 1 - distance
# ─────────────────────────────────────────────

def retrieve_chunks(db: Session, rfp_id: uuid.UUID, query: str, top_k: int = 5) -> list[dict]:
    query_vector = embed_text(query)

    sql = text("""
        SELECT id, chunk_index, content, token_count,
               1 - (embedding <=> :query_vector) AS similarity
        FROM document_chunks
        WHERE rfp_id = :rfp_id
        ORDER BY embedding <=> :query_vector
        LIMIT :top_k
    """)

    rows = db.execute(
        sql,
        {"query_vector": str(query_vector), "rfp_id": str(rfp_id), "top_k": top_k},
    ).fetchall()

    return [
        {
            "chunk_id"   : str(row.id),
            "chunk_index": row.chunk_index,
            "content"    : row.content,
            "score"      : round(float(row.similarity), 4),
            "token_count": row.token_count,
        }
        for row in rows
    ]


# ─────────────────────────────────────────────
#  5. Generation — GPT-4o with retrieved context + chat history
# ─────────────────────────────────────────────

def generate_answer(
    query: str,
    retrieved_chunks: list[dict],
    chat_history: Optional[list[dict]] = None,
) -> dict:
    context_block = "\n\n".join([
        f"[Source {i+1} — chunk #{c['chunk_index']}, similarity={c['score']}]\n{c['content']}"
        for i, c in enumerate(retrieved_chunks)
    ])

    system_prompt = f"""You are RFPilot AI Copilot, an expert RFP analyst assistant.

Answer the user's question using ONLY the context provided below.
If the answer is not in the context, say so explicitly.
Cite sources as [Source 1], [Source 2], etc.

--- CONTEXT FROM RFP DOCUMENT ---
{context_block}
---------------------------------
"""
    messages = [{"role": "system", "content": system_prompt}]
    if chat_history:
        messages.extend(chat_history)
    messages.append({"role": "user", "content": query})

    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.2,
        max_tokens=1000,
    )

    return {
        "answer"       : response.choices[0].message.content,
        "prompt_tokens": response.usage.prompt_tokens,
        "context_used" : [c["chunk_id"] for c in retrieved_chunks],
    }


# ─────────────────────────────────────────────
#  6. Full pipeline — orchestrates retrieve → generate → persist
#     Writes each turn to ai_chat_history for multi-turn support
# ─────────────────────────────────────────────

def ask_rfp(
    db: Session,
    session_id: str,
    user_id: uuid.UUID,
    rfp_id: uuid.UUID,
    question: str,
    top_k: int = 5,
) -> models.AIChatHistory:
    chunks = retrieve_chunks(db, rfp_id, question, top_k)

    # Load prior turns for this session (multi-turn context, max 10 back)
    prior_rows = (
        db.query(models.AIChatHistory)
        .filter_by(session_id=session_id)
        .order_by(models.AIChatHistory.created_at.asc())
        .limit(10)
        .all()
    )
    chat_history = []
    for row in prior_rows:
        chat_history.append({"role": "user",      "content": row.user_message})
        chat_history.append({"role": "assistant", "content": row.ai_response})

    result = generate_answer(question, chunks, chat_history)

    row = models.AIChatHistory(
        session_id    =session_id,
        user_id       =user_id,
        rfp_id        =rfp_id,
        user_message  =question,
        ai_response   =result["answer"],
        prompt_tokens =result["prompt_tokens"],
        context_used  =result["context_used"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
