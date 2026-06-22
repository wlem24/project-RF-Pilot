import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, BigInteger, Numeric, Boolean,
    DateTime, ForeignKey, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base

VALID_ROLES = ('admin', 'user')


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin','user')",
            name="users_role_check",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(50), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships added for RAG pipeline (Phase 2-6)
    rfps_uploaded   = relationship("RFP", foreign_keys="RFP.uploaded_by", back_populates="uploader")
    resources       = relationship("Resource", back_populates="user")
    chat_history    = relationship("AIChatHistory", back_populates="user")


# ─────────────────────────────────────────────
#  PHASE 2 — RFP Core
# ─────────────────────────────────────────────

class RFP(Base):
    __tablename__ = "rfps"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','under_review','bid_decision','submitted','won','lost','no_bid')",
            name="rfps_status_check",
        ),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title       = Column(String, nullable=False)
    status      = Column(String, default="draft")
    priority    = Column(String(20), default="medium")   # low / medium / high / critical
    file_url    = Column(Text, nullable=True)
    notes       = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    uploader            = relationship("User", foreign_keys=[uploaded_by], back_populates="rfps_uploaded")
    information         = relationship("RFPInformation", back_populates="rfp", uselist=False)
    documents           = relationship("RFPDocument", back_populates="rfp")
    ai_summaries        = relationship("AISummary", back_populates="rfp")
    technical_analyses  = relationship("TechnicalAnalysis", back_populates="rfp")
    bid_decisions       = relationship("BidDecision", back_populates="rfp")
    risks               = relationship("Risk", back_populates="rfp")
    resources           = relationship("Resource", back_populates="rfp")
    approval_steps      = relationship("ApprovalStep", back_populates="rfp", order_by="ApprovalStep.step_order")
    comments            = relationship("Comment", back_populates="rfp")
    notifications       = relationship("Notification", back_populates="rfp")
    evaluation_criteria = relationship("EvaluationCriteria", back_populates="rfp")
    draft_documents     = relationship("DraftDocument", back_populates="rfp")
    document_chunks     = relationship("DocumentChunk", back_populates="rfp")
    chat_history        = relationship("AIChatHistory", back_populates="rfp")
    requirements        = relationship("Requirement",  back_populates="rfp", cascade="all, delete-orphan")
    rfp_deadlines       = relationship("RFPDeadline",  back_populates="rfp", cascade="all, delete-orphan")


class RFPInformation(Base):
    __tablename__ = "rfp_information"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id              = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    client_name         = Column(String, nullable=True)
    department          = Column(String, nullable=True)
    industry            = Column(String, nullable=True)
    submission_deadline = Column(DateTime(timezone=True), nullable=True)
    estimated_value     = Column(Numeric, nullable=True)
    contract_duration   = Column(String, nullable=True)
    procurement_method  = Column(String, nullable=True)
    location            = Column(String, nullable=True)
    assigned_to         = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    rfp = relationship("RFP", back_populates="information")


class RFPDocument(Base):
    __tablename__ = "rfp_documents"
    __table_args__ = (
        CheckConstraint("file_type IN ('pdf','docx','xlsx')", name="rfp_documents_file_type_check"),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id      = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name   = Column(String, nullable=False)
    file_type   = Column(String, nullable=True)
    file_size   = Column(BigInteger, nullable=True)
    file_url    = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rfp             = relationship("RFP", back_populates="documents")
    document_chunks = relationship("DocumentChunk", back_populates="rfp_document")


# ─────────────────────────────────────────────
#  PHASE 3 — AI Analysis
# ─────────────────────────────────────────────

class AISummary(Base):
    __tablename__ = "ai_summaries"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id        = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    summary       = Column(Text, nullable=True)
    objectives    = Column(JSONB, nullable=True)
    scope         = Column(Text, nullable=True)
    key_dates     = Column(JSONB, nullable=True)
    model_version = Column(String, nullable=True)
    generated_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="ai_summaries")


class TechnicalAnalysis(Base):
    __tablename__ = "technical_analyses"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id                = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    requirements          = Column(JSONB, nullable=True)
    technology_stack      = Column(JSONB, nullable=True)
    certifications        = Column(JSONB, nullable=True)
    manpower_requirements = Column(JSONB, nullable=True)
    complexity_score      = Column(Numeric, nullable=True)
    created_at            = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at            = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="technical_analyses")


class BidDecision(Base):
    __tablename__ = "bid_decisions"
    __table_args__ = (
        CheckConstraint(
            "recommendation IN ('bid','no_bid','conditional_bid')",
            name="bid_decisions_recommendation_check",
        ),
    )

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id           = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    recommendation   = Column(String, nullable=True)
    bid_score        = Column(Numeric, nullable=True)
    win_rate         = Column(Numeric, nullable=True)
    confidence_level = Column(Numeric, nullable=True)
    strategic_fit    = Column(Numeric, nullable=True)
    technical_fit    = Column(Numeric, nullable=True)
    financial_fit    = Column(Numeric, nullable=True)
    resource_fit     = Column(Numeric, nullable=True)
    positive_flags      = Column(JSONB, nullable=True)
    risk_flags          = Column(JSONB, nullable=True)
    alignment_matrix    = Column(JSONB, nullable=True)
    risk_level          = Column(Numeric, nullable=True)   # 0-100, higher = more risky
    required_resources  = Column(Text, nullable=True)
    expected_risks      = Column(Text, nullable=True)
    budget_estimate     = Column(Text, nullable=True)
    created_at          = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at          = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="bid_decisions")


class Risk(Base):
    __tablename__ = "risks"
    __table_args__ = (
        CheckConstraint("severity IN ('low','medium','high','critical')", name="risks_severity_check"),
    )

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id     = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    risk_title = Column(String, nullable=False)
    severity   = Column(String, nullable=True)
    impact     = Column(Text, nullable=True)
    mitigation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="risks")


