"""Phase 2 — RFP core tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-19

Creates: rfps, rfp_information, rfp_documents
These are required as FK targets for every later phase.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "rfps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("status", sa.String(), server_default="draft"),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "status IN ('draft','under_review','bid_decision','submitted','won','lost','no_bid')",
            name="rfps_status_check",
        ),
    )

    op.create_table(
        "rfp_information",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("client_name", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=True),
        sa.Column("industry", sa.String(), nullable=True),
        sa.Column("submission_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("estimated_value", sa.Numeric(), nullable=True),
        sa.Column("contract_duration", sa.String(), nullable=True),
        sa.Column("procurement_method", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )

    op.create_table(
        "rfp_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("file_type", sa.String(), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("file_type IN ('pdf','docx','xlsx')", name="rfp_documents_file_type_check"),
    )

    op.create_index("ix_rfps_uploaded_by", "rfps", ["uploaded_by"])
    op.create_index("ix_rfp_information_rfp_id", "rfp_information", ["rfp_id"])
    op.create_index("ix_rfp_documents_rfp_id", "rfp_documents", ["rfp_id"])


def downgrade():
    op.drop_index("ix_rfp_documents_rfp_id", table_name="rfp_documents")
    op.drop_index("ix_rfp_information_rfp_id", table_name="rfp_information")
    op.drop_index("ix_rfps_uploaded_by", table_name="rfps")
    op.drop_table("rfp_documents")
    op.drop_table("rfp_information")
    op.drop_table("rfps")
