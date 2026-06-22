# RFPilot v3

AI-powered RFP (Request for Proposal) management platform. RFPilot helps teams upload, analyse, track, and collaborate on RFPs — from initial upload through AI parsing, bid/no-bid decision, and proposal drafting — all backed by a live PostgreSQL database with pgvector for semantic search.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, React Router 6, Recharts, Chart.js, Lucide React |
| **Backend** | FastAPI (Python 3.11+), Uvicorn |
| **Database** | PostgreSQL 15+ with **pgvector** extension |
| **ORM** | SQLAlchemy 2.0 |
| **Migrations** | Alembic |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **AI / LLM** | OpenAI GPT-4o (chat + tool calling), GPT-3.5-turbo (extraction), text-embedding-ada-002 (1536-dim vectors) |
| **Email** | Python `smtplib` — any SMTP provider (Gmail, Resend, Postmark, etc.) |
| **File parsing** | PyMuPDF (PDF text extraction) |

---

## Features Implemented

### Overview / Dashboard

- **Stat cards** — Total RFPs, Active, Under Review, Submitted, Archived, Win Rate — all live from `GET /rfps/stats`. Includes month-over-month % change badges. Under Review / Submitted / Win Rate now populate correctly once RFP statuses are updated via `PATCH /rfps/:id/status`.
- **Pipeline Value chart** — RFP count over the last 7 months (`GET /rfps/pipeline-value`).
- **Top Clients panel** — Aggregated from AI-extracted organization names in uploaded RFPs (`GET /rfps/top-clients`).
- **Tracking tabs**:
  - *Upcoming Deadlines* — real deadline records from the `rfp_deadlines` table, colour-coded by urgency (overdue / urgent / normal).
  - *Operating Status doughnut* — live status breakdown.
- **Bid / No-Bid Decisions** — section showing RFPs with confirmed decisions, linking to their Detail pages.
- **Notifications sidebar** — live from the `notifications` table, relative-time display.
- **Filter bar** — Status, Client, Deadline range, Assigned Owner, Priority — all server-side (`WHERE` clauses on `GET /rfps/`). Client and Owner options are dynamically fetched from the live database.
- **"Open AI Chat" button** — opens the same floating chat panel as the bottom-right FAB button via a shared `ChatContext`.

### RFP Upload Flow

1. User selects a PDF on the Upload page.
2. `POST /rfps/upload` stores the file, creates an `rfps` row, and runs the AI extraction pipeline:
   - PDF text extraction via PyMuPDF.
   - Batch embedding (OpenAI `text-embedding-ada-002`, up to 512 chunks per API call) stored in `document_chunks` with an HNSW pgvector index for fast similarity search.
   - One GPT-3.5-turbo JSON extraction call returning: summary, overview info, requirements (by category), evaluation criteria, deadlines, and bid analysis scores — all stored in their respective tables.
3. Deadline strings are parsed to `DateTime` for server-side filtering; urgency is computed dynamically.
4. RFP priority is derived from the AI-assessed `risk_level` score.
5. Default approval workflow steps are created automatically.
6. An upload notification is recorded.
7. Redirect to the Detail page; the page polls every 4 seconds while processing.

### RFP Detail Page

#### Overview Info Tab
AI-extracted structured fields: title, organization, project overview, scope, submission deadline, important dates, requirements summary, evaluation criteria, key deliverables, risks. Empty state is shown only when the API genuinely returns empty/null. The **Status** field is a live `<select>` dropdown that calls `PATCH /rfps/:id/status` to move the RFP between any valid status value.

#### Technical Analysis Tab
- **Key Requirements** — `GET /rfps/:id/requirements?category=technical|legal|commercial`. Pills refetch from the backend on switch. Empty state distinguishes "still processing" from "completed with no data".
- **Evaluation Criteria** — `GET /rfps/:id/evaluation-criteria`, rendered with weight percentage bars.
- **Re-analyse button** — calls `POST /rfps/:id/reprocess` to re-run the AI extraction against stored document chunks. Returns per-category counts. Use this to backfill legal/commercial requirements and evaluation criteria on legacy RFPs.

