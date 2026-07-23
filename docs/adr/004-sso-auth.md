# ADR 004 — 一般ユーザーはMIRROR SSO、管理者はメール・パスワードの2系統認証

**日付**: 2026-07-22
**ステータス**: 決定済み（当初は全ユーザーSSO一本化を決定したが、同日中に管理者のみ専用ログインへ変更した）

---

## 背景

これまでフロントエンドの認証はローカルストレージに書き込むだけのモック（`lib/auth-context.tsx`）で、実際のログイン検証を一切行っていなかった。一方でバックエンド(`backend/api/auth.py`)にはメール・パスワード認証(JWT)が実装済みだったが、フロントエンドから一度も呼ばれておらず未使用だった。

mirror配下の各プロジェクトはMIRRORアカウント1つで共通ログインする方針（`mirror/CLAUDE.md`、`mirror/sso/idp`）のため、tender-support独自のパスワード認証を維持する理由がない。creativestudioが同じ方式で先行実装済み（`creativestudio/apps/client/src/lib/oidc.ts`ほか）だったため、同じパターンを踏襲した。

## 決定事項

- **一般ユーザー**（`/login`）は`sso/idp`（OIDC IdP、`client_id: tender-support`）へのリダイレクトのみでログインする。tender-support独自のパスワードログインは提供しない
- **管理者**（`/admin/login`）はSSOを使わず、メール・パスワードでログインする。バックエンドの`POST /api/auth/admin-login`が`role=admin`かつパスワード一致のアカウントのみを許可する（role=admin以外はパスワードが一致しても拒否する）
- 両ログインとも最終的に同じ形式の署名付きセッションCookie(`tender_support_session`)を発行するため、`lib/auth-context.tsx`・`Header.tsx`などアプリ側はどちらの経路でログインしたかを意識しない。管理者セッションは`sub`を`admin:<email>`という形にして区別できるようにしている（ログアウト時の遷移先分岐に使用）
- OIDCのAuthorization Code + PKCEフローをNext.js側(`frontend/app/api/auth/{login,callback,logout,session}`)に実装
- ユーザーのロール(admin/user)は引き続きtender-support自身の`users`テーブル(Postgres, FastAPI/SQLAlchemy管理)で保持する。sso/idpはメール・氏名などの本人確認のみを担い、ロールという概念を持たない
- OIDCコールバック時にバックエンドの`POST /api/auth/sso-sync`を呼び、`users`テーブルをemailキーでupsertする（新規作成時は必ず`role=user`）。このエンドポイントは共有シークレット(`SSO_SYNC_SECRET`)で保護し、ブラウザから直接叩けるユーザー作成口にはしない。`SSO_SYNC_SECRET`にコード上のデフォルト値は持たせず、未設定なら起動時に落ちるようにしている（デフォルト値があると本番でも気づかず既知の値のまま動いてしまうため）
- `users.password_hash`はNULL許容（SSOユーザーはパスワードを持たない。管理者アカウントのみ値を持つ）

## 不採用の選択肢

- **全ユーザーをSSOに一本化する**: 当初はこの方針で実装しADR004初版として決定したが、ユーザーから「管理者は普通にメールアドレスとパスワードでログインしたい」という明確な要望があり、同日中に管理者のみ専用ログインへ変更した。sso/idp自体にロールの概念がなく、MIRRORの他サービスとの整合上も管理者向け認証をtender-support側で完結させる方が運用上シンプルという判断
- **tender-support独自のPrismaにUserテーブルを新設する**: 実際の開発の多くがNext.js側のPrisma/SQLiteに寄っていたが、ADR001/003で決定済みのFastAPI+Postgresの`users`テーブル・ロール管理をそのまま活かす方を優先した。RAG用DBとの物理分離も「今は不要、必要になったときに切り出す」方針とした

## 開発環境メモ

- sso/idpの開発用デモアカウント(`alice@example.com`)に`role=user`を`backend/seed.py`で事前登録している。実ユーザーレコード自体はSSOログイン時に`sso-sync`で作成される
- 管理者の開発用アカウントは`admin@tender-support.jp` / `admin1234`（`backend/seed.py`でハッシュ化して登録）。本番では別のメールアドレス・パスワードを使う想定（本番デプロイ時に個別設定）
- ローカルでPostgresを起動する際、他プロジェクトが既に5432/5433を使用していたため、tender-supportは**5434**番ポートを使う(`docker-compose.yml`)
- `frontend/app/admin/login`・`app/admin/dashboard`・`components/LoginForm.tsx`は、当初どこからもリンクされていない旧パスワードログインの試作("工事中"スタブ)だったため一度削除したが、上記の方針転換により`/admin/login`は独立した管理者ログインページとして作り直した

## E2Eテスト

`frontend/e2e/sso-login.spec.ts`にPlaywrightでSSOログイン/ログアウトのE2Eテストを用意した。ブラウザでの手動確認には限界があるため、DBへの直接書き込みでログインを代替せず、実際にsso/idpの画面を経由してログインする形でテストする（`CLAUDE.md`のE2Eテスト方針に準拠）。

実行には`sso/idp`・`backend`・`frontend`の3プロセスが起動している必要がある。

```bash
cd frontend
E2E_BASE_URL=http://localhost:3000 npm run e2e
```

ローカルの3000/4000/8000番ポートが別プロジェクトで使用中の場合は、`E2E_BASE_URL`と各サービスの起動ポートを合わせて別ポートに変更する。アカウントは`E2E_SSO_USER_EMAIL`/`E2E_SSO_USER_PASSWORD`（一般ユーザー）・`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`（管理者）で上書き可能（未指定時は開発用デフォルト値を使う）。

## 修正履歴

- 2026-07-22: Codexレビューで指摘された3件を修正。(1) 孤立していた旧`/admin/login`がビルドを壊していた問題を削除で解消、(2) 既にコミット済みだった初回マイグレーションを直接書き換えていたのを取りやめ、`users.password_hash`をNULL許容にする追加マイグレーション(`64060bc89bce`)に分離、(3) `SSO_SYNC_SECRET`のコード上デフォルト値を撤廃し未設定時は起動失敗するように変更
