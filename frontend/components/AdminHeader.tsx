"use client";

import Link from "next/link";
import { Building2, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-3" aria-label="管理者ホーム">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide">公共工事サポート</span>
            <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-indigo-300">
              <ShieldCheck className="h-3 w-3" /> 管理コンソール
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name ?? "管理者"}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <LogOut className="h-3.5 w-3.5" />
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