> **Known fix:** The AI upload prompt was previously truncated to 5,000 characters, causing legal, commercial, and evaluation criteria sections (which appear later in most RFPs) to return empty. Fixed to 15,000 characters with explicit category definitions in the system prompt.

#### Decision & Workflow Tab
- **AI Recommendation scores** — Technical Match, Commercial Match, Resource Readiness, Strategic Alignment, Win Probability, Risk Level — populated by the upload job.
- **Green / Red flags** — from AI analysis.
- **Bid / No-Bid buttons** — `PATCH /rfps/:id/decision`; persists and restores on reload.
- **Editable fields** — Required Resources, Expected Risks, Budget Estimate — auto-save on blur.
- **Approval pipeline** — real `ApprovalStep` records; click a circle to advance `pending → in_review → approved`. When all 4 steps reach `approved`, the RFP status automatically advances to `submitted` and a notification is dispatched.
- **Drafting Progress Tracker** — `GET /rfps/:id/drafts` returns per-section completion (5 expected sections). Each section shows "Generated · v{N}" once a draft exists. Overall completion % is calculated live. Draft content is persisted to `draft_documents` + `draft_versions` on each generation.
- **RFP Outcome** — "Mark as Won / Lost" buttons appear once a bid decision is confirmed or the RFP reaches `submitted` status. Calls `PATCH /rfps/:id/status` with `won` or `lost`; clicking the active button resets to `submitted`. This directly drives the **Win Rate** KPI on the dashboard (formula: `won / (won + lost) * 100`).

> **Win Rate root cause (fixed):** The backend formula and frontend display were always correct. The metric showed 0% because no UI existed to set `status = 'won'` or `'lost'` — both were already valid constraint values. The Outcome section in the Decision tab is the fix.

#### Collaboration Tab
Comment thread with nested replies (`GET/POST /rfps/:id/comments`). Posts persist to the database and re-render without a page reload. `@mention` autocomplete in the UI.

#### Right Sidebar
Notifications and Deadlines scoped to the specific RFP (`GET /rfps/:id/notifications`, `GET /rfps/:id/deadlines`). Polls every 15 seconds.

### AI Chatbot

Uses OpenAI function/tool calling with three tools:
- `get_rfp_count` — queries the live DB count (fixes the bug where the old RAG path returned data from only one document).
- `list_rfps` — live DB query with optional status/client filters.
- `search_rfp_content` — pgvector semantic search, scoped or global.

Session ID is stored in `sessionStorage` (survives in-tab navigation, resets on tab close). Last 10 conversation turns are loaded from `ai_chat_history` per session.

### Invite Users / Team Management

- **`POST /invitations/`** — Admin creates an invitation with email + role. Generates a secure random token, stores it with a 7-day expiry, and sends an email via SMTP (falls back to returning the invite URL in the API response when SMTP is not configured).
- **`GET /invitations/`** — Admin lists all invitations; pending records auto-expire at read time.
- **`DELETE /invitations/:id`** — Revoke a pending invitation.
- **`POST /invitations/:token/accept`** — Creates a new user account (or updates role of existing) and marks the invitation accepted.
- **`/team` page** — Members list + invitations table. Admin sees role dropdowns and Remove buttons; non-admins see a read-only view.
- **`/accept-invite?token=…` page** — Public; validates invite, shows name + password form, creates account.
- RBAC enforcement via `require_admin` FastAPI dependency on all admin endpoints (returns 403 for non-admins). Admin controls are also hidden in the UI.

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Registered users: id, name, email, password_hash, role (`admin`/`user`), avatar_url |
| `rfps` | Core RFP records: id, uploaded_by, title, status, priority, file_url, notes |
| `rfp_information` | Structured RFP info: client, deadline, estimated value, assigned owner |
| `rfp_documents` | Uploaded file metadata: filename, type, size |
| `ai_summaries` | AI-extracted summary + structured overview JSON (10 fields) |
| `technical_analyses` | JSONB: requirements, tech stack, certifications, complexity score |
| `bid_decisions` | Bid/no-bid recommendation, 6 numeric fit scores, flags, notes, resources/risks/budget |
| `risks` | Individual risk records with severity: low/medium/high/critical |
| `evaluation_criteria` | Weighted scoring criteria extracted from RFP text |
| `document_chunks` | pgvector chunks (1536-dim), HNSW index, dual FK to rfp + rfp_document |
| `ai_chat_history` | Conversation turns keyed by session_id, user_id, optional rfp_id |
| `resources` | User-to-RFP assignments with role and availability % |
| `approval_steps` | Ordered workflow steps with status and assignee |
| `comments` | Threaded comments on RFPs (self-referential parent_id for replies) |
| `notifications` | Event notifications (comment/approval/status_change/system), is_read flag |
| `invitations` | Email invitations: token, role, status (pending/accepted/expired/revoked), expiry |
| `requirements` | AI-extracted requirements split by category (technical/legal/commercial) |
| `rfp_deadlines` | Deadline records: title, due_date (string), due_date_parsed (DateTime), urgency |
| `draft_documents` | AI-generated proposal draft sections |
| `draft_versions` | Version history of draft documents |

