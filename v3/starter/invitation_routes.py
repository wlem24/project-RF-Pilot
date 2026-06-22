import secrets
import uuid as _uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth_utils import get_current_user, hash_password
import models
import schemas
from email_utils import send_invitation_email, build_invite_url

router = APIRouter(prefix="/invitations", tags=["Invitations"])

VALID_ROLES      = {"admin", "user"}
INVITE_EXPIRE_DAYS = 7


# ── RBAC helper ────────────────────────────────────────────────────────────────

def require_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


# ── POST /invitations/ ─────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_invitation(
    body: schemas.InvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if body.role.lower() not in VALID_ROLES:
        raise HTTPException(status_code=422, detail=f"Invalid role. Valid values: {', '.join(VALID_ROLES)}")

    # Check whether this email already has a pending invite
    existing = (
        db.query(models.Invitation)
        .filter_by(email=body.email.lower(), status="pending")
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A pending invitation already exists for this email address.",
        )

    token      = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=INVITE_EXPIRE_DAYS)

    invite = models.Invitation(
        invited_by =current_user.id,
        email      =body.email.lower(),
        role       =body.role.lower(),
        token      =token,
        status     ="pending",
        expires_at =expires_at,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    email_result = send_invitation_email(
        to_email       =body.email,
        invited_by_name=current_user.name,
        role           =body.role,
        token          =token,
    )

    return {
        "id"          : str(invite.id),
        "email"       : invite.email,
        "role"        : invite.role,
        "status"      : invite.status,
        "expiresAt"   : invite.expires_at.isoformat(),
        "createdAt"   : invite.created_at.isoformat(),
        "emailSent"   : email_result["status"] == "sent",
        "emailStatus" : email_result["status"],
        # Always return the URL so the admin can copy it
        "inviteUrl"   : email_result["invite_url"],
        # Only present when delivery was not successful
        "warning"     : email_result.get("message"),
    }


# ── GET /invitations/ ──────────────────────────────────────────────────────────

@router.get("/")
def list_invitations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    now  = datetime.now(timezone.utc)
    rows = (
        db.query(models.Invitation)
        .order_by(models.Invitation.created_at.desc())
        .all()
    )

    result = []
    for inv in rows:
        # Auto-expire stale pending invitations at read time
        if inv.status == "pending" and inv.expires_at and inv.expires_at < now:
            inv.status = "expired"

        inviter = db.get(models.User, inv.invited_by)
        result.append({
            "id"        : str(inv.id),
            "email"     : inv.email,
            "role"      : inv.role,
            "status"    : inv.status,
            "invitedBy" : inviter.name if inviter else "Unknown",
            "expiresAt" : inv.expires_at.isoformat() if inv.expires_at else None,
            "createdAt" : inv.created_at.isoformat() if inv.created_at else None,
        })

    db.commit()   # persist any auto-expired status updates
    return result


# ── POST /invitations/{id}/resend ────────────────────────────────────────────

@router.post("/{invitation_id}/resend", status_code=200)
def resend_invitation(
    invitation_id: _uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    inv = db.get(models.Invitation, invitation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if inv.status not in ("pending", "expired"):
        raise HTTPException(status_code=409, detail=f"Cannot resend a '{inv.status}' invitation.")

    # Reset expiry and mark pending
    inv.status     = "pending"
    inv.expires_at = datetime.now(timezone.utc) + timedelta(days=INVITE_EXPIRE_DAYS)
    db.commit()

    email_result = send_invitation_email(
        to_email       =inv.email,
        invited_by_name=current_user.name,
        role           =inv.role,
        token          =inv.token,
    )

    return {
        "id"          : str(inv.id),
        "email"       : inv.email,
        "emailStatus" : email_result["status"],
        "inviteUrl"   : email_result["invite_url"],
        "warning"     : email_result.get("message"),
        "expiresAt"   : inv.expires_at.isoformat(),
    }


# ── DELETE /invitations/{id} — revoke ─────────────────────────────────────────

@router.delete("/{invitation_id}", status_code=204)
def revoke_invitation(
    invitation_id: _uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    inv = db.get(models.Invitation, invitation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    if inv.status != "pending":
        raise HTTPException(status_code=409, detail=f"Cannot revoke a '{inv.status}' invitation.")
    inv.status = "revoked"
    db.commit()


# ── POST /invitations/{token}/accept — public ─────────────────────────────────

@router.post("/{token}/accept", status_code=200)
def accept_invitation(
    token: str,
    body: schemas.InvitationAccept,
    db: Session = Depends(get_db),
):
    inv = db.query(models.Invitation).filter_by(token=token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found or already used.")
    if inv.status == "accepted":
        raise HTTPException(status_code=409, detail="This invitation has already been accepted.")
    if inv.status in ("revoked", "expired"):
        raise HTTPException(status_code=410, detail=f"This invitation has been {inv.status}.")
    if inv.expires_at and inv.expires_at < datetime.now(timezone.utc):
        inv.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="This invitation has expired.")

    # Check if a user with this email already exists
    existing_user = db.query(models.User).filter_by(email=inv.email).first()
    if existing_user:
        # Link existing user to invitation (just update their role)
        existing_user.role = inv.role
        inv.status      = "accepted"
        inv.accepted_by = existing_user.id
        db.commit()
        return {
            "message": "Invitation accepted. Your role has been updated.",
            "email"  : inv.email,
            "role"   : inv.role,
        }

    # Create new user
    new_user = models.User(
        name         =body.name.strip(),
        email        =inv.email,
        password_hash=hash_password(body.password),
        role         =inv.role,
    )
    db.add(new_user)
    db.flush()   # get new_user.id without committing

    inv.status      = "accepted"
    inv.accepted_by = new_user.id
    db.commit()

    return {
        "message": "Account created successfully. You can now log in.",
        "email"  : inv.email,
        "role"   : inv.role,
    }


# ── GET /invitations/{token} — preview (public) ───────────────────────────────

@router.get("/{token}/preview")
def preview_invitation(token: str, db: Session = Depends(get_db)):
    inv = db.query(models.Invitation).filter_by(token=token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    now = datetime.now(timezone.utc)
    if inv.status == "pending" and inv.expires_at and inv.expires_at < now:
        inv.status = "expired"
        db.commit()
    return {
        "email"     : inv.email,
        "role"      : inv.role,
        "status"    : inv.status,
        "expiresAt" : inv.expires_at.isoformat() if inv.expires_at else None,
    }
