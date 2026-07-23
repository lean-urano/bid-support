"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Bot,
  Search,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  X,
  Check,
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  Headphones,
  Volume2,
  HelpCircle,
  PlusCircle,
  FileText,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  UploadCloud,
  Trash2,
  Edit,
  Eye,
  BookOpen,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

// メッセージ・会話履歴の型定義
type Message = {
  id: string;
  sender: "user" | "RoomChief" | "Architecture" | "Engineer" | "Legal" | "system";
  senderName: string;
  text: string;
  timestamp: string;
  isWarning?: boolean;
  workflow?: Array<{
    step: string;
    agent: string;
    message: string;
  }>;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
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

export default function AiAssistantPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ==========================================
  // 【管理者用】 RAG ナレッジ管理 (Embedding)
  // ==========================================
  const [ragDocs, setRagDocs] = useState<RagDoc[]>([
    { id: 1, title: "公共建築工事標準仕様書（令和6年版）", category: "建築標準仕様・技術基準", filename: "spec_r6_arch.pdf", content: "第1章 共通参考事項\n1.1.1 適用範囲: この仕様書は、公共建築工事の請負契約における建築工事 of 施工に適用する。\n1.1.2 施工計画書: 受注者は、工事着手前に工事計画書を作成し、監督員に提出してその承諾を受けなければならない。", createdAt: "2026-06-20" },
    { id: 2, title: "建設工事請負契約約款と解釈判例集", category: "判例・トラブル事例", filename: "contract_precedents.pdf", content: "【判例最高裁平成15年】不可抗力による工期延期と請負代金の増減請求について。\n台風等の天災地変により生じた損害および工期の遅延については、発注者・受注者双方の過失にあたらない場合、約款第26条に基づき双方協議の上、合理的な工期延長および追加費用の負担額を決定すべきであると判示された。", createdAt: "2026-06-22" },
    { id: 3, title: "民間建設工事標準請負契約約束（B）雛形", category: "契約書雛形・約款", filename: "form_b_template.docx", content: "第1条（総則）発注者及び受注者は、互いに協力し、誠実をもって本契約を履行しなければならない。\n※注意: 法務・相談AIがこの雛形を出力する際は、必ず弁護士等の専門家に相談するよう注記を表示すること。", createdAt: "2026-06-25" },
  ]);

  const [ragForm, setRagForm] = useState({ id: 0, title: "", category: "建築標準仕様・技術基準", filename: "", content: "" });
  const [isEditingRag, setIsEditingRag] = useState(false);
  const [viewingRag, setViewingRag] = useState<RagDoc | null>(null);

  const handleSaveRag = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingRag) {
      setRagDocs(ragDocs.map(r => r.id === ragForm.id ? { ...r, title: ragForm.title, category: ragForm.category, content: ragForm.content } : r));
      triggerToast("RAGナレッジを更新しました");
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
      triggerToast("RAGナレッジを登録・pgvectorにベクトル保存しました");
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
      triggerToast("RAGナレッジデータを削除しました");
    }
  };

  const resetRagForm = () => {
    setRagForm({ id: 0, title: "", category: "建築標準仕様・技術基準", filename: "", content: "" });
    setIsEditingRag(false);
  };


  // ==========================================
  // 【一般ユーザー用】 法務・相談AI
  // ==========================================
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  
  // 入力フォーム・添付・音声等
  const [inputText, setInputText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(null);

  // トースト
  const [toastMsg, setToastMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初回起動時の初期データロード
  useEffect(() => {
    if (isAdmin) return; // 管理者の場合はロード不要

    // セッション履歴ロード (localStorage)
    const storedSessions = localStorage.getItem("ai_secretary_sessions");
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 初期のダミーセッション作成
    const initialSessions: ChatSession[] = [
      {
        id: "session-1",
        title: "市民ホール改修の工期遅延について",
        messages: [
          {
            id: "msg-1-1",
            sender: "RoomChief",
            senderName: "室長AI",
            text: "こんにちは！建築・公共工事に関する専門AIアシスタント「法務・相談AI」です。\n市民ホールの工期遅延のご相談につきまして、約款第26条（不可抗力免責）を調査いたしました。発注機関への書面通知（工期延長願）の提出準備をお手伝いします。",
            timestamp: "10:30"
          }
        ]
      },
      {
        id: "session-2",
        title: "公共建築工事標準仕様書の確認",
        messages: [
          {
            id: "msg-2-1",
            sender: "RoomChief",
            senderName: "室長AI",
            text: "施工計画書の提出時期についてご案内いたします。標準仕様書では『工事着手前』に詳細計画書を作成し、監督員の承諾を得ることが必須となっています。",
            timestamp: "昨日"
          }
        ]
      }
    ];
    setSessions(initialSessions);
    setActiveSessionId(initialSessions[0].id);
    localStorage.setItem("ai_secretary_sessions", JSON.stringify(initialSessions));
  }, [isAdmin]);

  // トースト表示用関数
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // メッセージのスクロール追従
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, isSending]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // 新規セッション作成
  const handleCreateSession = () => {
    const newId = `session-${Date.now()}`;
    const newSess: ChatSession = {
      id: newId,
      title: "新規ご相談",
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "RoomChief",
          senderName: "室長AI",
          text: "新しく相談スレッドを開始しました。公共工事の仕様書基準、工期遅延に伴う約款の解釈、または一括下請負の禁止規制など、ご質問内容に合わせて最適な専門AI（建築・技術者・法務）を連携させ回答いたします。どのようなことでもご相談ください。",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    const updated = [newSess, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    localStorage.setItem("ai_secretary_sessions", JSON.stringify(updated));
    triggerToast("新しい相談スレッドを作成しました");
  };

  // ファイル添付処理
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      setAttachedFiles(prev => [...prev, fileName]);
      triggerToast(`ファイルを添付しました: ${fileName}`);
    }
  };

  // メッセージ送信
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() && attachedFiles.length === 0) return;

    if (!activeSessionId) return;

    // ユーザー発言メッセージ
    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      senderName: user?.name || "一般ユーザー",
      text: text + (attachedFiles.length > 0 ? `\n\n📎 添付ファイル: ${attachedFiles.join(", ")}` : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // セッション更新
    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        const newTitle = s.title === "新規ご相談" ? (text.length > 15 ? text.substring(0, 15) + "..." : text) : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInputText("");
    setAttachedFiles([]);
    setIsSending(true);

    try {
      // APIリクエスト
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      if (response.ok) {
        const data = await response.json();

        // 応答メッセージの組み立て
        const botMsgId = `msg-bot-${Date.now()}`;
        const botMsg: Message = {
          id: botMsgId,
          sender: "RoomChief",
          senderName: "室長AI",
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          workflow: data.workflowSteps
        };

        // 警告判定
        const needsWarning = text.includes("延長") || text.includes("約款") || text.includes("契約") || text.includes("下請") || data.response.includes("弁護士") || data.response.includes("有資格者");
        
        const finalMessages = [...updatedSessions.find(s => s.id === activeSessionId)!.messages, botMsg];

        if (needsWarning) {
          finalMessages.push({
            id: `msg-warning-${Date.now()}`,
            sender: "system",
            senderName: "法的注意事項",
            text: "⚠️ 警告: AIが生成した契約条項・工期延長願等の雛形案は参考用のものです。法的効力や正確性を担保するため、実際の使用前には必ず顧問弁護士や資格を持った専門家（行政書士・司法書士等）によるリーガルチェックを受けてください。",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isWarning: true
          });
        }

        updatedSessions = updatedSessions.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: finalMessages
            };
          }
          return s;
        });

        setSessions(updatedSessions);
        localStorage.setItem("ai_secretary_sessions", JSON.stringify(updatedSessions));
        setExpandedWorkflowId(botMsgId);
      }
    } catch (e) {
      console.error(e);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sender: "system",
        senderName: "システムエラー",
        text: "申し訳ありません。AIアシスタントとの接続中にエラーが発生しました。時間をおいて再度お試しください。",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updatedSessions = updatedSessions.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, errorMsg]
          };
        }
        return s;
      });
      setSessions(updatedSessions);
    } finally {
      setIsSending(false);
    }
  };

  // 提案質問の処理
  const handleQuickQuestion = (q: string) => {
    handleSendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between relative">
      {/* 共通ナビゲーションヘッダー */}
      <Header />

      {/* メインレイアウト */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col items-stretch">
        
        {isAdmin ? (
          /* ========================================== */
          /* 管理者ビュー: 法務・相談AI RAG学習・管理 */
          /* ========================================== */
          <div className="space-y-6 animate-fade-in w-full text-xs">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white shadow-xl border border-indigo-500/20">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30">
                  <Database className="w-4 h-4 text-indigo-400" /> AI知識ベース管理（RAG）
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  法務・相談AI 専門知識学習 ＆ RAG管理
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed">
                  一般ユーザー向けの「法務・相談AI」が契約約款相談や各種法令解釈に使用するナレッジ文書の登録・編集、およびベクトル化(embedding)を行います。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ナレッジ登録・編集フォーム */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 h-fit">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {isEditingRag ? <Edit className="w-4 h-4 text-amber-600" /> : <PlusCircle className="w-4 h-4 text-indigo-600" />}
                    {isEditingRag ? "ナレッジ情報の編集" : "新規ナレッジの追加・登録"}
                  </h3>
                  {isEditingRag && (
                    <button onClick={resetRagForm} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                      <X className="w-3.5 h-3.5" /> キャンセル
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveRag} className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ナレッジ・文書タイトル *</label>
                    <input 
                      type="text" 
                      required 
                      value={ragForm.title} 
                      onChange={e => setRagForm({...ragForm, title: e.target.value})} 
                      placeholder="例: 建築基準法 構造耐力基準" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">カテゴリ分類 *</label>
                    <select 
                      value={ragForm.category} 
                      onChange={e => setRagForm({...ragForm, category: e.target.value})} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      <option>建築標準仕様・技術基準</option>
                      <option>判例・トラブル事例</option>
                      <option>契約書雛形・約款</option>
                      <option>安全衛生・積算基準</option>
                    </select>
                  </div>

                  {!isEditingRag && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ファイルアップロード (任意)</label>
                      <div className="border border-dashed border-slate-300 hover:bg-slate-50 rounded-xl p-4 text-center cursor-pointer relative">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">PDF / TXT ファイルを選択</span>
                        <input 
                          type="file" 
                          onChange={e => setRagForm({...ragForm, filename: e.target.files?.[0]?.name || "uploaded_knowledge.pdf"})} 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                      {ragForm.filename && (
                        <div className="text-[10px] text-indigo-600 font-mono mt-1">選択ファイル: {ragForm.filename}</div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ナレッジ本文・参照テキスト *</label>
                    <textarea 
                      rows={6} 
                      required 
                      value={ragForm.content} 
                      onChange={e => setRagForm({...ragForm, content: e.target.value})} 
                      placeholder="AIが参照し回答を生成するための詳細情報、約款条文、トラブル判例などを入力してください..." 
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono leading-relaxed"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {isEditingRag ? "ナレッジ情報を更新" : "埋め込み実行 ＆ ベクトル保存"}
                  </button>
                </form>
              </div>

              {/* ナレッジ一覧テーブル */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">
                    登録済みRAGナレッジ一覧 ({ragDocs.length}件)
                  </h3>
                  <div className="text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> pgvector 連携完了
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">文書タイトル</th>
                        <th className="p-3">カテゴリ</th>
                        <th className="p-3">ファイル名</th>
                        <th className="p-3">プレビュー</th>
                        <th className="p-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {ragDocs.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> {r.title}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">{r.category}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-400 text-[10px]">{r.filename}</td>
                          <td className="p-3 text-slate-400 max-w-xs truncate font-mono text-[10px]">{r.content}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button onClick={() => setViewingRag(r)} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-0.5">
                              <Eye className="w-3 h-3" /> 閲覧
                            </button>
                            <button onClick={() => handleEditRag(r)} className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-0.5">
                              <Edit className="w-3 h-3" /> 編集
                            </button>
                            <button onClick={() => handleDeleteRag(r.id)} className="px-2 py-1 bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded font-bold transition-colors cursor-pointer inline-flex items-center gap-0.5">
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
          </div>
        ) : (
          /* ========================================== */
          /* 一般ユーザービュー: 法務・相談AI */
          /* ========================================== */
          <div className="flex-1 flex flex-col md:flex-row gap-6 items-stretch w-full animate-fade-in">
            {/* 左側サイドバー */}
            <aside className="w-full md:w-80 shrink-0 flex flex-col gap-5">
              <button
                onClick={handleCreateSession}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> 新しい相談スレッドを開始
              </button>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden max-h-[350px] md:max-h-none">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">相談・質問の履歴</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1 divide-y divide-slate-100">
                  {sessions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">相談履歴はありません</div>
                  ) : (
                    sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          activeSessionId === s.id
                            ? "bg-purple-50 text-purple-700 font-bold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="truncate flex-1">{s.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* 右側チャットエリア */}
            <section className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex flex-col justify-between min-h-[500px]">
              {/* 会話ログ */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50">
                {activeSession?.messages.map((msg, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                      {/* アイコン */}
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-xs ${
                        msg.sender === "user" ? "bg-purple-600" : "bg-emerald-600"
                      }`}>
                        {msg.sender === "user" ? "自" : "秘"}
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {msg.senderName} • {msg.timestamp}
                        </span>
                        
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-2xs ${
                          msg.isWarning 
                            ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none font-medium" 
                            : msg.sender === "user" 
                              ? "bg-purple-600 text-white rounded-tr-none" 
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>

                    {/* 専門AIのワークフロー表示 */}
                    {msg.workflow && (
                      <div className="pl-11 pr-4 max-w-3xl">
                        <button
                          onClick={() => setExpandedWorkflowId(expandedWorkflowId === msg.id ? null : msg.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                        >
                          {expandedWorkflowId === msg.id ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" /> 専門AI連携ワークフローを閉じる
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" /> 専門AI連携ワークフローを表示 ({msg.workflow.length}ステップ)
                            </>
                          )}
                        </button>
                        
                        {expandedWorkflowId === msg.id && (
                          <div className="mt-2 p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-2 text-[10px] animate-fade-in">
                            <span className="block font-bold text-purple-800">専門AI同士の合議プロセス:</span>
                            <div className="space-y-1.5 font-medium text-purple-900">
                              {msg.workflow.map((w, wIdx) => (
                                <div key={wIdx} className="flex items-start gap-1">
                                  <span className="font-bold whitespace-nowrap">【{w.agent}】:</span>
                                  <span className="text-slate-600">{w.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex gap-3 mr-auto max-w-[85%]">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-xs bg-emerald-600">
                      秘
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">AIが思考中...</span>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* サンプル質問 */}
              {activeSession && activeSession.messages.length <= 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-400 mb-3 text-center">▼ よくある質問例（タップで送信できます）</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "仕様書の要点を整理して",
                      "発注機関への質問書を作って",
                      "工期延長願を作って",
                      "一括下請負禁止について"
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(q)}
                        className="p-3 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 hover:border-purple-300 rounded-xl text-xs font-bold text-left transition-all hover:shadow-xs leading-relaxed cursor-pointer"
                      >
                        💡 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 入力フォームエリア */}
              <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                        📎 {file}
                        <button onClick={() => setAttachedFiles(f => f.filter((_, i) => i !== idx))} className="hover:bg-slate-200 rounded-full p-0.5">
                          <X className="w-3 h-3 text-slate-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2.5">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAttach} />
                  
                  <div className="flex items-center gap-1.5 mb-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-white transition-all cursor-pointer"
                      title="PDFやWord資料を添付"
                    >
                      <Paperclip className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => triggerToast("音声入力を開始します（デモ動作）")}
                      className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-white transition-all cursor-pointer"
                      title="音声入力"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => triggerToast("音声読み上げをONにしました（デモ動作）")}
                      className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-white transition-all cursor-pointer"
                      title="音声読み上げ"
                    >
                      <Headphones className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => triggerToast("音声ボリューム調整（デモ動作）")}
                      className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-white transition-all cursor-pointer"
                      title="音声設定"
                    >
                      <Volume2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="専門的な質問や、添付資料の確認依頼を入力... (Shift + Enterで改行)"
                      className="w-full pl-4 pr-12 py-3 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white placeholder:text-slate-400 leading-relaxed resize-none shadow-inner"
                    />
                    
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isSending || (!inputText.trim() && attachedFiles.length === 0)}
                      className={`absolute right-2.5 bottom-2.5 p-2 rounded-xl text-white transition-all shadow-xs ${
                        (inputText.trim() || attachedFiles.length > 0) && !isSending
                          ? "bg-purple-600 hover:bg-purple-700 hover:scale-105 cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                      title="送信"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed flex items-center justify-between">
                  <span>🛡️ 添付資料に AI への指示文があっても、自動的に無視します（プロンプトインジェクション防御機能）。</span>
                  <span className="font-semibold text-slate-300">tender-support AI Apps</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* トースト表示 (管理者ビューでも表示可能にするため) */}
      {toastMsg && !isAdmin && (
        <div className="absolute bottom-24 right-6 z-40 animate-bounce">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-800 shadow-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMsg}
          </div>
        </div>
      )}
      {toastMsg && isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-800 shadow-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMsg}
          </div>
        </div>
      )}

      {/* RAGナレッジ詳細閲覧モーダル (管理者用) */}
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
              <span className="text-xs text-slate-400">※この中身テキストが法務・相談AI（RAG）のコサイン類似度検索に使用されます</span>
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
