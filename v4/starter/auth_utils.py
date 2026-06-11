
from datetime import datetime, timedelta
import os

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from store import get_user_by_email

# === Configuration & helpers ===
# In a real project these would come from environment variables or a secrets manager.
# Keep them simple here for a beginner-friendly demo.
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
# Access tokens expire in this many minutes (default 24 hours)
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# OAuth2 scheme used by FastAPI's dependency system; token endpoint is /auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    """Hash a password for storage using bcrypt.

    Called during user registration so the server never stores plain passwords.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(*, data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token containing `data` payload.

    The token includes an `exp` claim used to automatically expire tokens.
    Store identifying info (like `email`) in `data` so `get_current_user` can find the user.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT token, returning its payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency — return the current user dict or raise 401."""
    payload = decode_access_token(token)
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
