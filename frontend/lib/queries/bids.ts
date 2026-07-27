import { pool } from "@/lib/db";

export interface BidRow {
  id: number;
  title: string;
  organization: string;
  category: string | null;
  location: string | null;
  budget_min: string | null;
  budget_max: string | null;
  announced_date: string | null;
  deadline: string | null;
  requirements: string | null;
  detail_url: string | null;
  source: "scraping" | "njss_csv" | "manual";
  created_at: string;
}

export async function listBids(): Promise<BidRow[]> {
  const { rows } = await pool.query<BidRow>(
    `SELECT id, title, organization, category, location, budget_min, budget_max,
            announced_date, deadline, requirements, detail_url, source, created_at
     FROM bids
     ORDER BY created_at DESC
     LIMIT 500`
  );
  return rows;
}

export interface CreateBidInput {
  title: string;
  organization: string;
  location: string | null;
  deadline: string | null;
  budgetMax: number | null;
  category: string | null;
  requirements: string | null;
}

export async function createBid(input: CreateBidInput): Promise<BidRow> {
  const { rows } = await pool.query<BidRow>(
    `INSERT INTO bids (title, organization, location, deadline, budget_max, category, requirements, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')
     RETURNING id, title, organization, category, location, budget_min, budget_max,
               announced_date, deadline, requirements, detail_url, source, created_at`,
    [input.title, input.organization, input.location, input.deadline, input.budgetMax, input.category, input.requirements]
  );
  return rows[0];
}

export async function updateBid(id: number, input: CreateBidInput): Promise<BidRow | null> {
  const { rows } = await pool.query<BidRow>(
    `UPDATE bids SET
       title = $2, organization = $3, location = $4, deadline = $5,
       budget_max = $6, category = $7, requirements = $8, updated_at = now()
     WHERE id = $1
     RETURNING id, title, organization, category, location, budget_min, budget_max,
               announced_date, deadline, requirements, detail_url, source, created_at`,
    [id, input.title, input.organization, input.location, input.deadline, input.budgetMax, input.category, input.requirements]
  );
  return rows[0] ?? null;
}

export async function deleteBid(id: number): Promise<void> {
  await pool.query("DELETE FROM bids WHERE id = $1", [id]);
}
