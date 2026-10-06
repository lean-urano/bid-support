"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight, Database, FilePlus2, Globe2, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const bidLinks = [
  { href: "/admin/bids", label: "案件マスター", icon: Database, exact: true },
  { href: "/admin/bids/scrapers", label: "スクレイパー一覧", icon: Globe2 },
  { href: "/admin/bids/register", label: "手動登録", icon: FilePlus2 },
];

type MenuItem = { href: string; label: string; icon: typeof Database; exact?: boolean };

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("bid-support:admin-sidebar-collapsed") === "true";
  });

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("bid-support:admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <aside className={`w-full shrink-0 border-b border-slate-200 bg-white transition-[width] duration-200 lg:border-b-0 lg:border-r ${collapsed ? "lg:w-[72px]" : "lg:w-60"}`} aria-label="管理メニュー">
      <div className={`hidden items-center pb-4 pt-6 lg:flex ${collapsed ? "flex-col gap-3 px-2" : "justify-between px-5"}`}>
        {!collapsed && <div><p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">OPERATIONS</p><p className="mt-1 text-xs text-slate-500">入札情報を整える</p></div>}
        <button type="button" onClick={toggle} aria-label={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"} title={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"} className="grid h-8 w-8 shrink-0 place-items-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className={`flex gap-1 overflow-x-auto px-3 py-2 lg:block lg:space-y-1 lg:py-0 ${collapsed ? "lg:px-2" : "lg:px-3"}`}>
        <div className="flex items-center gap-1 lg:block">
          <LinkWithCollapse item={{ href: "/admin", label: "管理者ホーム", icon: LayoutDashboard, exact: true }} collapsed={collapsed} />
          <span className="hidden px-3 pb-2 pt-6 text-[10px] font-bold tracking-[0.16em] text-slate-400 lg:block">{!collapsed && "入札案件"}</span>
          {bidLinks.map((item) => <LinkWithCollapse key={item.href} item={item} collapsed={collapsed} />)}
        </div>
      </nav>
      <div className={`hidden border-t border-slate-100 py-5 lg:block ${collapsed ? "px-2" : "px-5"}`}>
        <div className={`flex items-center text-xs font-semibold text-slate-500 ${collapsed ? "justify-center" : "gap-2"}`} title={collapsed ? "公共工事サポート" : undefined}><Building2 className="h-4 w-4 shrink-0" />{!collapsed && "公共工事サポート"}</div>
      </div>
    </aside>
  );
}

function LinkWithCollapse({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;
  return <Link href={item.href} title={collapsed ? item.label : undefined} className={cn("flex items-center border-l-2 py-2.5 text-sm font-medium transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><Icon className="h-4 w-4 shrink-0" /><span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span></Link>;
}
