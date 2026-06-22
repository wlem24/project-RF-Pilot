import os
import re
import uuid
import json
from datetime import datetime, timedelta, timezone as _tz
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from openai import (
    OpenAI,
    RateLimitError,
    BadRequestError,
    AuthenticationError,
    APIConnectionError,
    APIStatusError,
    OpenAIError,
)

from database import get_db
from auth_utils import get_current_user
import models
import schemas
import rag_engine

router = APIRouter(prefix="/rfps", tags=["RFPs"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

OVERVIEW_FIELDS = [
    "title", "organization", "projectOverview", "scopeOfWork",
    "submissionDeadline", "importantDates", "requirementsSummary",
    "evaluationCriteria", "keyDeliverables", "risks",
]

DRAFT_TYPE_MAP = {
    "executive summary": "executive_summary",
    "technical proposal": "technical",
    "commercial proposal": "commercial",
    "compliance response": "compliance",
    "full proposal": "full",
    "executive_summary": "executive_summary",
    "technical": "technical",
    "commercial": "commercial",
    "compliance": "compliance",
    "full": "full",
}
TOTAL_DRAFT_SECTIONS = 5

DEFAULT_WORKFLOW = [
    ("Initial Review",         1),
    ("Technical Assessment",   2),
    ("Commercial Evaluation",  3),
    ("Management Approval",    4),
]


# ─────────────────────────────────────────────
#  Upload (extended AI extraction)
# ─────────────────────────────────────────────

@router.post("/upload", status_code=201)
def upload_rfp(
    title: str,
    estimated_value: float = 0,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    import fitz  # PyMuPDF

    ext = (file.filename or "").lower()
    if not ext.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=422, detail="Only PDF, DOCX, and TXT files are accepted.")

    contents = file.file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")

    if len(contents) > 50 * 1024 * 1024:
        size_mb = len(contents) / 1024 / 1024
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum size is 50 MB.",
        )

    # Validate PDF integrity before creating any DB rows
    raw_text = ""
    if ext.endswith(".pdf"):
        try:
            doc = fitz.open(stream=contents, filetype="pdf")
            if doc.page_count == 0:
                raise ValueError("PDF has no pages.")
            raw_text = "".join(page.get_text() for page in doc)
            doc.close()
        except Exception as pdf_err:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"PDF could not be parsed: {pdf_err}. "
                    "Ensure the file is not password-protected or corrupted."
                ),
            )
    else:
        raw_text = contents.decode("utf-8", errors="ignore")

    rfp = models.RFP(uploaded_by=current_user.id, title=title, status="draft")
    db.add(rfp)
    db.commit()

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded file seems to be empty or unreadable.")

    rfp_doc = models.RFPDocument(
        rfp_id      =rfp.id,
        uploaded_by =current_user.id,
        file_name   =file.filename,
        file_type   ="pdf",
        file_size   =len(contents),
    )
    db.add(rfp_doc)
    db.commit()

    chunks = rag_engine.ingest_document(db, rfp.id, rfp_doc.id, raw_text)

    # Single comprehensive extraction call
    summary, overview, requirements_extracted, criteria_extracted, deadlines_extracted = \
        "", None, {}, [], []
    bid_analysis_extracted: dict = {}

    try:
        extraction_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": (
                    "You are an expert RFP analyst. Read the ENTIRE RFP text carefully — "
                    "requirements and criteria often appear in the middle and latter sections. "
                    "Return a JSON object with EXACTLY these keys:\n"
                    "- summary: brief professional summary string\n"
                    "- overview: {title, organization, projectOverview, scopeOfWork, submissionDeadline, "
                    "  importantDates, requirementsSummary, evaluationCriteria, keyDeliverables, risks} "
                    "  (all values plain strings or null)\n"
                    "- requirements: {\n"
                    "    technical: [string],   <- software/hardware specs, integration, infrastructure, "
                    "                              system architecture, performance, technology stack\n"
                    "    legal: [string],       <- compliance obligations, regulatory requirements, "
                    "                              certifications, data protection, GDPR/privacy law, "
                    "                              insurance, liability, indemnification, governing law, "
                    "                              IP ownership, confidentiality, audit rights\n"
                    "    commercial: [string]   <- pricing structure, payment terms, contract duration, "
                    "                              SLA commitments, penalties/liquidated damages, "
                    "                              budget constraints, invoicing, warranty periods, "
                    "                              termination clauses, performance bonds\n"
                    "  }\n"
                    "  Use empty array [] only if genuinely absent — do NOT put legal/commercial items "
                    "  under technical.\n"
                    "- criteria: [{name: string, weight: number or null, description: string}] "
                    "  <- ALL scoring rubric entries, evaluation weights, selection criteria, "
                    "     assessment methodology; empty array only if no rubric exists\n"
                    "- deadlines: [{title: string, date: string}] "
                    "  (all dates/deadlines mentioned; empty array if none)\n"
                    "- bid_analysis: {\n"
                    "    technical_fit: integer 0-100,\n"
                    "    commercial_fit: integer 0-100,\n"
                    "    resource_readiness: integer 0-100,\n"
                    "    strategic_alignment: integer 0-100,\n"
                    "    win_probability: integer 0-100,\n"
                    "    risk_level: integer 0-100,\n"
                    "    positive_flags: [string],\n"
                    "    risk_flags: [string],\n"
                    "    required_resources: string or null,\n"
                    "    expected_risks: string or null,\n"
                    "    budget_estimate: string or null\n"
                    "  }\n"
                    "Never nest objects inside overview fields. Never invent data not in the text."
                )},
                {"role": "user", "content": f"Analyze this RFP text:\n\n{raw_text[:15000]}"}
            ],
            max_tokens=3500,
        )
        raw_content = extraction_response.choices[0].message.content.strip()

        try:
            parsed = json.loads(raw_content)
            summary  = (parsed.get("summary") or "").strip() or raw_content
            overview_raw = parsed.get("overview")
            if isinstance(overview_raw, dict):
                overview = {k: overview_raw.get(k) for k in OVERVIEW_FIELDS}
            reqs_raw = parsed.get("requirements") or {}
            if isinstance(reqs_raw, dict):
                requirements_extracted = reqs_raw
            crit_raw = parsed.get("criteria") or []
            if isinstance(crit_raw, list):
                criteria_extracted = crit_raw
            dl_raw = parsed.get("deadlines") or []
            if isinstance(dl_raw, list):
                deadlines_extracted = dl_raw
            ba_raw = parsed.get("bid_analysis")
            if isinstance(ba_raw, dict):
                bid_analysis_extracted = ba_raw
        except (json.JSONDecodeError, AttributeError):
            summary = raw_content
    except Exception:
        pass

    # Store AI summary + overview
    ai_summary = models.AISummary(
        rfp_id       =rfp.id,
        summary      =summary,
        objectives   =overview,
        scope        =(overview or {}).get("scopeOfWork"),
        model_version="gpt-3.5-turbo",
    )
    db.add(ai_summary)

    # Store requirements by category
    for category, req_list in requirements_extracted.items():
        if category not in ("technical", "legal", "commercial"):
            continue
        for req_text in (req_list or []):
            if isinstance(req_text, str) and req_text.strip():
                db.add(models.Requirement(
                    rfp_id  =rfp.id,
                    category=category,
                    text    =req_text.strip(),
                ))

    # Store evaluation criteria
    for crit in criteria_extracted:
        if not isinstance(crit, dict):
            continue
        name = crit.get("name") or crit.get("criterion") or ""
        if name.strip():
            weight = crit.get("weight")
            try:
                weight = float(weight) if weight is not None else None
            except (TypeError, ValueError):
                weight = None
            db.add(models.EvaluationCriteria(
                rfp_id  =rfp.id,
                criteria=name.strip(),
                weight  =weight,
                notes   =crit.get("description"),
            ))

    # Helper: try to parse a natural-language date string
    def _parse_date(s: str):
        if not s:
            return None
        try:
            from dateutil import parser as _dp
            return _dp.parse(s, fuzzy=True).replace(tzinfo=_tz.utc)
        except Exception:
            return None

    def _deadline_urgency(due_dt) -> str:
        if due_dt is None:
            return "normal"
        now = datetime.now(_tz.utc)
        if due_dt < now:
            return "overdue"
        if (due_dt - now).days <= 7:
            return "urgent"
        return "normal"

    # Store extracted deadlines
    for dl in deadlines_extracted:
        if not isinstance(dl, dict):
            continue
        dl_title  = (dl.get("title") or "Deadline").strip()
        dl_date   = (dl.get("date")  or "").strip()
        parsed_dt = _parse_date(dl_date)
        urgency   = _deadline_urgency(parsed_dt) if parsed_dt else (
            "urgent" if any(
                kw in dl_title.lower()
                for kw in ("submission", "proposal", "bid", "tender", "closing")
            ) else "normal"
        )
        if dl_title:
            db.add(models.RFPDeadline(
                rfp_id         =rfp.id,
                title          =dl_title,
                due_date       =dl_date or None,
                due_date_parsed=parsed_dt,
                urgency        =urgency,
            ))

    # If no deadlines extracted but submissionDeadline exists in overview, store it
    if not deadlines_extracted and overview and overview.get("submissionDeadline"):
        raw = overview["submissionDeadline"]
        parsed_dt = _parse_date(raw)
        db.add(models.RFPDeadline(
            rfp_id         =rfp.id,
            title          ="Submission Deadline",
            due_date       =raw,
            due_date_parsed=parsed_dt,
            urgency        =_deadline_urgency(parsed_dt) if parsed_dt else "urgent",
        ))

    # Set RFP priority from AI-assessed risk_level
    if bid_analysis_extracted:
        try:
            rl = int(float(bid_analysis_extracted.get("risk_level") or 50))
            rfp.priority = "critical" if rl > 75 else "high" if rl > 50 else "medium" if rl > 25 else "low"
        except (TypeError, ValueError):
            pass

    # Store AI bid analysis scores in bid_decisions table
    if bid_analysis_extracted:
        def _safe_int(val, lo=0, hi=100):
            try:
                v = int(float(val))
                return max(lo, min(hi, v))
            except (TypeError, ValueError):
                return None

        ba = bid_analysis_extracted
        db.add(models.BidDecision(
            rfp_id            =rfp.id,
            recommendation    =None,                           # user sets this manually
            technical_fit     =_safe_int(ba.get("technical_fit")),
            financial_fit     =_safe_int(ba.get("commercial_fit")),
            resource_fit      =_safe_int(ba.get("resource_readiness")),
            strategic_fit     =_safe_int(ba.get("strategic_alignment")),
            win_rate          =_safe_int(ba.get("win_probability")),
            risk_level        =_safe_int(ba.get("risk_level")),
            positive_flags    =ba.get("positive_flags") or [],
            risk_flags        =ba.get("risk_flags") or [],
            required_resources=(ba.get("required_resources") or "").strip() or None,
            expected_risks    =(ba.get("expected_risks") or "").strip() or None,
            budget_estimate   =(ba.get("budget_estimate") or "").strip() or None,
        ))

    # Store estimated_value in rfp_information (upsert)
    if estimated_value and estimated_value > 0:
        rfp_info = db.query(models.RFPInformation).filter_by(rfp_id=rfp.id).first()
        if rfp_info:
            rfp_info.estimated_value = estimated_value
        else:
            db.add(models.RFPInformation(rfp_id=rfp.id, estimated_value=estimated_value))

    # Create default workflow steps
    for stage, order in DEFAULT_WORKFLOW:
        db.add(models.ApprovalStep(
            rfp_id     =rfp.id,
            stage      =stage,
            step_order =order,
            status     ="pending",
            assignee_id=current_user.id,
        ))

    # Upload notification
    db.add(models.Notification(
        user_id=current_user.id,
        rfp_id =rfp.id,
        type   ="status_change",
        message=f'RFP "{title}" uploaded and processed successfully.',
    ))

    db.commit()

    return {
        "rfp_id"         : str(rfp.id),
        "rfp_document_id": str(rfp_doc.id),
        "chunks_created" : len(chunks),
        "summary"        : summary,
    }


