# ADR 005 — バックエンドをPython(FastAPI)からNode.js/TypeScriptへ移行

**日付**: 2026-07-24
**ステータス**: 決定済み（[ADR001](001-tech-stack.md)を置き換え）

---

## 背景

ADR001（2026-06-27）でPython(FastAPI + SQLAlchemy + Alembic)を採用したが、実装は`backend/api/auth.py`のみに留まり、`tenders`等のCRUD APIも`backend/scraper/`・`backend/importer/`も未着手のまま空だった。

一方、2026-06-30には一度「フルスタックTypeScript」への方針転換がCLAUDE.md/GEMINI.md上でだけ記録された（バックエンドをNext.js App Router + Prisma/Drizzleにする案）が、実装には反映されずbackend/はPythonのまま維持され続けた。2026-07-22にはドキュメントだけが実コード（Python）に合わせて書き戻され、6/30の決定は宙に浮いた状態になっていた。

2026-07-24、bidAI（`mirror/bidAI`、Python/Celery/Playwrightで実装済みの入札情報クローラー）のスクレイパーをtender-supportに移植する作業をきっかけに技術選定を再検討した。

## 決定事項

バックエンドをPython(FastAPI)からNode.js/TypeScript（Next.js API Routes）に全面移行する。DBアクセスはORMを使わず`pg`パッケージによる生SQLで統一する。

| レイヤー | 旧(ADR001) | 新(本ADR) |
|---|---|---|
| バックエンド | FastAPI (Python) | Next.js API Routes (TypeScript) |
| DBアクセス | SQLAlchemy (async) + Alembic | `pg`（生SQL）。スキーマは`db/schema.sql`に冪等SQLで記述、マイグレーションツール無し |
| スクレイピング | Playwright (Python) | Playwright + Cheerio (TypeScript)。独立npmパッケージ`collector/`に分離 |
| 定期実行 | 未実装（Celery想定） | systemd常駐サービス + シェルループ |

## 理由

1. **MIRROR/lean系プロジェクトとの一貫性**: 兄弟プロジェクト`creativestudio`（`apps/client`、npm workspaces構成）はPrismaすら使わず`node:sqlite`直叩きの完全Node.js/TypeScript構成。さらに`/Users/uranonaoya/Projects/lean/vicca`（CityHeavenから数十万件規模を実際に収集し本番稼働中の実績プロジェクト）も、ORM無し・`pg`生SQル・独立`collector`パッケージ・systemd常駐ループという構成で実際にうまくいっている。tender-supportだけPythonが混在している状態を解消し、この2件の実績パターンに合わせる
2. **将来数百本規模のスクレイパーを見据えたPlaywrightエコシステム**: Playwrightのステルス・bot対策回避プラグイン（`playwright-extra`等）はNode.js/TypeScript側のエコシステムが厚く、対象サイトの検知回避が必要になった際の選択肢が広い
3. **既存Python実装の投資が薄く切り替えコストが低い**: 実装済みだったのは認証API(`auth.py`)のみで、`tenders`等のCRUD・スクレイパー・NJSSインポーターは全て未着手の空ディレクトリだった。DBの実データもseedユーザー3件のみで、スキーマの作り直しに支障がなかった
4. **ORMを入れない判断についての補足**: 当初はtenders/RAG(pgvector)のリレーション複雑さを理由にDrizzle ORMの導入を検討したが、vicca側も`shops`→`girls`のFK・複数関連テーブル・継続的な機能追加を抱えつつ生SQLのみで本番運用できている実績があり、「複雑になったらORMが要る」という前提自体が反証された。pgvectorの`vector(1536)`列の扱いだけは生SQLでの直列化に注意が必要な箇所だが、これは`rag_documents`用の小さなヘルパー関数で対応すれば足り、アプリ全体にORMを導入する理由にはならないと判断した

## 不採用の選択肢

- **Drizzle ORM**: pgvector型サポートやリレーション定義の型安全性は魅力だったが、creativestudio・viccaのどちらも採用していない第3の技術を持ち込む根拠が弱く、生SQL統一を優先した
- **Prisma**: pgvectorサポートが弱く（`Unsupported`型+生SQLでの回避が必要）、上記と同じ理由で不採用
- **Celery + Redis**: bidAI側では使われていたが、スクレイパー本数が少ないうちは過剰。vicca同様systemd常駐ループで代替し、将来数百本規模になった際に運用を再検討する
- **JWT Bearerトークンによる`/api/auth/me`エンドポイント**: Python版`auth.py`はJWT発行・検証の仕組みを持っていたが、実際のセッション管理はフロントエンド側の独自セッショントークン(`frontend/lib/auth.ts`、HMAC署名Cookie)であり、JWTは`sso-sync`/`admin-login`のレスポンスから`role`/`name`を取り出す目的にしか使われていなかった。Next.js側にロジックを内製化した時点でプロセス間通信自体が不要になったため、JWT発行・検証の仕組みごと廃止し、DB照会結果を直接セッショントークン生成に渡す構成にした

## 教訓

- 技術方針の転換はドキュメントだけ書き換えても実装が伴わなければ意味がなく、むしろ「決定済みなのに未実施」という宙ぶらりんな状態を生む。方針転換は実装のマイルストーンとセットで記録すること
- 「将来複雑になるから安全側の技術（ORM等）を先回りで入れる」という判断は、実際に近い規模・複雑さで運用されている実績（vicca）と照らして検証すること。実績が伴わない一般論だけで技術選定をしない
