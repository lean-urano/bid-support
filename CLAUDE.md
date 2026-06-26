# tender-support

入札情報を集約・管理するWebダッシュボード。

## プロジェクト概要

地方公共団体の入札情報をスクレイピングしてDBに蓄積し、Webダッシュボードで閲覧できるシステム。

### データソース
1. **地方公共団体Webサイト** — Playwrightでスクレイピング
2. **NJSS（加入済み）** — CSVダウンロードして定期インポート

### ユーザー種別
- **管理者** — ユーザー管理、スクレイピング実行、CSVインポート設定など
- **ユーザー** — 案件の閲覧・検索

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js (TypeScript) |
| バックエンド | FastAPI (Python) |
| データベース | PostgreSQL |
| スクレイピング | Playwright (Python) |

---

## ディレクトリ構成（予定）

```
tender-support/
├── frontend/        # Next.js
├── backend/         # FastAPI
│   ├── api/
│   ├── scraper/     # Playwright スクレイパー
│   ├── importer/    # NJSS CSV インポーター
│   └── models/
├── docs/
│   └── adr/         # アーキテクチャ決定記録
└── docker-compose.yml
```

---

## ADR（アーキテクチャ決定記録）

- [001 - 技術スタック選定](docs/adr/001-tech-stack.md)
