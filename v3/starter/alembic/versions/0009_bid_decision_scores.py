"""Phase 9 — bid_decisions AI score columns

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-21

Adds four columns to bid_decisions that hold AI-generated analysis:
  risk_level         — 0-100 numeric risk score
  required_resources — free-text resource estimate
  expected_risks     — free-text risk summary
  budget_estimate    — free-text budget projection
"""
from alembic import op
import sqlalchemy as sa

revision      = "0009"
down_revision = "0008"
branch_labels = None
depends_on    = None


def upgrade():
    op.add_column("bid_decisions", sa.Column("risk_level",         sa.Numeric(), nullable=True))
    op.add_column("bid_decisions", sa.Column("required_resources",  sa.Text(),    nullable=True))
    op.add_column("bid_decisions", sa.Column("expected_risks",      sa.Text(),    nullable=True))
    op.add_column("bid_decisions", sa.Column("budget_estimate",     sa.Text(),    nullable=True))


def downgrade():
    op.drop_column("bid_decisions", "budget_estimate")
    op.drop_column("bid_decisions", "expected_risks")
    op.drop_column("bid_decisions", "required_resources")
    op.drop_column("bid_decisions", "risk_level")
