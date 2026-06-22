"""Phase 4 — RAG Pipeline (pgvector)

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-19

Creates: document_chunks (with vector(1536) embedding column),
         ai_chat_history

The vector extension was already created in 0001_init_users_and_vector.py
per the README. This migration only adds the tables that use it.

Includes an HNSW index on the embedding column for fast cosine
similarity search — required once document_chunks grows past a
few thousand rows (sequential scan becomes the bottleneck).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    # Defensive — README says this runs in 0001, but RAG tables
    # cannot exist without it, so re-assert here too.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    op.create_table(
        "document_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_document_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("rfp_documents.id"), nullable=False),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
    )

    op.create_index("ix_document_chunks_rfp_id", "document_chunks", ["rfp_id"])
    op.create_index("ix_document_chunks_rfp_document_id", "document_chunks", ["rfp_document_id"])

    # HNSW index for fast approximate cosine similarity search.
    # vector_cosine_ops matches the cosine_similarity retrieval
    # used in rag_engine.py — must match the distance operator
    # used at query time or the index won't be used.
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding_hnsw "
        "ON document_chunks USING hnsw (embedding vector_cosine_ops);"
    )

    op.create_table(
        "ai_chat_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=True),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("ai_response", sa.Text(), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("context_used", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("ix_ai_chat_history_session_id", "ai_chat_history", ["session_id"])
    op.create_index("ix_ai_chat_history_rfp_id", "ai_chat_history", ["rfp_id"])


def downgrade():
    op.drop_index("ix_ai_chat_history_rfp_id", table_name="ai_chat_history")
    op.drop_index("ix_ai_chat_history_session_id", table_name="ai_chat_history")
    op.drop_table("ai_chat_history")

    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw;")
    op.drop_index("ix_document_chunks_rfp_document_id", table_name="document_chunks")
    op.drop_index("ix_document_chunks_rfp_id", table_name="document_chunks")
    op.drop_table("document_chunks")
