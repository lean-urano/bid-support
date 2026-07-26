import { pool } from "@/lib/db";

export type UserRole = "admin" | "user";

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id: number): Promise<User | null> {
  const { rows } = await pool.query<User>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

// SSO同期用: 既存ユーザーはnameのみ更新しroleは変更しない(Python版auth.pyのsso_syncと同じ契約)。
// 新規ユーザーはrole="user"固定で作成する。
export async function upsertSsoUser(params: {
  email: string;
  name: string;
}): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (email, name, role)
     VALUES ($1, $2, 'user')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
     RETURNING *`,
    [params.email, params.name]
  );
  return rows[0];
}
