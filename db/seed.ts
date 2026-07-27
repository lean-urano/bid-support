// 初期データ投入: 開発用アカウントの事前登録
// 実行: npx tsx db/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const users = [
    // 一般ユーザーはMIRROR SSO経由。sso/idpの開発用デモアカウント(alice@example.com)に
    // ロールを割り当てておく。実際のユーザーレコードはSSOログイン時にsso-syncで作成される。
    { email: "alice@example.com", name: "Alice(SSO)", password_hash: null, role: "user" },
    // 管理者はSSOを使わずメール・パスワードでログインする(/admin/login)。開発用の固定パスワード。
    { email: "admin@bid-support.jp", name: "管理者", password_hash: await bcrypt.hash("admin1234", 10), role: "admin" },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.email, u.name, u.password_hash, u.role]
    );
  }

  console.log("シード完了:");
  for (const u of users) console.log(`  ${u.role}: ${u.email}`);

  await pool.end();
}

seed();
