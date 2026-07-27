# ADR 006 — プロジェクト名を`tender-support`から`bid-support`へ変更

**日付**: 2026-07-27
**ステータス**: 決定済み

---

## 背景

プロジェクト名・ドメイン用語として"tender"（入札の英訳）を使ってきたが、ユーザーから「tenderではなくbidという表現に統一してほしい」という明確な指示があった。

---

## 決定事項

コード・DB・インフラ・プロジェクト名のすべてで`tender`表記を`bid`に統一する。

| 対象 | 旧 | 新 |
|---|---|---|
| DBテーブル | `tenders` | `bids` |
| DBテーブル | `tender_favorites` | `bid_favorites` |
| DBテーブル | `tender_recommendations` | `bid_recommendations` |
| APIルート | `/api/tenders`, `/api/tenders/[id]` | `/api/bids`, `/api/bids/[id]` |
| ページURL | `/tenders` | `/bids` |
| TypeScript型 | `Tender`, `TenderRow`, `ScrapedTender` | `Bid`, `BidRow`, `ScrapedBid` |
| クエリファイル | `frontend/lib/queries/tenders.ts` | `frontend/lib/queries/bids.ts` |
| collectorファイル | `collector/src/tenders.ts` | `collector/src/bids.ts` |
| セッションCookie名 | `tender_support_session_chips`等 | `bid_support_session_chips`等 |
| OIDC client_id | `tender-support`（`sso/idp`に登録） | `bid-support`（`sso/idp`側も同時に変更） |
| プロジェクトディレクトリ | `tender-support/` | `bid-support/` |
| GitHubリポジトリ | `lean-urano/tender-support` | `lean-urano/bid-support` |
| VPS配置パス | `/var/www/tender-support` | `/var/www/bid-support` |
| PM2プロセス名 | `tender-support-frontend` | `bid-support-frontend` |
| systemdユニット名 | `tender-support-gifu.service`等 | `bid-support-gifu.service`等 |

DB側のテーブル・列・インデックス・制約は`ALTER TABLE ... RENAME`系のSQLで、既存データ（ローカル・progress・mirror本番の3環境）を保持したまま名前だけ変更した。

## 影響・移行時の注意

- **既存の本番セッションは無効化される**: セッションCookie名を変更したため、変更を反映した時点でログイン中のユーザーは再ログインが必要になる（実ユーザー3名のみのため許容）
- **OIDC client_idの変更はsso/idp側との同時デプロイが必須**: `sso/idp`（別プロジェクト、mirrorサーバーでPM2稼働中）の`client_id`登録も同時に`bid-support`へ変更し、フロントエンドと同時に再デプロイしないとログインが完全に失敗する
- **通知機能(Prisma/SQLite)の`linkUrl`スキーム**: `tender:1`形式を`bid:1`形式に変更。移行前にDBへ投入済みの通知データがある場合、旧形式の行はリンクが機能しなくなる（デモ用シードデータのみのため実害なし）

## 教訓

- ドメイン用語（今回で言う"tender" vs "bid"）はプロジェクトの初期段階で確定させておかないと、後から変える際にDBスキーマ・API・セッションCookie・OIDC設定・インフラパス・GitHubリポジトリ名まで多層的に影響が及び、変更コストが大きくなる
- OIDCのclient_idのように複数プロジェクトにまたがる識別子は、変更時に「もう片方を直し忘れる」事故が起きやすい。変更前に`grep`等で登録元を横断的に確認すること
