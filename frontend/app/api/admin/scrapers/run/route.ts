import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const scripts = new Map([
  ["gifu", "gifu.ts"],
  ["nexco-east", "nexco-east.ts"],
  ["geps", "geps.ts"],
]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json() as { sourceKeys?: string[] };
  const sourceKeys = [...new Set(body.sourceKeys ?? [])];
  if (sourceKeys.length === 0 || sourceKeys.some((key) => !scripts.has(key))) {
    return NextResponse.json({ error: "実行対象を1件以上選択してください。" }, { status: 400 });
  }

  const targets = sourceKeys;

  const runningResult = await pool.query<{ source_key: string }>(
    "SELECT source_key FROM scraper_runs WHERE source_key = ANY($1) AND status = 'running'",
    [targets]
  );
  if (runningResult.rows.length > 0) {
    return NextResponse.json({ error: "このスクレイパーはすでに実行中です。完了を待ってください。" }, { status: 409 });
  }

  const collectorDir = [path.resolve(process.cwd(), "../collector"), path.resolve(process.cwd(), "collector")].find(existsSync);
  if (!collectorDir) return NextResponse.json({ error: "collectorディレクトリが見つかりません。" }, { status: 500 });
  const tsxCli = path.join(collectorDir, "node_modules/tsx/dist/cli.mjs");
  if (!existsSync(tsxCli)) return NextResponse.json({ error: "collectorの実行環境（tsx）が見つかりません。" }, { status: 500 });

  for (const sourceKey of targets) {
    const runResult = await pool.query<{ id: number }>(
      "INSERT INTO scraper_runs (source_key) VALUES ($1) RETURNING id",
      [sourceKey]
    );
    const runId = runResult.rows[0].id;
    const child = spawn(process.execPath, [tsxCli, path.join(collectorDir, "src/sources", scripts.get(sourceKey)!)], {
      cwd: collectorDir,
      env: { ...process.env, SCRAPER_RUN_ID: String(runId) },
      detached: true,
      stdio: "ignore",
    });
    await pool.query("UPDATE scraper_runs SET process_id = $2 WHERE id = $1", [runId, child.pid ?? null]);
    child.on("error", (error) => {
      console.error(`[scraper:${sourceKey}] collector起動失敗`, error);
      void pool.query(
        "UPDATE scraper_runs SET status = 'failed', finished_at = now(), failure_count = 1, error_message = $2 WHERE id = $1",
        [runId, error.message]
      );
    });
    child.on("exit", (code, signal) => {
      if (code !== 0) console.error(`[scraper:${sourceKey}] collector終了 code=${code ?? "null"} signal=${signal ?? "null"}`);
    });
    child.unref();
  }

  return NextResponse.json({ started: targets });
}
