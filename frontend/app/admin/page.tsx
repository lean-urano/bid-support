"use client";

import Link from "next/link";
import { ArrowRight, Database, HardHat, LayoutDashboard, Settings, Users } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/AdminPage";

const cards = [
  {
    title: "クライアント一覧",
    description: "契約中のクライアント情報と利用状況を管理します。",
    icon: Users,
    iconClass: "bg-sky-50 text-sky-700",
    href: "/admin/clients",
  },
  {
    title: "入札案件収集",
    description: "自治体サイトから入札案件を収集し、案件データを管理します。",
    icon: Database,
    iconClass: "bg-indigo-50 text-indigo-700",
    href: "/admin/bids",
  },
  {
    title: "下請け企業収集",
    description: "下請け・協力企業の情報を収集し、企業マスターを管理します。",
    icon: HardHat,
    iconClass: "bg-amber-50 text-amber-700",
    href: "/admin/contractors",
  },
  {
    title: "設定",
    description: "管理者向けのシステム設定を管理します。",
    icon: Settings,
    iconClass: "bg-slate-100 text-slate-700",
    href: "/admin/settings",
  },
] as const;

export default function AdminHomePage() {
  return (
    <AdminPageShell>
        <AdminPageHeader eyebrow="Admin workspace" title="管理者ホーム" description="管理対象を選択してください。" icon={LayoutDashboard} />

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="管理メニュー">
          {cards.map(({ title, description, icon: Icon, iconClass, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-44 flex-col justify-between border border-slate-200 bg-white p-6 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
              </div>
              <div className="mt-7">
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            </Link>
          ))}
        </section>
    </AdminPageShell>
  );
}
