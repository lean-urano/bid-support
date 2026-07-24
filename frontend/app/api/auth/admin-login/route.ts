import { NextRequest, NextResponse } from "next/server";
import { authCookieOptions, createSessionToken, sessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const res = await fetch(`${API_URL}/api/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }
  const data: { role: "admin"; name: string } = await res.json();

  const sessionToken = createSessionToken({ sub: `admin:${email}`, name: data.name, email, role: data.role });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, sessionToken, {
    ...authCookieOptions,
    maxAge: 8 * 60 * 60,
  });
  return response;
}
