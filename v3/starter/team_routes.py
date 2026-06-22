import uuid as _uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth_utils import get_current_user
import models
import schemas

router = APIRouter(prefix="/team", tags=["Team"])

VALID_ROLES = {"admin", "user"}


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


# ── GET /team/members ─────────────────────────────────────────────────────────

@router.get("/members")
def list_members(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    users = db.query(models.User).order_by(models.User.created_at.asc()).all()
    return [
        {
            "id"       : str(u.id),
            "name"     : u.name,
            "email"    : u.email,
            "role"     : u.role or "user",
            "avatarUrl": u.avatar_url,
            "joinedAt" : u.created_at.isoformat() if u.created_at else None,
            "isYou"    : u.id == current_user.id,
        }
        for u in users
    ]


# ── PATCH /team/members/{id}/role — admin only ────────────────────────────────

@router.patch("/members/{member_id}/role")
def update_member_role(
    member_id: _uuid.UUID,
    body: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if body.role.lower() not in VALID_ROLES:
        raise HTTPException(status_code=422, detail=f"Invalid role. Valid: {', '.join(VALID_ROLES)}")
    if member_id == current_user.id:
        raise HTTPException(status_code=409, detail="You cannot change your own role.")

    user = db.get(models.User, member_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.role = body.role.lower()
    db.commit()
    return {"id": str(user.id), "name": user.name, "role": user.role}


# ── DELETE /team/members/{id} — admin only ────────────────────────────────────

@router.delete("/members/{member_id}", status_code=204)
def remove_member(
    member_id: _uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if member_id == current_user.id:
        raise HTTPException(status_code=409, detail="You cannot remove yourself.")

    user = db.get(models.User, member_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()
