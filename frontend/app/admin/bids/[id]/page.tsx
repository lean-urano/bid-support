"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

type Bid = { id: number; title: string; organization: string; category: string | null; location: string | null; deadline: string | null; announced_date: string | null; budget_min: string | null; budget_max: string | null; requirements: string | null; detail_url: string | null; source: string; created_at: string };

export default function AdminBidDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [bid, setBid] = useState<Bid | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { params.then(({ id }) => fetch(`/api/bids/${id}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error("案件が見つかりません。"); setBid(data.bid); }).catch((cause) => setError(cause instanceof Error ? cause.message : "読み込みに失敗しました。"))); }, [params]);
  if (error) return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10"><Link href="/admin/bids" className="text-sm font-semibold text-indigo-700 hover:underline">案件マスターへ戻る</Link><p className="mt-8 text-sm text-red-700">{error}</p></main>;
  if (!bid) return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10"><p className="text-sm text-slate-500">案件情報を読み込んでいます…</p></main>;
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10"><Link href="/admin/bids" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />案件マスター</Link><div className="mt-6 border-b border-slate-200 pb-6"><p className="text-xs font-bold tracking-[0.16em] text-indigo-600">BID DETAIL</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{bid.title}</h1><p className="mt-2 text-sm text-slate-500">案件ID #{bid.id} ・ {bid.source === "scraping" ? "自治体収集" : bid.source === "njss_csv" ? "NJSS CSV" : "手動登録"}</p></div><section className="mt-6 border border-slate-200 bg-white"><div className="grid sm:grid-cols-2"><Detail label="発注機関" value={bid.organization} /><Detail label="対象地域" value={bid.location || "未設定"} /><Detail label="工種" value={bid.category || "未分類"} /><Detail label="開札予定日" value={bid.deadline || "未設定"} /><Detail label="公告日" value={bid.announced_date || "未設定"} /><Detail label="予定価格" value={bid.budget_max ? `${Number(bid.budget_max).toLocaleString()}円` : "未設定"} /></div><div className="border-t border-slate-200 px-5 py-5"><p className="text-xs font-bold text-slate-500">工事内容・参加資格要件</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{bid.requirements || "詳細情報はありません。"}</p></div>{bid.detail_url && <div className="border-t border-slate-200 px-5 py-4"><a href={bid.detail_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline">収集元の詳細ページを開く <ExternalLink className="h-4 w-4" /></a></div>}</section></main>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="border-b border-r border-slate-200 px-5 py-4 last:border-r-0"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-slate-900">{value}</p></div>; }
