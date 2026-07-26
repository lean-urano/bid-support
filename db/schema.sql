-- tender-support DBスキーマ（ORM無し・生SQL、vicca方式に準拠）
-- 適用: psql "$DATABASE_URL" -f db/schema.sql
-- 冪等に書くこと（CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS）。
-- 変更を加える場合は本ファイルの末尾に追記し、既存行は原則書き換えない。

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

CREATE TABLE IF NOT EXISTS tenders (
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
    source VARCHAR(20) NOT NULL CHECK (source IN ('scraping', 'njss_csv')),
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tender_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    tender_id INTEGER NOT NULL REFERENCES tenders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tender_favorites UNIQUE (user_id, tender_id)
);

CREATE TABLE IF NOT EXISTS tender_recommendations (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL UNIQUE REFERENCES tenders(id),
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

CREATE INDEX IF NOT EXISTS idx_tenders_source ON tenders (source);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders (deadline);
CREATE INDEX IF NOT EXISTS idx_tender_favorites_user_id ON tender_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_company_licenses_company_id ON company_licenses (company_id);
CREATE INDEX IF NOT EXISTS idx_company_achievements_company_id ON company_achievements (company_id);

-- 2026-07-25: スクレイパーの再実行で重複投入されないよう、detail_urlを自然キーとしてUNIQUE化。
-- vicca(shops.portal_shop_url)と同じ考え方。部分インデックスはON CONFLICTの推論対象にならないため
-- 通常のUNIQUEインデックスにする(NULL同士は重複とみなされないため、detail_urlがNULLの行(njss_csv等)は問題ない)。
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenders_detail_url ON tenders (detail_url);
