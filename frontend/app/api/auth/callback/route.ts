import { NextRequest, NextResponse } from "next/server";
import { appOrigin, authCookieOptions, createSessionToken, oidcStateCookieName, oidcVerifierCookieName, returnToCookieName, sessionCookieName } from "@/lib/auth";
import { client, getOidcConfiguration } from "@/lib/oidc";
import { upsertSsoUser } from "@/lib/queries/users";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const state = request.cookies.get(oidcStateCookieName)?.value;
  const codeVerifier = request.cookies.get(oidcVerifierCookieName)?.value;
  const returnTo = request.cookies.get(returnToCookieName)?.value ?? "/";
  if (!state || !codeVerifier) return NextResponse.redirect(new URL("/api/auth/login", appOrigin));

  try {
    const configuration = await getOidcConfiguration();
    // request.urlはリバースプロキシ配下だとlocalhost:<内部ポート>ベースになることがあるため、
    // パス+クエリはrequest.nextUrlから取り、originは常にappOriginを使う。
    const tokens = await client.authorizationCodeGrant(configuration, new URL(request.nextUrl.pathname + request.nextUrl.search, appOrigin), {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
    });
    const claims = tokens.claims();
    if (!claims?.sub || !tokens.access_token) throw new Error("Missing ID token claims");
    const userinfo = await client.fetchUserInfo(configuration, tokens.access_token, claims.sub);
    const email = typeof userinfo.email === "string" ? userinfo.email : "";
    const name = typeof userinfo.name === "string" ? userinfo.name : "MIRRORユーザー";

    const synced = await upsertSsoUser({ email, name });

    const sessionToken = createSessionToken({ sub: claims.sub, name: synced.name, email, role: synced.role });
    const response = NextResponse.redirect(new URL(returnTo, appOrigin));
    response.cookies.set(sessionCookieName, sessionToken, {
      ...authCookieOptions,
      maxAge: 8 * 60 * 60,
    });
    response.cookies.set(oidcStateCookieName, "", { ...authCookieOptions, maxAge: 0 });
    response.cookies.set(oidcVerifierCookieName, "", { ...authCookieOptions, maxAge: 0 });
    response.cookies.set(returnToCookieName, "", { ...authCookieOptions, maxAge: 0 });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/api/auth/login?error=callback", appOrigin));
  }
}
