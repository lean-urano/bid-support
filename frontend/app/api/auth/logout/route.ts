import { NextResponse } from "next/server";
import { appOrigin, authCookieOptions, getSession, sessionCookieName } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const response = session?.sub.startsWith("admin:")
    // 管理者はSSOを経由していないため、そのまま管理者ログイン画面に戻す
    ? NextResponse.redirect(new URL("/admin/login", appOrigin))
    : (() => {
        const issuer = process.env.OIDC_ISSUER_URL ?? "http://localhost:4000";
        const tenderSupportLoginUrl = process.env.TENDER_SUPPORT_LOGIN_URL ?? "http://localhost:3000/login";
        const logoutUrl = new URL("/logout", issuer);
        logoutUrl.searchParams.set("return_to", tenderSupportLoginUrl);
        return NextResponse.redirect(logoutUrl);
      })();
  response.cookies.set(sessionCookieName, "", { ...authCookieOptions, maxAge: 0 });
  return response;
}
