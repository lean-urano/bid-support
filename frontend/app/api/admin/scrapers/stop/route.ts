import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json() as { sourceKey?: string };
  if (!body.sourceKey) return NextResponse.json({ error: "停止対象を指定してください。" }, { status: 400 });

  const result = await pool.query<{ id: number; process_id: number | null }>(
    `SELECT id, process_id FROM scraper_runs
       WHERE source_key = $1 AND status = 'running'
       ORDER BY started_at DESC LIMIT 1`,
    [body.sourceKey]
  );
  const run = result.rows[0];
  if (!run) return NextResponse.json({ error: "実行中のスクレイパーはありません。" }, { status: 409 });

  if (run.process_id) {
    try {
      // detached: true で起動したcollectorのプロセスグループ全体を停止する。
      process.kill(-run.process_id, "SIGTERM");
    } catch (error) {
      // すでに終了している場合も、実行履歴は停止済みにする。
      if (!(error && typeof error === "object" && "code" in error && error.code === "ESRCH")) throw error;
    }
  }

  await pool.query(
    `UPDATE scraper_runs
        SET status = 'failed', finished_at = now(), error_message = '管理画面から手動停止'
      WHERE id = $1 AND status = 'running'`,
    [run.id]
  );
  return NextResponse.json({ stopped: true, runId: run.id });
}
