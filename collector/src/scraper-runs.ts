import { pool } from "./db.js";

export async function isScraperEnabled(sourceKey: string): Promise<boolean> {
  const { rows } = await pool.query<{ enabled: boolean }>(
    "SELECT enabled FROM scraper_sources WHERE source_key = $1",
    [sourceKey]
  );
  return rows[0]?.enabled ?? true;
}

export async function startScraperRun(sourceKey: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO scraper_runs (source_key) VALUES ($1) RETURNING id`,
    [sourceKey]
  );
  return rows[0].id;
}

export async function finishScraperRun(
  id: number,
  result: { successCount: number; failureCount: number }
): Promise<void> {
  await pool.query(
    `UPDATE scraper_runs
        SET finished_at = now(), status = 'success', success_count = $2, failure_count = $3
      WHERE id = $1`,
    [id, result.successCount, result.failureCount]
  );
}

export async function updateScraperRunProgress(id: number, result: { successCount: number; failureCount: number }): Promise<void> {
  await pool.query(
    `UPDATE scraper_runs
        SET success_count = $2, failure_count = $3
      WHERE id = $1 AND status = 'running'`,
    [id, result.successCount, result.failureCount]
  );
}

export async function failScraperRun(id: number, error: unknown, failureCount = 1): Promise<void> {
  await pool.query(
    `UPDATE scraper_runs
        SET finished_at = now(), status = 'failed', failure_count = $3, error_message = $2
      WHERE id = $1`,
    [id, error instanceof Error ? error.message : String(error), failureCount]
  );
}
