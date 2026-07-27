"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Building2, 
  Bot, 
  Search, 
  ShieldCheck, 
  Bell, 
  LogOut,
  Check,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time?: string;
  read: boolean;
  type: "ai" | "scraping" | "system";
  linkUrl?: string;
};

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // ハンバーガーメニュー
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        const res = await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
        if (res.ok) {
          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
        }
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }

    setShowNotifications(false);

    if (item.linkUrl) {
      if (item.linkUrl.startsWith("bid:")) {
        const id = item.linkUrl.split(":")[1];
        router.push(`/bids?id=${id}`);
      } else if (item.linkUrl === "admin:scraping") {
        router.push(`/bids?tab=scraping`);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotifications(updated);
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // テーマカラー設定
  const themeColor = isAdmin ? "bg-indigo-600" : "bg-blue-600";
  const hoverColor = isAdmin ? "hover:text-indigo-600" : "hover:text-blue-600";
  const activeColor = isAdmin ? "text-indigo-600 font-bold" : "text-blue-600 font-bold";

  // ナビリンク定義（管理者 / 一般で分岐）
  const navLinks = isAdmin
    ? [
        { href: "/bids",          icon: <Search className="w-5 h-5" />,    label: "調査AI管理",   sub: "Bid AI" },
        { href: "/contractors",   icon: <UserCheck className="w-5 h-5" />, label: "交渉AI管理",   sub: "Negotiation AI" },
        { href: "/ai-assistant",  icon: <Bot className="w-5 h-5" />,       label: "法務AI学習",   sub: "Legal AI" },
      ]
    : [
        { href: "/bids",          icon: <Search className="w-5 h-5" />,    label: "案件調査AI",   sub: "Bid AI" },
        { href: "/contractors",   icon: <UserCheck className="w-5 h-5" />, label: "交渉AI",       sub: "Negotiation AI" },
        { href: "/ai-assistant",  icon: <Bot className="w-5 h-5" />,       label: "秘書AI",       sub: "Secretary AI" },
      ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ロゴエリア */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className={`p-2 rounded-lg font-bold flex items-center justify-center text-white ${themeColor}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
              公共工事サポート
              {isAdmin ? (
                <span className="hidden min-[500px]:flex text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 管理者コンソール
                </span>
              ) : null}
            </span>
          </Link>
        </div>

        {/* ナビゲーションメニュー（md以上で表示） */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`group flex flex-col items-center justify-center py-1 transition-colors ${
                pathname === link.href ? activeColor : `text-slate-600 ${hoverColor}`
              }`}
            >
              <span className="group-hover:scale-110 transition-transform">{link.icon}</span>
              <span className="text-[10px] font-bold mt-0.5 leading-none">{link.label}</span>
              <span className={`text-[8px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider ${
                isAdmin ? "group-hover:text-indigo-400" : "group-hover:text-blue-400"
              } transition-colors`}>{link.sub}</span>
            </Link>
          ))}
        </nav>

        {/* 右側アクションエリア */}
        <div className="flex items-center gap-3 relative">
          {/* 通知ベルボタン */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 relative cursor-pointer transition-colors"
              title="通知一覧"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">お知らせ・通知一覧</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full text-[10px]">
                        未読 {unreadCount}件
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                      <Check className="w-3 h-3" /> すべて既読にする
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">通知はありません</div>
                  ) : (
                    notifications.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleNotificationClick(item)} 
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${!item.read ? "bg-blue-50/40" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!item.read ? "bg-blue-600" : "bg-transparent"}`}></div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{item.title}</span>
                            <span className="text-[10px] text-slate-400">{item.time || "新着"}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div 
              title={`${user?.name || ""} (${user?.email || ""})`} 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${themeColor}`}
            >
              {isAdmin ? "管" : "般"}
            </div>
            <button onClick={logout} title="ログアウト" className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* ハンバーガーボタン（md未満で表示） */}
          <div className="md:hidden relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="メニュー"
              aria-label="メニューを開く"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-[5px]">
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-200 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-200 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
              </div>
            </button>

            {/* ドロップダウンメニュー */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      pathname === link.href
                        ? `${isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"} font-bold`
                        : `text-slate-600 ${isAdmin ? "hover:bg-indigo-50 hover:text-indigo-600" : "hover:bg-blue-50 hover:text-blue-600"}`
                    }`}
                  >
                    <span className="shrink-0">{link.icon}</span>
                    <div>
                      <div className="text-sm font-semibold leading-none">{link.label}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{link.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
