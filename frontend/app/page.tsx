"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  Bot, 
  Search, 
  ShieldCheck, 
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* 共通ナビゲーションヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {isAdmin ? (
          /* ========================================== */
          /* 管理者ダッシュボード */
          /* ========================================== */
          <div className="space-y-8 animate-fade-in">
            {/* 管理者用バナー */}
            <section className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Building2 className="w-96 h-96 text-white" />
              </div>
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> システム管理者権限でログイン中
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  管理者ダッシュボード
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  入札案件マスターの自動スクレイピング、協力業者リスト管理、および秘書AIが参照するRAG知識の学習を一括コントロールします。
                </p>
              </div>
            </section>

            {/* 管理メニュー */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                管理メニュー
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/tenders" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/tender-research-ai.png" alt="入札案件を調査するAIのイメージ" />
                  <div className="p-6 pt-5 flex flex-1 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">1. 入札案件調査AI管理</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      自治体サイトの自動スクレイピング、NJSS CSVデータの取り込み、および入札案件マスター情報の追加・編集を行います。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-indigo-600">
                    入札案件調査AI管理を開く <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </div>
                </Link>

                <Link href="/contractors" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/contractor-negotiation-online-ai.png" alt="オンライン業者検索・交渉を支援するAIのイメージ" />
                  <div className="p-6 pt-5 flex flex-1 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">2. 下請け・業者交渉AI管理</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      業者情報の自動収集、業者マスターの追加・編集、および交渉打診自動マッチング用AI知識の登録管理を行います。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-amber-700">
                    下請け・業者交渉AI管理を開く <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </div>
                </Link>

                <Link href="/ai-assistant" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/legal-consultation-ai.png" alt="秘書AIのイメージ" />
                  <div className="p-6 pt-5 flex flex-1 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">3. 秘書AI管理</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      秘書AIが回答および契約雛形生成で参照する仕様基準、過去判例、各種約款などの学習(RAG)登録管理を行います。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-indigo-600">
                    秘書AI管理を開く <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        ) : (
          /* ========================================== */
          /* 一般ユーザーダッシュボード */
          /* ========================================== */
          <div className="space-y-8 animate-fade-in">
            {/* 一般ユーザー用バナー */}
            <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Building2 className="w-96 h-96 text-white" />
              </div>
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> 建設業者向け 入札情報ダッシュボード
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  入札案件の自動収集から<br />AIおすすめ評価・契約書補助まで一元管理
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  全国の最新入札データをリアルタイムに自動統合。自社実績・適性に最適な公共工事案件をAIが自動スコアリングします。
                </p>
              </div>
            </section>

            {/* 主要機能 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                ３つの機能
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/tenders" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/tender-research-ai.png" alt="入札案件を調査するAIのイメージ" />
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

                <Link href="/ai-assistant" className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group">
                  <FeatureThumbnail src="/images/features/legal-consultation-ai.png" alt="秘書AIのイメージ" />
                  <div className="p-6 pt-5 flex flex-1 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">秘書AI</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      建築専門知識RAGナレッジ相談および契約書雛形作成。※生成された法務書類は弁護士の最終確認が必須です。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-emerald-600">
                    秘書AIに相談する <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        )}
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
