# VPS上のsystemd設定（バックアップ）

## GitHub Actionsによる本番デプロイ

`main`へのpush（またはActions画面からの手動実行）で、本番VPSの`/var/www/bid-support`を更新する。
依存関係の固定インストール、Next.jsの本番ビルド、PM2の再読み込み、収集サービスの再起動、ヘルスチェックまでを行う。

GitHubリポジトリの **Settings → Secrets and variables → Actions** に次のSecretsを登録する。

| Secret | 内容 |
| --- | --- |
| `DEPLOY_HOST` | 本番VPSのホスト名またはIPアドレス |
| `DEPLOY_USER` | `/var/www/bid-support`を更新し、PM2とsystemdを操作できるSSHユーザー |
| `DEPLOY_PORT` | SSHポート（通常は`22`） |
| `DEPLOY_SSH_PRIVATE_KEY` | デプロイ専用Ed25519秘密鍵 |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -H <host>`で取得・確認したknown_hostsの1行 |
| `PROD_DATABASE_URL` | 本番PostgreSQLの接続URL |
| `PROD_OIDC_CLIENT_SECRET` | `bid-support`用OIDCクライアントシークレット |
| `PROD_AUTH_SESSION_SECRET` | 十分にランダムなセッション署名鍵 |

ワークフローは秘密値から`frontend/.env.production`を毎回生成する。このファイルはGit管理対象外で、
`NEXT_PUBLIC_MIRROR_SSO_URL=https://sso.mi-rror.com`を**ビルド前**に与えるため、公開用SSO URLが
ブラウザ向けJavaScriptに確実に組み込まれる。SSHユーザーには`systemctl try-restart bid-support-gifu bid-support-nexco-east`を
パスワードなしで実行できるsudo権限が必要。

本番VPS（`ssh progress`, `ssh mirror`）の `/etc/systemd/system/bid-support-*.service` と
`/var/www/bid-support/collector/loops/*.sh` は、リポジトリのデプロイスクリプトから自動生成されて
いるわけではなく、VPS上に直接手動で置く想定（vicca方式）。

サーバーを作り直す・別サーバーに引っ越すことがあった場合にゼロから再現できるよう、ここに現状のコピーを
保存している。**ここを直しても本番には反映されない**（逆に本番を直してもここには反映されない）ので、
どちらかを変更したらもう一方にも手動で反映すること。

## 復元手順（サーバーを作り直した場合）

```bash
# 1. collector一式を配置（/var/www/bid-support/collector）した後、loopスクリプトを配置
scp deploy/loops/*.sh <host>:/var/www/bid-support/collector/loops/
ssh <host> 'chmod +x /var/www/bid-support/collector/loops/*.sh'

# 2. systemd unitを配置して有効化
scp deploy/systemd/*.service <host>:/etc/systemd/system/
ssh <host> 'systemctl daemon-reload && systemctl enable --now bid-support-gifu bid-support-nexco-east'
```

## 各サービスの役割

| サービス | 役割 |
|---|---|
| `bid-support-gifu` | 岐阜県入札情報を収集（継続ループ、1時間間隔） |
| `bid-support-nexco-east` | NEXCO東日本の入札公告（受付中案件）を収集（継続ループ、1時間間隔） |

`geps`（政府電子調達システム）は移植元のbidAI(Python)時点で実サイト構造が未検証（`GEPS_BID_LIST`のURLが
2026-07-25時点で404）で、セレクタも仮実装のまま。`collector/src/sources/geps.ts`はコードとしては移植済みだが、
実サイトで検証しURLとセレクタを修正するまでsystemdループには入れていない。

## 現在デプロイ済みの環境

- `progress`（`/var/www/bid-support`）: 開発検証用
- `mirror`（`/var/www/bid-support`, 本番`bid.mi-rror.com`）: 本番
