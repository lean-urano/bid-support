from sqlalchemy import String, Text, Date, Numeric, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from decimal import Decimal
from .base import TimestampMixin
from db.base import Base


class CompanyProfile(Base, TimestampMixin):
    """自社基本情報（1レコード固定）"""
    __tablename__ = "company_profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)          # 会社名
    address: Mapped[str | None] = mapped_column(String(500))                # 所在地
    phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)                   # 会社概要
    philosophy: Mapped[str | None] = mapped_column(Text)                    # 経営理念・考え方
    specialties: Mapped[str | None] = mapped_column(Text)                   # 得意分野

    licenses: Mapped[list["CompanyLicense"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    achievements: Mapped[list["CompanyAchievement"]] = relationship(back_populates="company", cascade="all, delete-orphan")


class CompanyLicense(Base):
    """自社の資格・許可（建設業許可など）"""
    __tablename__ = "company_licenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company_profile.id"), nullable=False)
    license_type: Mapped[str] = mapped_column(String(200), nullable=False)  # 例: 建設業許可（土木工事業）
    license_number: Mapped[str | None] = mapped_column(String(100))
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_until: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)

    company: Mapped["CompanyProfile"] = relationship(back_populates="licenses")


class CompanyAchievement(Base, TimestampMixin):
    """自社実績（工事ごと）"""
    __tablename__ = "company_achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company_profile.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)         # 工事名
    client: Mapped[str | None] = mapped_column(String(200))                 # 発注者
    category: Mapped[str | None] = mapped_column(String(100))               # 工事種別
    amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 0))          # 請負金額
    completed_year: Mapped[int | None] = mapped_column(Integer)             # 完成年
    location: Mapped[str | None] = mapped_column(String(200))               # 工事場所
    description: Mapped[str | None] = mapped_column(Text)                   # 工事概要

    company: Mapped["CompanyProfile"] = relationship(back_populates="achievements")
