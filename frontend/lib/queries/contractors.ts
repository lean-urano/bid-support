import { pool } from "@/lib/db";

export interface ContractorRow {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  specialties: string[] | null;
  notes: string | null;
  created_at: string;
}

export async function listContractors(): Promise<ContractorRow[]> {
  const { rows } = await pool.query<ContractorRow>(
    `SELECT id, name, address, phone, email, specialties, notes, created_at
     FROM contractors
     ORDER BY created_at DESC
     LIMIT 500`
  );
  return rows;
}

export interface CreateContractorInput {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  specialties: string[];
}

export async function createContractor(input: CreateContractorInput): Promise<ContractorRow> {
  const { rows } = await pool.query<ContractorRow>(
    `INSERT INTO contractors (name, address, phone, email, specialties)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, address, phone, email, specialties, notes, created_at`,
    [input.name, input.address, input.phone, input.email, JSON.stringify(input.specialties)]
  );
  return rows[0];
}

export async function updateContractor(id: number, input: CreateContractorInput): Promise<ContractorRow | null> {
  const { rows } = await pool.query<ContractorRow>(
    `UPDATE contractors SET
       name = $2, address = $3, phone = $4, email = $5, specialties = $6, updated_at = now()
     WHERE id = $1
     RETURNING id, name, address, phone, email, specialties, notes, created_at`,
    [id, input.name, input.address, input.phone, input.email, JSON.stringify(input.specialties)]
  );
  return rows[0] ?? null;
}

export async function deleteContractor(id: number): Promise<void> {
  await pool.query("DELETE FROM contractors WHERE id = $1", [id]);
}
