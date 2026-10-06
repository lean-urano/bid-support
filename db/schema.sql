-- bid-support DBスキーマ（ORM無し・生SQL、vicca方式に準拠）
-- 適用: psql "$DATABASE_URL" -f db/schema.sql
-- 冪等に書くこと（CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS）。
-- 変更を加える場合は本ファイルの末尾に追記し、既存行は原則書き換えない。
--
-- 2026-07-27: tender -> bid にリネーム(要件の呼称に合わせる)。既存3環境(ローカル/progress/mirror)は
-- ALTER TABLE RENAME等でデータを保持したまま移行済み。このファイルは新規環境用に最初からbid名で定義する。

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    organization VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(200),
    budget_min NUMERIC(15, 0),
    budget_max NUMERIC(15, 0),
    announced_date DATE,
    deadline DATE,
    requirements TEXT,
    detail_url VARCHAR(1000),
    source VARCHAR(20) NOT NULL CHECK (source IN ('scraping', 'njss_csv', 'manual')),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bid_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    bid_id INTEGER NOT NULL REFERENCES bids(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bid_favorites UNIQUE (user_id, bid_id)
);

CREATE TABLE IF NOT EXISTS bid_recommendations (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER NOT NULL UNIQUE REFERENCES bids(id),
    score INTEGER NOT NULL,
    reason TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    specialties JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_profile (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    description TEXT,
    philosophy TEXT,
    specialties TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_licenses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
    license_type VARCHAR(200) NOT NULL,
    license_number VARCHAR(100),
    valid_from DATE,
    valid_until DATE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS company_achievements (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    client VARCHAR(200),
    category VARCHAR(100),
    amount NUMERIC(15, 0),
    completed_year INTEGER,
    location VARCHAR(200),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_rag_documents_embedding
    ON rag_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_bids_source ON bids (source);
CREATE INDEX IF NOT EXISTS idx_bids_deadline ON bids (deadline);
CREATE INDEX IF NOT EXISTS idx_bid_favorites_user_id ON bid_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_company_licenses_company_id ON company_licenses (company_id);
CREATE INDEX IF NOT EXISTS idx_company_achievements_company_id ON company_achievements (company_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bids_detail_url ON bids (detail_url);

-- 企業情報入力（資格証・実績書類のアップロード＋AI解析によるフォーム自動反映）
CREATE TABLE IF NOT EXISTS company_documents (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id),
    original_filename VARCHAR(300) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents (company_id);

CREATE TABLE IF NOT EXISTS scraper_runs (
    id BIGSERIAL PRIMARY KEY,
    source_key VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
    process_id BIGINT,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_source_started ON scraper_runs (source_key, started_at DESC);

CREATE TABLE IF NOT EXISTS scraper_sources (
    source_key VARCHAR(50) PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO scraper_sources (source_key) VALUES
    ('gifu'), ('nexco-east'), ('geps')
ON CONFLICT (source_key) DO NOTHING;
