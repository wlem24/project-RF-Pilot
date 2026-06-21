"""Phase 10 — priority on rfps + due_date_parsed on rfp_deadlines

Revision ID: 0010
Revises: 0009
Create Date: 2026-06-21

- rfps.priority              VARCHAR(20) DEFAULT 'medium'
- rfp_deadlines.due_date_parsed  TIMESTAMPTZ nullable
- Indexes for both new columns plus rfps.uploaded_by
"""
from alembic import op
import sqlalchemy as sa

revision      = "0010"
down_revision = "0009"
branch_labels = None
depends_on    = None


def upgrade():
    # rfps.priority
    op.add_column("rfps", sa.Column("priority", sa.String(20), server_default="medium", nullable=True))
    op.create_index("ix_rfps_priority", "rfps", ["priority"])

    # rfp_deadlines.due_date_parsed
    op.add_column("rfp_deadlines", sa.Column("due_date_parsed", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_rfp_deadlines_due_date_parsed", "rfp_deadlines", ["due_date_parsed"])


def downgrade():
    op.drop_index("ix_rfp_deadlines_due_date_parsed", table_name="rfp_deadlines")
    op.drop_column("rfp_deadlines", "due_date_parsed")

    op.drop_index("ix_rfps_priority", table_name="rfps")
    op.drop_column("rfps", "priority")
