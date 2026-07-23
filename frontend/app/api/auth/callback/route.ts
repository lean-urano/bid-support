import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, oidcStateCookieName, oidcVerifierCookieName, returnToCookieName, secureCookie, sessionCookieName } from "@/lib/auth";
import { client, getOidcConfiguration } from "@/lib/oidc";

export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// デフォルト値を与えると本番でも既知の値のまま起動できてしまうため、明示的な設定を必須にする。
function requireSsoSyncSecret() {
  const secret = process.env.SSO_SYNC_SECRET;
  if (!secret) throw new Error("SSO_SYNC_SECRET is required");
  return secret;
}

export async function GET(request: NextRequest) {
  const state = request.cookies.get(oidcStateCookieName)?.value;
  const codeVerifier = request.cookies.get(oidcVerifierCookieName)?.value;
  const returnTo = request.cookies.get(returnToCookieName)?.value ?? "/";
  if (!state || !codeVerifier) return NextResponse.redirect(new URL("/api/auth/login", request.url));

  try {
    const configuration = await getOidcConfiguration();
    const tokens = await client.authorizationCodeGrant(configuration, new URL(request.url), {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
    });
    const claims = tokens.claims();
    if (!claims?.sub || !tokens.access_token) throw new Error("Missing ID token claims");
    const userinfo = await client.fetchUserInfo(configuration, tokens.access_token, claims.sub);
    const email = typeof userinfo.email === "string" ? userinfo.email : "";
    const name = typeof userinfo.name === "string" ? userinfo.name : "MIRRORユーザー";

    const syncRes = await fetch(`${API_URL}/api/auth/sso-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sso-Sync-Secret": requireSsoSyncSecret() },
      body: JSON.stringify({ email, name }),
    });
    if (!syncRes.ok) throw new Error("Failed to sync user with backend");
    const synced: { role: "user" | "admin"; name: string } = await syncRes.json();

    const sessionToken = createSessionToken({ sub: claims.sub, name: synced.name, email, role: synced.role });
    const response = NextResponse.redirect(new URL(returnTo, request.url));
    response.cookies.set(sessionCookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    response.cookies.delete(oidcStateCookieName);
    response.cookies.delete(oidcVerifierCookieName);
    response.cookies.delete(returnToCookieName);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/api/auth/login?error=callback", request.url));
  }
}
