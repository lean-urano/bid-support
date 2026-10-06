"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Search,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

export default function Home() {
  useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* 共通ナビゲーションヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="space-y-8 animate-fade-in">
            {/* 一般ユーザー用バナー */}
            <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Building2 className="w-96 h-96 text-white" />
              </div>
              <div className="relative z-10 w-full">
                <h1 className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> 建設業者向け 入札情報ダッシュボード
                </h1>
              </div>
            </section>

            {/* 企業情報入力 */}
            <section>
              <Link
                href="/company-profile"
                className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all p-6 group"
              >
                <div className="w-10 h-10 shrink-0 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">企業情報入力</h2>
                  <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">
                    自社の基本情報・保有資格・工事実績を登録します。書類をアップロードするとAIが内容を読み取り、AIおすすめ度の精度を高めます。
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all" />
              </Link>
            </section>

            {/* 主要機能 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                ２つの機能
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/bids" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/bid-research-ai.png" alt="入札案件を調査するAIのイメージ" />
                  <div className="p-6 pt-5 flex flex-1 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">入札案件調査AI</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      全国の最新公共工事案件をリアルタイム横断検索。自社実績・適性に合わせたAIおすすめ度を瞬時に算出・表示。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-blue-600">
                    案件調査を開始する <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </div>
                </Link>

                <Link href="/contractors" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/contractor-negotiation-online-ai.png" alt="オンライン業者検索・交渉を支援するAIのイメージ" />
                  <div className="p-6 pt-5 flex flex-1 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">下請け・業者交渉AI</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      協力業者・下請業者の検索および交渉連絡補助。AIによる最適な打診交渉文書の自動作成やメール送信をサポート。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-amber-700">
                    業者交渉を開始する <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </div>
                </Link>

              </div>
            </section>
        </div>
      </main>
    </div>
  );
}

function FeatureThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-video overflow-hidden bg-slate-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}
