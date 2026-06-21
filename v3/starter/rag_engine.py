# =============================================================
#  RFPilot v3 — rag_engine.py
#  RAG Pipeline + Tool-Calling Chat
# =============================================================

import os
import re
import json
import uuid
from typing import Optional
from openai import OpenAI
from sqlalchemy import text
from sqlalchemy.orm import Session

import models

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
EMBEDDING_MODEL = "text-embedding-ada-002"
CHAT_MODEL      = "gpt-4o"
CHUNK_SIZE      = 220
CHUNK_OVERLAP   = 40
MAX_EMBED_BATCH = 512
MAX_TOOL_ROUNDS = 5   # prevent infinite tool-call loops


# ── Tool definitions (OpenAI function calling schema) ─────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_rfp_count",
            "description": (
                "Return the exact count of RFPs in the database, optionally filtered by status or client. "
                "ALWAYS use this tool for questions like 'how many RFPs', 'total RFPs', 'count of RFPs'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by RFP status. Valid values: draft, under_review, bid_decision, submitted, won, lost, no_bid",
                    },
                    "client": {
                        "type": "string",
                        "description": "Filter by client/organization name (case-insensitive partial match).",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_rfps",
            "description": (
                "List RFPs with their titles, statuses, clients, and deadlines. "
                "Use for questions like 'list all RFPs', 'which RFPs are under review', 'show me RFPs by client X'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by RFP status. Valid values: draft, under_review, bid_decision, submitted, won, lost, no_bid",
                    },
                    "client": {
                        "type": "string",
                        "description": "Filter by client/organization name (partial match).",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_rfp_content",
            "description": (
                "Search inside RFP document text using semantic similarity. "
                "Use for questions about specific content: deadlines, requirements, scope, budget, contact details, evaluation criteria. "
                "Optionally restrict to one RFP or search across all documents."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query — what you are looking for inside the document(s).",
                    },
                    "rfp_id": {
                        "type": "string",
                        "description": "Optional UUID of a specific RFP. Omit to search across all uploaded RFPs.",
                    },
                },
                "required": ["query"],
            },
        },
    },
]

