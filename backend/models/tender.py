from sqlalchemy import String, Text, Date, Numeric, Enum as SAEnum, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime
from decimal import Decimal
import enum
from .base import TimestampMixin
from db.base import Base


class TenderSource(str, enum.Enum):
    scraping = "scraping"
    njss_csv = "njss_csv"


class Tender(Base, TimestampMixin):
    __tablename__ = "tenders"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    organization: Mapped[str] = mapped_column(String(200), nullable=False)  # 発注機関
    category: Mapped[str | None] = mapped_column(String(100))               # 工事種別
    location: Mapped[str | None] = mapped_column(String(200))               # 所在地
    budget_min: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))      # 予定価格（下限）
    budget_max: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))      # 予定価格（上限）
    announced_date: Mapped[date | None] = mapped_column(Date)               # 公告日
    deadline: Mapped[date | None] = mapped_column(Date)                     # 締切日
    requirements: Mapped[str | None] = mapped_column(Text)                  # 参加条件
    detail_url: Mapped[str | None] = mapped_column(String(1000))
    source: Mapped[TenderSource] = mapped_column(SAEnum(TenderSource), nullable=False)
    raw_data: Mapped[dict | None] = mapped_column(JSONB)

    favorites: Mapped[list["TenderFavorite"]] = relationship(back_populates="tender")
    recommendation: Mapped["TenderRecommendation | None"] = relationship(back_populates="tender", uselist=False)


class TenderFavorite(Base):
    __tablename__ = "tender_favorites"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    tender_id: Mapped[int] = mapped_column(ForeignKey("tenders.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)

    tender: Mapped["Tender"] = relationship(back_populates="favorites")


class TenderRecommendation(Base):
    __tablename__ = "tender_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    tender_id: Mapped[int] = mapped_column(ForeignKey("tenders.id"), unique=True, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)   # 0〜100
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)

    tender: Mapped["Tender"] = relationship(back_populates="recommendation")
