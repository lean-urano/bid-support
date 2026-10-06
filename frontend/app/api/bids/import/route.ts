import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function value(row: Record<string, string>, ...keys: string[]) { return keys.map((key) => row[key]?.trim()).find(Boolean) ?? null; }
function budget(valueText: string | null) { if (!valueText) return null; const digits = valueText.replace(/[^0-9]/g, ""); return digits ? Number(digits) : null; }
function date(valueText: string | null) { if (!valueText) return null; const match = valueText.match(/(20\d{2})[年\/-](\d{1,2})[月\/-](\d{1,2})/); return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : valueText; }

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "CSVファイルを選択してください。" }, { status: 400 });
  const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (rows.length < 2) return NextResponse.json({ error: "CSVに登録する案件がありません。" }, { status: 400 });
  if (rows.length > 5001) return NextResponse.json({ error: "一度に登録できるのは5,000件までです。" }, { status: 400 });

  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  const bids = records.map((row, index) => ({
    rowNumber: index + 2,
    title: value(row, "案件名", "工事名称", "title"),
    organization: value(row, "発注機関", "発注者", "organization"),
    location: value(row, "地域", "所在地", "location"),
    deadline: date(value(row, "開札予定日", "入札締切", "deadline")),
    budgetMax: budget(value(row, "予定価格", "予算", "budget_max")),
    category: value(row, "工種", "カテゴリ", "category"),
    requirements: value(row, "概要", "参加資格", "requirements"),
    detailUrl: value(row, "詳細URL", "URL", "detail_url"),
  }));
  const invalid = bids.filter((bid) => !bid.title || !bid.organization);
  if (invalid.length) return NextResponse.json({ error: `${invalid[0].rowNumber}行目以降に、案件名または発注機関がありません。` }, { status: 400 });

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;
  try {
    await client.query("BEGIN");
    for (const bid of bids) {
      const result = await client.query<{ inserted: boolean }>(
        `INSERT INTO bids (title, organization, location, deadline, budget_max, category, requirements, detail_url, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'njss_csv')
         ON CONFLICT (detail_url) DO UPDATE SET title=EXCLUDED.title, organization=EXCLUDED.organization,
           location=EXCLUDED.location, deadline=EXCLUDED.deadline, budget_max=EXCLUDED.budget_max,
           category=EXCLUDED.category, requirements=EXCLUDED.requirements, updated_at=now()
         RETURNING (xmax = 0) AS inserted`,
        [bid.title, bid.organization, bid.location, bid.deadline, bid.budgetMax, bid.category, bid.requirements, bid.detailUrl]
      );
      if (result.rows[0]?.inserted) inserted += 1; else updated += 1;
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: error instanceof Error ? error.message : "CSV登録に失敗しました。" }, { status: 500 });
  } finally { client.release(); }
  return NextResponse.json({ inserted, updated, total: bids.length });
}
