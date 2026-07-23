import { NextRequest, NextResponse } from "next/server";
import { oidcStateCookieName, oidcVerifierCookieName, returnToCookieName, safeReturnTo, secureCookie } from "@/lib/auth";
import { client, getOidcConfiguration, redirectUri } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const configuration = await getOidcConfiguration();
  const codeVerifier = client.randomPKCECodeVerifier();
  const state = client.randomState();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const authorizationUrl = client.buildAuthorizationUrl(configuration, {
    redirect_uri: redirectUri,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: secureCookie, path: "/", maxAge: 10 * 60 };
  response.cookies.set(oidcStateCookieName, state, cookieOptions);
  response.cookies.set(oidcVerifierCookieName, codeVerifier, cookieOptions);
  response.cookies.set(returnToCookieName, safeReturnTo(request.nextUrl.searchParams.get("returnTo")), cookieOptions);
  return response;
}
