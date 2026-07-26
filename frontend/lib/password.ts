import bcrypt from "bcryptjs";

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
