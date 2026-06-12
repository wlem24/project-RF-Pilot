from fastapi import APIRouter, HTTPException, status

from auth_utils import hash_password
from schemas import RegisterRequest, RegisterResponse
from store import create_user, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest):
    """Register a new user with a unique email and hashed password.

    User accounts are stored in SQLite so data persists across server restarts.
    """
    if get_user_by_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    create_user(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )

    return {
        "username": payload.username,
        "email": payload.email,
        "role": payload.role,
        "message": "User registered successfully",
    }
