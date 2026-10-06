import { pool } from "@/lib/db";

export interface CompanyProfileRow {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  philosophy: string | null;
  specialties: string | null;
  updated_at: string;
}

export interface CompanyLicenseRow {
  id: number;
  company_id: number;
  license_type: string;
  license_number: string | null;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
}

export interface CompanyAchievementRow {
  id: number;
  company_id: number;
  title: string;
  client: string | null;
  category: string | null;
  amount: string | null;
  completed_year: number | null;
  location: string | null;
  description: string | null;
}

export interface CompanyDocumentRow {
  id: number;
  company_id: number;
  original_filename: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface LicenseInput {
  licenseType: string;
  licenseNumber: string | null;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
}

export interface AchievementInput {
  title: string;
  client: string | null;
  category: string | null;
  amount: number | null;
  completedYear: number | null;
  location: string | null;
  description: string | null;
}

export interface ProfileInput {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  philosophy: string | null;
  specialties: string | null;
}

// company_profileは1レコード固定。存在しなければ空レコードを作成してidを返す。
export async function ensureCompanyProfile(): Promise<number> {
  const existing = await pool.query<{ id: number }>("SELECT id FROM company_profile ORDER BY id LIMIT 1");
  if (existing.rows[0]) return existing.rows[0].id;
  const created = await pool.query<{ id: number }>(
    "INSERT INTO company_profile (name) VALUES ('') RETURNING id"
  );
  return created.rows[0].id;
}

export async function getCompanyProfileFull() {
  const companyId = await ensureCompanyProfile();
  const [profile, licenses, achievements, documents] = await Promise.all([
    pool.query<CompanyProfileRow>("SELECT * FROM company_profile WHERE id = $1", [companyId]),
    pool.query<CompanyLicenseRow>("SELECT * FROM company_licenses WHERE company_id = $1 ORDER BY id", [companyId]),
    pool.query<CompanyAchievementRow>("SELECT * FROM company_achievements WHERE company_id = $1 ORDER BY id", [companyId]),
    pool.query<CompanyDocumentRow>(
      "SELECT id, company_id, original_filename, mime_type, file_size, created_at FROM company_documents WHERE company_id = $1 ORDER BY created_at DESC",
      [companyId]
    ),
  ]);
  return {
    profile: profile.rows[0],
    licenses: licenses.rows,
    achievements: achievements.rows,
    documents: documents.rows,
  };
}

export async function saveCompanyProfile(input: ProfileInput): Promise<void> {
  const companyId = await ensureCompanyProfile();
  await pool.query(
    `UPDATE company_profile
     SET name = $2, address = $3, phone = $4, email = $5, description = $6, philosophy = $7, specialties = $8, updated_at = now()
     WHERE id = $1`,
    [companyId, input.name, input.address, input.phone, input.email, input.description, input.philosophy, input.specialties]
  );
}

export async function replaceLicenses(companyId: number, licenses: LicenseInput[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM company_licenses WHERE company_id = $1", [companyId]);
    for (const license of licenses) {
      await client.query(
        `INSERT INTO company_licenses (company_id, license_type, license_number, valid_from, valid_until, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [companyId, license.licenseType, license.licenseNumber, license.validFrom, license.validUntil, license.notes]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function replaceAchievements(companyId: number, achievements: AchievementInput[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM company_achievements WHERE company_id = $1", [companyId]);
    for (const achievement of achievements) {
      await client.query(
        `INSERT INTO company_achievements (company_id, title, client, category, amount, completed_year, location, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          companyId,
          achievement.title,
          achievement.client,
          achievement.category,
          achievement.amount,
          achievement.completedYear,
          achievement.location,
          achievement.description,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function insertDocument(input: {
  companyId: number;
  uploadedBy: number | null;
  originalFilename: string;
  storedPath: string;
  mimeType: string | null;
  fileSize: number;
}): Promise<CompanyDocumentRow> {
  const { rows } = await pool.query<CompanyDocumentRow>(
    `INSERT INTO company_documents (company_id, uploaded_by, original_filename, stored_path, mime_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, company_id, original_filename, mime_type, file_size, created_at`,
    [input.companyId, input.uploadedBy, input.originalFilename, input.storedPath, input.mimeType, input.fileSize]
  );
  return rows[0];
}

export async function getDocument(id: number): Promise<(CompanyDocumentRow & { stored_path: string }) | null> {
  const { rows } = await pool.query<CompanyDocumentRow & { stored_path: string }>(
    "SELECT id, company_id, original_filename, stored_path, mime_type, file_size, created_at FROM company_documents WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function deleteDocument(id: number): Promise<void> {
  await pool.query("DELETE FROM company_documents WHERE id = $1", [id]);
}
