import { NextRequest, NextResponse } from "next/server";
import { authCookieOptions, createSessionToken, sessionCookieName } from "@/lib/auth";
import { findUserByEmail } from "@/lib/queries/users";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await findUserByEmail(email);
  const passwordOk = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;
  if (!user || user.role !== "admin" || !user.is_active || !passwordOk) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  const sessionToken = createSessionToken({ sub: `admin:${email}`, name: user.name, email, role: user.role });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, sessionToken, {
    ...authCookieOptions,
    maxAge: 8 * 60 * 60,
  });
  return response;
}
