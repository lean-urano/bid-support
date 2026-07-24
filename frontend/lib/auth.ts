import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// 既存の非Partitioned Cookieと衝突させず、再ログインでCHIPSへ移行する。
export const sessionCookieName = "tender_support_session_chips";
export const oidcStateCookieName = "tender_support_oidc_state_chips";
export const oidcVerifierCookieName = "tender_support_oidc_verifier_chips";
export const returnToCookieName = "tender_support_return_to_chips";

export interface UserSession {
  sub: string;
  name: string;
  email: string;
  role: "user" | "admin";
  expiresAt: number;
}

const sessionSecret = process.env.AUTH_SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "tender-support-development-session-secret");

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  if (!sessionSecret) throw new Error("AUTH_SESSION_SECRET is required in production");
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

export function createSessionToken(user: Omit<UserSession, "expiresAt">) {
  const payload = encode(JSON.stringify({ ...user, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }));
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token: string | undefined): UserSession | null {
  if (!token) return null;
  const [payload, receivedSignature] = token.split(".");
  if (!payload || !receivedSignature) return null;

  try {
    const expectedSignature = signature(payload);
    if (!timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) return null;
    const session = JSON.parse(decode(payload)) as UserSession;
    if (!session.sub || !session.name || !session.email || !session.role || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(sessionCookieName)?.value);
}

export function safeReturnTo(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export const secureCookie = process.env.NODE_ENV === "production";

// Partitioned は Secure 必須。HTTP のローカル開発ではCookieを保存できなくなるため、
// 本番HTTPSのみCHIPSを有効にする。SameSite=Noneでも同一サイト要求は送信される。
export const authCookieOptions = secureCookie
  ? { httpOnly: true, sameSite: "none" as const, secure: true, partitioned: true, path: "/" }
  : { httpOnly: true, sameSite: "lax" as const, secure: false, path: "/" };

// request.urlはNext.jsがNodeの生のreq.url(パスのみ)からoriginを補完する際、
// リバースプロキシ配下だとlocalhost:<内部ポート>を使ってしまうことがあるため、
// 絶対URLを組み立てる際は必ずこちら(OIDC_REDIRECT_URIから導出した正しいorigin)を使うこと。
export const appOrigin = new URL(process.env.OIDC_REDIRECT_URI ?? "http://localhost:4325/api/auth/callback").origin;
