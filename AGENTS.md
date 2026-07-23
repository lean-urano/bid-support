# tender-support

入札情報を集約・管理するWebダッシュボード。建設業者向けの入札支援システム。

## プロジェクト概要

地方公共団体の入札情報をスクレイピングしてDBに蓄積し、Webダッシュボードで閲覧できるシステム。
管理者とユーザーの2ロール構成。

### データソース
1. **地方公共団体Webサイト** — Playwright (Node.js/TypeScript) でスクレイピング
2. **NJSS（加入済み）** — CSVダウンロードして定期インポート（NJSSへのスクレイピングは行わない）

### ユーザー種別
- **管理者** — ユーザー管理、スクレイピング実行、CSVインポート設定など
- **ユーザー** — 入札案件調査AI、下請け・業者交渉AI、法務・相談AIの利用

---

## 機能一覧

### 1. 入札案件調査AI
- 案件の検索・一覧表示・詳細表示
- お気に入り登録
- AI自動おすすめ度（自社プロフィールと照合して0〜100でスコアリング）

### 2. 下請け・業者交渉AI
- 業者の検索
- 連絡・交渉補助（打診文書作成、メール送信など）

### 3. 法務・相談AI
- **機能1**: 建築に関する専門知識を持つエージェントとして全般的な相談をサポート
- **機能2**: 契約書雛形生成（必ず弁護士の判断を仰ぐよう注意書きを表示する）
- 専門知識・判例などをRAGで記憶（pgvectorを使用）

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js (TypeScript) + shadcn/ui + Tailwind CSS |
| バックエンド | Next.js App Router (TypeScript) |
| データベース | PostgreSQL + pgvector（RAG用ベクトル拡張） |
| ORM / マイグレーション | Prisma / Drizzle ORM |
| スクレイピング | Playwright (Node.js / TypeScript) |
| AI（生成） | Claude API / OpenAI API (Node.js SDK) |
| AI（埋め込み） | OpenAI text-embedding-3-small（次元数: 1536） |
| インフラ | Vercel / Node.js + Ubuntu VPS |

---

## ディレクトリ構成

```
tender-support/
├── frontend/            # Next.js (App Router / TypeScript フルスタック)
│   ├── app/             # ページ・API Route (app/api/)
│   ├── components/      # UIコンポーネント (shadcn/ui + Tailwind)
│   ├── lib/             # Prismaクライアント, AI/RAGロジック, 共通処理
│   ├── scraper/         # Playwright (Node.js) スクレイパー
│   ├── importer/        # NJSS CSV インポーター
│   └── prisma/          # DBスキーマ & マイグレーション (または drizzle)
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
cd frontend
npx prisma migrate dev
```

---

## 注意事項・デザインルール

- UIの実装には**すべて Tailwind CSS と shadcn/ui を使用すること**（UIの統一感を保つため）
- コンテナの最大幅は **`max-w-7xl` (1280px)** を標準とすること
- 法務・相談AIの契約書雛形生成には**必ず弁護士確認を促す注意書き**を表示すること
- `company_profile` は1レコード固定。複数レコード作成を許容しない

---

## ADR（アーキテクチャ決定記録）

- [001 - 技術スタック選定](docs/adr/001-tech-stack.md)
- [002 - RAG設計](docs/adr/002-rag.md)
- [003 - DBスキーマ設計](docs/adr/003-database-schema.md)
