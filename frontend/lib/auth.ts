import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const sessionCookieName = "tender_support_session";
export const oidcStateCookieName = "tender_support_oidc_state";
export const oidcVerifierCookieName = "tender_support_oidc_verifier";
export const returnToCookieName = "tender_support_return_to";

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
