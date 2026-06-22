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


class CommentCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    parent_id: Optional[UUID] = None


class DecisionUpdate(BaseModel):
    decision:           Optional[str] = Field(None, description="BID or NO BID — omit to update only notes/resources")
    notes:              Optional[str] = None
    required_resources: Optional[str] = None
    expected_risks:     Optional[str] = None
    budget_estimate:    Optional[str] = None


# ── Invitations & Team ─────────────────────────────────────────

class InvitationCreate(BaseModel):
    email: EmailStr
    role:  str = Field("user", description="Role to assign on accept: 'admin' or 'user'")

class InvitationAccept(BaseModel):
    name:     str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)

class RoleUpdate(BaseModel):
    role: str = Field(..., description="New role: 'admin' or 'user'")
