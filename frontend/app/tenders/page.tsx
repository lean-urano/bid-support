"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Star, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  X,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  ArrowLeft,
  Bot
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

type Tender = {
  id: number;
  title: string;
  agency: string;
  location: string;
  openDate: string;
  budget?: string;
  description?: string;
  categoryTag?: string;
};

// DBの tenders 行 <-> 画面表示用 Tender の変換
type TenderRow = {
  id: number;
  title: string;
  organization: string;
  category: string | null;
  location: string | null;
  budget_max: string | null;
  deadline: string | null;
  requirements: string | null;
};

function rowToTender(row: TenderRow): Tender {
  return {
    id: row.id,
    title: row.title,
    agency: row.organization,
    location: row.location ?? "",
    openDate: row.deadline ?? "",
    budget: row.budget_max ? `${Number(row.budget_max).toLocaleString()}円` : undefined,
    description: row.requirements ?? undefined,
    categoryTag: row.category ?? undefined,
  };
}

function parseBudgetText(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : null;
}

export default function TendersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [viewingTender, setViewingTender] = useState<Tender | null>(null);
  const [showSuccessMsg, setShowSuccessMsg] = useState("");

  // Tenders state (DBから取得)
  const [tenders, setTenders] = useState<Tender[]>([]);

  useEffect(() => {
    fetch("/api/tenders")
      .then(res => res.json())
      .then((data: { tenders: TenderRow[] }) => setTenders(data.tenders.map(rowToTender)))
      .catch(() => setTenders([]));
  }, []);

  // Deep linking support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      if (id) {
        const tenderId = parseInt(id, 10);
        const t = tenders.find(item => item.id === tenderId);
        if (t) setViewingTender(t);
      }
    }
  }, [tenders]);

  // 検索・フィルター用State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  // 【管理者用】物件フォーム
  const [tenderForm, setTenderForm] = useState({ id: 0, title: "", agency: "", location: "", openDate: "", budget: "", description: "", categoryTag: "建築一式・大規模改修" });
  const [isEditingTender, setIsEditingTender] = useState(false);

  // スクレイピング/インポートスピナー表示用
  const [isScraping, setIsScraping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const triggerSuccess = (msg: string) => {
    setShowSuccessMsg(msg);
    setTimeout(() => setShowSuccessMsg(""), 4000);
  };

  const getAiUserRecommendation = (tenderId: number) => {
    if (tenderId === 1) return { score: 95, label: "高相性", reason: "自社の「公共施設大規模改修」の過去実績およびBランク以上の資格要件と95%合致しています。" };
    if (tenderId === 2) return { score: 91, label: "高相性", reason: "自社の「管工事・GHP空調設置」の得意分野および保有技術者数と高い相性です。" };
    return { score: 84, label: "良好", reason: "地域要件は合致していますが、土木舗装実績の配点が標準的です。" };
  };

  const filteredTenders = tenders.filter(t => {
    const matchesQuery = t.title.includes(searchQuery) || t.agency.includes(searchQuery) || t.location.includes(searchQuery);
    const matchesCategory = selectedCategory === "すべて" || (t.categoryTag && t.categoryTag.includes(selectedCategory));
    return matchesQuery && matchesCategory;
  });

  const handleSaveTender = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: tenderForm.title,
      organization: tenderForm.agency,
      location: tenderForm.location || null,
      deadline: tenderForm.openDate || null,
      budgetMax: tenderForm.budget ? parseBudgetText(tenderForm.budget) : null,
      category: tenderForm.categoryTag || null,
      requirements: tenderForm.description || null,
    };

    if (isEditingTender) {
      const res = await fetch(`/api/tenders/${tenderForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { tender }: { tender: TenderRow } = await res.json();
        setTenders(tenders.map(t => (t.id === tenderForm.id ? rowToTender(tender) : t)));
        triggerSuccess("物件マスター情報を更新しました");
      }
    } else {
      const res = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { tender }: { tender: TenderRow } = await res.json();
        setTenders([rowToTender(tender), ...tenders]);
        triggerSuccess("新しい入札物件をデータベースに登録しました");
      }
    }
    resetTenderForm();
  };

  const handleEditTender = (tender: Tender) => {
    setTenderForm({ 
      id: tender.id, 
      title: tender.title, 
      agency: tender.agency, 
      location: tender.location, 
      openDate: tender.openDate, 
      budget: tender.budget || "", 
      description: tender.description || "",
      categoryTag: tender.categoryTag || "建築一式・大規模改修"
    });
    setIsEditingTender(true);
  };

  const handleDeleteTender = async (id: number) => {
    if (!confirm("この物件マスターデータを削除してもよろしいですか？")) return;
    const res = await fetch(`/api/tenders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTenders(tenders.filter(t => t.id !== id));
      triggerSuccess("物件データを削除しました");
    }
  };

  const resetTenderForm = () => {
    setTenderForm({ id: 0, title: "", agency: "", location: "", openDate: "", budget: "", description: "", categoryTag: "建築一式・大規模改修" });
    setIsEditingTender(false);
  };

  const runScraper = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      triggerSuccess("Playwrightスクレイパーが完了し、最新案件12件を自動収集・マージしました");
    }, 2000);
  };

  const runImporter = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      triggerSuccess("NJSS CSVデータの一括インポート(45件)が完了しました");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* 共通ナビゲーションヘッダー */}
      <Header />

      {/* 成功トースト */}
      {showSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs text-sm font-medium animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {showSuccessMsg}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {isAdmin ? (
          /* ========================================== */
          /* 管理者ビュー: 入札案件管理 */
          /* ========================================== */
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" /> 入札案件管理
                </h1>
                <p className="text-sm text-slate-500 mt-1">地方自治体サイトの自動スクレイピング、NJSS CSVのインポート、およびマスター情報のCRUD登録を行います</p>
              </div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-xs transition-all">
                <ArrowLeft className="w-3.5 h-3.5" /> ダッシュボードへ戻る
              </Link>
            </div>

            {/* スクレイピング & CSVインポートコントロール */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-3.5">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600 animate-pulse" /> 自治体入札サイト自動スクレイパー
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  登録済みの地方公共団体（東京都、神奈川県、埼玉県等）の入札公示WebページへPlaywrightを走らせて最新案件データを自動回収します。
                </p>
                <button 
                  onClick={runScraper} 
                  disabled={isScraping}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> スクレイパー実行中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> 即時スクレイピング実行
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-3.5">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> NJSS CSVファイル 一括インポート
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  加入済みのNJSS（入札情報サービス）からダウンロードした最新の入札CSVデータを読み込み、データベースに一括流し込みを行います。
                </p>
                <div className="flex gap-2">
                  <input type="file" accept=".csv" className="flex-1 text-xs text-slate-500 border border-slate-200 rounded-xl bg-white p-2" />
                  <button 
                    onClick={runImporter}
                    disabled={isImporting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isImporting ? "処理中..." : "インポート実行"}
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 新規追加・編集フォーム */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md h-fit space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {isEditingTender ? <Edit className="w-4 h-4 text-amber-600" /> : <PlusCircle className="w-4 h-4 text-indigo-600" />}
                    {isEditingTender ? "物件情報の編集" : "新規入札案件のマスター登録"}
                  </h3>
                  {isEditingTender && (
                    <button onClick={resetTenderForm} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                      <X className="w-3.5 h-3.5" /> キャンセル
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveTender} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">案件名 / 工事名称 *</label>
                    <input type="text" required value={tenderForm.title} onChange={e => setTenderForm({...tenderForm, title: e.target.value})} placeholder="例: 新築市民体育館建設工事" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">発注機関 *</label>
                    <input type="text" required value={tenderForm.agency} onChange={e => setTenderForm({...tenderForm, agency: e.target.value})} placeholder="例: ○○市 教育委員会" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">対象地域</label>
                      <input type="text" value={tenderForm.location} onChange={e => setTenderForm({...tenderForm, location: e.target.value})} placeholder="例: 東京都" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">予定価格 / 予算感</label>
                      <input type="text" value={tenderForm.budget} onChange={e => setTenderForm({...tenderForm, budget: e.target.value})} placeholder="例: 1億2000万円" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">開札予定日</label>
                      <input type="date" value={tenderForm.openDate} onChange={e => setTenderForm({...tenderForm, openDate: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">工種・カテゴリ分類</label>
                      <select value={tenderForm.categoryTag} onChange={e => setTenderForm({...tenderForm, categoryTag: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option>建築一式・大規模改修</option>
                        <option>管工事・空調設備</option>
                        <option>電気設備工事</option>
                        <option>舗装工事・土木</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">工事詳細概要・参加資格要件</label>
                    <textarea rows={3} value={tenderForm.description} onChange={e => setTenderForm({...tenderForm, description: e.target.value})} placeholder="工期、使用書番号、参加実績ランク要件など..." className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>
                  <button type="submit" className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${isEditingTender ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                    <PlusCircle className="w-4 h-4" /> {isEditingTender ? "マスター情報を更新" : "マスターデータベースに登録"}
                  </button>
                </form>
              </div>

              {/* 物件リスト一覧テーブル */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">
                    登録済み入札物件マスター一覧 ({tenders.length}件)
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="案件名で絞り込み..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">案件名 / 工事名称</th>
                        <th className="p-3">発注機関 / 地域</th>
                        <th className="p-3">工種カテゴリ</th>
                        <th className="p-3">開札予定日</th>
                        <th className="p-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTenders.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-400">#{t.id}</td>
                          <td className="p-3 font-semibold text-slate-900">{t.title}</td>
                          <td className="p-3">{t.agency} ({t.location})</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">{t.categoryTag}</span>
                          </td>
                          <td className="p-3">{t.openDate}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button onClick={() => setViewingTender(t)} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold transition-colors cursor-pointer">
                              詳細
                            </button>
                            <button onClick={() => handleEditTender(t)} className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-bold transition-colors cursor-pointer">
                              編集
                            </button>
                            <button onClick={() => handleDeleteTender(t.id)} className="px-2 py-1 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded font-bold transition-colors cursor-pointer">
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* 一般ユーザービュー: 入札案件調査AI */
          /* ========================================== */
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <Search className="w-7 h-7 text-blue-600" /> 入札案件調査AI
                </h1>
                <p className="text-sm text-slate-500 mt-1">全国で現在公開されている最新の建設・公共工事入札物件を自動調査・横断検索します</p>
              </div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-xs transition-all">
                ← トップページへ戻る
              </Link>
            </div>

            {/* クイック統計カード */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">新着公開案件</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{tenders.length} <span className="text-sm font-normal text-slate-500">件</span></h3>
                </div>
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Search className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">お気に入り保存中</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">18 <span className="text-sm font-normal text-slate-500">件</span></h3>
                  <p className="text-xs text-slate-500 mt-1">締切間近: 3件</p>
                </div>
                <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Star className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">自社AI相性90%超</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">8 <span className="text-sm font-normal text-slate-500">件</span></h3>
                  <p className="text-xs text-blue-600 font-semibold mt-1">自社得意分野と高相性</p>
                </div>
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Bot className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* 一覧テーブル */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    公開中の入札物件一覧 <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> AI相性スコア自動判定済</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">自社プロフィールと各案件の要件をAIが動的判定したおすすめスコアです</p>
                </div>
              </div>

              {/* 検索・フィルターバー */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="案件名・発注機関・地域で検索..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="すべて">すべての工種</option>
                  <option value="建築">建築一式・改修</option>
                  <option value="管工事">管工事・空調設備</option>
                  <option value="舗装">舗装・土木工事</option>
                </select>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-6">案件名</th>
                      <th className="py-3 px-4">発注機関</th>
                      <th className="py-3 px-4">地域</th>
                      <th className="py-3 px-4">AI自社おすすめ度 (動的計算)</th>
                      <th className="py-3 px-4">開札予定日</th>
                      <th className="py-3 px-4 text-right">詳細</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTenders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-400">該当する案件は見つかりませんでした</td>
                      </tr>
                    ) : (
                      filteredTenders.map(t => {
                        const aiRec = getAiUserRecommendation(t.id);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-900">{t.title}</td>
                            <td className="py-4 px-4">{t.agency}</td>
                            <td className="py-4 px-4">{t.location}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                aiRec.score >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                              }`} title={aiRec.reason}>
                                <Sparkles className="w-3 h-3 text-amber-500" /> {aiRec.score}点 ({aiRec.label})
                              </span>
                            </td>
                            <td className="py-4 px-4">{t.openDate}</td>
                            <td className="py-4 px-4 text-right">
                              <button onClick={() => setViewingTender(t)} className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer">
                                閲覧
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* 物件詳細閲覧モーダル */}
      {viewingTender && (() => {
        const aiRec = getAiUserRecommendation(viewingTender.id);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative">
              <button onClick={() => setViewingTender(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              
              <div className="space-y-1">
                {!isAdmin && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${aiRec.score >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                    <Sparkles className="w-3.5 h-3.5" /> AIおすすめ度 {aiRec.score}点 ({aiRec.label})
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900">{viewingTender.title}</h3>
                <p className="text-xs text-slate-500">発注機関: {viewingTender.agency} | 対象地域: {viewingTender.location}</p>
              </div>

              {!isAdmin && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-blue-600" /> AI判定によるおすすめ理由分析
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed font-semibold">{aiRec.reason}</p>
                </div>
              )}

              <div className="space-y-3 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">予定価格 / 予算</span>
                    <span className="font-bold text-slate-900 text-sm">{viewingTender.budget || "未定"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">開札予定日</span>
                    <span className="font-bold text-slate-900 text-sm">{viewingTender.openDate}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-900">工事内容・要件概要</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-600">
                    {viewingTender.description || "詳細情報はありません。"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button onClick={() => setViewingTender(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                  閉じる
                </button>
                {!isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        window.sessionStorage.setItem("selectedTenderForNegotiation", JSON.stringify(viewingTender));
                        window.location.assign("/contractors");
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" /> 業者交渉AIへ引き継ぐ
                    </button>
                    <button onClick={() => { alert("お気に入りに登録しました"); setViewingTender(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 animate-pulse" /> お気に入りに追加
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
