"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Bot, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Check, 
  ArrowRight, 
  ChevronRight, 
  FileText, 
  Plus, 
  MapPin, 
  Briefcase, 
  Copy, 
  Mail, 
  Send, 
  Loader2, 
  ArrowLeft, 
  PlusCircle, 
  Edit,
  Database,
  RefreshCw,
  Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

// 業者の型定義
type Contractor = {
  id: string | number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  specialties: string[];
  isCustom?: boolean;
  url?: string;
};

// 業者個別RAGナレッジの型定義
type ContractorRag = {
  id: number;
  title: string;
  contractorId: number | string;
  category: string;
  filename: string;
  content: string;
};

type SelectedTender = {
  id: number;
  title: string;
  agency: string;
  location: string;
  openDate: string;
  budget?: string;
  description?: string;
  categoryTag?: string;
};

const DEFAULT_SELECTED_TENDER: SelectedTender = {
  id: 1,
  title: "○○市民ホール大規模改修建築工事",
  agency: "○○市 建築課",
  location: "東京都○○市",
  openDate: "2026-07-15",
  budget: "480,000,000円",
  description: "RC造地上3階地下1階、延床面積4,500㎡の大規模改修。空調・衛生設備含む一括発注。同規模の公共施設改修実績が必要。",
  categoryTag: "建築一式・大規模改修",
};

