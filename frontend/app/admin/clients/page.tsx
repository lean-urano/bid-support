"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";

export default function AdminClientsPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-700">
              <ArrowLeft className="h-3.5 w-3.5" /> 管理者ホーム
            </Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Client management</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">クライアント一覧</h1>
            <p className="mt-2 text-sm text-slate-600">契約中のクライアント情報と利用状況を管理します。</p>
          </div>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
            <Plus className="h-4 w-4" /> クライアントを追加
          </button>
        </div>

        <section className="mt-8 border border-slate-200 bg-white" aria-label="クライアント一覧">
          <div className="grid grid-cols-[minmax(0,1fr)_160px_140px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500">
            <span>クライアント</span>
            <span>利用状況</span>
            <span>登録日</span>
          </div>
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-sm font-bold text-slate-800">クライアント一覧</h2>
            <p className="mt-2 text-sm text-slate-500">登録されているクライアントはありません。</p>
          </div>
        </section>
      </main>
    </div>
  );
}
