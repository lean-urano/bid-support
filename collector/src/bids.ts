// bidAI(Python)のcrawl_tasks.pyのsave_bids相当。
// Bidモデル(bidai) → bidsテーブルへのフィールドマッピングとupsertを行う。
import { pool } from "./db.js";

export interface ScrapedBid {
  title: string;
  organization: string;
  category: string | null;
  location: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  announcedDate: string | null; // YYYY-MM-DD
  deadline: string | null; // YYYY-MM-DD
  requirements?: string | null;
  detailUrl: string;
  rawData: Record<string, unknown> | null;
}

export interface SaveResult {
  newCount: number;
  updatedCount: number;
}

export async function findExistingDetailUrls(detailUrls: string[]): Promise<Set<string>> {
  if (detailUrls.length === 0) return new Set();
  const { rows } = await pool.query<{ detail_url: string }>(
    "SELECT detail_url FROM bids WHERE detail_url = ANY($1)",
    [detailUrls]
  );
  return new Set(rows.map((row) => row.detail_url));
}

export async function saveBids(bids: ScrapedBid[]): Promise<SaveResult> {
  let newCount = 0;
  let updatedCount = 0;

  for (const b of bids) {
    const { rows } = await pool.query<{ inserted: boolean }>(
      `INSERT INTO bids (
         title, organization, category, location,
         budget_min, budget_max, announced_date, deadline, requirements,
         detail_url, source, raw_data
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scraping', $11)
       ON CONFLICT (detail_url) DO UPDATE SET
         title = excluded.title,
         organization = excluded.organization,
         category = excluded.category,
         location = excluded.location,
         budget_min = excluded.budget_min,
         budget_max = excluded.budget_max,
         announced_date = excluded.announced_date,
         deadline = excluded.deadline,
         requirements = excluded.requirements,
         raw_data = excluded.raw_data,
         updated_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [
        b.title,
        b.organization,
        b.category,
        b.location,
        b.budgetMin,
        b.budgetMax,
        b.announcedDate,
        b.deadline,
        b.requirements ?? null,
        b.detailUrl,
        b.rawData ? JSON.stringify(b.rawData) : null,
      ]
    );
    if (rows[0]?.inserted) newCount++;
    else updatedCount++;
  }

  return { newCount, updatedCount };
}
