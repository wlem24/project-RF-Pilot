"""Phase 6 — Draft Generation

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-19

Creates: draft_documents, draft_versions
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "draft_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("generated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("draft_type", sa.String(), nullable=True),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "draft_type IN ('executive_summary','technical','commercial','compliance','full')",
            name="draft_documents_draft_type_check",
        ),
    )

    op.create_table(
        "draft_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("draft_document_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("draft_documents.id"), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("generated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("ix_draft_documents_rfp_id", "draft_documents", ["rfp_id"])
    op.create_index("ix_draft_versions_draft_document_id", "draft_versions", ["draft_document_id"])


def downgrade():
    op.drop_index("ix_draft_versions_draft_document_id", table_name="draft_versions")
    op.drop_index("ix_draft_documents_rfp_id", table_name="draft_documents")
    op.drop_table("draft_versions")
    op.drop_table("draft_documents")
