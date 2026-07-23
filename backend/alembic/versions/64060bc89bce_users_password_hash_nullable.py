"""users.password_hash nullable (SSOログインへの移行に伴いパスワード不要に)

Revision ID: 64060bc89bce
Revises: 32e6b25a60e6
Create Date: 2026-07-22

"""
from alembic import op
import sqlalchemy as sa

revision = '64060bc89bce'
down_revision = '32e6b25a60e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(255), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(255), nullable=False)
