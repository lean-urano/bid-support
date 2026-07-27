# ADR 003 — データベーススキーマ設計

**日付**: 2026-06-27
**ステータス**: 決定済み（2026-07-27、[ADR006](006-rename-tender-to-bid.md)でテーブル名`tenders`→`bids`、`tender_favorites`→`bid_favorites`、`tender_recommendations`→`bid_recommendations`に変更。以下の本文は当時の名称のまま残す）

---

## テーブル一覧

### 認証・ユーザー

| カラム | 型 | 説明 |
|-------|---|------|
| id | integer PK | |
| email | varchar(255) UNIQUE | |
| name | varchar(100) | |
| password_hash | varchar(255) | |
| role | enum(admin, user) | デフォルト: user |
| is_active | boolean | |

### 入札案件: `tenders`

| カラム | 型 | 説明 |
|-------|---|------|
| id | integer PK | |
| title | varchar(500) | 案件名 |
| organization | varchar(200) | 発注機関 |
| category | varchar(100) | 工事種別 |
| location | varchar(200) | 所在地 |
| budget_min / budget_max | numeric(15,0) | 予定価格（範囲） |
| announced_date | date | 公告日 |
| deadline | date | 締切日 |
| requirements | text | 参加条件 |
| detail_url | varchar(1000) | 元ページURL |
| source | enum(scraping, njss_csv) | データ取得元 |
| raw_data | jsonb | 元データ保持 |

### お気に入り: `tender_favorites`
- user_id × tender_id にUNIQUE制約

### AIおすすめ度: `tender_recommendations`
- tender_id に UNIQUE（1案件につき1スコア）
- score: 0〜100、reason: AI判定理由テキスト

### 業者: `contractors`
- specialties は JSONB（配列）で複数の得意分野を持てる

### 自社情報

**`company_profile`**（1レコード固定）
- name, address, phone, email
- description（会社概要）
- philosophy（経営理念・考え方）
- specialties（得意分野）

**`company_licenses`**（company_profileに紐づく複数）
- license_type: 例「建設業許可（土木工事業）」
- license_number, valid_from, valid_until

**`company_achievements`**（工事実績、複数）
- title（工事名）, client（発注者）, category（工事種別）
- amount（請負金額）, completed_year, location, description

### RAG: `rag_documents`

- embedding: `vector(1536)`（pgvector）
- IVFFlat インデックス（コサイン類似度）
- category: 判例 / 法令 / 社内ナレッジ など

---

## おすすめ度の判定ロジック（方針）

以下の情報をClaudeに渡して0〜100のスコアと理由を生成する：

**案件側**: 工事種別・金額・地域・資格要件  
**自社側**: company_profile（得意分野）+ company_licenses（保有資格）+ company_achievements（実績規模・種別）

バックグラウンドジョブで案件インポート後に自動生成する。

---

## マイグレーション

- ツール: Alembic（async対応）
- 初回: `alembic upgrade head`
- pgvectorの`CREATE EXTENSION IF NOT EXISTS vector`は初回マイグレーションに含む
- embeddingカラムはText→vector(1536)にALTERで変換（Alembicがvector型を直接サポートしないため）
