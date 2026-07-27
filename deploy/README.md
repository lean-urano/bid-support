# VPS上のsystemd設定（バックアップ）

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
