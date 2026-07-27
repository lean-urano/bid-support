# bid-support

入札情報を集約・管理するWebダッシュボード。建設業者向けの入札支援システム。

## プロジェクト概要

地方公共団体の入札情報をスクレイピングしてDBに蓄積し、Webダッシュボードで閲覧できるシステム。
管理者とユーザーの2ロール構成。

**2026-07-27にプロジェクト名を`tender-support`から`bid-support`に変更した（[ADR006](docs/adr/006-rename-tender-to-bid.md)）。
DBテーブル・API・ページURL・ディレクトリ名・OIDC client_id・GitHubリポジトリ名まで含めて全面的に`tender`→`bid`表記へ統一済み。**

### データソース
1. **地方公共団体Webサイト** — Playwright (Python) でスクレイピング
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

`docs/adr/005-nodejs-migration.md`で決定済みの構成（2026-07-24、`docs/adr/001-tech-stack.md`のPython(FastAPI)構成から全面移行）。

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js (TypeScript) + shadcn/ui + Tailwind CSS |
| バックエンド | Next.js API Routes (TypeScript) |
| データベース | PostgreSQL + pgvector（RAG用ベクトル拡張） |
| DBアクセス | ORM無し。`pg`パッケージによる生SQL。スキーマは`db/schema.sql`に冪等SQLで記述（マイグレーションツール無し）。Next.js側の補助機能（通知など）のみPrisma + SQLiteを個別に使用 |
| スクレイピング | Playwright + Cheerio (TypeScript)。`collector/`に独立npmパッケージとして分離 |
| 定期実行 | systemd常駐サービス + シェルループ（`deploy/systemd/`, `deploy/loops/`） |
| 認証 | MIRROR SSO（`mirror/sso/idp`、OIDC、client_id: `bid-support`）。bid-support独自のパスワードログインは廃止済み。詳細は`docs/adr/004-sso-auth.md` |
| AI（生成） | Claude API / OpenAI API |
| AI（埋め込み） | OpenAI text-embedding-3-small（次元数: 1536） |
| インフラ | nginx + Ubuntu VPS |

---

## ディレクトリ構成

```
bid-support/
├── db/
│   ├── schema.sql        # 全テーブル定義（冪等SQL、マイグレーションツール無し）
│   └── seed.ts           # 開発用アカウント投入
├── collector/            # Playwright + Cheerio (TypeScript) スクレイパー。frontendとは独立npmパッケージ
│   └── src/
│       └── sources/      # サイト別スクレイピングロジック
├── frontend/             # Next.js (App Router / TypeScript)
│   ├── app/              # ページ・API Route (app/api/) — 認証(SSO)・bids等の中核ドメインAPI・通知など
│   ├── components/       # UIコンポーネント (shadcn/ui + Tailwind)
│   ├── lib/              # DB接続(db.ts)・クエリ関数(queries/)・認証セッション処理・AI/RAGロジック
│   └── prisma/           # Next.js側の補助機能用スキーマ (SQLite。中核ドメインとは別管理)
├── deploy/
│   ├── systemd/          # スクレイパー常駐サービスのunitファイル
│   └── loops/            # 常駐ループのシェルスクリプト
├── docs/
│   └── adr/
└── docker-compose.yml
```

---

## DBテーブル一覧

| テーブル | 内容 |
|---------|------|
| `users` | 管理者・ユーザー（role: admin/user） |
| `bids` | 入札案件（scraping / njss_csv / manual） |
| `bid_favorites` | お気に入り（user × bid） |
| `bid_recommendations` | AIおすすめ度（0〜100）＋理由テキスト |
| `contractors` | 業者情報 |
| `company_profile` | 自社基本情報・理念・得意分野（1レコード） |
| `company_licenses` | 自社の資格・許可（複数） |
| `company_achievements` | 自社実績（工事ごと） |
| `rag_documents` | ナレッジ（pgvectorでコサイン類似度検索） |

### マイグレーション実行

```bash
# 中核ドメイン (users/bids等、Postgres)
# db/schema.sqlは冪等なので何度流しても安全。変更はファイル末尾に追記する
psql "$DATABASE_URL" -f db/schema.sql

# Next.js側の補助機能 (通知など、SQLite)
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

- [001 - 技術スタック選定](docs/adr/001-tech-stack.md)（廃止。005参照）
- [002 - RAG設計](docs/adr/002-rag.md)
- [003 - DBスキーマ設計](docs/adr/003-database-schema.md)（テーブル名は006でbid_*に変更済み）
- [004 - 認証をMIRROR SSO(OIDC)に統一](docs/adr/004-sso-auth.md)
- [005 - バックエンドをNode.js/TypeScriptへ移行](docs/adr/005-nodejs-migration.md)
- [006 - プロジェクト名をtender-supportからbid-supportへ変更](docs/adr/006-rename-tender-to-bid.md)
