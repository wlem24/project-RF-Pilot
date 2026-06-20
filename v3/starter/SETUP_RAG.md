# RFPilot v3 — RAG Pipeline Setup Guide

This guide explains how to run and test the RAG (Retrieval-Augmented Generation) pipeline that was integrated into the v3 backend.

---

## What Was Added

| Component | Description |
|---|---|
| `rag_engine.py` | Full RAG pipeline: chunking, embedding, pgvector search, GPT-4o answers |
| `models.py` | 17 new database tables (RFP, DocumentChunk, AISummary, AIChatHistory, etc.) |
| `rfp_routes.py` | New upload, list, detail, generate-draft, and chat endpoints |
| `schemas.py` | New request/response schemas for RAG chat |
| `alembic/versions/` | 5 new migrations (0002 → 0006) for all new tables |

---

## Prerequisites

- Python 3.11+
- PostgreSQL 15+ with **pgvector** extension
- OpenAI API key with credits

---

## 1. Database Setup

### Option A — Docker (Recommended, easiest)

```bash
docker run -d \
  --name rfpilot-db \
  -e POSTGRES_PASSWORD=Dana4846 \
  -e POSTGRES_DB=rfpilot \
  -p 5432:5432 \
  pgvector/pgvector:pg17

docker exec rfpilot-db psql -U postgres -d rfpilot -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Option B — Direct PostgreSQL (no Docker)

**Step 1 — Install pgvector extension**

Windows (run in PowerShell as Administrator):
```
# Download pgvector from https://github.com/pgvector/pgvector/releases
# and follow the Windows install instructions for your PostgreSQL version
```

Mac:
```bash
brew install pgvector
```

Linux (Ubuntu/Debian):
```bash
sudo apt install postgresql-15-pgvector
```

**Step 2 — Create the database**

Open pgAdmin or psql and run:
```sql
CREATE DATABASE rfpilot;
```

**Step 3 — Enable pgvector**

Connect to the `rfpilot` database and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Step 4 — Update your `.env`**

Use your local PostgreSQL credentials:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rfpilot
```

---

## 2. Configure Environment

Create `v3/starter/.env` (never commit this file):

```env
DATABASE_URL=postgresql://postgres:Dana4846@localhost:5432/rfpilot
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=sk-proj-your-key-here
```

---

## 3. Install Dependencies

```bash
cd v3/starter
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

## 4. Run Database Migrations

```bash
cd v3/starter
alembic upgrade head
```

This creates all 18 tables including `document_chunks` (with 1536-dim vector column).

---

## 5. Start the Backend

```bash
cd v3/starter
uvicorn main:app --reload --port 8002
```

API docs available at: `http://127.0.0.1:8002/docs`

---

## 6. Start the Frontend

```bash
cd v3
npm install
npm run dev
```

Frontend runs at: `http://localhost:3001`

---

## 7. Get a JWT Token

**Register:**
```
POST http://127.0.0.1:8002/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

**Login:**
```
POST http://127.0.0.1:8002/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

Copy the `access_token` from the response and add it to all requests:
```
Authorization: Bearer <access_token>
```

> Tip: Use Postman — Swagger /docs auth doesn't work with our current login format.

---

## 8. Test the RAG Pipeline

### Step 1 — Upload a PDF
```
POST http://127.0.0.1:8002/rfps/upload?title=Test RFP
Authorization: Bearer <token>
Body: form-data → key: file, value: your_rfp.pdf
```

Expected response:
```json
{
  "rfp_id": "uuid...",
  "rfp_document_id": "uuid...",
  "chunks_created": 45,
  "summary": "This RFP is about..."
}
```

> `chunks_created` should be > 1 for a real multi-page PDF.

### Step 2 — Ask a Question (RAG Chat)
```
POST http://127.0.0.1:8002/rfps/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "rfp_id": "uuid from step 1",
  "session_id": "test-session-1",
  "question": "What is the submission deadline?",
  "top_k": 5
}
```

Expected response:
```json
{
  "session_id": "test-session-1",
  "answer": "The submission deadline is...",
  "context_used": [...],
  "prompt_tokens": 320
}
```

### Step 3 — Check Overview Info
```
GET http://127.0.0.1:8002/rfps/<rfp_id>
Authorization: Bearer <token>
```

The `information` field contains structured fields extracted by AI:
`title, organization, projectOverview, scopeOfWork, submissionDeadline, importantDates, requirementsSummary, evaluationCriteria, keyDeliverables, risks`

### Step 4 — Chat Without rfp_id (Lists All RFPs)
```
POST http://127.0.0.1:8002/rfps/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "test-session-1",
  "question": "What RFPs do you have?"
}
```

---

## 9. Verify the Database

```bash
# Check RFPs
docker exec rfpilot-db psql -U postgres -d rfpilot -c "SELECT id, title FROM rfps;"

# For direct PostgreSQL (no Docker), open psql and run:
# psql -U postgres -d rfpilot
# SELECT id, title FROM rfps;

# Check chunks per RFP (should be > 1 for large PDFs)
docker exec rfpilot-db psql -U postgres -d rfpilot -c "SELECT rfp_id, COUNT(*) FROM document_chunks GROUP BY rfp_id;"

# Check AI extraction results
docker exec rfpilot-db psql -U postgres -d rfpilot -c "SELECT rfp_id, summary FROM ai_summaries;"
```

---

## RAG Architecture

```
PDF Upload
    │
    ├─ Extract text (PyMuPDF)
    ├─ Chunk text (220 words, 40 overlap)
    ├─ Embed chunks (OpenAI text-embedding-ada-002, 1536 dims)
    ├─ Store in PostgreSQL + pgvector (document_chunks table)
    └─ Extract structured overview (GPT-3.5-turbo → ai_summaries table)

Chat Question
    │
    ├─ Embed question (text-embedding-ada-002)
    ├─ Search top-5 similar chunks (pgvector cosine distance)
    ├─ Send chunks + question to GPT-4o
    └─ Save answer to ai_chat_history table
```

---

## Notes for the Team

- **Auth is unchanged** — `auth_utils.py`, `register.py`, `login.py` are exactly as before
- **bot.py is unchanged** — the old SQLite chat route is untouched
- **`.env` is never committed** — each developer must create their own with their own credentials
- **pgvector must be enabled** before running migrations, otherwise migrations will fail
- **OpenAI API key must have credits** — the pipeline uses text-embedding-ada-002 and GPT-3.5-turbo/GPT-4o
