"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  Bell, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink 
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

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAndMarkRead() {
      try {
        setLoading(true);
        // 1. データ取得
        const res = await fetch(`/api/notifications/${id}`);
        if (!res.ok) {
          throw new Error("通知が見つかりませんでした");
        }
        const data: NotificationItem = await res.json();
        setNotification(data);

        // 2. 未読の場合は自動的に既読に更新
        if (!data.read) {
          await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
          setNotification(prev => prev ? { ...prev, read: true } : null);
        }
      } catch (err: any) {
        setError(err.message || "通知データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadAndMarkRead();
    }
  }, [id]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ai":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI自動評価・おすすめ
          </span>
        );
      case "scraping":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> 自治体スクレイピング
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> システム通知
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
            <span>公共工事サポート</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">通知センター</span>
          </Link>

          <Link href="/notifications" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> 通知一覧へ戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500">通知データを読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="bg-white p-12 rounded-2xl border border-red-200 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
            <h2 className="text-lg font-bold text-slate-800">{error}</h2>
            <Link href="/notifications" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white font-medium text-sm rounded-xl hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 通知一覧に戻る
            </Link>
          </div>
        ) : notification ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/notifications" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> お知らせ一覧
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(notification.createdAt).toLocaleString('ja-JP')}</span>
              </div>
            </div>

            {/* 通知カード詳細 */}
            <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(notification.type)}
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 既読完了
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      {notification.title}
                    </h1>
                  </div>
                </div>

                {/* メッセージ本文 */}
                <div className="prose prose-slate max-w-none py-2 text-slate-700 leading-relaxed space-y-4 text-base whitespace-pre-wrap">
                  <p className="bg-slate-50/80 p-6 rounded-xl border border-slate-100 text-slate-800 font-normal leading-loose">
                    {notification.message}
                  </p>
                </div>

                {/* 関連リンクボタン */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <Link href="/notifications" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> 通知一覧へ戻る
                  </Link>

                  <Link href="/" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer">
                    ダッシュボードで詳細を確認 <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </main>
    </div>
  );
}