SYSTEM_PROMPT = """You are RFPilot AI Copilot — an expert RFP management assistant with access to a live database.

You have three tools:
• get_rfp_count  — counts RFPs from the database (with optional filters)
• list_rfps      — fetches RFP titles, statuses, clients, and deadlines from the database
• search_rfp_content — searches inside RFP document text (requirements, deadlines, scope, etc.)

Rules you MUST follow:
1. For ANY question about counts or totals ("how many", "total", "count") → call get_rfp_count. NEVER estimate counts from document chunks.
2. For questions about lists or multiple RFPs ("list all", "which RFPs", "show me RFPs that...") → call list_rfps.
3. For questions about content inside a specific RFP ("what is the deadline", "what are the requirements") → call search_rfp_content.
4. You may call multiple tools in sequence to answer complex questions.
5. If you are unsure whether a question is about one RFP or all RFPs, ask for clarification before answering.
6. NEVER make up data — only use what the tools return.
"""


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_text(raw_text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    cleaned = re.sub(r"\s+", " ", raw_text).strip()
    words   = cleaned.split()
    chunks, start = [], 0
    while start < len(words):
        piece = " ".join(words[start : start + chunk_size])
        if piece.strip():
            chunks.append(piece)
        start += chunk_size - overlap
    return chunks


# ── Embedding (batched) ───────────────────────────────────────────────────────

def embed_texts(texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    for i in range(0, len(texts), MAX_EMBED_BATCH):
        batch = [t.replace("\n", " ") for t in texts[i : i + MAX_EMBED_BATCH]]
        resp  = client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        vectors.extend(item.embedding for item in resp.data)
    return vectors


def embed_text(text_to_embed: str) -> list[float]:
    return embed_texts([text_to_embed])[0]


# ── Ingestion ─────────────────────────────────────────────────────────────────

def ingest_document(
    db: Session,
    rfp_id: uuid.UUID,
    rfp_document_id: uuid.UUID,
    raw_text: str,
) -> list[models.DocumentChunk]:
    db.query(models.DocumentChunk).filter_by(rfp_document_id=rfp_document_id).delete()
    db.commit()

    pieces = chunk_text(raw_text)
    if not pieces:
        return []

    vectors = embed_texts(pieces)
    saved   = []

    for idx, (piece, vector) in enumerate(zip(pieces, vectors)):
        chunk = models.DocumentChunk(
            rfp_document_id=rfp_document_id,
            rfp_id     =rfp_id,
            chunk_index=idx,
            content    =piece,
            embedding  =vector,
            token_count=len(piece.split()),
        )
        db.add(chunk)
        saved.append(chunk)

    db.commit()
    return saved


# ── Retrieval ─────────────────────────────────────────────────────────────────

def retrieve_chunks(
    db:     Session,
    query:  str,
    top_k:  int = 5,
    rfp_id: Optional[uuid.UUID] = None,
) -> list[dict]:
    query_vector = embed_text(query)

    if rfp_id is not None:
        sql    = text("""
            SELECT dc.id, dc.chunk_index, dc.content, dc.token_count, dc.rfp_id,
                   r.title AS rfp_title,
                   1 - (dc.embedding <=> :qv) AS similarity
            FROM   document_chunks dc
            JOIN   rfps r ON r.id = dc.rfp_id
            WHERE  dc.rfp_id = :rfp_id
            ORDER  BY dc.embedding <=> :qv
            LIMIT  :k
        """)
        params = {"qv": str(query_vector), "rfp_id": str(rfp_id), "k": top_k}
    else:
        sql    = text("""
            SELECT dc.id, dc.chunk_index, dc.content, dc.token_count, dc.rfp_id,
                   r.title AS rfp_title,
                   1 - (dc.embedding <=> :qv) AS similarity
            FROM   document_chunks dc
            JOIN   rfps r ON r.id = dc.rfp_id
            ORDER  BY dc.embedding <=> :qv
            LIMIT  :k
        """)
        params = {"qv": str(query_vector), "k": top_k}

    rows = db.execute(sql, params).fetchall()
    return [
        {
            "chunk_id"   : str(row.id),
            "chunk_index": row.chunk_index,
            "content"    : row.content,
            "score"      : round(float(row.similarity), 4),
            "token_count": row.token_count,
            "rfp_id"     : str(row.rfp_id),
            "rfp_title"  : row.rfp_title,
        }
        for row in rows
    ]


# ── Tool execution ────────────────────────────────────────────────────────────

def _execute_tool(db: Session, tool_call, context_rfp_id: Optional[uuid.UUID] = None) -> str:
    name = tool_call.function.name
    try:
        args = json.loads(tool_call.function.arguments or "{}")
    except json.JSONDecodeError:
        args = {}

    if name == "get_rfp_count":
        q = db.query(models.RFP)
        if args.get("status"):
            q = q.filter(models.RFP.status == args["status"].lower().replace(" ", "_"))
        if args.get("client"):
            # join AISummary and filter by organization in objectives JSONB
            q = q.join(models.AISummary, models.AISummary.rfp_id == models.RFP.id, isouter=True)
        count = q.count()
        return json.dumps({"count": count})

    elif name == "list_rfps":
        q = db.query(models.RFP)
        if args.get("status"):
            q = q.filter(models.RFP.status == args["status"].lower().replace(" ", "_"))
        rfps = q.order_by(models.RFP.created_at.desc()).all()
        result = []
        for r in rfps:
            s    = db.query(models.AISummary).filter_by(rfp_id=r.id).first()
            info = (s.objectives or {}) if s else {}
            # Client filter (post-query)
            org = info.get("organization", "")
            if args.get("client") and args["client"].lower() not in org.lower():
                continue
            result.append({
                "id"      : str(r.id),
                "title"   : r.title,
                "status"  : r.status,
                "client"  : org or None,
                "deadline": info.get("submissionDeadline"),
            })
        return json.dumps(result)

    elif name == "search_rfp_content":
        query    = args.get("query", "")
        rfp_arg  = args.get("rfp_id") or (str(context_rfp_id) if context_rfp_id else None)
        rfp_uuid = None
        if rfp_arg:
            try:
                rfp_uuid = uuid.UUID(rfp_arg)
            except ValueError:
                pass
        chunks = retrieve_chunks(db, query, top_k=5, rfp_id=rfp_uuid)
        simplified = [
            {
                "rfp_title": c["rfp_title"],
                "content"  : c["content"][:600],
                "score"    : c["score"],
            }
            for c in chunks
        ]
        return json.dumps(simplified)

    return json.dumps({"error": f"Unknown tool: {name}"})


# ── History helpers ───────────────────────────────────────────────────────────

def _load_history(db: Session, session_id: str) -> list[dict]:
    rows = (
        db.query(models.AIChatHistory)
        .filter_by(session_id=session_id)
        .order_by(models.AIChatHistory.created_at.asc())
        .limit(10)
        .all()
    )
    history = []
    for r in rows:
        history.append({"role": "user",      "content": r.user_message})
        history.append({"role": "assistant", "content": r.ai_response})
    return history


def _save_turn(
    db: Session,
    session_id: str,
    user_id: uuid.UUID,
    rfp_id: Optional[uuid.UUID],
    question: str,
    answer: str,
    prompt_tokens: int = 0,
    context_used: list = None,
) -> models.AIChatHistory:
    row = models.AIChatHistory(
        session_id   =session_id,
        user_id      =user_id,
        rfp_id       =rfp_id,
        user_message =question,
        ai_response  =answer,
        prompt_tokens=prompt_tokens,
        context_used =context_used or [],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ── Main chat function (tool-calling) ─────────────────────────────────────────

def chat(
    db: Session,
    session_id: str,
    user_id: uuid.UUID,
    question: str,
    context_rfp_id: Optional[uuid.UUID] = None,
    top_k: int = 5,
) -> models.AIChatHistory:
    """
    Unified chat function using OpenAI function calling.

    context_rfp_id: the RFP currently open in the UI (passed as hint to search_rfp_content).
                    The model still calls get_rfp_count/list_rfps for aggregate questions.
    """
    history  = _load_history(db, session_id)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)

    # If we are viewing a specific RFP, give the model a hint so search_rfp_content
    # defaults to that document unless the user clearly asks about all RFPs.
    if context_rfp_id:
        rfp_row = db.get(models.RFP, context_rfp_id)
        hint = (
            f"\n\n[Context: the user is currently viewing RFP \"{rfp_row.title if rfp_row else context_rfp_id}\""
            f" (id={context_rfp_id}). "
            "For questions about this specific RFP's content use search_rfp_content with this rfp_id. "
            "For global count/list questions still use get_rfp_count or list_rfps.]"
        )
        messages[0]["content"] += hint

    messages.append({"role": "user", "content": question})

    total_tokens = 0
    tool_chunk_ids: list[str] = []

    for _ in range(MAX_TOOL_ROUNDS):
        resp = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.2,
            max_tokens=1000,
        )
        total_tokens += resp.usage.total_tokens if resp.usage else 0
        msg = resp.choices[0].message

        if not msg.tool_calls:
            # Final answer — no more tool calls
            answer = msg.content or ""
            return _save_turn(db, session_id, user_id, context_rfp_id, question, answer, total_tokens, tool_chunk_ids)

        # Execute each tool call and feed results back
        messages.append(msg)
        for tc in msg.tool_calls:
            result_str = _execute_tool(db, tc, context_rfp_id)
            messages.append({
                "role"        : "tool",
                "tool_call_id": tc.id,
                "content"     : result_str,
            })

    # Safety: if we exhausted rounds, return the last message content
    answer = msg.content or "I was unable to complete this request. Please try again."
    return _save_turn(db, session_id, user_id, context_rfp_id, question, answer, total_tokens, tool_chunk_ids)


# ── Legacy wrappers (kept for backward compat) ────────────────────────────────

def ask_rfp(
    db: Session, session_id: str, user_id: uuid.UUID,
    rfp_id: uuid.UUID, question: str, top_k: int = 5,
) -> models.AIChatHistory:
    return chat(db, session_id, user_id, question, context_rfp_id=rfp_id, top_k=top_k)


def ask_global(
    db: Session, session_id: str, user_id: uuid.UUID,
    question: str, top_k: int = 5,
) -> models.AIChatHistory:
    return chat(db, session_id, user_id, question, context_rfp_id=None, top_k=top_k)
