"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, CheckCircle2 } from "lucide-react";

interface MirrorUser {
  name: string;
  email: string;
  companyName: string;
}

const mirrorSsoUrl = process.env.NEXT_PUBLIC_MIRROR_SSO_URL ?? "http://localhost:4000";
const EMBED_CLIENT_ID = "bid-support";
const isDev = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const [user, setUser] = useState<MirrorUser | null>(null);
  const [checking, setChecking] = useState(!isDev);
  const [modalOpen, setModalOpen] = useState(false);
  const [devLoggingIn, setDevLoggingIn] = useState(false);
  const [devError, setDevError] = useState("");

  const checkMirrorSession = async (closeModalWhenAuthenticated = false) => {
    setChecking(true);
    try {
      const response = await fetch(`${mirrorSsoUrl}/api/session`, { credentials: "include" });
      const data: { authenticated?: boolean; user?: MirrorUser } = await response.json();
      const authenticatedUser = data.authenticated && data.user ? data.user : null;
      setUser(authenticatedUser);
      if (authenticatedUser && closeModalWhenAuthenticated) setModalOpen(false);
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isDev) return;
    const sessionTimer = window.setTimeout(() => { void checkMirrorSession(); }, 0);

    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.origin !== new URL(mirrorSsoUrl).origin || event.data?.type !== "mirror-authenticated") return;
      setModalOpen(false);
      void checkMirrorSession();
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.clearTimeout(sessionTimer);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const startBidSupportSession = () => {
    const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
    const returnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const devLogin = async () => {
    setDevError("");
    setDevLoggingIn(true);
    try {
      const res = await fetch("/api/auth/dev-login", { method: "POST" });
      if (!res.ok) {
        setDevError("仮IDログインに失敗しました");
        return;
      }
      const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
      const returnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
      // AuthProviderのセッション取得はマウント時のみのため、フルリロードで遷移する
      window.location.assign(returnTo);
    } finally {
      setDevLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold shadow-md mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          公共工事サポートにログイン
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          建設業者向け 入札・交渉・法務AI支援システム
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200/80 text-center">
          {isDev ? (
            <>
              <p className="text-sm text-slate-600 leading-6">
                ローカル開発用の仮IDでログインします（SSOは使用しません）。
              </p>
              <button
                type="button"
                onClick={() => { void devLogin(); }}
                disabled={devLoggingIn}
                className="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-60"
              >
                {devLoggingIn ? "ログイン中..." : "仮IDでログイン"}
              </button>
              {devError && <p className="mt-3 text-sm text-red-600">{devError}</p>}
            </>
          ) : checking ? (
            <div className="flex items-center justify-center gap-3 text-sm text-slate-500 py-2">
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
              MIRRORアカウントを確認しています
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3 text-left">
                <span className="grid w-10 h-10 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  {user.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">MIRRORにログイン済みです</p>
                  <p className="mt-0.5 text-xs text-slate-500">{user.companyName}・{user.name}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
              </div>
              <button
                type="button"
                onClick={startBidSupportSession}
                className="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
              >
                公共工事サポートに入る
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 leading-6">
                MIRRORアカウントを使って、公共工事サポートへ安全にログインできます。
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                MIRRORでログイン
              </button>
            </>
          )}
          {!isDev && <p className="mt-4 text-[11px] text-slate-400">Secure sign-in via MIRROR</p>}
          <Link href="/admin/login" className="mt-3 inline-block text-[11px] text-slate-400 hover:text-slate-600 hover:underline">
            管理者の方はこちら
          </Link>
          <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
            はじめてご利用の方は
            <Link href="/register" className="ml-1 font-bold text-blue-600 hover:text-blue-700 hover:underline">
              新規企業登録へ
            </Link>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5" role="dialog" aria-modal="true" aria-label="MIRRORアカウントにログイン">
          <div className="relative h-[min(720px,90vh)] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 z-10 grid w-8 h-8 place-items-center rounded-full bg-white text-lg text-slate-500 shadow hover:text-slate-800"
              aria-label="閉じる"
            >
              ×
            </button>
            <iframe
              title="MIRRORアカウントにログイン"
              src={`${mirrorSsoUrl}/login?embed=1&client=${EMBED_CLIENT_ID}`}
              onLoad={() => { void checkMirrorSession(true); }}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