# ─────────────────────────────────────────────
#  Stats / Pipeline / Clients — before /{rfp_id}
# ─────────────────────────────────────────────

@router.get("/stats")
def get_rfp_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfps = db.query(models.RFP).all()
    now  = datetime.now(_tz.utc)

    # Current-month boundary (UTC)
    cur_start  = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # Previous-month boundary
    if cur_start.month == 1:
        prev_start = cur_start.replace(year=cur_start.year - 1, month=12)
    else:
        prev_start = cur_start.replace(month=cur_start.month - 1)

    def ts(r):
        return r.created_at if r.created_at and r.created_at.tzinfo else None

    cur_rfps  = [r for r in rfps if ts(r) and ts(r) >= cur_start]
    prev_rfps = [r for r in rfps if ts(r) and prev_start <= ts(r) < cur_start]

    def pct(current, previous):
        if previous == 0:
            return None
        return round((current - previous) / previous * 100)

    counts: dict = {}
    for r in rfps:
        counts[r.status] = counts.get(r.status, 0) + 1

    prev_counts: dict = {}
    for r in prev_rfps:
        prev_counts[r.status] = prev_counts.get(r.status, 0) + 1

    total    = len(rfps)
    won      = counts.get("won", 0)
    lost     = counts.get("lost", 0)
    decided  = won + lost
    # Return None (not 0) when no RFPs have a final outcome yet — the
    # frontend renders None as "N/A" rather than a misleading "0%".
    win_rate = round(won / decided * 100) if decided else None

    active   = counts.get("under_review", 0) + counts.get("bid_decision", 0)
    prev_active = prev_counts.get("under_review", 0) + prev_counts.get("bid_decision", 0)

    return {
        "total"             : total,
        "total_change"      : pct(len(cur_rfps), len(prev_rfps)),
        "active"            : active,
        "active_change"     : pct(active, prev_active),
        "under_review"      : counts.get("under_review", 0),
        "under_review_change": pct(counts.get("under_review", 0), prev_counts.get("under_review", 0)),
        "draft"             : counts.get("draft", 0),
        "submitted"         : counts.get("submitted", 0),
        "submitted_change"  : pct(counts.get("submitted", 0), prev_counts.get("submitted", 0)),
        "won"               : won,
        "archived"          : counts.get("no_bid", 0) + lost,
        "win_rate"          : win_rate,
    }


