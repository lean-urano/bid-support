// bid.progress-ai.co.jp(bidAI, Python)の`bids`テーブルから過去データを移行するワンショットスクリプト。
// 実行: npx tsx src/migrate-legacy-data.ts [CSVパス]
// CSVは以下で事前にエクスポートしておく:
//   ssh progress "docker exec bidai-db-1 psql -U njss -d njss -c \"\\copy (SELECT id, source_id, external_id,
//     title, organization, prefecture, city, category, bid_type, budget_min, budget_max, announcement_date,
//     deadline, raw_url, pdf_urls, extracted_data, raw_text FROM bids) TO STDOUT WITH CSV HEADER\""
//     > collector/legacy_bids.csv
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "node:path";
import { pool } from "./db.js";

interface LegacyBidRow {
  id: string;
  source_id: string;
  external_id: string;
  title: string;
  organization: string;
  prefecture: string;
  city: string;
  category: string;
  bid_type: string;
  budget_min: string;
  budget_max: string;
  announcement_date: string;
  deadline: string;
  raw_url: string;
  pdf_urls: string;
  extracted_data: string;
  raw_text: string;
}

// 簡易CSVパーサー: ダブルクォート内の改行・カンマ・エスケープ("")に対応する。
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toNullableInt(v: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNullableDate(v: string): string | null {
  if (!v) return null;
  return v.slice(0, 10); // "2026-02-25 00:00:00" -> "2026-02-25"
}

function mapRow(row: LegacyBidRow): {
  title: string;
  organization: string;
  category: string | null;
  location: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  announcedDate: string | null;
  deadline: string | null;
  detailUrl: string;
  rawData: Record<string, unknown>;
} {
  // 旧DBの都道府県はJIS X 0401コードで保存されていたため、表示用の名称へ変換する。
  const prefecture = row.prefecture === "21" ? "岐阜県" : row.prefecture;
  const location = [prefecture, row.city].filter(Boolean).join(" ") || null;

  let pdfUrls: unknown = null;
  try {
    pdfUrls = row.pdf_urls ? JSON.parse(row.pdf_urls) : null;
  } catch {
    pdfUrls = row.pdf_urls || null;
  }

  let extractedData: unknown = null;
  try {
    extractedData = row.extracted_data ? JSON.parse(row.extracted_data) : null;
  } catch {
    extractedData = row.extracted_data || null;
  }

  return {
    title: row.title,
    organization: row.organization || "不明",
    category: row.category || null,
    location,
    budgetMin: toNullableInt(row.budget_min),
    budgetMax: toNullableInt(row.budget_max),
    announcedDate: toNullableDate(row.announcement_date),
    deadline: toNullableDate(row.deadline),
    detailUrl: row.raw_url,
    rawData: {
      legacy_bid_id: row.id,
      legacy_source_id: row.source_id,
      external_id: row.external_id,
      bid_type: row.bid_type || null,
      pdf_urls: pdfUrls,
      extracted_data: extractedData,
      raw_text: row.raw_text || null,
    },
  };
}

async function main() {
  const csvPath = process.argv[2] ?? "legacy_bids.csv";
  const text = readFileSync(csvPath, "utf-8");
  const rows = parseCsv(text);
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.length === header.length && r.some((c) => c !== ""));

  console.log(`[migrate-legacy-data] ${parse(csvPath).base}: ${dataRows.length}件を読み込み`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const cols of dataRows) {
    const row = Object.fromEntries(header.map((h, i) => [h, cols[i]])) as unknown as LegacyBidRow;
    if (!row.raw_url || !row.title) {
      skipped++;
      continue;
    }
    const mapped = mapRow(row);

    const { rows: result } = await pool.query<{ inserted: boolean }>(
      `INSERT INTO bids (
         title, organization, category, location,
         budget_min, budget_max, announced_date, deadline,
         detail_url, source, raw_data
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scraping', $10)
       ON CONFLICT (detail_url) DO UPDATE SET
         title = excluded.title,
         organization = excluded.organization,
         category = excluded.category,
         location = excluded.location,
         budget_min = excluded.budget_min,
         budget_max = excluded.budget_max,
         announced_date = excluded.announced_date,
         deadline = excluded.deadline,
         raw_data = excluded.raw_data,
         updated_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [
        mapped.title,
        mapped.organization,
        mapped.category,
        mapped.location,
        mapped.budgetMin,
        mapped.budgetMax,
        mapped.announcedDate,
        mapped.deadline,
        mapped.detailUrl,
        JSON.stringify(mapped.rawData),
      ]
    );
    if (result[0]?.inserted) inserted++;
    else updated++;
  }

  console.log(`[migrate-legacy-data] ${inserted} inserted, ${updated} updated, ${skipped} skipped(欠損データ)`);
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate-legacy-data] 失敗:", err);
  process.exitCode = 1;
});
