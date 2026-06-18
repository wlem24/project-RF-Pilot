# RFPilot — v3

> AI-powered RFP management platform — Phase 1: Identity & Access complete.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Phase 1 — Identity & Access](#phase-1--identity--access)
   - [Database Configuration](#database-configuration)
   - [Authentication Flow](#authentication-flow)
   - [API Endpoints](#api-endpoints)
5. [Full ERD — All 18 Tables](#full-erd--all-18-tables)
6. [Running Locally](#running-locally)
7. [Environment Variables](#environment-variables)
8. [Alembic Migrations](#alembic-migrations)
9. [Security Notes](#security-notes)

---

## Project Overview

RFPilot is an enterprise RFP (Request for Proposal) management platform that uses AI to automate analysis, draft generation, and bid decision-making. The system is built around a FastAPI backend with a PostgreSQL + pgvector database and a React frontend.

**Current Status:** Phase 1 (Identity & Access) complete. Users can register, log in, and authenticate via JWT. The PostgreSQL schema is in place and Alembic migrations are ready to run.

---

## Technology Stack

### Backend (`v3/starter/`)

| Layer | Technology |
|-------|-----------|
| Web framework | FastAPI 0.115.0 |
| ORM | SQLAlchemy 2.0.36 (sync) |
| Database | PostgreSQL 15+ |
| Vector storage | pgvector extension |
| Migrations | Alembic 1.13.3 |
| Password hashing | passlib[bcrypt] 1.7.4 + bcrypt 4.0.1 |
| Authentication | JWT via python-jose 3.3.0 (HS256) |
| Schema validation | Pydantic v2 2.13.4 |
| PDF extraction | PyMuPDF 1.24.11 |
| AI integration | OpenAI SDK 1.54.0 |
| ASGI server | uvicorn[standard] 0.32.0 |
| DB driver | psycopg2-binary 2.9.10 |
| Env management | python-dotenv 1.0.1 |

### Frontend (`v3/src/`)

| Layer | Technology |
|-------|-----------|
| UI framework | React 18.3.1 |
| Routing | React Router v6 |
| HTTP client | Axios 1.17.0 |
| Charts | Recharts 3.8.1 |
| Build tool | Vite 5.4.21 |

---

## Directory Structure

```
v3/
├── src/                         # React frontend
│   ├── api/
│   │   ├── api.js               # Axios base client (reads VITE_API_BASE_URL)
│   │   └── auth.js              # loginRequest / registerRequest / meRequest
│   ├── auth/
│   │   └── AuthProvider.jsx     # Context: user, login(), logout(), loading
│   ├── components/
│   │   └── ProtectedRoute.jsx   # Guards routes — redirects to /login if no token
│   ├── pages/
│   │   ├── Register.jsx         # Registration form -> POST /auth/register
│   │   ├── login.jsx            # Login form -> AuthProvider.login()
│   │   ├── Dashboard.jsx
│   │   ├── DetailPage.jsx
│   │   └── UploadRFPPage.jsx
│   └── App.jsx                  # Router tree — / -> /login, protected routes wrapped
│
├── starter/                     # FastAPI backend
│   ├── database.py              # SQLAlchemy engine, SessionLocal, get_db()
│   ├── models.py                # SQLAlchemy ORM model: User
│   ├── schemas.py               # Pydantic schemas: RegisterRequest, LoginRequest, UserResponse
│   ├── auth_utils.py            # bcrypt helpers, JWT create/decode, get_current_user dependency
│   ├── register.py              # POST /auth/register
│   ├── login.py                 # POST /auth/login  GET /auth/me
│   ├── main.py                  # FastAPI app, CORS, startup hook
│   ├── rfp_routes.py            # POST /rfps/upload  GET /rfps/  GET /rfps/{id}  POST /rfps/chat
│   ├── requirements.txt
│   ├── .env.example             # Template — copy to .env and fill in credentials
│   └── alembic/
│       ├── env.py               # Reads DATABASE_URL from .env, imports Base + models
│       └── versions/
│           └── 0001_init_users_and_vector.py   # Creates users table + pgvector extension
│
├── .env.example                 # Frontend env template
└── README.md                    # This file
```

---

## Phase 1 — Identity & Access

### Database Configuration

**File:** `starter/database.py`

```python
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

- `pool_pre_ping=True` — automatically recycles dead connections
- `autocommit=False` — all writes must be explicitly committed
- `get_db()` — FastAPI dependency that yields a session and always closes it in `finally`

### User Model

**File:** `starter/models.py`

```python
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin','user')", name="users_role_check"),
    )

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(100), nullable=False)
    email         = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    role          = Column(String(50), nullable=True)
    avatar_url    = Column(Text, nullable=True)
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at    = Column(DateTime(timezone=True), default=..., onupdate=...)
```

**Design decisions:**
- `role` is `VARCHAR + CHECK constraint` — not a native PostgreSQL ENUM. This allows adding new roles with a simple `ALTER TABLE DROP CONSTRAINT / ADD CONSTRAINT` rather than an `ALTER TYPE` DDL operation.
- UUID generated at the Python layer (`default=uuid.uuid4`) so the ORM always has the ID before the INSERT executes.
- `password_hash` is never exposed — it is absent from all `UserResponse` Pydantic schemas.

### Authentication Flow

```
REGISTER
--------
POST /auth/register
  { name, email, password, role }
        |
  1. Validate role in ('admin', 'user')         -> 400 if invalid
  2. Check email uniqueness in DB               -> 400 if duplicate
  3. bcrypt(password) -> password_hash
  4. INSERT user row
  5. db.commit() + db.refresh()
  6. Return 201 { message, user: UserResponse }

LOGIN
-----
POST /auth/login
  { email, password }
        |
  1. Fetch user by email
  2. bcrypt.verify(password, user.password_hash) -> 401 if mismatch
  3. Create JWT: { email, exp: now + 24h }
  4. Return { access_token, token_type: "bearer" }

PROTECTED REQUEST
-----------------
GET /auth/me
  Authorization: Bearer <token>
        |
  1. Decode + validate JWT signature + expiry
  2. Extract email claim
  3. Fetch live user from DB
  4. Return UserResponse (no password_hash)
```

**Frontend token lifecycle (`AuthProvider.jsx`):**
1. On login — token stored in `localStorage` + set as `Authorization: Bearer` header on all Axios requests
2. On page reload — token read from `localStorage`, `/auth/me` called to validate and populate user context
3. On invalid token — `localStorage` cleared, user set to `null`, redirected to `/login`
4. On logout — token and header cleared

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Create user account |
| `POST` | `/auth/login` | Public | Obtain JWT |
| `GET` | `/auth/me` | Bearer token | Get current user profile |
| `POST` | `/rfps/upload` | — | Upload and parse PDF |
| `GET` | `/rfps/` | — | List all RFPs |
| `GET` | `/rfps/{rfp_id}` | — | Get RFP details |
| `POST` | `/rfps/chat` | — | AI chat with RFP context |

---

## Full ERD — All 18 Tables

### Core Application Tables

#### 1. `users`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default gen |
| `name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE, INDEX |
| `password_hash` | TEXT | NOT NULL |
| `role` | VARCHAR(50) | CHECK IN ('admin','user') |
| `avatar_url` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

#### 2. `rfps`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `uploaded_by` | UUID | FK -> users.id |
| `title` | VARCHAR | NOT NULL |
| `status` | VARCHAR | CHECK IN ('draft','under_review','bid_decision','submitted','won','lost','no_bid') |
| `file_url` | TEXT | |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### 3. `rfp_information`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `client_name` | VARCHAR | |
| `department` | VARCHAR | |
| `industry` | VARCHAR | |
| `submission_deadline` | TIMESTAMPTZ | |
| `estimated_value` | NUMERIC | |
| `contract_duration` | VARCHAR | |
| `procurement_method` | VARCHAR | |
| `location` | VARCHAR | |
| `assigned_to` | UUID | FK -> users.id |

#### 4. `ai_summaries`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `summary` | TEXT | |
| `objectives` | JSONB | |
| `scope` | TEXT | |
| `key_dates` | JSONB | |
| `model_version` | VARCHAR | |
| `generated_at` | TIMESTAMPTZ | |

#### 5. `technical_analyses`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `requirements` | JSONB | |
| `technology_stack` | JSONB | |
| `certifications` | JSONB | |
| `manpower_requirements` | JSONB | |
| `complexity_score` | NUMERIC | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### 6. `bid_decisions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `recommendation` | VARCHAR | CHECK IN ('bid','no_bid','conditional_bid') |
| `bid_score` | NUMERIC | |
| `win_rate` | NUMERIC | |
| `confidence_level` | NUMERIC | |
| `strategic_fit` | NUMERIC | |
| `technical_fit` | NUMERIC | |
| `financial_fit` | NUMERIC | |
| `resource_fit` | NUMERIC | |
| `positive_flags` | JSONB | |
| `risk_flags` | JSONB | |
| `alignment_matrix` | JSONB | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### 7. `risks`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `risk_title` | VARCHAR | NOT NULL |
| `severity` | VARCHAR | CHECK IN ('low','medium','high','critical') |
| `impact` | TEXT | |
| `mitigation` | TEXT | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### 8. `resources`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `user_id` | UUID | FK -> users.id |
| `role` | VARCHAR | |
| `availability_pct` | NUMERIC | |
| `assigned_at` | TIMESTAMPTZ | |

#### 9. `approval_steps`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `assignee_id` | UUID | FK -> users.id |
| `stage` | VARCHAR | |
| `step_order` | INTEGER | |
| `status` | VARCHAR | CHECK IN ('pending','in_review','approved','rejected','skipped') |
| `notes` | TEXT | |
| `completed_at` | TIMESTAMPTZ | |

#### 10. `rfp_documents`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `uploaded_by` | UUID | FK -> users.id |
| `file_name` | VARCHAR | NOT NULL |
| `file_type` | VARCHAR | CHECK IN ('pdf','docx','xlsx') |
| `file_size` | BIGINT | |
| `file_url` | TEXT | |
| `uploaded_at` | TIMESTAMPTZ | |

#### 11. `draft_documents`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `generated_by` | UUID | FK -> users.id |
| `draft_type` | VARCHAR | CHECK IN ('executive_summary','technical','commercial','compliance','full') |
| `prompt` | TEXT | |
| `content` | TEXT | |
| `file_url` | TEXT | |

#### 12. `comments`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `author_id` | UUID | FK -> users.id |
| `parent_id` | UUID | FK -> comments.id (self-ref threading) |
| `message` | TEXT | NOT NULL |
| `mentions` | JSONB | |
| `is_edited` | BOOLEAN | default false |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### 13. `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK -> users.id |
| `rfp_id` | UUID | FK -> rfps.id |
| `type` | VARCHAR | CHECK IN ('comment','approval','status_change','system') |
| `message` | TEXT | |
| `is_read` | BOOLEAN | default false |
| `created_at` | TIMESTAMPTZ | |

#### 14. `evaluation_criteria`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_id` | UUID | FK -> rfps.id |
| `criteria` | TEXT | NOT NULL |
| `weight` | NUMERIC | |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### 15. `invitations`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `invited_by` | UUID | FK -> users.id |
| `accepted_by` | UUID | FK -> users.id, nullable |
| `email` | VARCHAR | NOT NULL |
| `token` | VARCHAR | UNIQUE |
| `status` | VARCHAR | CHECK IN ('pending','accepted','expired','revoked') |
| `expires_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### RAG & AI Extension Tables

#### 16. `document_chunks` — pgvector storage
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `rfp_document_id` | UUID | FK -> rfp_documents.id |
| `rfp_id` | UUID | FK -> rfps.id |
| `chunk_index` | INTEGER | NOT NULL |
| `content` | TEXT | NOT NULL |
| `embedding` | vector(1536) | pgvector — requires `CREATE EXTENSION vector` |
| `token_count` | INTEGER | |

> The `embedding` column uses the `pgvector` extension. The dimension (1536) matches OpenAI `text-embedding-ada-002`. Run `CREATE EXTENSION IF NOT EXISTS vector;` before migration (already included in `0001_init_users_and_vector.py`).

#### 17. `ai_chat_history`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `session_id` | VARCHAR | NOT NULL |
| `user_id` | UUID | FK -> users.id |
| `rfp_id` | UUID | FK -> rfps.id, nullable |
| `user_message` | TEXT | NOT NULL |
| `ai_response` | TEXT | NOT NULL |
| `prompt_tokens` | INTEGER | |
| `context_used` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

#### 18. `draft_versions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `draft_document_id` | UUID | FK -> draft_documents.id |
| `version_number` | INTEGER | NOT NULL |
| `content` | TEXT | NOT NULL |
| `prompt` | TEXT | |
| `generated_by` | UUID | FK -> users.id |
| `created_at` | TIMESTAMPTZ | |

---

## Running Locally

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Node.js 18+

### Backend

```bash
# 1. Create the database
psql -U postgres -c "CREATE DATABASE rfpilot;"

# 2. Install dependencies
cd v3/starter
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env -- set DATABASE_URL, SECRET_KEY, OPENAI_API_KEY

# 4. Run migrations
python -m alembic upgrade head

# 5. Start the server
python -m uvicorn main:app --port 8002 --reload
```

API available at `http://127.0.0.1:8002`
Interactive docs: `http://127.0.0.1:8002/docs`

### Frontend

```bash
cd v3
cp .env.example .env         # VITE_API_BASE_URL is already correct
npm install
npm run dev                  # -> http://127.0.0.1:3001
```

---

## Environment Variables

### Backend — `v3/starter/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret (min 32 chars) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `APP_ENV` | No | `development` or `production` |

Generate a secure `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend — `v3/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend base URL |

---

## Alembic Migrations

```bash
# Apply all pending migrations
python -m alembic upgrade head

# Check current migration state
python -m alembic current

# Roll back one migration
python -m alembic downgrade -1

# Auto-generate a new migration after model changes
python -m alembic revision --autogenerate -m "describe your change"
```

### Migration history

| Revision | Description |
|----------|-------------|
| `0001` | `CREATE EXTENSION vector` + `users` table with UUID PK, CHECK constraint, indexes |

---

## Security Notes

- Passwords hashed with **bcrypt** (salt rounds: 12 default). Plaintext passwords never touch the database.
- `password_hash` field absent from all API response schemas — cannot leak via any endpoint.
- JWT tokens use **HS256** and expire after **24 hours**.
- Login returns an identical `401` for both "email not found" and "wrong password" — prevents email enumeration attacks.
- CORS restricted to `localhost:3001` and `localhost:5173`. Do not use `allow_origins=["*"]` in production.
- `SECRET_KEY` must be replaced with a cryptographically random value before any production deployment.
- Never commit `.env` files — use `.env.example` as the template.

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | **Complete** | Identity & Access — users table, JWT auth, registration, login |
| Phase 2 | Planned | RFP Core — rfps, rfp_information, rfp_documents tables + upload pipeline |
| Phase 3 | Planned | AI Analysis — ai_summaries, technical_analyses, bid_decisions |
| Phase 4 | Planned | RAG Pipeline — document_chunks (pgvector), ai_chat_history |
| Phase 5 | Planned | Collaboration — comments, notifications, approval_steps |
| Phase 6 | Planned | Draft Generation — draft_documents, draft_versions |

---

*Built with FastAPI · SQLAlchemy · PostgreSQL · pgvector · React*
