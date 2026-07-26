// bidAI(Python)のcrawl_tasks.pyのsave_bids相当。
// Bidモデル(bidai) → tendersテーブルへのフィールドマッピングとupsertを行う。
import { pool } from "./db.js";

export interface ScrapedTender {
  title: string;
  organization: string;
  category: string | null;
  location: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  announcedDate: string | null; // YYYY-MM-DD
  deadline: string | null; // YYYY-MM-DD
  detailUrl: string;
  rawData: Record<string, unknown> | null;
}

export interface SaveResult {
  newCount: number;
  updatedCount: number;
}

export async function saveTenders(tenders: ScrapedTender[]): Promise<SaveResult> {
  let newCount = 0;
  let updatedCount = 0;

  for (const t of tenders) {
    const { rows } = await pool.query<{ inserted: boolean }>(
      `INSERT INTO tenders (
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
        t.title,
        t.organization,
        t.category,
        t.location,
        t.budgetMin,
        t.budgetMax,
        t.announcedDate,
        t.deadline,
        t.detailUrl,
        t.rawData ? JSON.stringify(t.rawData) : null,
      ]
    );
    if (rows[0]?.inserted) newCount++;
    else updatedCount++;
  }

  return { newCount, updatedCount };
}