export default function ContractorsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [toastMsg, setToastMsg] = useState("");
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ==========================================
  // 【共通】業者データ状態管理
  // ==========================================
  const [contractors, setContractors] = useState<Contractor[]>([
    { id: 1, name: "山下建設株式会社", address: "東京都新宿区西新宿1-1-1", phone: "03-1234-5678", email: "info@yamashita-const.co.jp", specialties: ["建築一式", "内装仕上"] },
    { id: 2, name: "佐藤空調設備有限会社", address: "神奈川県横浜市中区桜木町2-2-2", phone: "045-234-5678", email: "contact@sato-hvac.jp", specialties: ["管工事・空調設備"] },
    { id: 3, name: "鈴木電気工事株式会社", address: "埼玉県さいたま市大宮区桜木町3-3-3", phone: "048-345-6789", email: "support@suzuki-denki.com", specialties: ["電気設備工事"] },
    { id: 4, name: "田中土木工業株式会社", address: "千葉県千葉市中央区栄町4-4-4", phone: "043-456-7890", email: "sales@tanaka-doboku.co.jp", specialties: ["土木工事"] },
    { id: 5, name: "高橋内装デザイン", address: "東京都渋谷区神宮前5-5-5", phone: "03-8765-4321", email: "hello@takahashi-interiors.jp", specialties: ["内装仕上"] },
    { id: 6, name: "渡辺配管工業", address: "神奈川県川崎市川崎区本町1-2-3", phone: "044-987-6543", email: "pipe@watanabe-plumbing.jp", specialties: ["管工事・空調設備"] },
  ]);

  // ==========================================
  // 【管理者用】業者連絡管理 (Scraping/CRUD/Embedding)
  // ==========================================
  const [isScraping, setIsScraping] = useState(false);
  
  // 業者登録用フォームState
  const [contractorForm, setContractorForm] = useState({ id: 0, name: "", address: "", phone: "", email: "", specialtiesText: "" });
  const [isEditingContractor, setIsEditingContractor] = useState(false);

  // 業者AI知識（Embedding）RAGデータ
  const [contractorRags, setContractorRags] = useState<ContractorRag[]>([
    { id: 1, title: "山下建設 大規模改修工事施工計画書", contractorId: 1, category: "施工実績", filename: "yamashita_records.pdf", content: "港区立青少年センター耐震補強および改修工事の実績。\n工期: 2024年4月〜2025年3月。\nRC造延床3,800平米の耐震ブレース設置、アスベスト除去、外壁改修を自社一元施工で完遂した記録。" },
    { id: 2, title: "佐藤空調設備 GHP施工許可及び技術者数一覧", contractorId: 2, category: "保有資格・許可証", filename: "sato_certifications.pdf", content: "一級管工事施工管理技士: 3名、二級: 5名。\nダイキン工業認定施工店ライセンス。\n高圧ガス製造保安責任者資格を保有し、フロン回収からGHP室外機キュービクル設置まで一括対応可能な技術体制一覧。" }
  ]);
  const [ragForm, setRagForm] = useState({ id: 0, title: "", contractorId: "", category: "施工実績", filename: "", content: "" });
  const [isEditingRag, setIsEditingRag] = useState(false);
  const [viewingRag, setViewingRag] = useState<ContractorRag | null>(null);

  const runScraper = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      triggerToast("業者リストの自動スクレイピングが完了し、新規業者 8社を登録しました");
    }, 2000);
  };

  const handleSaveContractor = (e: React.FormEvent) => {
    e.preventDefault();
    const specialties = contractorForm.specialtiesText.split(",").map(s => s.trim()).filter(Boolean);
    if (isEditingContractor) {
      setContractors(contractors.map(c => c.id === contractorForm.id ? { 
        ...c, 
        name: contractorForm.name, 
        address: contractorForm.address, 
        phone: contractorForm.phone,
        email: contractorForm.email,
        specialties
      } : c));
      triggerToast("業者マスター情報を更新しました");
    } else {
      const newContractor: Contractor = {
        id: Date.now(),
        name: contractorForm.name,
        address: contractorForm.address,
        phone: contractorForm.phone,
        email: contractorForm.email,
        specialties
      };
      setContractors([newContractor, ...contractors]);
      triggerToast("新しい業者情報をDBに登録しました");
    }
    resetContractorForm();
  };

  const handleEditContractor = (c: Contractor) => {
    setContractorForm({ 
      id: Number(c.id), 
      name: c.name, 
      address: c.address, 
      phone: c.phone || "", 
      email: c.email || "", 
      specialtiesText: c.specialties.join(", ")
    });
    setIsEditingContractor(true);
  };

  const handleDeleteContractor = (id: string | number) => {
    if (confirm("この業者情報を削除してもよろしいですか？")) {
      setContractors(contractors.filter(c => c.id !== id));
      triggerToast("業者情報を削除しました");
    }
  };

  const resetContractorForm = () => {
    setContractorForm({ id: 0, name: "", address: "", phone: "", email: "", specialtiesText: "" });
    setIsEditingContractor(false);
  };

  const handleSaveRag = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingRag) {
      setContractorRags(contractorRags.map(r => r.id === ragForm.id ? { 
        ...r, 
        title: ragForm.title, 
        contractorId: Number(ragForm.contractorId), 
        category: ragForm.category, 
        content: ragForm.content 
      } : r));
      triggerToast("業者AI知識を更新しました");
    } else {
      const newRag: ContractorRag = {
        id: Date.now(),
        title: ragForm.title,
        contractorId: Number(ragForm.contractorId) || contractors[0].id,
        category: ragForm.category,
        filename: ragForm.filename || "contractor_portfolio.pdf",
        content: ragForm.content
      };
      setContractorRags([newRag, ...contractorRags]);
      triggerToast("業者ナレッジをpgvectorにベクトル保存しました");
    }
    resetRagForm();
  };

  const handleEditRag = (r: ContractorRag) => {
    setRagForm({ 
      id: r.id, 
      title: r.title, 
      contractorId: String(r.contractorId), 
      category: r.category, 
      filename: r.filename, 
      content: r.content 
    });
    setIsEditingRag(true);
  };

  const handleDeleteRag = (id: number) => {
    if (confirm("このナレッジデータを削除してもよろしいですか？")) {
      setContractorRags(contractorRags.filter(r => r.id !== id));
      triggerToast("業者ナレッジを削除しました");
    }
  };

  const resetRagForm = () => {
    setRagForm({ id: 0, title: "", contractorId: "", category: "施工実績", filename: "", content: "" });
    setIsEditingRag(false);
  };

  // ==========================================
  // 【一般ユーザー用】業者連絡ウィザード
  // ==========================================
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "result">(1);

  // 案件調査AIで選択された案件を受け取る
  const [selectedTender, setSelectedTender] = useState<SelectedTender>(DEFAULT_SELECTED_TENDER);

  useEffect(() => {
    const savedTender = window.sessionStorage.getItem("selectedTenderForNegotiation");
    if (!savedTender) return;
    try {
      setSelectedTender(JSON.parse(savedTender) as SelectedTender);
    } catch {
      window.sessionStorage.removeItem("selectedTenderForNegotiation");
    }
  }, []);

  const [searchRegion, setSearchRegion] = useState("すべて");
  const [searchSpecialty, setSearchSpecialty] = useState("すべて");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [selectedContractors, setSelectedContractors] = useState<Contractor[]>([]);

  const [purposeEstimate, setPurposeEstimate] = useState(false);
  const [purposeDrawing, setPurposeDrawing] = useState(false);
  const [purposeFreeText, setPurposeFreeText] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<Record<string | number, string>>({});
  const [activeDraftTab, setActiveDraftTab] = useState<string | number>("");

  const filteredContractors = contractors.filter(c => {
    const matchesRegion = searchRegion === "すべて" || c.address.includes(searchRegion);
    const matchesSpecialty = searchSpecialty === "すべて" || c.specialties.includes(searchSpecialty);
    const matchesKeyword = searchKeyword === "" || 
      c.name.includes(searchKeyword) || 
      c.address.includes(searchKeyword) ||
      c.specialties.some(s => s.includes(searchKeyword));
    return matchesRegion && matchesSpecialty && matchesKeyword;
  });

  const toggleContractorSelection = (contractor: Contractor) => {
    const isSelected = selectedContractors.some(c => c.id === contractor.id);
    if (isSelected) {
      setSelectedContractors(prev => prev.filter(c => c.id !== contractor.id));
    } else {
      setSelectedContractors(prev => [...prev, contractor]);
    }
  };

  const addCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let formattedUrl = customUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "http://" + formattedUrl;
    }

    let domain = "手動登録業者";
    try {
      const parsed = new URL(formattedUrl);
      domain = parsed.hostname.replace("www.", "") + " (直接入力)";
    } catch {
      // ignore
    }

    const newCustomContractor: Contractor = {
      id: "custom-" + Date.now(),
      name: domain,
      address: "URL指定による直接登録",
      specialties: ["直接URL入力"],
      isCustom: true,
      url: formattedUrl
    };

    setSelectedContractors(prev => [...prev, newCustomContractor]);
    setCustomUrl("");
    triggerToast("カスタム業者URLを追加しました");
  };

  const startAiConsultation = () => {
    if (selectedContractors.length === 0) {
      alert("打診対象の業者を1社以上選択してください。");
      return;
    }

    setIsGenerating(true);
    setStep("result");

    setTimeout(() => {
      const drafts: Record<string | number, string> = {};

      selectedContractors.forEach(contractor => {
        const tenderBrief = selectedTender
          ? `【対象案件】\n案件名：${selectedTender.title}\n発注機関：${selectedTender.agency}\n対象地域：${selectedTender.location}\n予定価格：${selectedTender.budget || "未定"}\n工事概要：${selectedTender.description || "詳細情報はありません。"}\n`
          : "【対象案件】\n案件調査AIから選択された公共工事案件について\n";

        let purposeText = "";
        if (purposeEstimate && purposeDrawing) {
          purposeText = `つきましては、添付の図面・仕様書をご確認いただき、施工可能かどうかのご判断と併せて、概算見積もりをご提示いただくことは可能でしょうか。\nまずは図面等の資料送付のご承諾をいただけますと幸いです。`;
        } else if (purposeEstimate) {
          purposeText = `つきましては、上記の条件における工事につきまして、概算での御見積もりの作成をお願いできますでしょうか。工事概要をご確認の上、ご検討いただけますと幸いです。`;
        } else if (purposeDrawing) {
          purposeText = `つきましては、詳細な検討のためにまずは図面や仕様書といった設計資料送付のご承諾をいただけますでしょうか。`;
        } else {
          purposeText = `つきましては、弊社が計画しております上記の工事物件につきまして、施工協力のご相談をさせていただきたく存じます。まずは情報交換を兼ねて一度お話しさせていただくことは可能でしょうか。`;
        }

        const freeTextBrief = purposeFreeText.trim() 
          ? `\n【追加のご質問・要望】\n${purposeFreeText.trim()}\n` 
          : "";

        const letter = `お世話になっております。
テンダー建設の施工管理部と申します。

貴社の実績や得意分野（${contractor.specialties.join(", ")}）を拝見し、弊社が現在入札を進めております案件について、ぜひご相談・打診をさせていただきたくご連絡差し上げました。

${tenderBrief}
${freeTextBrief}
${purposeText}

何卒ご検討のほど、よろしくお願い申し上げます。

----------------------------
テンダー建設株式会社 担当
E-mail: contact@tender-construction.co.jp
URL: https://tender-construction.co.jp
----------------------------`;
        
        drafts[contractor.id] = letter;
      });

      setGeneratedDrafts(drafts);
      setActiveDraftTab(selectedContractors[0].id);
      setIsGenerating(false);
      triggerToast("AIによる打診文面の作成が完了しました");
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast("文面をクリップボードにコピーしました");
  };

  const handleUpdateDraft = (id: string | number, value: string) => {
    setGeneratedDrafts(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* 共通ナビゲーションヘッダー */}
      <Header />

      {/* トースト表示 */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl text-xs font-semibold border border-slate-800">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            {toastMsg}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {isAdmin ? (
          /* ========================================== */
          /* 管理者ビュー: 下請け・業者交渉AI管理 */
          /* ========================================== */
          <div className="space-y-8 animate-fade-in text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" /> 下請け・業者交渉AI管理
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">交渉打診先業者リストのクローリング、業者情報マスターCRUD管理、業者交渉マッチング用AI知識(Embedding)の設定を行います</p>
              </div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-xs transition-all">
                <ArrowLeft className="w-3.5 h-3.5" /> ダッシュボードへ戻る
              </Link>
            </div>

            {/* 即時スクレイピング */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <RefreshCw className="w-4.5 h-4.5 text-indigo-600 animate-spin" /> WEB業者リスト自動スクレイパー
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                  地方自治体の入札参加業者資格名簿（建築工事、設備工事等）から、公開中の各社URL・実績をPlaywrightスクレイパーで自動クローリング収集し統合します。
                </p>
              </div>
              <button 
                onClick={runScraper}
                disabled={isScraping}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isScraping ? "スクレイピング中..." : "業者名簿のスクレイピング即時実行"}
              </button>
            </section>

            {/* 業者情報 CRUD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 h-fit">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {isEditingContractor ? <Edit className="w-4 h-4 text-amber-600" /> : <PlusCircle className="w-4 h-4 text-indigo-600" />}
                    {isEditingContractor ? "業者マスターの編集" : "新規業者情報の登録"}
                  </h3>
                  {isEditingContractor && (
                    <button onClick={resetContractorForm} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                      キャンセル
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveContractor} className="space-y-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">会社名 / 業者名 *</label>
                    <input type="text" required value={contractorForm.name} onChange={e => setContractorForm({...contractorForm, name: e.target.value})} placeholder="例: ○○設備工業株式会社" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">本社所在地 *</label>
                    <input type="text" required value={contractorForm.address} onChange={e => setContractorForm({...contractorForm, address: e.target.value})} placeholder="例: 東京都港区..." className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">電話番号</label>
                      <input type="text" value={contractorForm.phone} onChange={e => setContractorForm({...contractorForm, phone: e.target.value})} placeholder="03-0000-0000" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">メールアドレス</label>
                      <input type="email" value={contractorForm.email} onChange={e => setContractorForm({...contractorForm, email: e.target.value})} placeholder="info@example.com" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">工種・得意分野 (カンマ区切り) *</label>
                    <input type="text" required value={contractorForm.specialtiesText} onChange={e => setContractorForm({...contractorForm, specialtiesText: e.target.value})} placeholder="例: 管工事・空調設備, 電気設備工事" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  <button type="submit" className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${isEditingContractor ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                    <PlusCircle className="w-4 h-4" /> {isEditingContractor ? "業者マスターを更新" : "業者マスターをDB登録"}
                  </button>
                </form>
              </div>

              {/* 業者一覧テーブル */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                  登録済み業者マスター一覧 ({contractors.length}社)
                </h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">会社名</th>
                        <th className="p-3">得意分野</th>
                        <th className="p-3">住所</th>
                        <th className="p-3">連絡先</th>
                        <th className="p-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {contractors.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {c.specialties.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 truncate max-w-[120px]" title={c.address}>{c.address}</td>
                          <td className="p-3 font-mono text-[10px]">{c.phone || c.email || "未設定"}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button onClick={() => handleEditContractor(c)} className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-bold transition-colors cursor-pointer">
                              編集
                            </button>
                            <button onClick={() => handleDeleteContractor(c.id)} className="px-2 py-1 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded font-bold transition-colors cursor-pointer">
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

            {/* 業者別AI知識 (Embedding/RAG) の管理 */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" /> 業者AI知識管理 (Embedding/RAG)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-semibold">自社と下請業者をAIで自動マッチングさせ、打診文書を作成する際に参照される『業者プロフィール/施工実績』の知識登録を行います。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 業者ナレッジ登録 */}
                <form onSubmit={handleSaveRag} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-xs">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    {isEditingRag ? <Edit className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-indigo-600" />}
                    {isEditingRag ? "AI知識情報の編集" : "業者施工実績等の知識登録"}
                  </h4>
                  
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">知識・文書タイトル *</label>
                    <input type="text" required value={ragForm.title} onChange={e => setRagForm({...ragForm, title: e.target.value})} placeholder="例: ○○建設の耐震工事実績" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">対象の業者指定 *</label>
                    <select value={ragForm.contractorId} onChange={e => setRagForm({...ragForm, contractorId: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
                      <option value="">-- 業者を選択してください --</option>
                      {contractors.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">カテゴリ</label>
                      <select value={ragForm.category} onChange={e => setRagForm({...ragForm, category: e.target.value})} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
                        <option>施工実績</option>
                        <option>保有資格・許可証</option>
                        <option>会社概要</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ファイル名</label>
                      <input type="text" value={ragForm.filename} onChange={e => setRagForm({...ragForm, filename: e.target.value})} placeholder="portfolio.pdf" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">知識テキスト本文 *</label>
                    <textarea rows={4} required value={ragForm.content} onChange={e => setRagForm({...ragForm, content: e.target.value})} placeholder="AIがマッチングやメール作成時に参照する業者の施工能力、得意とする規模、特定の工法などの詳細記述..." className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"></textarea>
                  </div>

                  <div className="flex gap-2 justify-end">
                    {isEditingRag && (
                      <button type="button" onClick={resetRagForm} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold bg-white cursor-pointer">
                        キャンセル
                      </button>
                    )}
                    <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer">
                      {isEditingRag ? "ナレッジを更新" : "Embedding実行 & 保存"}
                    </button>
                  </div>
                </form>

                {/* 業者ナレッジ一覧 */}
                <div className="lg:col-span-2 overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">文書タイトル</th>
                        <th className="p-3">対象業者</th>
                        <th className="p-3">カテゴリ</th>
                        <th className="p-3">プレビュー</th>
                        <th className="p-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {contractorRags.map(r => {
                        const targetContractor = contractors.find(c => c.id === r.contractorId);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> {r.title}
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{targetContractor?.name || "未指定"}</td>
                            <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">{r.category}</span></td>
                            <td className="p-3 text-slate-400 max-w-xs truncate font-mono text-[10px]">{r.content}</td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button onClick={() => setViewingRag(r)} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold transition-colors cursor-pointer">
                                閲覧
                              </button>
                              <button onClick={() => handleEditRag(r)} className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-bold transition-colors cursor-pointer">
                                編集
                              </button>
                              <button onClick={() => handleDeleteRag(r.id)} className="px-2 py-1 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded font-bold transition-colors cursor-pointer">
                                削除
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ========================================== */
          /* 一般ユーザービュー: 下請け・業者交渉AI */
          /* ========================================== */
          <div className="space-y-8 animate-fade-in">
            {/* ヘッダーエリア */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <Building2 className="w-7 h-7 text-blue-600" /> 下請け・業者交渉AI
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">下請業者や協力業者の選定、およびAIによる打診交渉文面の自動作成をサポートします</p>
              </div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-xs transition-all hover:shadow-sm">
                <ArrowLeft className="w-3.5 h-3.5" /> トップページへ戻る
              </Link>
            </div>

            {/* 4ステップウィザードカード */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              {/* ステッパーインジケータ */}
              {step !== "result" && (
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">
                  <div className="max-w-4xl mx-auto flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-[18px] h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
                    <div 
                      className="absolute left-0 top-[18px] h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
                      style={{ width: `${((step - 1) / 3) * 100}%` }}
                    ></div>

                    {[
                      { s: 1, label: "選択案件" },
                      { s: 2, label: "業者検索" },
                      { s: 3, label: "問い合わせ目的" },
                      { s: 4, label: "確認画面" },
                    ].map(item => (
                      <div key={item.s} className="flex flex-col items-center relative z-10">
                        <div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                            step === item.s 
                              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-110" 
                              : step > item.s 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "bg-white border-slate-200 text-slate-400"
                          }`}
                        >
                          {step > item.s ? <Check className="w-4 h-4 stroke-[3px]" /> : item.s}
                        </div>
                        <span 
                          className={`text-[11px] font-bold mt-2.5 transition-colors ${
                            step === item.s ? "text-blue-600" : step > item.s ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ウィザードコンテンツ */}
              <div className="p-6 sm:p-8">
                {step === 1 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">案件調査AIから引き継いだ案件</h2>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-4 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 font-bold text-blue-800"><CheckCircle2 className="w-3.5 h-3.5" /> 引き継ぎ済み</span>
                        <span className="font-bold text-blue-700">AIおすすめ案件</span>
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{selectedTender.title}</h3>
                        <p className="mt-1 font-semibold text-slate-600">発注機関：{selectedTender.agency}　/　対象地域：{selectedTender.location}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-blue-100 bg-white p-3.5">
                        <div><span className="block text-[10px] font-bold text-slate-400">予定価格・予算</span><span className="font-bold text-slate-800">{selectedTender.budget || "未定"}</span></div>
                        <div><span className="block text-[10px] font-bold text-slate-400">開札予定日</span><span className="font-bold text-slate-800">{selectedTender.openDate}</span></div>
                      </div>
                      <div><span className="block text-[10px] font-bold text-slate-400">工事内容・要件概要</span><p className="mt-1.5 rounded-xl border border-blue-100 bg-white p-3 text-slate-700 leading-relaxed">{selectedTender.description || "詳細情報はありません。"}</p></div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button onClick={() => setStep(2)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5">
                        次へ (業者を検索) <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                          <Search className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">業者を検索</h2>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">選択中: {selectedContractors.length}社</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="space-y-6 lg:border-r lg:border-slate-100 lg:pr-6 text-xs">
                        <div className="space-y-4">
                          <h3 className="font-bold text-slate-800">絞り込み条件</h3>
                          
                          <div className="space-y-1.5">
                            <label className="block font-bold text-slate-500 uppercase">地域 (都道府県)</label>
                            <select value={searchRegion} onChange={e => setSearchRegion(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white">
                              <option value="すべて">すべての地域</option>
                              <option value="東京都">東京都</option>
                              <option value="神奈川県">神奈川県</option>
                              <option value="埼玉県">埼玉県</option>
                              <option value="千葉県">千葉県</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-bold text-slate-500 uppercase">業種 / 得意分野</label>
                            <select value={searchSpecialty} onChange={e => setSearchSpecialty(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white">
                              <option value="すべて">すべての業種</option>
                              <option value="建築一式">建築一式</option>
                              <option value="土木工事">土木工事</option>
                              <option value="管工事・空調設備">管工事・空調設備</option>
                              <option value="電気設備工事">電気設備工事</option>
                              <option value="内装仕上">内装仕上</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-bold text-slate-500 uppercase">キーワード検索</label>
                            <div className="relative">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                              <input type="text" placeholder="会社名、キーワード等..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white" />
                            </div>
                          </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-slate-800">自分でURLを入力して宛先追加</h3>
                          </div>
                          <form onSubmit={addCustomUrl} className="flex gap-2">
                            <input type="text" placeholder="例: https://example-const.co.jp" value={customUrl} onChange={e => setCustomUrl(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-white" />
                            <button type="submit" className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shrink-0">追加</button>
                          </form>
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-6">
                        {selectedContractors.length > 0 && (
                          <div className="space-y-2">
                            <span className="block text-xs font-bold text-slate-500 uppercase">現在選択中の宛先業者:</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedContractors.map(c => (
                                <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold shadow-2xs">
                                  {c.name}
                                  <button onClick={() => toggleContractorSelection(c)} className="hover:bg-blue-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-800">検索結果 ({filteredContractors.length}件)</h3>
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {filteredContractors.length === 0 ? (
                              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">業者が見つかりませんでした</div>
                            ) : (
                              filteredContractors.map(c => {
                                const isSelected = selectedContractors.some(sc => sc.id === c.id);
                                return (
                                  <div key={c.id} onClick={() => toggleContractorSelection(c)} className={`p-4 border rounded-xl flex items-start gap-3.5 cursor-pointer transition-all hover:bg-slate-50/50 ${isSelected ? "border-blue-500 bg-blue-50/10" : "border-slate-200 bg-white"}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 text-blue-600 border-slate-300 rounded mt-1" />
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-slate-900 truncate">{c.name}</h4>
                                        <div className="flex gap-1 shrink-0">
                                          {c.specialties.map((s, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold flex items-center gap-0.5">
                                              <Briefcase className="w-2.5 h-2.5" /> {s}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate">{c.address}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between">
                      <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> 戻る</button>
                      <button onClick={() => setStep(3)} disabled={selectedContractors.length === 0} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">次へ (目的選択) <ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <h2 className="text-lg font-bold text-slate-900">連絡の目的を選択</h2>
                    </div>

                    <div className="space-y-5 text-xs">
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50/50 cursor-pointer transition-all">
                          <input type="checkbox" checked={purposeEstimate} onChange={e => setPurposeEstimate(e.target.checked)} className="w-4 h-4 text-blue-600 border-slate-300 rounded mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800">1. 工事の概算見積の依頼</span>
                            <p className="text-[11px] text-slate-500 font-medium">条件テキストに基づき、工期・施工範囲に応じた概算価格提示を依頼します。</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50/50 cursor-pointer transition-all">
                          <input type="checkbox" checked={purposeDrawing} onChange={e => setPurposeDrawing(e.target.checked)} className="w-4 h-4 text-blue-600 border-slate-300 rounded mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800">2. 図面・仕様書資料送付のご承諾確認</span>
                            <p className="text-[11px] text-slate-500 font-medium">詳細検討のために、メール等での仕様設計図書の受領可能か確認を求めます。</p>
                          </div>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">その他の相談用フリーテキスト (任意)</label>
                        <textarea rows={3} value={purposeFreeText} onChange={e => setPurposeFreeText(e.target.value)} placeholder="特に質問したい事項、来社候補日程、連絡希望時間帯などがあれば記述..." className="w-full px-4 py-3 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"></textarea>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between">
                      <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> 戻る</button>
                      <button onClick={() => setStep(4)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">次へ (最終確認) <ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 max-w-xl mx-auto text-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <h2 className="text-lg font-bold text-slate-900">最終確認画面</h2>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 font-semibold text-slate-700">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">1. 送信対象の業者 ({selectedContractors.length}社):</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {selectedContractors.map(c => (
                            <span key={c.id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold">{c.name}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">2. 引き継ぎ案件:</span>
                        <p className="mt-1 font-bold text-slate-800">{selectedTender?.title || "案件が選択されていません"}</p>
                        {selectedTender && <p className="mt-1.5 text-slate-600 text-[11px] leading-relaxed bg-white p-2.5 border border-slate-200 rounded-xl">{selectedTender.agency} / {selectedTender.location} / {selectedTender.budget || "予算未定"}</p>}
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">3. 問い合わせ目的:</span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {purposeEstimate && <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg font-bold border border-blue-100">概算見積依頼</span>}
                          {purposeDrawing && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg font-bold border border-indigo-100">図面送付承諾確認</span>}
                          {purposeFreeText && <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-200">個別相談記載あり</span>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between">
                      <button onClick={() => setStep(3)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> 戻る</button>
                      <button onClick={startAiConsultation} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                        <Bot className="w-4 h-4" /> AI打診文章を生成する
                      </button>
                    </div>
                  </div>
                )}

                {step === "result" && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">AI自動打診メッセージ生成結果</h2>
                      </div>
                      <button onClick={() => { setStep(1); setSelectedContractors([]); setPurposeEstimate(false); setPurposeDrawing(false); setPurposeFreeText(""); }} className="text-xs font-bold text-blue-600 hover:underline">同じ案件で新しく打診を作成する</button>
                    </div>

                    {isGenerating ? (
                      <div className="py-16 text-center space-y-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                        <p className="text-xs text-slate-500 font-semibold animate-pulse">各選択業者の実績(Embedding/RAG)と照合し、個別メール打診メッセージを自動ドラフト中...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[500px]">
                        {/* 左：対象業者タブ選択 */}
                        <div className="lg:border-r lg:border-slate-200 lg:pr-4 overflow-y-auto space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">生成先業者一覧</span>
                          {selectedContractors.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => setActiveDraftTab(c.id)}
                              className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 ${
                                activeDraftTab === c.id 
                                  ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                  : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Mail className="w-4 h-4 shrink-0" />
                              <span className="truncate">{c.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* 右：ドラフトプレビュー & コピペ・送信 */}
                        <div className="lg:col-span-3 flex flex-col justify-between h-full bg-slate-50 p-5 rounded-2xl border border-slate-200">
                          {(() => {
                            const target = selectedContractors.find(c => c.id === activeDraftTab);
                            const draftText = generatedDrafts[activeDraftTab] || "";
                            if (!target) return <div className="text-slate-400 text-xs">プレビュー可能なドラフトはありません</div>;
                            return (
                              <div className="space-y-4 flex-1 flex flex-col justify-between">
                                <div className="space-y-2 flex-1 flex flex-col">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                      <Bot className="w-4 h-4 text-emerald-600" /> {target.name} 宛ての下書き
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">宛先: {target.email || target.url || "直接連絡先無し"}</span>
                                  </div>
                                  <textarea 
                                    value={draftText} 
                                    onChange={e => handleUpdateDraft(target.id, e.target.value)}
                                    className="w-full flex-1 p-4 text-xs font-mono bg-white border border-slate-200 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
                                  <button onClick={() => copyToClipboard(draftText)} className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                                    <Copy className="w-3.5 h-3.5" /> クリップボードにコピー
                                  </button>
                                  <button onClick={() => triggerToast(`${target.name} へ直接メール送信を行いました`)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md">
                                    <Send className="w-3.5 h-3.5" /> メールを即時送信
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* 業者ナレッジ詳細閲覧モーダル */}
      {viewingRag && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
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
              <p className="text-xs font-mono text-slate-400">ファイル名: {viewingRag.filename} | 関連業者ID: {viewingRag.contractorId}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" /> pgvector 埋め込み用ナレッジ詳細テキスト
              </h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap border border-slate-700 shadow-inner">
                {viewingRag.content}
              </div>
            </div>

            <div className="flex justify-end pt-2">
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
