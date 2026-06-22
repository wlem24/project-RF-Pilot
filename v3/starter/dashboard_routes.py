"""
Unified dashboard analytics endpoint.
Returns all data needed by the Overview Dashboard in a single request,
with optional server-side filtering so every section reflects the same
filter state simultaneously.
"""
from datetime import datetime, timezone as _tz
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from auth_utils import get_current_user
import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _urgency(parsed_dt) -> str:
    if parsed_dt is None:
        return "normal"
    now = datetime.now(_tz.utc)
    dt  = parsed_dt if parsed_dt.tzinfo else parsed_dt.replace(tzinfo=_tz.utc)
    if dt < now:
        return "overdue"
    days = (dt - now).days
    if days <= 3:
        return "urgent"
    if days <= 7:
        return "soon"
    return "normal"


@router.get("/analytics")
def dashboard_analytics(
    status:         Optional[str] = Query(None),
    client:         Optional[str] = Query(None),
    priority:       Optional[str] = Query(None),
    owner:          Optional[str] = Query(None),
    deadline_range: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Single endpoint powering the entire Overview Dashboard.
    Applying a filter here affects KPIs, pipeline, top clients,
    bid decisions, and deadlines simultaneously.
    """

    # ── Build filtered RFP queryset ─────────────────────────────────────
    STATUS_MAP = {
        "Under Review": "under_review",
        "Drafting":     "draft",
        "Submitted":    "submitted",
        "Archived":     "no_bid",
    }
    VALID_PRIORITIES    = {"low", "medium", "high", "critical"}
    VALID_DEADLINE_RNGS = {"next_7_days", "next_30_days", "overdue"}

    q = db.query(models.RFP)

    if status and status not in ("All Statuses", "all"):
        db_status = STATUS_MAP.get(status, status.lower().replace(" ", "_"))
        q = q.filter(models.RFP.status == db_status)

    if priority and priority.lower() in VALID_PRIORITIES:
        q = q.filter(models.RFP.priority == priority.lower())

    if owner and owner not in ("All Owners", "all"):
        q = q.join(models.User, models.User.id == models.RFP.uploaded_by).filter(
            models.User.name.ilike(f"%{owner}%")
        )

    if deadline_range and deadline_range.lower() in VALID_DEADLINE_RNGS:
        from datetime import timedelta
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

    all_rfps = q.distinct().all()

    # Client filter: match AI-extracted organization name ─────────────
    if client and client not in ("All Clients", "all"):
        # Load summaries for the filtered rfp set
        rfp_ids = {r.id for r in all_rfps}
        summaries = db.query(models.AISummary).filter(
            models.AISummary.rfp_id.in_(rfp_ids)
        ).all()
        org_map = {
            s.rfp_id: (s.objectives or {}).get("organization", "")
            for s in summaries
        }
        all_rfps = [
            r for r in all_rfps
            if client.lower() in (org_map.get(r.id) or "").lower()
        ]

    # ── KPI Stats ───────────────────────────────────────────────────────
    now        = datetime.now(_tz.utc)
    cur_start  = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if cur_start.month == 1:
        prev_start = cur_start.replace(year=cur_start.year - 1, month=12)
    else:
        prev_start = cur_start.replace(month=cur_start.month - 1)

    def ts(r):
        return r.created_at if r.created_at and r.created_at.tzinfo else None

    cur_rfps  = [r for r in all_rfps if ts(r) and ts(r) >= cur_start]
    prev_rfps = [r for r in all_rfps if ts(r) and prev_start <= ts(r) < cur_start]

    def pct(cur, prev):
        return round((cur - prev) / prev * 100) if prev else None

    counts: dict = {}
    for r in all_rfps:
        counts[r.status] = counts.get(r.status, 0) + 1

    prev_counts: dict = {}
    for r in prev_rfps:
        prev_counts[r.status] = prev_counts.get(r.status, 0) + 1

    won     = counts.get("won", 0)
    lost    = counts.get("lost", 0)
    decided = won + lost
    win_rate = round(won / decided * 100) if decided else None

    active      = counts.get("under_review", 0) + counts.get("bid_decision", 0)
    prev_active = prev_counts.get("under_review", 0) + prev_counts.get("bid_decision", 0)

    stats = {
        "total"              : len(all_rfps),
        "total_change"       : pct(len(cur_rfps), len(prev_rfps)),
        "active"             : active,
        "active_change"      : pct(active, prev_active),
        "under_review"       : counts.get("under_review", 0),
        "under_review_change": pct(counts.get("under_review", 0), prev_counts.get("under_review", 0)),
        "draft"              : counts.get("draft", 0),
        "submitted"          : counts.get("submitted", 0),
        "submitted_change"   : pct(counts.get("submitted", 0), prev_counts.get("submitted", 0)),
        "won"                : won,
        "lost"               : lost,
        "decided"            : decided,
        "archived"           : counts.get("no_bid", 0) + lost,
        "win_rate"           : win_rate,
    }

    # ── Pipeline Value (RFP count per month, last 7 months) ─────────────
    abbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    pipeline_value = []
    for i in range(6, -1, -1):
        total_months = now.year * 12 + now.month - 1 - i
        yr = total_months // 12
        mo = (total_months % 12) + 1
        cnt = sum(
            1 for r in all_rfps
            if r.created_at and r.created_at.year == yr and r.created_at.month == mo
        )
        pipeline_value.append({"month": abbr[mo - 1], "value": cnt})

    # ── Top Clients ──────────────────────────────────────────────────────
    rfp_ids = {r.id for r in all_rfps}
    summaries = db.query(models.AISummary).filter(
        models.AISummary.rfp_id.in_(rfp_ids)
    ).all() if rfp_ids else []

    org_counts: dict = {}
    org_rfp_ids: dict = {}
    for s in summaries:
        org = (s.objectives or {}).get("organization") if s.objectives else None
        if org:
            org_counts[org]   = org_counts.get(org, 0) + 1
            org_rfp_ids.setdefault(org, set()).add(s.rfp_id)

    status_by_rfp = {r.id: r.status for r in all_rfps}
    total_orgs = sum(org_counts.values()) or 1

    top_clients = sorted(
        [
            {
                "name" : name,
                "count": cnt,
                "pct"  : round(cnt / total_orgs * 100),
                "won"  : sum(1 for rid in org_rfp_ids[name] if status_by_rfp.get(rid) == "won"),
                "lost" : sum(1 for rid in org_rfp_ids[name] if status_by_rfp.get(rid) == "lost"),
            }
            for name, cnt in org_counts.items()
        ],
        key=lambda x: -x["count"],
    )[:5]

    for c in top_clients:
        decided_c = c["won"] + c["lost"]
        c["win_rate"] = round(c["won"] / decided_c * 100) if decided_c else None

    # ── Owners (for filter dropdown) ─────────────────────────────────────
    owner_rows = (
        db.query(models.User)
        .join(models.RFP, models.RFP.uploaded_by == models.User.id)
        .distinct()
        .all()
    )
    owners = [{"id": str(u.id), "name": u.name} for u in owner_rows]

    # ── Notifications ────────────────────────────────────────────────────
    notif_rows = (
        db.query(models.Notification)
        .filter_by(user_id=current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(20)
        .all()
    )
    notifications = [
        {
            "id"       : str(n.id),
            "type"     : n.type,
            "message"  : n.message,
            "isRead"   : n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
            "rfpId"    : str(n.rfp_id) if n.rfp_id else None,
        }
        for n in notif_rows
    ]

    # ── Deadlines (re-compute urgency from parsed date) ───────────────────
    deadline_rows = (
        db.query(models.RFPDeadline)
        .join(models.RFP, models.RFP.id == models.RFPDeadline.rfp_id)
        .all()
    )
    deadlines = [
        {
            "id"      : str(d.id),
            "rfpId"   : str(d.rfp_id),
            "rfpTitle": d.rfp.title if d.rfp else "Unknown RFP",
            "title"   : d.title,
            "dueDate" : d.due_date,
            "urgency" : _urgency(d.due_date_parsed),
        }
        for d in deadline_rows
    ]
    deadlines.sort(key=lambda d: (
        0 if d["urgency"] == "overdue" else
        1 if d["urgency"] == "urgent"  else
        2 if d["urgency"] == "soon"    else 3
    ))

    # ── Decision RFPs (with client info from AI summaries) ───────────────
    decision_rfp_ids = {r.id for r in all_rfps if True}  # already filtered
    bid_rows = (
        db.query(models.BidDecision)
        .filter(models.BidDecision.rfp_id.in_(decision_rfp_ids))
        .filter(models.BidDecision.recommendation.isnot(None))
        .all()
    )
    bid_map = {b.rfp_id: b for b in bid_rows}

    summary_map = {s.rfp_id: s for s in summaries} if summaries else {}

    decision_rfps = []
    for r in all_rfps:
        bid = bid_map.get(r.id)
        if not bid:
            continue
        s   = summary_map.get(r.id)
        org = (s.objectives or {}).get("organization") if s and s.objectives else None
        decision_rfps.append({
            "id"            : str(r.id),
            "title"         : r.title,
            "status"        : r.status,
            "client"        : org,
            "bid_decision"  : bid.recommendation,
            "positive_flags": bid.positive_flags or [],
            "risk_flags"    : bid.risk_flags     or [],
            "summary"       : (s.summary if s else None),
        })

    return {
        "stats"         : stats,
        "pipeline_value": pipeline_value,
        "top_clients"   : top_clients,
        "owners"        : owners,
        "notifications" : notifications,
        "deadlines"     : deadlines,
        "decision_rfps" : decision_rfps,
        "generated_at"  : now.isoformat(),
        "filters_applied": {
            k: v for k, v in {
                "status": status, "client": client,
                "priority": priority, "owner": owner,
                "deadline_range": deadline_range,
            }.items() if v
        },
    }