---

## API Endpoints

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Authenticate, receive JWT |
| GET | `/auth/me` | Bearer | Current user profile |

### RFPs — `/rfps`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/rfps/upload` | Bearer | Upload PDF, run AI pipeline |
| GET | `/rfps/stats` | Bearer | KPI counts + % change vs last month |
| GET | `/rfps/pipeline-value` | Bearer | RFP counts per month (7 months) |
| GET | `/rfps/top-clients` | Bearer | Client aggregation |
| GET | `/rfps/owners` | Bearer | Distinct uploaders for filter dropdown |
| GET | `/rfps/` | Bearer | List RFPs (status/client/priority/owner/deadline_range/has_decision filters) |
| GET | `/rfps/:id` | Bearer | Full detail with bid decision, workflow, criteria |
| PATCH | `/rfps/:id/status` | Bearer | Update RFP status to any valid value |
| GET | `/rfps/:id/requirements` | Bearer | Requirements by category |
| GET | `/rfps/:id/evaluation-criteria` | Bearer | Weighted evaluation criteria |
| GET | `/rfps/:id/workflow` | Bearer | Ordered approval steps |
| PATCH | `/rfps/:id/workflow/:stepId` | Bearer | Advance workflow step; auto-submits RFP when all steps approved |
| GET | `/rfps/:id/notifications` | Bearer | Per-RFP notifications |
| GET | `/rfps/:id/deadlines` | Bearer | Per-RFP deadlines |
| POST | `/rfps/:id/generate-draft` | Bearer | AI draft generation (persists to draft_documents) |
| GET | `/rfps/:id/drafts` | Bearer | Draft section completion status + overall % |
| POST | `/rfps/:id/reprocess` | Bearer | Re-run AI extraction from stored chunks; re-populates requirements + criteria |
| GET | `/rfps/:id/comments` | Bearer | Threaded comments |
| POST | `/rfps/:id/comments` | Bearer | Post comment or reply |
| DELETE | `/rfps/:id/comments/:commentId` | Bearer | Delete own comment |
| PATCH | `/rfps/:id/decision` | Bearer | Save bid decision + notes |
| POST | `/rfps/chat` | Bearer | Tool-calling chatbot |

### Notifications — `/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/notifications/` | Global notification feed |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |

### Deadlines — `/deadlines`

| Method | Path | Description |
|---|---|---|
| GET | `/deadlines/` | Global deadline list |

### Invitations — `/invitations`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/invitations/` | Admin | Create invitation, send email |
| GET | `/invitations/` | Admin | List all invitations |
| DELETE | `/invitations/:id` | Admin | Revoke invitation |
| GET | `/invitations/:token/preview` | Public | Validate token |
| POST | `/invitations/:token/accept` | Public | Accept + create account |

### Team — `/team`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/team/members` | Bearer | List all team members |
| PATCH | `/team/members/:id/role` | Admin | Update role |
| DELETE | `/team/members/:id` | Admin | Remove member |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (min 32 random chars) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (GPT-4o + embeddings) |
| `SMTP_HOST` | Optional | SMTP server (leave blank for console-only mode) |
| `SMTP_PORT` | Optional | SMTP port (default: 587) |
| `SMTP_USER` | Optional | SMTP login |
| `SMTP_PASS` | Optional | SMTP password / API key |
| `SMTP_FROM` | Optional | Sender address |
| `FRONTEND_URL` | Optional | Frontend base URL for invite links (default: `http://localhost:3001`) |
| `VITE_API_BASE_URL` | ✅ (frontend) | Backend URL for the Vite dev server |

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with the **pgvector** extension
- OpenAI API key

