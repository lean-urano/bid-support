"""initial schema

Revision ID: 32e6b25a60e6
Revises:
Create Date: 2026-06-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '32e6b25a60e6'
down_revision = None
branch_labels = None
depends_on = None

EMBEDDING_DIM = 1536


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "user", name="userrole"), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "tenders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("organization", sa.String(200), nullable=False),
        sa.Column("category", sa.String(100)),
        sa.Column("location", sa.String(200)),
        sa.Column("budget_min", sa.Numeric(15, 0)),
        sa.Column("budget_max", sa.Numeric(15, 0)),
        sa.Column("announced_date", sa.Date()),
        sa.Column("deadline", sa.Date()),
        sa.Column("requirements", sa.Text()),
        sa.Column("detail_url", sa.String(1000)),
        sa.Column("source", sa.Enum("scraping", "njss_csv", name="tendersource"), nullable=False),
        sa.Column("raw_data", JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "tender_favorites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("tender_id", sa.Integer(), sa.ForeignKey("tenders.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "tender_id", name="uq_tender_favorites"),
    )

    op.create_table(
        "tender_recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tender_id", sa.Integer(), sa.ForeignKey("tenders.id"), nullable=False, unique=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "contractors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("address", sa.String(500)),
        sa.Column("phone", sa.String(50)),
        sa.Column("email", sa.String(255)),
        sa.Column("specialties", JSONB()),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "company_profile",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("address", sa.String(500)),
        sa.Column("phone", sa.String(50)),
        sa.Column("email", sa.String(255)),
        sa.Column("description", sa.Text()),
        sa.Column("philosophy", sa.Text()),
        sa.Column("specialties", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "company_licenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("company_profile.id"), nullable=False),
        sa.Column("license_type", sa.String(200), nullable=False),
        sa.Column("license_number", sa.String(100)),
        sa.Column("valid_from", sa.Date()),
        sa.Column("valid_until", sa.Date()),
        sa.Column("notes", sa.Text()),
    )

    op.create_table(
        "company_achievements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("company_profile.id"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("client", sa.String(200)),
        sa.Column("category", sa.String(100)),
        sa.Column("amount", sa.Numeric(15, 0)),
        sa.Column("completed_year", sa.Integer()),
        sa.Column("location", sa.String(200)),
        sa.Column("description", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "rag_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(100)),
        sa.Column("embedding", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.execute(f"ALTER TABLE rag_documents ALTER COLUMN embedding TYPE vector({EMBEDDING_DIM}) USING NULL::vector({EMBEDDING_DIM})")
    op.execute("CREATE INDEX ix_rag_documents_embedding ON rag_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)")


def downgrade() -> None:
    op.drop_table("rag_documents")
    op.drop_table("company_achievements")
    op.drop_table("company_licenses")
    op.drop_table("company_profile")
    op.drop_table("contractors")
    op.drop_table("tender_recommendations")
    op.drop_table("tender_favorites")
    op.drop_table("tenders")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS tendersource")
    op.execute("DROP TYPE IF EXISTS userrole")
