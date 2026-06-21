from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth_utils import get_current_user
import models

notif_router    = APIRouter(prefix="/notifications", tags=["Notifications"])
deadline_router = APIRouter(prefix="/deadlines",     tags=["Deadlines"])


# ── Notifications ──────────────────────────────────────────────────────────

@notif_router.get("/")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.Notification)
        .filter_by(user_id=current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id"       : str(n.id),
            "type"     : n.type,
            "message"  : n.message,
            "isRead"   : n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
            "rfpId"    : str(n.rfp_id) if n.rfp_id else None,
        }
        for n in rows
    ]


@notif_router.post("/{notif_id}/read")
def mark_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    import uuid as _uuid
    try:
        nid = _uuid.UUID(notif_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid notification ID.")

    notif = db.query(models.Notification).filter_by(id=nid, user_id=current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    return {"ok": True}


@notif_router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.Notification).filter_by(user_id=current_user.id, is_read=False).update({"is_read": True})
    db.commit()
    return {"ok": True}


# ── Deadlines ──────────────────────────────────────────────────────────────

@deadline_router.get("/")
def list_deadlines(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns all deadlines across every RFP from the rfp_deadlines table,
    which is populated by the AI extraction job at upload time.
    Falls back to ai_summaries.objectives for older RFPs that pre-date
    the rfp_deadlines table.
    """
    rows = (
        db.query(models.RFPDeadline)
        .join(models.RFP, models.RFP.id == models.RFPDeadline.rfp_id)
        .order_by(models.RFPDeadline.urgency.desc(), models.RFPDeadline.created_at.asc())
        .all()
    )
    seen_rfp_ids = {str(d.rfp_id) for d in rows}

    deadlines = [
        {
            "id"      : str(d.id),
            "rfpId"   : str(d.rfp_id),
            "rfpTitle": d.rfp.title if d.rfp else "Unknown RFP",
            "title"   : d.title,
            "dueDate" : d.due_date,
            "urgency" : d.urgency,
        }
        for d in rows
    ]

    # Back-fill from ai_summaries for RFPs that were uploaded before rfp_deadlines existed
    older = db.query(models.AISummary).all()
    for s in older:
        if str(s.rfp_id) in seen_rfp_ids:
            continue
        if not s.objectives or not isinstance(s.objectives, dict):
            continue
        dl = s.objectives.get("submissionDeadline")
        if not dl:
            continue
        rfp = db.get(models.RFP, s.rfp_id)
        if rfp:
            deadlines.append({
                "id"      : str(s.id),
                "rfpId"   : str(rfp.id),
                "rfpTitle": rfp.title,
                "title"   : "Submission Deadline",
                "dueDate" : dl,
                "urgency" : "urgent",
            })

    return deadlines
