from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Optional[str] = Field(None, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    message: str = "User registered successfully"
    user: UserResponse


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GenerateDraftRequest(BaseModel):
    draftType: str = Field(..., min_length=1, max_length=100)
    prompt: str | None = Field(None, max_length=4000)


# ── RAG Phase 4 schemas ────────────────────────────────────────

class ChatRequest(BaseModel):
    rfp_id: Optional[UUID] = None
    session_id: str
    question: str
    top_k: int = 5


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    context_used: Optional[list] = None
    prompt_tokens: Optional[int] = None


class IngestRequest(BaseModel):
    rfp_id: UUID
    rfp_document_id: UUID
    raw_text: str