### 1. Database

**Option A — Docker (recommended):**
```bash
docker run -d \
  --name rfpilot-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=rfpilot \
  -p 5432:5432 \
  pgvector/pgvector:pg17

docker exec rfpilot-db psql -U postgres -d rfpilot -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Option B — Local PostgreSQL:**
```sql
CREATE DATABASE rfpilot;
\c rfpilot
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend

```bash
cd v3/starter
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, OPENAI_API_KEY
python -m alembic upgrade head
uvicorn main:app --reload --port 8002
```

API docs: http://127.0.0.1:8002/docs

### 3. Frontend

```bash
cd v3
npm install
echo "VITE_API_BASE_URL=http://127.0.0.1:8002" > .env
npm run dev
```

Frontend: http://127.0.0.1:3001

### 4. First Admin User

Register via the `/register` page or `POST /auth/register` with `"role": "admin"`.

---

## Project Structure

```
project-RF-Pilot/
├── v3/
│   ├── src/
│   │   ├── App.jsx                     # Router + AuthProvider
│   │   ├── auth/AuthProvider.jsx       # JWT context
│   │   ├── context/ChatContext.jsx     # Global chat open/close state (ChatProvider + useChat)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Overview dashboard
│   │   │   ├── DetailPage.jsx          # RFP detail (4 tabs + sidebar)
│   │   │   ├── UploadRFPPage.jsx       # File upload
│   │   │   ├── TeamPage.jsx            # Team members + invitations
│   │   │   ├── AcceptInvitePage.jsx    # Invitation acceptance
│   │   │   ├── login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/
│   │   │   ├── icons/Icons.jsx         # Central inline SVG icon library (35+ Lucide-compatible icons)
│   │   │   ├── dashboard/              # KPISection, TrackingTabs, FilterBar, BidDecisionCards, RightPanel
│   │   │   ├── detailpage/             # OverviewTab, TechnicalTab, DecisionTab, CollaborationTab
│   │   │   ├── layout/                 # TopNavbar, Layout (ChatProvider), AIChat, DraftWorkspace, TabBar
│   │   │   ├── sidebar/                # RightSidebar (polling)
│   │   │   ├── team/                   # InviteModal
│   │   │   └── ui/                     # ProgressBar primitive
│   │   ├── services/api.js             # Axios client + all API methods
│   │   ├── hooks/useAsync.js           # Generic async state hook
│   │   └── data/constants.js           # Filter option shapes
│   └── starter/                        # FastAPI backend
│       ├── main.py                     # App factory + router registration
│       ├── models.py                   # 20 SQLAlchemy models
│       ├── schemas.py                  # Pydantic schemas
│       ├── auth_utils.py               # JWT + bcrypt
│       ├── rfp_routes.py               # Core RFP API
│       ├── notification_routes.py      # Notifications + deadlines
│       ├── invitation_routes.py        # Invitation lifecycle
│       ├── team_routes.py              # Team management
│       ├── rag_engine.py               # RAG + tool-calling chat engine
│       ├── email_utils.py              # SMTP email utility
│       ├── database.py                 # SQLAlchemy session
│       └── alembic/versions/           # 11 migration files (0001–0011)
```

---

## Database Migrations

| # | Description |
|---|---|
| 0001 | Users table + pgvector extension |
| 0002 | RFP core tables |
| 0003 | AI analysis tables |
| 0004 | RAG pipeline — document_chunks + HNSW index + ai_chat_history |
| 0005 | Collaboration — resources, approval_steps, comments, notifications, invitations |
| 0006 | Draft generation |
| 0007 | requirements + rfp_deadlines tables; approval_steps.assignee_id nullable |
| 0008 | HNSW index on document_chunks.embedding |
| 0009 | bid_decisions AI score columns |
| 0010 | rfps.priority + rfp_deadlines.due_date_parsed |
| 0011 | invitations.role + indexes |
