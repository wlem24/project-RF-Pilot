"""Phase 8 — pgvector HNSW index on document_chunks.embedding

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-21

Adds an HNSW index for approximate nearest-neighbour search.
Without this every retrieval is O(n) over all rows.
HNSW is preferred over ivfflat here because it needs no training step
and maintains accuracy as the corpus grows.
"""
from alembic import op

revision      = "0008"
down_revision = "0007"
branch_labels = None
depends_on    = None


def upgrade():
    # HNSW index for cosine distance (<=> operator)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw
        ON document_chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw")
