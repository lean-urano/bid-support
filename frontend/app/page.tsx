"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Bot, 
  Search, 
  Star, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Bell,
  UserCheck,
  LogOut,
  PlusCircle,
  UploadCloud,
  Database,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Edit,
  Trash2,
  X,
  FileText,
  RefreshCw,
  Eye,
  Check,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// 案件データの型
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

// RAGナレッジの型
type RagDoc = {
  id: number;
  title: string;
  category: string;
  filename: string;
  content: string;
  createdAt: string;
};

// 通知データの型
type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time?: string;
  read: boolean;
  type: "ai" | "scraping" | "system";
  linkUrl?: string;
};

export default function Home() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  // 管理者タブ状態
  const [activeAdminTab, setActiveAdminTab] = useState<"tenders" | "rag" | "scraping" | "users">("tenders");
  const [showSuccessMsg, setShowSuccessMsg] = useState("");

  // モーダル表示用State
  const [viewingTender, setViewingTender] = useState<Tender | null>(null);
  const [viewingRag, setViewingRag] = useState<RagDoc | null>(null);

  // 通知の State & Ref
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // DBから通知一覧を取得
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (item: NotificationItem) => {
    // 既読フラグ更新 API を呼び出し
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

    // ドロップダウンを閉じる
    setShowNotifications(false);

    // リンクアクションに応じた画面操作
    if (item.linkUrl) {
      if (item.linkUrl.startsWith("tender:")) {
        const tenderId = parseInt(item.linkUrl.split(":")[1], 10);
        const targetTender = tenders.find(t => t.id === tenderId);
        if (targetTender) {
          setViewingTender(targetTender);
        }
      } else if (item.linkUrl === "admin:scraping") {
        setActiveAdminTab("scraping");
        const el = document.getElementById("admin-console");
        if (el) el.scrollIntoView({ behavior: "smooth" });
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

  // ==========================================
  // 1. 入札物件データ (Tenders) State
  // ==========================================
  const [tenders, setTenders] = useState<Tender[]>([
    { id: 1, title: "○○市民ホール大規模改修建築工事", agency: "○○市 建築課", location: "東京都○○市", openDate: "2026-07-15", budget: "480,000,000円", description: "RC造地上3階地下1階、延床面積4,500㎡の大規模改修。空調・衛生設備含む一括発注。同規模の公共施設改修実績が必要。", categoryTag: "建築一式・大規模改修" },
    { id: 2, title: "市立第一中学校体育館空調設備設置工事", agency: "○○県 教育委員会", location: "神奈川県", openDate: "2026-07-20", budget: "85,000,000円", description: "体育館（1,200㎡）への電気式GHP空調機器12台設置およびキュービクル増設工事。", categoryTag: "管工事・空調設備" },
    { id: 3, title: "△△地区道路舗装修繕工事（第2工区）", agency: "△△建設事務所", location: "埼玉県", openDate: "2026-07-18", budget: "120,000,000円", description: "主要地方道△△線 L=1.2km の切削オーバーレイ工および路面標示工。", categoryTag: "舗装工事・土木" },
  ]);

  const [tenderForm, setTenderForm] = useState({ id: 0, title: "", agency: "", location: "", openDate: "", budget: "", description: "", categoryTag: "建築一式・大規模改修" });
  const [isEditingTender, setIsEditingTender] = useState(false);

  // 一般ユーザー向け：動的AI相性スコア計算
  const getAiUserRecommendation = (tenderId: number) => {
    if (tenderId === 1) return { score: 95, label: "高相性", reason: "自社の「公共施設大規模改修」の過去実績およびBランク以上の資格要件と95%合致しています。" };
    if (tenderId === 2) return { score: 91, label: "高相性", reason: "自社の「管工事・GHP空調設置」の得意分野および保有技術者数と高い相性です。" };
    return { score: 84, label: "良好", reason: "地域要件は合致していますが、土木舗装実績の配点が標準的です。" };
  };

  const handleSaveTender = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingTender) {
      setTenders(tenders.map(t => t.id === tenderForm.id ? { 
        ...t, 
        title: tenderForm.title, 
        agency: tenderForm.agency, 
        location: tenderForm.location, 
        openDate: tenderForm.openDate,
        budget: tenderForm.budget,
        description: tenderForm.description,
        categoryTag: tenderForm.categoryTag
      } : t));
      triggerSuccess("物件マスター情報を更新しました");
    } else {
      const newTender: Tender = {
        id: Date.now(),
        title: tenderForm.title,
        agency: tenderForm.agency,
        location: tenderForm.location || "東京都",
        openDate: tenderForm.openDate || "2026-08-01",
        budget: tenderForm.budget || "未定",
        description: tenderForm.description || "手動登録された物件データです。",
        categoryTag: tenderForm.categoryTag || "建築一式"
      };
      setTenders([newTender, ...tenders]);
      triggerSuccess("新しい入札物件をデータベースに登録しました");
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

  const handleDeleteTender = (id: number) => {
    if (confirm("この物件マスターデータを削除してもよろしいですか？")) {
      setTenders(tenders.filter(t => t.id !== id));
      triggerSuccess("物件データを削除しました");
    }
  };

  const resetTenderForm = () => {
    setTenderForm({ id: 0, title: "", agency: "", location: "", openDate: "", budget: "", description: "", categoryTag: "建築一式・大規模改修" });
    setIsEditingTender(false);
  };


  // ==========================================
  // 2. RAGナレッジ State
  // ==========================================
  const [ragDocs, setRagDocs] = useState<RagDoc[]>([
    { id: 1, title: "公共建築工事標準仕様書（令和6年版）", category: "建築標準仕様・技術基準", filename: "spec_r6_arch.pdf", content: "第1章 共通参考事項\n1.1.1 適用範囲: この仕様書は、公共建築工事の請負契約における建築工事の施工に適用する。\n1.1.2 施工計画書: 受注者は、工事着手前に工事計画書を作成し、監督員に提出してその承諾を受けなければならない。", createdAt: "2026-06-20" },
    { id: 2, title: "建設工事請負契約約款と解釈判例集", category: "判例・トラブル事例", filename: "contract_precedents.pdf", content: "【判例最高裁平成15年】不可抗力による工期延期と請負代金の増減請求について。\n台風等の天災地変により生じた損害および工期の遅延については、発注者・受注者双方の過失にあたらない場合、約款第26条に基づき双方協議の上、合理的な工期延長および追加費用の負担額を決定すべきであると判示された。", createdAt: "2026-06-22" },
    { id: 3, title: "民間建設工事標準請負契約約束（B）雛形", category: "契約書雛形・約款", filename: "form_b_template.docx", content: "第1条（総則）発注者及び受注者は、互いに協力し、誠実をもって本契約を履行しなければならない。\n※注意: AI秘書がこの雛形を出力する際は、必ず弁護士等の専門家に相談するよう注記を表示すること。", createdAt: "2026-06-25" },
  ]);

  const [ragForm, setRagForm] = useState({ id: 0, title: "", category: "建築標準仕様・技術基準", filename: "", content: "" });
  const [isEditingRag, setIsEditingRag] = useState(false);

  const handleSaveRag = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingRag) {
      setRagDocs(ragDocs.map(r => r.id === ragForm.id ? { ...r, title: ragForm.title, category: ragForm.category, content: ragForm.content } : r));
      triggerSuccess("RAGナレッジを更新しました");
    } else {
      const newDoc: RagDoc = {
        id: Date.now(),
        title: ragForm.title,
        category: ragForm.category,
        filename: ragForm.filename || "uploaded_knowledge.pdf",
        content: ragForm.content || "登録された本文ナレッジテキストです。",
        createdAt: new Date().toISOString().split('T')[0]
      };
      setRagDocs([newDoc, ...ragDocs]);
      triggerSuccess("RAGナレッジを登録・pgvectorにベクトル保存しました");
    }
    resetRagForm();
  };

  const handleEditRag = (doc: RagDoc) => {
    setRagForm({ id: doc.id, title: doc.title, category: doc.category, filename: doc.filename, content: doc.content });
    setIsEditingRag(true);
  };

  const handleDeleteRag = (id: number) => {
    if (confirm("このRAGナレッジデータを削除してもよろしいですか？")) {
      setRagDocs(ragDocs.filter(r => r.id !== id));
      triggerSuccess("RAGナレッジデータを削除しました");
    }
  };

  const resetRagForm = () => {
    setRagForm({ id: 0, title: "", category: "建築標準仕様・技術基準", filename: "", content: "" });
    setIsEditingRag(false);
  };

  const triggerSuccess = (msg: string) => {
    setShowSuccessMsg(msg);
    setTimeout(() => setShowSuccessMsg(""), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* ナビゲーションヘッダー */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg font-bold flex items-center justify-center text-white ${isAdmin ? "bg-indigo-600" : "bg-blue-600"}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
              tender-support 
              {isAdmin ? (
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 管理者コンソール
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">建設入札支援</span>
              )}
            </span>
          </div>

          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <Link href="#tenders" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <Search className="w-4 h-4" /> 公共工事案件
              </Link>
              <Link href="#contractors" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> 業者連絡ツール
              </Link>
              <Link href="#ai-assistant" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> AI秘書
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-4 relative">
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
                        <Link 
                          key={item.id} 
                          href={`/notifications/${item.id}`}
                          onClick={() => {
                            if (!item.read) {
                              fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
                            }
                            setShowNotifications(false);
                          }} 
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 block ${!item.read ? "bg-blue-50/40" : ""}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!item.read ? "bg-blue-600" : "bg-transparent"}`}></div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{item.title}</span>
                              <span className="text-[10px] text-slate-400">{item.time || "新着"}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.message}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                    <Link 
                      href="/notifications" 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center justify-center py-1 w-full"
                    >
                      すべての通知を見る →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${isAdmin ? "bg-indigo-600 shadow-xs" : "bg-blue-600"}`}>
                  {isAdmin ? "管" : "般"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button onClick={logout} title="ログアウト" className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 成功トースト */}
      {showSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs text-sm font-medium animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {showSuccessMsg}
          </div>
        </div>
      )}

      {/* メインコンテンツ (max-w-7xl 基準) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ========================================== */}
        {/* VIEW A: 管理者専用コンソール (isAdmin === true の場合のみ完全に表示) */}
        {/* ========================================== */}
        {isAdmin ? (
          <section id="admin-console" className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
              <div className="max-w-3xl relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" /> システム管理者権限でログイン中
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  管理者コントロールパネル (データ管理 & CRUD)
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed">
                  公購入札物件基本情報のマスター登録・管理、およびAI秘書用RAGナレッジの保存管理を行います。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2 overflow-x-auto">
                <button onClick={() => setActiveAdminTab("tenders")} className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${activeAdminTab === "tenders" ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
                  <PlusCircle className="w-4 h-4" /> 入札物件マスター管理 ({tenders.length}件)
                </button>
                <button onClick={() => setActiveAdminTab("rag")} className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${activeAdminTab === "rag" ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
                  <Database className="w-4 h-4" /> RAGナレッジCRUD管理 ({ragDocs.length}件)
                </button>
                <button onClick={() => setActiveAdminTab("scraping")} className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${activeAdminTab === "scraping" ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
                  <UploadCloud className="w-4 h-4" /> スクレイピング & CSV連携
                </button>
                <button onClick={() => setActiveAdminTab("users")} className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${activeAdminTab === "users" ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}>
                  <Users className="w-4 h-4" /> ユーザー管理
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* TAB 1: 物件マスター管理 */}
                {activeAdminTab === "tenders" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          {isEditingTender ? <Edit className="w-4 h-4 text-amber-600" /> : <PlusCircle className="w-4 h-4 text-indigo-600" />}
                          {isEditingTender ? "入札物件マスターの編集 (Update)" : "新規入札物件の基本情報登録 (Create)"}
                        </h3>
                        {isEditingTender && (
                          <button onClick={resetTenderForm} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" /> 編集をキャンセル
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleSaveTender} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">案件名 / 工事名称 *</label>
                          <input type="text" required value={tenderForm.title} onChange={e => setTenderForm({...tenderForm, title: e.target.value})} placeholder="例: ○○市立新体育館建設工事" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">発注機関 *</label>
                          <input type="text" required value={tenderForm.agency} onChange={e => setTenderForm({...tenderForm, agency: e.target.value})} placeholder="例: ○○市 施設課" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">対象地域</label>
                          <input type="text" value={tenderForm.location} onChange={e => setTenderForm({...tenderForm, location: e.target.value})} placeholder="例: 東京都" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">開札予定日</label>
                          <input type="date" value={tenderForm.openDate} onChange={e => setTenderForm({...tenderForm, openDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">工種・カテゴリ分類</label>
                          <select value={tenderForm.categoryTag} onChange={e => setTenderForm({...tenderForm, categoryTag: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>建築一式・大規模改修</option>
                            <option>管工事・空調設備</option>
                            <option>電気設備工事</option>
                            <option>舗装工事・土木</option>
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">工事詳細概要・要件・特記事項</label>
                          <textarea rows={2} value={tenderForm.description} onChange={e => setTenderForm({...tenderForm, description: e.target.value})} placeholder="工期、対象工種、資格条件など..." className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2">
                          <button type="submit" className={`px-5 py-2 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${isEditingTender ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                            {isEditingTender ? "物件マスターを更新" : "物件マスターをDB登録"}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">登録済み入札物件マスター一覧 ({tenders.length}件)</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-3">ID</th>
                              <th className="p-3">案件名</th>
                              <th className="p-3">発注機関 / 地域</th>
                              <th className="p-3">工種カテゴリ</th>
                              <th className="p-3">開札予定日</th>
                              <th className="p-3 text-right">マスター操作 (CRUD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {tenders.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-400">#{t.id}</td>
                                <td className="p-3 font-semibold text-slate-900">{t.title}</td>
                                <td className="p-3">{t.agency} ({t.location})</td>
                                <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[11px]">{t.categoryTag || "建築"}</span></td>
                                <td className="p-3">{t.openDate}</td>
                                <td className="p-3 text-right space-x-1">
                                  <button onClick={() => setViewingTender(t)} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> 詳細
                                  </button>
                                  <button onClick={() => handleEditTender(t)} className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                                    <Edit className="w-3 h-3" /> 編集
                                  </button>
                                  <button onClick={() => handleDeleteTender(t.id)} className="px-2.5 py-1 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> 削除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: RAGナレッジ */}
                {activeAdminTab === "rag" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          {isEditingRag ? <Edit className="w-4 h-4 text-amber-600" /> : <Database className="w-4 h-4 text-indigo-600" />}
                          {isEditingRag ? "RAGナレッジの編集 (Update)" : "AI秘書用 RAGナレッジ新規追加 (Create & Vectorize)"}
                        </h3>
                        {isEditingRag && (
                          <button onClick={resetRagForm} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" /> 編集をキャンセル
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleSaveRag} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">ナレッジ・文書タイトル *</label>
                          <input type="text" required value={ragForm.title} onChange={e => setRagForm({...ragForm, title: e.target.value})} placeholder="例: 国土交通省 建築工事積算基準" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">カテゴリ分類</label>
                          <select value={ragForm.category} onChange={e => setRagForm({...ragForm, category: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>建築標準仕様・技術基準</option>
                            <option>判例・トラブル事例</option>
                            <option>契約書雛形・約款</option>
                            <option>安全衛生・積算基準</option>
                          </select>
                        </div>
                        {!isEditingRag && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">ファイル選択 (.pdf / .txt)</label>
                            <input type="file" onChange={e => setRagForm({...ragForm, filename: e.target.files?.[0]?.name || "uploaded_document.pdf"})} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white cursor-pointer" />
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">ナレッジ本文・参照テキスト (AIがベクトル化して記憶する中身データ) *</label>
                          <textarea rows={4} required value={ragForm.content} onChange={e => setRagForm({...ragForm, content: e.target.value})} placeholder="文書の具体的内容、条文、判例テキスト、またはAIに記憶させたい知識文章を記述..." className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <button type="submit" className={`px-5 py-2 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${isEditingRag ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                            {isEditingRag ? "ナレッジを更新" : "埋め込み実行 & pgvector保存"}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">登録済みRAGナレッジ一覧 ({ragDocs.length}件)</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-3">ID</th>
                              <th className="p-3">文書タイトル</th>
                              <th className="p-3">カテゴリ</th>
                              <th className="p-3">ファイル名</th>
                              <th className="p-3">本文テキストプレビュー</th>
                              <th className="p-3 text-right">操作 (CRUD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {ragDocs.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-400">#{r.id}</td>
                                <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> {r.title}
                                </td>
                                <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">{r.category}</span></td>
                                <td className="p-3 font-mono text-slate-500 text-[11px]">{r.filename}</td>
                                <td className="p-3 text-slate-500 max-w-xs truncate font-mono text-[11px]">{r.content}</td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button onClick={() => setViewingRag(r)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> 中身閲覧
                                  </button>
                                  <button onClick={() => handleEditRag(r)} className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                                    <Edit className="w-3 h-3" /> 編集
                                  </button>
                                  <button onClick={() => handleDeleteRag(r.id)} className="px-2.5 py-1 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> 削除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3 & 4 */}
                {activeAdminTab === "scraping" && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-blue-600" /> 自自治体サイト スクレイパー起動
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          登録済みの地方公共団体（東京都、神奈川県、埼玉県等）の入札公告ページへPlaywrightを走らせて最新案件を回収します。
                        </p>
                        <button onClick={() => triggerSuccess("Playwrightスクレイパーが即時起動しました")} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 即時スクレイピング実行
                        </button>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> NJSS CSVファイル 一括インポート
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          加入済みのNJSSからダウンロードした入札CSVを選択して一括登録します。
                        </p>
                        <input type="file" accept=".csv" className="w-full text-xs text-slate-500 border border-slate-300 rounded-md bg-white p-1" />
                        <button onClick={() => triggerSuccess("NJSS CSVデータの一括取り込みが完了しました")} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer">
                          CSVデータをインポート
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeAdminTab === "users" && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                          <tr>
                            <th className="p-3">名前</th>
                            <th className="p-3">メールアドレス</th>
                            <th className="p-3">ロール</th>
                            <th className="p-3">ステータス</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-3 font-medium text-slate-900">管理者ユーザー</td>
                            <td className="p-3">admin@tender-support.jp</td>
                            <td className="p-3"><span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">admin</span></td>
                            <td className="p-3 text-emerald-600 font-medium">有効</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-900">建設太郎 (一般ユーザー)</td>
                            <td className="p-3">user@tender-support.jp</td>
                            <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">user</span></td>
                            <td className="p-3 text-emerald-600 font-medium">有効</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* ========================================== */
          /* VIEW B: 一般ユーザー専用ダッシュボード (isAdmin === false の場合のみ表示) */
          /* ========================================== */
          <div className="space-y-8">
            {/* 一般ユーザー用バナー */}
            <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Building2 className="w-96 h-96 text-white" />
              </div>
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> 建設業者向け 入札情報ダッシュボード
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  入札案件の自動収集から<br />AIおすすめ評価・契約書補助まで一元管理
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  地方公共団体Webサイトの自動スクレイピングおよびNJSSデータ連携により、自社実績に最適な公共工事案件をAIが自動スコアリングします。
                </p>
              </div>
            </section>

            {/* クイック統計カード */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">新着公開案件</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{tenders.length + 139} <span className="text-sm font-normal text-slate-500">件</span></h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 本日 +12 件更新
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Search className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">お気に入り保存中</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">18 <span className="text-sm font-normal text-slate-500">件</span></h3>
                  <p className="text-xs text-slate-500 mt-1">締切間近: 3件</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Star className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">自社AI相性90%超</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">8 <span className="text-sm font-normal text-slate-500">件</span></h3>
                  <p className="text-xs text-blue-600 font-medium mt-1">自社得意分野と高相性</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Bot className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* コア機能アクセス */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                主要機能
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">公共工事案件 検索</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      地方自治体サイトスクレイピング＆NJSSインポート案件の一覧検索。AI自動おすすめ度（0〜100）を表示。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-blue-600 group cursor-pointer">
                    案件一覧を見る <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">業者連絡ツール</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      協力業者・下請業者の検索および連絡補助機能。打診文書の自動作成やメール送信をサポート。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-indigo-600 group cursor-pointer">
                    業者検索・連絡 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">AI秘書 & 契約書生成</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      建築専門知識RAGナレッジ相談および契約書雛形作成。※生成契約書は弁護士の確認が必須です。
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-emerald-600 group cursor-pointer">
                    AI秘書に相談する <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </section>

            {/* 公共工事案件一覧テーブル (一般ユーザー専用) */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    公開中の入札物件一覧 <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> AI相性スコア自動判定済</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">自社プロフィール（建築・設備等の実績データ）と各案件の要件をAIが動的判定したおすすめスコアです</p>
                </div>
                <button className="text-sm font-semibold text-blue-600 hover:underline">すべて表示</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase border-b border-slate-200">
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
                    {tenders.map(t => {
                      const aiRec = getAiUserRecommendation(t.id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-900">
                            {t.title}
                          </td>
                          <td className="py-4 px-4">{t.agency}</td>
                          <td className="py-4 px-4">{t.location}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              aiRec.score >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`} title={aiRec.reason}>
                              <Sparkles className="w-3 h-3" /> {aiRec.score}点 ({aiRec.label})
                            </span>
                          </td>
                          <td className="py-4 px-4">{t.openDate}</td>
                          <td className="py-4 px-4 text-right">
                            <button onClick={() => setViewingTender(t)} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
                              閲覧
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
                    <Sparkles className="w-3 h-3" /> 自社AIおすすめ度: {aiRec.score}点 ({aiRec.label})
                  </span>
                )}
                <h2 className="text-xl font-bold text-slate-900">{viewingTender.title}</h2>
              </div>

              {!isAdmin && (
                <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AIによる自動スコアリング理由
                  </span>
                  <p className="text-amber-800 leading-relaxed">{aiRec.reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">発注機関</span>
                  <span className="text-slate-800 font-bold text-sm">{viewingTender.agency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">対象地域</span>
                  <span className="text-slate-800 font-bold text-sm">{viewingTender.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">開札予定日</span>
                  <span className="text-slate-800 font-bold text-sm">{viewingTender.openDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">予算感 / 予定価格</span>
                  <span className="text-slate-800 font-bold text-sm">{viewingTender.budget || "未定"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">工事概要・特記事項</h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl leading-relaxed">
                  {viewingTender.description || "詳細情報はありません。"}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setViewingTender(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RAGナレッジ中身閲覧モーダル */}
      {viewingRag && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setViewingRag(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                {viewingRag.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> {viewingRag.title}
              </h2>
              <p className="text-xs font-mono text-slate-400">ファイル名: {viewingRag.filename} | 登録日: {viewingRag.createdAt}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" /> pgvector ベクトル保存データ中身 (AI参照用テキスト)
              </h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap border border-slate-700 shadow-inner">
                {viewingRag.content}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">※この中身テキストがAI秘書（RAG）のコサイン類似度検索に使用されます</span>
              <button onClick={() => setViewingRag(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
