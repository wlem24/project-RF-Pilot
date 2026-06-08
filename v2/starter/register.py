from fastapi import APIRouter, HTTPException, status

from auth_utils import hash_password
from schemas import RegisterRequest, RegisterResponse
from store import users

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest):
    """Register a new user with a unique email and hashed password.

    This demo stores users in the in-memory `users` dict (no database).
    Passwords are hashed with `hash_password` before being stored.
    """
    if payload.email in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    users[payload.email] = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
    }

    return {
        "username": payload.username,
        "email": payload.email,
        "message": "User registered successfully",
    }
