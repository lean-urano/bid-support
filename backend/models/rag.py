from sqlalchemy import String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from .base import TimestampMixin
from db.base import Base

EMBEDDING_DIM = 1536  # OpenAI text-embedding-3-small


class RagDocument(Base, TimestampMixin):
    """RAG用ナレッジ（専門知識・判例など）"""
    __tablename__ = "rag_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))   # 例: 判例, 法令, 社内ナレッジ
    embedding: Mapped[list | None] = mapped_column(Vector(EMBEDDING_DIM))

    __table_args__ = (
        Index("ix_rag_documents_embedding", "embedding", postgresql_using="ivfflat",
              postgresql_with={"lists": 100}, postgresql_ops={"embedding": "vector_cosine_ops"}),
    )
