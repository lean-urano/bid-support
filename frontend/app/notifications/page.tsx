"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  Filter 
} from "lucide-react";

type NotificationItem = {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: "ai" | "scraping" | "system" | string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsListPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ai":
        return (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[11px] font-bold inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AIおすすめ
          </span>
        );
      case "scraping":
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> スクレイピング
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> システム
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* ナビゲーションヘッダー */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Bell className="w-5 h-5" />
            </div>
            <span>tender-support</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">通知センター</span>
          </Link>

          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> ダッシュボードへ戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              お知らせ・通知一覧
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-red-500 text-white font-bold rounded-full text-xs">
                  未読 {unreadCount}件
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              AI評価や自動収集システムからの重要なお知らせ一覧です。選択すると全文を確認できます。
            </p>
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4" /> すべて既読にする
            </button>
          )}
        </div>

        {/* フィルタータブ */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>絞り込み:</span>
            <button 
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              すべて ({notifications.length})
            </button>
            <button 
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === "unread" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              未読 ({unreadCount})
            </button>
            <button 
              onClick={() => setFilter("read")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === "read" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              既読 ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* リスト表示 */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500">通知データを読み込んでいます...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center text-slate-400 text-sm">
            該当する通知はありません
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(item => (
              <Link 
                key={item.id} 
                href={`/notifications/${item.id}`}
                className={`block p-5 bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:border-blue-300 group ${!item.read ? "border-blue-200 bg-blue-50/20" : "border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${!item.read ? "bg-blue-600" : "bg-transparent"}`}></div>
                      {getTypeBadge(item.type)}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <h2 className={`text-base font-bold tracking-tight group-hover:text-blue-600 transition-colors ${!item.read ? "text-slate-900" : "text-slate-700"}`}>
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all my-auto shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
