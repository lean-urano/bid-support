"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Database, KeyRound, SlidersHorizontal } from "lucide-react";

const settings = [
  {
    title: "会社情報",
    description: "サービス名や管理者向けの基本情報を管理します。",
    icon: Building2,
  },
  {
    title: "データ収集",
    description: "入札案件・下請け企業の収集元と実行設定を管理します。",
    icon: Database,
  },
  {
    title: "AI・RAG設定",
    description: "AIが参照するナレッジと生成設定を管理します。",
    icon: SlidersHorizontal,
  },
  {
    title: "認証・権限",
    description: "管理者アカウントとアクセス権限を管理します。",
    icon: KeyRound,
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-700">
            <ArrowLeft className="h-3.5 w-3.5" /> 管理者ホーム
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">System settings</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">設定</h1>
          <p className="mt-2 text-sm text-slate-600">管理者向けのシステム設定を管理します。</p>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="設定項目">
          {settings.map(({ title, description, icon: Icon }) => (
            <button
              key={title}
              type="button"
              className="group flex min-h-36 items-start gap-4 border border-slate-200 bg-white p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">{title}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">{description}</span>
              </span>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
