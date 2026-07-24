"use client";

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const startLogin = () => {
    const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
    const returnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold shadow-md mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          tender-support にログイン
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          建設業者向け 入札・交渉・法務AI支援システム
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200/80 text-center">
          <p className="text-sm text-slate-600 leading-6">
            MIRRORアカウントを使って、tender-supportへ安全にログインできます。
          </p>
          <button
            type="button"
            onClick={startLogin}
            className="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            MIRRORでログイン
          </button>
          <p className="mt-4 text-[11px] text-slate-400">Secure sign-in via MIRROR</p>
          <Link href="/admin/login" className="mt-3 inline-block text-[11px] text-slate-400 hover:text-slate-600 hover:underline">
            管理者の方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
