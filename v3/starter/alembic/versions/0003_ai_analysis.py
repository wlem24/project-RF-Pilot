"""Phase 3 — AI Analysis tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-19

Creates: ai_summaries, technical_analyses, bid_decisions, risks, evaluation_criteria
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "ai_summaries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("objectives", postgresql.JSONB(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("key_dates", postgresql.JSONB(), nullable=True),
        sa.Column("model_version", sa.String(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "technical_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("requirements", postgresql.JSONB(), nullable=True),
        sa.Column("technology_stack", postgresql.JSONB(), nullable=True),
        sa.Column("certifications", postgresql.JSONB(), nullable=True),
        sa.Column("manpower_requirements", postgresql.JSONB(), nullable=True),
        sa.Column("complexity_score", sa.Numeric(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "bid_decisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("recommendation", sa.String(), nullable=True),
        sa.Column("bid_score", sa.Numeric(), nullable=True),
        sa.Column("win_rate", sa.Numeric(), nullable=True),
        sa.Column("confidence_level", sa.Numeric(), nullable=True),
        sa.Column("strategic_fit", sa.Numeric(), nullable=True),
        sa.Column("technical_fit", sa.Numeric(), nullable=True),
        sa.Column("financial_fit", sa.Numeric(), nullable=True),
        sa.Column("resource_fit", sa.Numeric(), nullable=True),
        sa.Column("positive_flags", postgresql.JSONB(), nullable=True),
        sa.Column("risk_flags", postgresql.JSONB(), nullable=True),
        sa.Column("alignment_matrix", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "recommendation IN ('bid','no_bid','conditional_bid')",
            name="bid_decisions_recommendation_check",
        ),
    )

    op.create_table(
        "risks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("risk_title", sa.String(), nullable=False),
        sa.Column("severity", sa.String(), nullable=True),
        sa.Column("impact", sa.Text(), nullable=True),
        sa.Column("mitigation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("severity IN ('low','medium','high','critical')", name="risks_severity_check"),
    )

    op.create_table(
        "evaluation_criteria",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id"), nullable=False),
        sa.Column("criteria", sa.Text(), nullable=False),
        sa.Column("weight", sa.Numeric(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    for tbl in ["ai_summaries", "technical_analyses", "bid_decisions", "risks", "evaluation_criteria"]:
        op.create_index(f"ix_{tbl}_rfp_id", tbl, ["rfp_id"])


def downgrade():
    for tbl in ["ai_summaries", "technical_analyses", "bid_decisions", "risks", "evaluation_criteria"]:
        op.drop_index(f"ix_{tbl}_rfp_id", table_name=tbl)
    op.drop_table("evaluation_criteria")
    op.drop_table("risks")
    op.drop_table("bid_decisions")
    op.drop_table("technical_analyses")
    op.drop_table("ai_summaries")
