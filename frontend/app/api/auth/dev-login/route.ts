import { NextResponse } from "next/server";
import { authCookieOptions, createSessionToken, sessionCookieName } from "@/lib/auth";
import { upsertSsoUser } from "@/lib/queries/users";

export const runtime = "nodejs";

const DEV_EMAIL = "dev-user@bid-support.local";
const DEV_NAME = "開発ユーザー";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await upsertSsoUser({ email: DEV_EMAIL, name: DEV_NAME });
  const sessionToken = createSessionToken({ sub: `dev:${DEV_EMAIL}`, name: user.name, email: user.email, role: user.role });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, sessionToken, {
    ...authCookieOptions,
    maxAge: 8 * 60 * 60,
  });
  return response;
}
