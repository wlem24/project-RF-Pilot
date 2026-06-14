from fastapi import APIRouter, HTTPException, status, Depends

from auth_utils import create_access_token, verify_password, get_current_user
from schemas import LoginRequest, TokenResponse
from store import users

router = APIRouter(prefix="/auth", tags=["auth"])

# Authentication endpoints live under the /auth prefix
# - POST /auth/register  -> create account
# - POST /auth/login     -> obtain JWT
# - GET  /auth/me        -> return current user (requires token)


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest):
    """Authenticate a user and return a JWT access token.

    Verifies the password against the in-memory `users` store and returns
    a signed JWT that contains the user's email.
    """
    user = users.get(payload.email)
    if user is None or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"email": payload.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
def read_current_user(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's public profile.

    This endpoint is protected by the `get_current_user` dependency which checks
    the Authorization header for a valid Bearer token.
    """
    return {"username": current_user.get("username"), "email": current_user.get("email")}