# tender-support

入札情報を集約・管理するWebダッシュボード。建設業者向けの入札支援システム。

## プロジェクト概要

地方公共団体の入札情報をスクレイピングしてDBに蓄積し、Webダッシュボードで閲覧できるシステム。
管理者とユーザーの2ロール構成。

### データソース
1. **地方公共団体Webサイト** — Playwrightでスクレイピング
2. **NJSS（加入済み）** — CSVダウンロードして定期インポート（NJSSへのスクレイピングは行わない）

### ユーザー種別
- **管理者** — ユーザー管理、スクレイピング実行、CSVインポート設定など
- **ユーザー** — 案件の閲覧・検索・お気に入り、業者連絡、AI秘書利用

---

## 機能一覧

### 1. 公共工事案件
- 案件の検索・一覧表示・詳細表示
- お気に入り登録
- AI自動おすすめ度（自社プロフィールと照合して0〜100でスコアリング）

### 2. 業者連絡ツール
- 業者の検索
- 連絡補助（文書作成、メール送信など）

### 3. AI秘書
- **機能1**: 建築に関する専門知識を持つ秘書として全般的な相談をサポート
- **機能2**: 契約書雛形生成（必ず弁護士の判断を仰ぐよう注意書きを表示する）
- 専門知識・判例などをRAGで記憶（pgvectorを使用）

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js (TypeScript) + shadcn/ui + Tailwind CSS |
| バックエンド | FastAPI (Python) |
| データベース | PostgreSQL + pgvector（RAG用ベクトル拡張） |
| ORM / マイグレーション | SQLAlchemy (async) + Alembic |
| スクレイピング | Playwright (Python) |
| AI（生成） | Claude API |
| AI（埋め込み） | OpenAI text-embedding-3-small（次元数: 1536） |
| インフラ | nginx + Ubuntu VPS |

---

## ディレクトリ構成

```
tender-support/
├── frontend/            # Next.js
├── backend/             # FastAPI
│   ├── api/             # ルーター
│   ├── scraper/         # Playwright スクレイパー
│   ├── importer/        # NJSS CSV インポーター
│   ├── models/          # SQLAlchemy モデル
│   ├── db/              # DB接続（async engine）
│   ├── rag/             # RAG（ベクトル検索・埋め込み）
│   ├── alembic/         # マイグレーション
│   └── main.py          # FastAPI エントリーポイント
├── docs/
│   └── adr/
└── docker-compose.yml
```

---

## DBテーブル一覧

| テーブル | 内容 |
|---------|------|
| `users` | 管理者・ユーザー（role: admin/user） |
| `tenders` | 入札案件（scraping / njss_csv） |
| `tender_favorites` | お気に入り（user × tender） |
| `tender_recommendations` | AIおすすめ度（0〜100）＋理由テキスト |
| `contractors` | 業者情報 |
| `company_profile` | 自社基本情報・理念・得意分野（1レコード） |
| `company_licenses` | 自社の資格・許可（複数） |
| `company_achievements` | 自社実績（工事ごと） |
| `rag_documents` | ナレッジ（pgvectorでコサイン類似度検索） |

### マイグレーション実行

```bash
cd backend
alembic upgrade head
```

---

## 注意事項

- AI秘書の契約書雛形生成には**必ず弁護士確認を促す注意書き**を表示すること
- shadcn/uiのコンポーネントを使うこと（Tailwind単体はUI統一が難しい）
- `company_profile` は1レコード固定。複数レコード作成を許容しない

---

## ADR（アーキテクチャ決定記録）

- [001 - 技術スタック選定](docs/adr/001-tech-stack.md)
- [002 - RAG設計](docs/adr/002-rag.md)
- [003 - DBスキーマ設計](docs/adr/003-database-schema.md)
