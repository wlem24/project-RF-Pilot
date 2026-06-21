"""Phase 11 — invitations.role column

Revision ID: 0011
Revises: 0010
Create Date: 2026-06-21

Adds the `role` column to invitations so admin can specify which role
the invitee should receive when they accept.
"""
from alembic import op
import sqlalchemy as sa

revision      = "0011"
down_revision = "0010"
branch_labels = None
depends_on    = None


def upgrade():
    op.add_column("invitations", sa.Column("role", sa.String(50), server_default="user", nullable=True))
    op.create_index("ix_invitations_token",  "invitations", ["token"],  unique=True)
    op.create_index("ix_invitations_email",  "invitations", ["email"])
    op.create_index("ix_invitations_status", "invitations", ["status"])


def downgrade():
    op.drop_index("ix_invitations_status", table_name="invitations")
    op.drop_index("ix_invitations_email",  table_name="invitations")
    op.drop_index("ix_invitations_token",  table_name="invitations")
    op.drop_column("invitations", "role")
