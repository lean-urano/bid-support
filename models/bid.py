from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Bid:
    # 一覧ページから取得
    bid_id: str                    # NJSS案件ID
    title: str                     # 案件名
    organization: str              # 発注機関
    bid_type: str                  # 入札方式
    announced_date: str            # 公告日
    deadline: str                  # 締切日
    detail_url: str                # 詳細ページURL

    # 詳細ページから取得
    budget: Optional[str] = None           # 予定価格
    location: Optional[str] = None         # 所在地
    category: Optional[str] = None         # 業種・カテゴリ
    contact: Optional[str] = None          # 担当者・連絡先
    description: Optional[str] = None      # 案件概要
    requirements: Optional[str] = None     # 参加条件

    def to_row(self) -> list:
        """Google Sheets用に1行のリストに変換"""
        return [
            self.bid_id,
            self.title,
            self.organization,
            self.bid_type,
            self.announced_date,
            self.deadline,
            self.budget or "",
            self.location or "",
            self.category or "",
            self.contact or "",
            self.description or "",
            self.requirements or "",
            self.detail_url,
        ]

    @staticmethod
    def header_row() -> list:
        return [
            "案件ID", "案件名", "発注機関", "入札方式",
            "公告日", "締切日", "予定価格", "所在地",
            "カテゴリ", "担当者連絡先", "案件概要", "参加条件",
            "詳細URL",
        ]
