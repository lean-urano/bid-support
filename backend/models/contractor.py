from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from .base import TimestampMixin
from db.base import Base


class Contractor(Base, TimestampMixin):
    """業者情報"""
    __tablename__ = "contractors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500))
    phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    specialties: Mapped[list | None] = mapped_column(JSONB)   # 得意分野（配列）
    notes: Mapped[str | None] = mapped_column(Text)
