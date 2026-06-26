# ADR 001 — 技術スタック選定

**日付**: 2026-06-27
**ステータス**: 決定済み（旧ADRから刷新）

---

## 背景

入札情報を集約するWebダッシュボード「tender-support」を構築する。
地方公共団体の入札情報をスクレイピングしてDBに蓄積し、複数ユーザーが閲覧できるシステム。
管理者とユーザーの2ロール構成。

---

## 決定事項

| レイヤー | 採用技術 |
|---------|---------|
| フロントエンド | Next.js (TypeScript) + shadcn/ui + Tailwind CSS |
| バックエンド | FastAPI (Python) |
| データベース | PostgreSQL |
| スクレイピング | Playwright (Python) |
| インフラ | nginx + Ubuntu VPS |

### フロントエンド: Next.js + shadcn/ui + Tailwind CSS

- 型安全なTypeScriptでフロントを構築
- shadcn/uiでUIコンポーネントを統一（Tailwind単体ではページごとにUIがバラつく問題を回避）
- **Claudeへの指示時は「shadcn/uiのコンポーネントを使って」と明記すること**

### バックエンド: FastAPI (Python)

- Playwright等Python資産との親和性が高い
- async/await対応、自動APIドキュメント生成

### スクレイピング: Playwright (Python)

- Seleniumは不採用。async対応、ドライバ管理不要でシンプル
- 対象は**地方公共団体のWebサイト**（NJSSへのスクレイピングは行わない）

### データベース: PostgreSQL

- Googleスプレッドシート連携は不採用（複数ユーザー閲覧にはDBが適切）

---

## データソース方針

| ソース | 方式 |
|-------|------|
| 地方公共団体サイト | Playwrightで直接スクレイピング |
| NJSS | CSVダウンロード＋定期インポート（加入済みのため直接スクレイピングしない） |

---

## ユーザー種別

| ロール | できること |
|-------|----------|
| 管理者 | ユーザー管理、スクレイピング実行、CSVインポート |
| ユーザー | 案件の閲覧・検索 |

---

## 不採用の選択肢

- **Selenium**: 旧コードで使用していたが破棄。Playwrightに乗り換え
- **Next.js API Routes フルスタック**: バックエンドをPythonに寄せるためFastAPIで分離
- **Googleスプレッドシート**: 旧コードにあったが、マルチユーザー要件に不適合