class EvaluationCriteria(Base):
    __tablename__ = "evaluation_criteria"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id     = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    criteria   = Column(Text, nullable=False)
    weight     = Column(Numeric, nullable=True)
    notes      = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="evaluation_criteria")


# ─────────────────────────────────────────────
#  PHASE 4 — RAG Pipeline (pgvector)
# ─────────────────────────────────────────────

class DocumentChunk(Base):
    """Stores embedded text chunks. embedding column is 1536-dim (text-embedding-ada-002)."""
    __tablename__ = "document_chunks"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_document_id = Column(UUID(as_uuid=True), ForeignKey("rfp_documents.id"), nullable=False)
    rfp_id          = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    chunk_index     = Column(Integer, nullable=False)
    content         = Column(Text, nullable=False)
    embedding       = Column(Vector(1536), nullable=True)  # pgvector column
    token_count     = Column(Integer, nullable=True)

    rfp_document = relationship("RFPDocument", back_populates="document_chunks")
    rfp          = relationship("RFP", back_populates="document_chunks")


class AIChatHistory(Base):
    """Persists each RAG chat turn — session_id groups a conversation."""
    __tablename__ = "ai_chat_history"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id    = Column(String, nullable=False)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rfp_id        = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=True)
    user_message  = Column(Text, nullable=False)
    ai_response   = Column(Text, nullable=False)
    prompt_tokens = Column(Integer, nullable=True)
    context_used  = Column(JSONB, nullable=True)  # list of chunk UUIDs used
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chat_history")
    rfp  = relationship("RFP", back_populates="chat_history")


# ─────────────────────────────────────────────
#  PHASE 5 — Collaboration
# ─────────────────────────────────────────────

class Resource(Base):
    __tablename__ = "resources"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id           = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role             = Column(String, nullable=True)
    availability_pct = Column(Numeric, nullable=True)
    assigned_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rfp  = relationship("RFP", back_populates="resources")
    user = relationship("User", back_populates="resources")


class ApprovalStep(Base):
    __tablename__ = "approval_steps"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','in_review','approved','rejected','skipped')",
            name="approval_steps_status_check",
        ),
    )

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id       = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    assignee_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    stage        = Column(String, nullable=True)
    step_order   = Column(Integer, nullable=True)
    status       = Column(String, default="pending")
    notes        = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    rfp = relationship("RFP", back_populates="approval_steps")


class Comment(Base):
    __tablename__ = "comments"

    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id    = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True)
    message   = Column(Text, nullable=False)
    mentions  = Column(JSONB, nullable=True)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rfp     = relationship("RFP", back_populates="comments")
    replies = relationship("Comment", backref="parent", remote_side="Comment.id")


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "type IN ('comment','approval','status_change','system')",
            name="notifications_type_check",
        ),
    )

    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rfp_id    = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    type      = Column(String, nullable=True)
    message   = Column(Text, nullable=True)
    is_read   = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="notifications")


class Invitation(Base):
    __tablename__ = "invitations"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','accepted','expired','revoked')",
            name="invitations_status_check",
        ),
    )

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invited_by  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    accepted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    email       = Column(String, nullable=False)
    role        = Column(String(50), default="user")    # role to assign on accept
    token       = Column(String, unique=True, nullable=True)
    status      = Column(String, default="pending")
    expires_at  = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    inviter     = relationship("User", foreign_keys=[invited_by])
    accepter    = relationship("User", foreign_keys=[accepted_by])


# ─────────────────────────────────────────────
#  PHASE 6 — Draft Generation
# ─────────────────────────────────────────────

class DraftDocument(Base):
    __tablename__ = "draft_documents"
    __table_args__ = (
        CheckConstraint(
            "draft_type IN ('executive_summary','technical','commercial','compliance','full')",
            name="draft_documents_draft_type_check",
        ),
    )

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id       = Column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    draft_type   = Column(String, nullable=True)
    prompt       = Column(Text, nullable=True)
    content      = Column(Text, nullable=True)
    file_url     = Column(Text, nullable=True)

    rfp      = relationship("RFP", back_populates="draft_documents")
    versions = relationship("DraftVersion", back_populates="draft_document")


class DraftVersion(Base):
    __tablename__ = "draft_versions"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    draft_document_id = Column(UUID(as_uuid=True), ForeignKey("draft_documents.id"), nullable=False)
    version_number    = Column(Integer, nullable=False)
    content           = Column(Text, nullable=False)
    prompt            = Column(Text, nullable=True)
    generated_by      = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    draft_document = relationship("DraftDocument", back_populates="versions")


# ─────────────────────────────────────────────
#  PHASE 7 — Requirements & Deadlines
# ─────────────────────────────────────────────

class Requirement(Base):
    __tablename__ = "requirements"
    __table_args__ = (
        CheckConstraint(
            "category IN ('technical','legal','commercial')",
            name="requirements_category_check",
        ),
    )

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id         = Column(UUID(as_uuid=True), ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False)
    category       = Column(String(50), nullable=False)
    text           = Column(Text, nullable=False)
    is_mandatory   = Column(Boolean, default=True)
    source_section = Column(String(200), nullable=True)
    created_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="requirements")


class RFPDeadline(Base):
    __tablename__ = "rfp_deadlines"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id           = Column(UUID(as_uuid=True), ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False)
    title            = Column(String(200), nullable=False)
    due_date         = Column(String(300), nullable=True)
    due_date_parsed  = Column(DateTime(timezone=True), nullable=True)  # machine-comparable date
    urgency          = Column(String(20), default="normal")
    created_at       = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rfp = relationship("RFP", back_populates="rfp_deadlines")