@router.get("/pipeline-value")
def get_pipeline_value(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfps = db.query(models.RFP).all()
    # Pre-load estimated_value from rfp_information
    info_map = {
        i.rfp_id: float(i.estimated_value or 0)
        for i in db.query(models.RFPInformation).all()
    }
    abbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    now  = datetime.now()
    result = []
    for i in range(6, -1, -1):
        total_months = now.year * 12 + now.month - 1 - i
        yr = total_months // 12
        mo = (total_months % 12) + 1
        month_rfps = [
            r for r in rfps
            if r.created_at and r.created_at.year == yr and r.created_at.month == mo
        ]
        total_value = sum(info_map.get(r.id, 0) for r in month_rfps)
        result.append({
            "month": abbr[mo - 1],
            "value": total_value,
            "count": len(month_rfps),
        })
    return result


@router.get("/top-clients")
def get_top_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    summaries = db.query(models.AISummary).all()
    counts: dict = {}
    for s in summaries:
        if s.objectives and isinstance(s.objectives, dict):
            org = s.objectives.get("organization")
            if org:
                counts[org] = counts.get(org, 0) + 1
    total = sum(counts.values()) or 1
    return sorted(
        [{"name": n, "count": c, "pct": round(c / total * 100)} for n, c in counts.items()],
        key=lambda x: -x["count"]
    )[:5]


# ─────────────────────────────────────────────
#  Owners (distinct uploaders) — before /{rfp_id}
# ─────────────────────────────────────────────

@router.get("/owners")
def get_rfp_owners(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Distinct users who have uploaded at least one RFP — used to populate the Owner filter."""
    rows = (
        db.query(models.User)
        .join(models.RFP, models.RFP.uploaded_by == models.User.id)
        .distinct()
        .all()
    )
    return [{"id": str(u.id), "name": u.name} for u in rows]


# ─────────────────────────────────────────────
#  List RFPs (status / client / priority / owner / deadline filters)
# ─────────────────────────────────────────────

VALID_PRIORITIES    = {"low", "medium", "high", "critical"}
VALID_DEADLINE_RNGS = {"next_7_days", "next_30_days", "overdue"}

@router.get("/")
def list_rfps(
    status:         Optional[str]  = Query(None),
    client:         Optional[str]  = Query(None),
    has_decision:   Optional[bool] = Query(None),
    priority:       Optional[str]  = Query(None),
    owner:          Optional[str]  = Query(None),
    deadline_range: Optional[str]  = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if priority and priority.lower() not in VALID_PRIORITIES and priority.lower() not in ("all", "all priorities"):
        raise HTTPException(status_code=422, detail=f"Invalid priority value. Valid: {', '.join(VALID_PRIORITIES)}")
    if deadline_range and deadline_range.lower() not in VALID_DEADLINE_RNGS and deadline_range.lower() not in ("all", "any date"):
        raise HTTPException(status_code=422, detail=f"Invalid deadline_range. Valid: {', '.join(VALID_DEADLINE_RNGS)}")

    STATUS_MAP = {
        "Under Review": "under_review",
        "Drafting":     "draft",
        "Submitted":    "submitted",
        "Archived":     "no_bid",
    }
    q = db.query(models.RFP)

    if status and status not in ("All Statuses", "all"):
        db_status = STATUS_MAP.get(status, status.lower().replace(" ", "_"))
        q = q.filter(models.RFP.status == db_status)

    if priority and priority.lower() in VALID_PRIORITIES:
        q = q.filter(models.RFP.priority == priority.lower())

    if owner and owner not in ("All Owners", "all"):
        q = (
            q.join(models.User, models.User.id == models.RFP.uploaded_by)
            .filter(models.User.name.ilike(f"%{owner}%"))
        )

    if deadline_range and deadline_range.lower() in VALID_DEADLINE_RNGS:
        now = datetime.now(_tz.utc)
        q = q.join(models.RFPDeadline, models.RFPDeadline.rfp_id == models.RFP.id)
        if deadline_range == "next_7_days":
            q = q.filter(
                models.RFPDeadline.due_date_parsed >= now,
                models.RFPDeadline.due_date_parsed <= now + timedelta(days=7),
            )
        elif deadline_range == "next_30_days":
            q = q.filter(
                models.RFPDeadline.due_date_parsed >= now,
                models.RFPDeadline.due_date_parsed <= now + timedelta(days=30),
            )
        elif deadline_range == "overdue":
            q = q.filter(models.RFPDeadline.due_date_parsed < now)

    rfps = q.distinct().order_by(models.RFP.created_at.desc()).all()
    result = []
    for r in rfps:
        s = db.query(models.AISummary).filter_by(rfp_id=r.id).first()
        info = s.objectives if s else {}
        org  = (info or {}).get("organization")
        if client and client not in ("All Clients", "all"):
            if not org or client.lower() not in org.lower():
                continue
        bid = db.query(models.BidDecision).filter_by(rfp_id=r.id).first()
        if has_decision is True  and not bid: continue
        if has_decision is False and bid:     continue
        result.append({
            "id"           : str(r.id),
            "title"        : r.title,
            "status"       : r.status,
            "priority"     : r.priority,
            "notes"        : r.notes,
            "created_at"   : r.created_at.isoformat() if r.created_at else None,
            "client"       : org,
            "deadline"     : (info or {}).get("submissionDeadline"),
            "summary"      : s.summary if s else None,
            "bid_decision" : bid.recommendation if bid else None,
            "positive_flags": bid.positive_flags if bid else [],
            "risk_flags"   : bid.risk_flags if bid else [],
        })
    return result


# ─────────────────────────────────────────────
#  Single RFP (full detail)
# ─────────────────────────────────────────────

@router.get("/{rfp_id}")
def get_rfp(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfp = db.get(models.RFP, rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    s           = db.query(models.AISummary).filter_by(rfp_id=rfp_id).first()
    tech        = db.query(models.TechnicalAnalysis).filter_by(rfp_id=rfp_id).first()
    bid         = db.query(models.BidDecision).filter_by(rfp_id=rfp_id).first()
    eval_crit   = db.query(models.EvaluationCriteria).filter_by(rfp_id=rfp_id).all()
    steps       = (
        db.query(models.ApprovalStep)
        .filter_by(rfp_id=rfp_id)
        .order_by(models.ApprovalStep.step_order)
        .all()
    )
    comment_count = db.query(models.Comment).filter(
        models.Comment.rfp_id == rfp_id,
        models.Comment.parent_id == None,
    ).count()

    return {
        "id"         : str(rfp.id),
        "title"      : rfp.title,
        "status"     : rfp.status,
        "notes"      : rfp.notes,
        "created_at" : rfp.created_at.isoformat() if rfp.created_at else None,
        "information": s.objectives if s else None,
        "summary"    : s.summary if s else None,
        "technicalAnalysis": {
            "requirements"   : tech.requirements,
            "technologyStack": tech.technology_stack,
            "certifications" : tech.certifications,
            "complexityScore": float(tech.complexity_score) if tech.complexity_score else None,
        } if tech else None,
        "bidDecision": {
            "recommendation"   : bid.recommendation,
            "technicalFit"     : float(bid.technical_fit)   if bid.technical_fit   else None,
            "commercialFit"    : float(bid.financial_fit)   if bid.financial_fit   else None,
            "resourceReadiness": float(bid.resource_fit)    if bid.resource_fit    else None,
            "strategicAlignment": float(bid.strategic_fit)  if bid.strategic_fit   else None,
            "winProbability"   : float(bid.win_rate)        if bid.win_rate        else None,
            "riskLevel"        : float(bid.risk_level)      if bid.risk_level      else None,
            "confidenceLevel"  : float(bid.confidence_level)if bid.confidence_level else None,
            "positiveFlags"    : bid.positive_flags or [],
            "riskFlags"        : bid.risk_flags or [],
            "alignmentMatrix"  : bid.alignment_matrix or [],
            "requiredResources": bid.required_resources,
            "expectedRisks"    : bid.expected_risks,
            "budgetEstimate"   : bid.budget_estimate,
        } if bid else None,
        "approvalPipeline": [
            {
                "id"         : str(step.id),
                "stage"      : step.stage,
                "status"     : step.status,
                "step_order" : step.step_order,
                "completedAt": step.completed_at.isoformat() if step.completed_at else None,
            }
            for step in steps
        ],
        "evaluationCriteria": [
            {
                "id"      : str(ec.id),
                "criteria": ec.criteria,
                "weight"  : float(ec.weight) if ec.weight else None,
                "notes"   : ec.notes,
            }
            for ec in eval_crit
        ],
        "commentCount": comment_count,
    }


# ─────────────────────────────────────────────
#  Status Update
# ─────────────────────────────────────────────

VALID_STATUSES = {'draft', 'under_review', 'bid_decision', 'submitted', 'won', 'lost', 'no_bid'}

@router.patch("/{rfp_id}/status")
def update_rfp_status(
    rfp_id: uuid.UUID,
    body:   dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfp = db.get(models.RFP, rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")
    new_status = (body.get("status") or "").strip()
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Valid values: {', '.join(sorted(VALID_STATUSES))}",
        )
    old_status = rfp.status
    rfp.status = new_status
    if old_status != new_status:
        db.add(models.Notification(
            user_id=current_user.id,
            rfp_id =rfp_id,
            type   ="status_change",
            message=f'"{rfp.title}" status changed to {new_status.replace("_", " ").title()}',
        ))
    db.commit()
    return {"rfp_id": str(rfp_id), "status": rfp.status}


# ─────────────────────────────────────────────
#  Requirements (by category)
# ─────────────────────────────────────────────

@router.get("/{rfp_id}/requirements")
def get_requirements(
    rfp_id:   uuid.UUID,
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    q = db.query(models.Requirement).filter_by(rfp_id=rfp_id)
    if category and category in ("technical", "legal", "commercial"):
        q = q.filter_by(category=category)
    reqs = q.order_by(models.Requirement.created_at).all()
    return [
        {
            "id"           : str(r.id),
            "category"     : r.category,
            "text"         : r.text,
            "isMandatory"  : r.is_mandatory,
            "sourceSection": r.source_section,
        }
        for r in reqs
    ]


# ─────────────────────────────────────────────
#  Evaluation Criteria (per RFP)
# ─────────────────────────────────────────────

@router.get("/{rfp_id}/evaluation-criteria")
def get_evaluation_criteria(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    criteria = db.query(models.EvaluationCriteria).filter_by(rfp_id=rfp_id).all()
    return [
        {
            "id"      : str(c.id),
            "criteria": c.criteria,
            "weight"  : float(c.weight) if c.weight else None,
            "notes"   : c.notes,
        }
        for c in criteria
    ]


# ─────────────────────────────────────────────
#  Workflow (ApprovalSteps)
# ─────────────────────────────────────────────

@router.get("/{rfp_id}/workflow")
def get_workflow(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    steps = (
        db.query(models.ApprovalStep)
        .filter_by(rfp_id=rfp_id)
        .order_by(models.ApprovalStep.step_order)
        .all()
    )
    return [
        {
            "id"         : str(s.id),
            "stage"      : s.stage,
            "status"     : s.status,
            "step_order" : s.step_order,
            "notes"      : s.notes,
            "completedAt": s.completed_at.isoformat() if s.completed_at else None,
        }
        for s in steps
    ]


@router.patch("/{rfp_id}/workflow/{step_id}")
def update_workflow_step(
    rfp_id:  uuid.UUID,
    step_id: uuid.UUID,
    body:    dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    step = db.query(models.ApprovalStep).filter_by(id=step_id, rfp_id=rfp_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found.")

    STATUS_MAP = {
        "in_progress": "in_review",
        "completed"  : "approved",
        "rejected"   : "rejected",
        "pending"    : "pending",
        "in_review"  : "in_review",
        "approved"   : "approved",
        "skipped"    : "skipped",
    }
    if "status" in body:
        new_status = STATUS_MAP.get(body["status"], body["status"])
        step.status = new_status
        if new_status in ("approved", "completed"):
            step.completed_at = datetime.now()
    if "notes" in body:
        step.notes = body["notes"]

    db.commit()

    # Auto-submit: when every step is approved/completed, advance RFP to "submitted"
    all_steps = db.query(models.ApprovalStep).filter_by(rfp_id=rfp_id).all()
    if all_steps and all(s.status in ("approved", "completed") for s in all_steps):
        rfp_obj = db.get(models.RFP, rfp_id)
        if rfp_obj and rfp_obj.status not in ("won", "lost", "no_bid", "submitted"):
            rfp_obj.status = "submitted"
            db.add(models.Notification(
                user_id=current_user.id,
                rfp_id =rfp_id,
                type   ="status_change",
                message=f'"{rfp_obj.title}" completed all approval steps and moved to Submitted.',
            ))
            db.commit()

    return {
        "id"         : str(step.id),
        "stage"      : step.stage,
        "status"     : step.status,
        "completedAt": step.completed_at.isoformat() if step.completed_at else None,
    }


# ─────────────────────────────────────────────
#  Per-RFP Notifications
# ─────────────────────────────────────────────

@router.get("/{rfp_id}/notifications")
def get_rfp_notifications(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    rows = (
        db.query(models.Notification)
        .filter_by(rfp_id=rfp_id, user_id=current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(20)
        .all()
    )
    unread = sum(1 for n in rows if not n.is_read)
    return {
        "unread": unread,
        "items" : [
            {
                "id"       : str(n.id),
                "type"     : n.type,
                "message"  : n.message,
                "isRead"   : n.is_read,
                "createdAt": n.created_at.isoformat() if n.created_at else None,
            }
            for n in rows
        ],
    }


# ─────────────────────────────────────────────
#  Per-RFP Deadlines
# ─────────────────────────────────────────────

@router.get("/{rfp_id}/deadlines")
def get_rfp_deadlines(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    rows = (
        db.query(models.RFPDeadline)
        .filter_by(rfp_id=rfp_id)
        .order_by(models.RFPDeadline.created_at)
        .all()
    )
    return [
        {
            "id"     : str(d.id),
            "title"  : d.title,
            "dueDate": d.due_date,
            "urgency": d.urgency,
        }
        for d in rows
    ]


# ─────────────────────────────────────────────
#  RFP Completion (7-dimension tracker)
# ─────────────────────────────────────────────

@router.get("/{rfp_id}/completion")
def get_rfp_completion(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns a weighted completion score (0-100) across 7 real DB signals.
    Each dimension is either 0% (not done) or 100% (done); overall is the
    weighted average so the dashboard can show meaningful progress.
    """
    rfp = db.get(models.RFP, rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    ai_summary     = db.query(models.AISummary).filter_by(rfp_id=rfp_id).first()
    req_count      = db.query(models.Requirement).filter_by(rfp_id=rfp_id).count()
    crit_count     = db.query(models.EvaluationCriteria).filter_by(rfp_id=rfp_id).count()
    bid            = db.query(models.BidDecision).filter_by(rfp_id=rfp_id).first()
    workflow_count = db.query(models.ApprovalStep).filter_by(rfp_id=rfp_id).count()
    comment_count  = db.query(models.Comment).filter_by(rfp_id=rfp_id).count()
    draft_count    = db.query(models.DraftDocument).filter_by(rfp_id=rfp_id).count()

    has_overview    = bool(ai_summary and ai_summary.objectives)
    has_reqs        = req_count > 0
    has_criteria    = crit_count > 0
    has_ai_scores   = bool(bid and bid.technical_fit is not None)
    has_decision    = bool(bid and bid.recommendation)
    has_workflow    = workflow_count > 0
    has_collab      = comment_count > 0

    sections = [
        {"key": "overview_parsed",       "label": "Overview Extracted",      "weight": 15, "completed": has_overview,  "detail": f"{len(ai_summary.objectives or {})} fields extracted" if has_overview else "Not yet extracted"},
        {"key": "requirements_extracted","label": "Requirements Extracted",  "weight": 20, "completed": has_reqs,      "detail": f"{req_count} requirement{'s' if req_count != 1 else ''}" if has_reqs else "No requirements found"},
        {"key": "evaluation_criteria",   "label": "Evaluation Criteria",     "weight": 15, "completed": has_criteria,  "detail": f"{crit_count} {'criterion' if crit_count == 1 else 'criteria'}" if has_criteria else "No criteria detected"},
        {"key": "ai_scored",             "label": "AI Bid Analysis",         "weight": 20, "completed": has_ai_scores, "detail": "6 scores computed" if has_ai_scores else "Scores not yet generated"},
        {"key": "decision_made",         "label": "Bid / No-Bid Decision",   "weight": 15, "completed": has_decision,  "detail": (bid.recommendation or "").replace("_", " ").title() if has_decision else "No decision recorded"},
        {"key": "workflow_assigned",     "label": "Approval Workflow",       "weight": 10, "completed": has_workflow,  "detail": f"{workflow_count} steps" if has_workflow else "No steps assigned"},
        {"key": "collaboration",         "label": "Team Collaboration",      "weight":  5, "completed": has_collab,    "detail": f"{comment_count} comment{'s' if comment_count != 1 else ''}" if has_collab else "No comments yet"},
    ]

    overall = sum(s["weight"] for s in sections if s["completed"])

    return {
        "rfp_id"            : str(rfp_id),
        "overall_completion": overall,
        "sections"          : sections,
        "draft_count"       : draft_count,
    }


# ─────────────────────────────────────────────
#  Re-process (re-extract AI data for existing RFP)
# ─────────────────────────────────────────────

@router.post("/{rfp_id}/reprocess", status_code=200)
def reprocess_rfp(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Re-runs AI extraction on the stored chunk content.
    Clears and re-populates requirements and evaluation_criteria rows.
    Useful after prompt improvements or when legacy RFPs have empty categories.
    """
    rfp = db.get(models.RFP, rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    # Reconstruct source text from stored document chunks
    chunks = (
        db.query(models.DocumentChunk)
        .filter_by(rfp_id=rfp_id)
        .order_by(models.DocumentChunk.chunk_index)
        .all()
    )
    if not chunks:
        raise HTTPException(status_code=400, detail="No stored content found for this RFP. Re-upload the file.")

    source_text = " ".join(c.content for c in chunks)

    # Delete stale requirements and evaluation criteria
    db.query(models.Requirement).filter_by(rfp_id=rfp_id).delete()
    db.query(models.EvaluationCriteria).filter_by(rfp_id=rfp_id).delete()
    db.commit()

    requirements_extracted: dict = {}
    criteria_extracted: list = []

    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": (
                    "You are an expert RFP analyst. Read the ENTIRE RFP text carefully — "
                    "requirements and criteria often appear in the middle and latter sections. "
                    "Return a JSON object with EXACTLY these keys:\n"
                    "- requirements: {\n"
                    "    technical: [string],   <- software/hardware specs, integration, infrastructure, "
                    "                              system architecture, performance, technology stack\n"
                    "    legal: [string],       <- compliance obligations, regulatory requirements, "
                    "                              certifications, data protection, GDPR/privacy law, "
                    "                              insurance, liability, indemnification, governing law, "
                    "                              IP ownership, confidentiality, audit rights\n"
                    "    commercial: [string]   <- pricing structure, payment terms, contract duration, "
                    "                              SLA commitments, penalties/liquidated damages, "
                    "                              budget constraints, invoicing, warranty periods, "
                    "                              termination clauses, performance bonds\n"
                    "  }\n"
                    "  Use empty array [] only if genuinely absent.\n"
                    "- criteria: [{name: string, weight: number or null, description: string}] "
                    "  <- ALL scoring rubric entries, evaluation weights, selection criteria; "
                    "     empty array only if no rubric exists\n"
                    "Never invent data not present in the text."
                )},
                {"role": "user", "content": f"Analyze this RFP text:\n\n{source_text[:15000]}"},
            ],
            max_tokens=3000,
        )
        parsed = json.loads(resp.choices[0].message.content.strip())
        reqs_raw = parsed.get("requirements") or {}
        if isinstance(reqs_raw, dict):
            requirements_extracted = reqs_raw
        crit_raw = parsed.get("criteria") or []
        if isinstance(crit_raw, list):
            criteria_extracted = crit_raw
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI extraction failed: {exc}")

    # Save refreshed requirements
    saved_req = 0
    for category, req_list in requirements_extracted.items():
        if category not in ("technical", "legal", "commercial"):
            continue
        for req_text in (req_list or []):
            if isinstance(req_text, str) and req_text.strip():
                db.add(models.Requirement(
                    rfp_id  =rfp_id,
                    category=category,
                    text    =req_text.strip(),
                ))
                saved_req += 1

    # Save refreshed evaluation criteria
    saved_crit = 0
    for crit in criteria_extracted:
        if not isinstance(crit, dict):
            continue
        name = (crit.get("name") or crit.get("criterion") or "").strip()
        if name:
            weight = crit.get("weight")
            try:
                weight = float(weight) if weight is not None else None
            except (TypeError, ValueError):
                weight = None
            db.add(models.EvaluationCriteria(
                rfp_id  =rfp_id,
                criteria=name,
                weight  =weight,
                notes   =crit.get("description"),
            ))
            saved_crit += 1

    db.commit()

    return {
        "rfp_id"              : str(rfp_id),
        "requirements_saved"  : saved_req,
        "criteria_saved"      : saved_crit,
        "categories"          : {k: len(v) for k, v in requirements_extracted.items() if isinstance(v, list)},
    }


# ─────────────────────────────────────────────
#  Generate Draft
# ─────────────────────────────────────────────

@router.post("/{rfp_id}/generate-draft")
async def generate_draft(
    rfp_id: uuid.UUID,
    payload: schemas.GenerateDraftRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfp = db.get(models.RFP, rfp_id)
    if rfp is None:
        raise HTTPException(status_code=404, detail="RFP not found.")
    chunks = (
        db.query(models.DocumentChunk)
        .filter_by(rfp_id=rfp_id)
        .order_by(models.DocumentChunk.chunk_index)
        .all()
    )
    source_text = " ".join(c.content for c in chunks).strip()
    if not source_text:
        raise HTTPException(status_code=400, detail="This RFP has no extracted content to draft from.")

    custom = (payload.prompt or "").strip()
    system = (
        f"You are an expert proposal writer. Draft a '{payload.draftType}' section for a "
        "response to the following RFP. Base it only on the RFP content provided."
    )
    user_msg = (
        f"RFP: {rfp.title}\n\nContent:\n{source_text[:6000]}\n\n"
        + (f"Extra instructions: {custom}\n\n" if custom else "")
        + f"Write the {payload.draftType} now."
    )
    try:
        res = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
            max_tokens=900,
        )
        content_text = res.choices[0].message.content.strip()

        # Persist the generated draft to draft_documents / draft_versions
        draft_type_db = DRAFT_TYPE_MAP.get(payload.draftType.lower().strip())
        if draft_type_db:
            draft_doc = db.query(models.DraftDocument).filter_by(rfp_id=rfp_id, draft_type=draft_type_db).first()
            if not draft_doc:
                draft_doc = models.DraftDocument(
                    rfp_id      =rfp_id,
                    generated_by=current_user.id,
                    draft_type  =draft_type_db,
                    prompt      =(payload.prompt or "").strip() or None,
                    content     =content_text,
                )
                db.add(draft_doc)
                db.flush()
                version_num = 1
            else:
                draft_doc.content = content_text
                db.flush()
                last_ver = (
                    db.query(models.DraftVersion)
                    .filter_by(draft_document_id=draft_doc.id)
                    .order_by(models.DraftVersion.version_number.desc())
                    .first()
                )
                version_num = (last_ver.version_number + 1) if last_ver else 1

            db.add(models.DraftVersion(
                draft_document_id=draft_doc.id,
                version_number   =version_num,
                content          =content_text,
                prompt           =(payload.prompt or "").strip() or None,
                generated_by     =current_user.id,
            ))
            db.commit()

        return {"content": content_text, "draftType": payload.draftType}
    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="AI service authentication failed.")
    except (APIConnectionError, APIStatusError, OpenAIError, BadRequestError) as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


# ─────────────────────────────────────────────
#  Draft Documents
# ─────────────────────────────────────────────

_DRAFT_LABELS = {
    "executive_summary": "Executive Summary",
    "technical":         "Technical Proposal",
    "commercial":        "Commercial Proposal",
    "compliance":        "Compliance Response",
    "full":              "Full Proposal",
}

@router.get("/{rfp_id}/drafts")
def get_drafts(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    docs = (
        db.query(models.DraftDocument)
        .filter_by(rfp_id=rfp_id)
        .all()
    )
    result = []
    for d in docs:
        latest = (
            db.query(models.DraftVersion)
            .filter_by(draft_document_id=d.id)
            .order_by(models.DraftVersion.version_number.desc())
            .first()
        )
        result.append({
            "id"            : str(d.id),
            "draft_type"    : d.draft_type,
            "label"         : _DRAFT_LABELS.get(d.draft_type, d.draft_type or "Draft"),
            "version_number": latest.version_number if latest else 1,
            "created_at"    : latest.created_at.isoformat() if latest and latest.created_at else None,
        })
    return {
        "drafts"               : result,
        "completion_percentage": round(len(result) / TOTAL_DRAFT_SECTIONS * 100),
        "total_sections"       : TOTAL_DRAFT_SECTIONS,
    }


# ─────────────────────────────────────────────
#  Comments
# ─────────────────────────────────────────────

def _format_comment(c: models.Comment, db: Session) -> dict:
    author = db.get(models.User, c.author_id)
    return {
        "id"        : str(c.id),
        "message"   : c.message,
        "authorId"  : str(c.author_id),
        "authorName": author.name if author else "Unknown",
        "authorRole": author.role if author else "user",
        "parentId"  : str(c.parent_id) if c.parent_id else None,
        "createdAt" : c.created_at.isoformat() if c.created_at else None,
        "isEdited"  : c.is_edited,
        "replies"   : [_format_comment(r, db) for r in (c.replies or [])],
    }


@router.get("/{rfp_id}/comments")
def list_comments(rfp_id: uuid.UUID, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    top = (
        db.query(models.Comment)
        .filter(models.Comment.rfp_id == rfp_id, models.Comment.parent_id == None)
        .order_by(models.Comment.created_at.asc())
        .all()
    )
    return [_format_comment(c, db) for c in top]


@router.post("/{rfp_id}/comments", status_code=201)
def create_comment(rfp_id: uuid.UUID, body: schemas.CommentCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    if not db.get(models.RFP, rfp_id):
        raise HTTPException(status_code=404, detail="RFP not found.")
    if body.parent_id:
        if not db.query(models.Comment).filter_by(id=body.parent_id, rfp_id=rfp_id).first():
            raise HTTPException(status_code=404, detail="Parent comment not found.")
    comment = models.Comment(
        rfp_id=rfp_id, author_id=current_user.id,
        message=body.message.strip(), parent_id=body.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _format_comment(comment, db)


@router.delete("/{rfp_id}/comments/{comment_id}", status_code=204)
def delete_comment(rfp_id: uuid.UUID, comment_id: uuid.UUID, db=Depends(get_db), current_user=Depends(get_current_user)):
    c = db.query(models.Comment).filter_by(id=comment_id, rfp_id=rfp_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found.")
    if c.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")
    db.delete(c)
    db.commit()


# ─────────────────────────────────────────────
#  Bid / No-Bid Decision
# ─────────────────────────────────────────────

@router.patch("/{rfp_id}/decision")
def update_decision(rfp_id: uuid.UUID, body: schemas.DecisionUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    rfp = db.get(models.RFP, rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    bid = db.query(models.BidDecision).filter_by(rfp_id=rfp_id).first()
    if not bid:
        bid = models.BidDecision(rfp_id=rfp_id)
        db.add(bid)

    notify = False

    # Update recommendation only when explicitly provided
    if body.decision is not None:
        MAP = {"BID": "bid", "NO BID": "no_bid", "NO_BID": "no_bid", "CONDITIONAL": "conditional_bid"}
        rec = MAP.get(body.decision.upper(), body.decision.lower().replace(" ", "_"))
        bid.recommendation = rec
        rfp.status = "no_bid" if rec == "no_bid" else "bid_decision"
        notify = True

    # Persist editable fields from the UI form
    if body.required_resources is not None:
        bid.required_resources = body.required_resources or None
    if body.expected_risks is not None:
        bid.expected_risks = body.expected_risks or None
    if body.budget_estimate is not None:
        bid.budget_estimate = body.budget_estimate or None
    if body.notes is not None:
        rfp.notes = body.notes

    if notify:
        label = "BID" if bid.recommendation == "bid" else "NO-BID"
        db.add(models.Notification(
            user_id=current_user.id, rfp_id=rfp_id,
            type="status_change", message=f'Decision recorded for "{rfp.title}": {label}',
        ))

    db.commit()
    return {
        "rfp_id"    : str(rfp_id),
        "decision"  : bid.recommendation,
        "status"    : rfp.status,
    }


# ─────────────────────────────────────────────
#  RAG Chat
# ─────────────────────────────────────────────

@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_rfp(body: schemas.ChatRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Unified chat endpoint — all questions go through the tool-calling engine.

    context_rfp_id resolution (in priority order):
      1. body.rfp_id  — explicitly set by the Detail page
      2. UUID found anywhere in the question text — hints the model toward that RFP
      3. None         — Dashboard / global mode; model uses get_rfp_count / list_rfps freely
    """
    try:
        # Detect a UUID mentioned inside the question text (e.g. "tell me about <uuid>")
        context_rfp_id: uuid.UUID | None = None

        if body.rfp_id:
            context_rfp_id = body.rfp_id
        else:
            match = re.search(
                r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
                body.question, re.IGNORECASE,
            )
            if match:
                try:
                    candidate = uuid.UUID(match.group(0))
                    if db.get(models.RFP, candidate):
                        context_rfp_id = candidate
                except ValueError:
                    pass

        row = rag_engine.chat(
            db             =db,
            session_id     =body.session_id,
            user_id        =current_user.id,
            question       =body.question,
            context_rfp_id =context_rfp_id,
            top_k          =body.top_k,
        )
        return schemas.ChatResponse(
            session_id   =row.session_id,
            answer       =row.ai_response,
            context_used =row.context_used,
            prompt_tokens=row.prompt_tokens,
        )

    except AuthenticationError:
        raise HTTPException(status_code=502, detail="OpenAI API key is invalid or missing.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="OpenAI rate limit reached.")
    except APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not reach OpenAI.")
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")
