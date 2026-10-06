import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sources = [
  { key: "gifu", name: "岐阜県 電子調達システム", type: "自治体サイト", url: "https://www.pref.gifu.lg.jp/bid/search/search.php" },
  { key: "nexco-east", name: "NEXCO東日本 入札公告", type: "公社サイト", url: "https://www.e-nexco.co.jp/bids/public_notice/search_service" },
  { key: "geps", name: "GEPS 政府電子調達システム", type: "政府調達サイト", url: "https://www.geps.go.jp/info" },
];

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (source_key)
        source_key, started_at, finished_at, status, success_count, failure_count, error_message
      FROM scraper_runs
      ORDER BY source_key, started_at DESC
    `);
    const latest = new Map(rows.map((row) => [row.source_key, row]));
    return NextResponse.json({ sources: sources.map((source) => ({ ...source, latestRun: latest.get(source.key) ?? null })) });
  } catch (error) {
    console.error("[admin/scrapers] scraper_runs取得失敗", error);
    return NextResponse.json({ error: "スクレイパーの実行履歴を取得できませんでした。" }, { status: 500 });
  }
}
