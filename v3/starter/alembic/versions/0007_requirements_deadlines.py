"""Phase 7 — Requirements & Deadlines

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-21

- Creates: requirements, rfp_deadlines
- Alters: approval_steps.assignee_id → nullable
- Updates: approval_steps status constraint to include in_progress / completed
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision      = "0007"
down_revision = "0006"
branch_labels = None
depends_on    = None


def upgrade():
    # ── Make approval_steps.assignee_id nullable ──────────────────
    op.alter_column("approval_steps", "assignee_id", nullable=True)

    # ── Widen approval_steps status constraint ────────────────────
    op.drop_constraint("approval_steps_status_check", "approval_steps", type_="check")
    op.create_check_constraint(
        "approval_steps_status_check",
        "approval_steps",
        "status IN ('pending','in_review','in_progress','approved','completed','rejected','skipped')",
    )

    # ── requirements table ────────────────────────────────────────
    op.create_table(
        "requirements",
        sa.Column("id",             postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id",         postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category",       sa.String(50),  nullable=False),
        sa.Column("text",           sa.Text(),       nullable=False),
        sa.Column("is_mandatory",   sa.Boolean(),    server_default=sa.text("true")),
        sa.Column("source_section", sa.String(200),  nullable=True),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "category IN ('technical','legal','commercial')",
            name="requirements_category_check",
        ),
    )
    op.create_index("ix_requirements_rfp_id",       "requirements", ["rfp_id"])
    op.create_index("ix_requirements_rfp_category", "requirements", ["rfp_id", "category"])

    # ── rfp_deadlines table ───────────────────────────────────────
    op.create_table(
        "rfp_deadlines",
        sa.Column("id",         postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfp_id",     postgresql.UUID(as_uuid=True), sa.ForeignKey("rfps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title",      sa.String(200), nullable=False),
        sa.Column("due_date",   sa.String(300), nullable=True),
        sa.Column("urgency",    sa.String(20),  server_default=sa.text("'normal'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_rfp_deadlines_rfp_id", "rfp_deadlines", ["rfp_id"])


def downgrade():
    op.drop_index("ix_rfp_deadlines_rfp_id",      table_name="rfp_deadlines")
    op.drop_table("rfp_deadlines")

    op.drop_index("ix_requirements_rfp_category", table_name="requirements")
    op.drop_index("ix_requirements_rfp_id",       table_name="requirements")
    op.drop_table("requirements")

    op.drop_constraint("approval_steps_status_check", "approval_steps", type_="check")
    op.create_check_constraint(
        "approval_steps_status_check",
        "approval_steps",
        "status IN ('pending','in_review','approved','rejected','skipped')",
    )
    op.alter_column("approval_steps", "assignee_id", nullable=False)
