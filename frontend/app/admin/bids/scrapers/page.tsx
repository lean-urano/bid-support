"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, Globe2, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Source = {
  key: string; name: string; type: string; url: string;
  latestRun: { started_at: string; status: string; success_count: number; failure_count: number; error_message: string | null } | null;
};

export default function ScrapersPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState("");
  const [runError, setRunError] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadSources = async () => {
    try {
      const response = await fetch("/api/admin/scrapers", { cache: "no-store" });
      const data = await response.json() as { sources?: Source[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "実行履歴を取得できませんでした。");
      setLoadError("");
      setSources(data.sources ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "実行履歴を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadSources(), 0);
    const timer = window.setInterval(() => void loadSources(), 5000);
    return () => { window.clearTimeout(initialTimer); window.clearInterval(timer); };
  }, []);

  const runSource = async (source: Source) => {
    setRunning(source.key); setRunMessage(`${source.name}を起動しています…`); setRunError("");
    try {
      const response = await fetch("/api/admin/scrapers/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceKeys: [source.key] }) });
      const responseText = await response.text();
      let data: { started?: string[]; error?: string } = {};
      try { data = JSON.parse(responseText) as typeof data; } catch { /* Next.jsのHTMLエラーも下の共通メッセージで扱う */ }
      if (!response.ok) throw new Error(data.error ?? "スクレイパーを起動できませんでした。");
      setRunMessage(`${source.name}を起動しました。実行結果は完了後に更新されます。`);
      void loadSources();
    } catch (cause) {
      setRunError(cause instanceof Error ? cause.message : "スクレイパーを起動できませんでした。");
    } finally { setRunning(null); }
  };

  const stopSource = async (source: Source) => {
    setStopping(source.key); setRunMessage(`${source.name}を停止しています…`); setRunError("");
    try {
      const response = await fetch("/api/admin/scrapers/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceKey: source.key }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "スクレイパーを停止できませんでした。");
      setRunMessage(`${source.name}を停止しました。保存済みの案件は残っています。`);
      void loadSources();
    } catch (cause) {
      setRunError(cause instanceof Error ? cause.message : "スクレイパーを停止できませんでした。");
    } finally { setStopping(null); }
  };

  const totalSuccess = useMemo(() => sources.reduce((sum, source) => sum + (source.latestRun?.success_count ?? 0), 0), [sources]);
  const totalFailed = useMemo(() => sources.reduce((sum, source) => sum + (source.latestRun?.failure_count ?? 0), 0), [sources]);

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
    <div className="border-b border-slate-200 pb-6"><p className="text-xs font-bold tracking-[0.16em] text-indigo-600">DATA SOURCES</p><h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight"><span className="flex h-8 w-8 shrink-0 items-center justify-center bg-indigo-50 text-indigo-700"><Globe2 className="h-4 w-4" /></span>スクレイパー一覧</h1><p className="mt-2 text-sm text-slate-600">収集元ごとの実行状態と、直近の実行結果を管理します。</p></div>
    <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="収集状況の概要"><Summary label="登録スクレイパー" value={`${sources.length}件`} detail="実行ボタンから手動起動" icon={<Globe2 className="h-4 w-4" />} /><Summary label="直近の成功件数" value={`${totalSuccess}件`} detail="各スクレイパーの最新実行" icon={<CheckCircle2 className="h-4 w-4" />} tone="success" /><Summary label="直近の失敗件数" value={`${totalFailed}件`} detail={totalFailed > 0 ? "要確認のエラーがあります" : "失敗記録はありません"} icon={<XCircle className="h-4 w-4" />} tone={totalFailed > 0 ? "danger" : "neutral"} /></section>
    {runMessage && <div className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{runMessage}</div>}
    {runError && <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{runError}</div>}
    {loadError && <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>}
    <section className="mt-6 border border-slate-200 bg-white" aria-label="登録済みスクレイパー一覧"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><div><h2 className="text-sm font-bold">登録済みスクレイパー</h2><p className="mt-1 text-xs text-slate-500">実行状態はDBの最新記録を5秒ごとに確認します。実行中の行から停止できます。</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1320px] table-fixed text-left text-sm"><colgroup><col className="w-[260px]" /><col className="w-[320px]" /><col className="w-[190px]" /><col className="w-[110px]" /><col className="w-[110px]" /><col className="w-[120px]" /><col className="w-[170px]" /></colgroup><thead className="border-b border-slate-200 text-xs font-bold text-slate-500"><tr><th className="whitespace-nowrap px-4 py-3">スクレイパー</th><th className="whitespace-nowrap px-4 py-3">収集元URL</th><th className="whitespace-nowrap px-4 py-3">最終実行日</th><th className="whitespace-nowrap px-4 py-3 text-right">成功数</th><th className="whitespace-nowrap px-4 py-3 text-right">失敗数</th><th className="whitespace-nowrap px-4 py-3 text-right">成功率</th><th className="whitespace-nowrap px-4 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">設定を読み込んでいます…</td></tr> : sources.map((source) => <tr key={source.key} className="align-top hover:bg-slate-50"><td className="px-4 py-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center bg-indigo-50 text-indigo-700"><Globe2 className="h-4 w-4" /></span><div><p className="font-semibold text-slate-900">{source.name}</p><p className="mt-1 text-xs text-slate-500">{source.type}</p></div></div></td><td className="max-w-[290px] px-4 py-4"><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 break-all text-xs leading-5 text-indigo-700 hover:underline">{source.url}<ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /></a></td><td className="whitespace-nowrap px-4 py-4"><div className="flex flex-col items-start gap-1 text-slate-700"><div className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-400" />{source.latestRun ? new Date(source.latestRun.started_at).toLocaleString("ja-JP") : "未実行"}</div><ExecutionStatus run={source.latestRun} /></div></td><td className="whitespace-nowrap px-4 py-4 text-right"><Count value={source.latestRun?.success_count} tone="success" /></td><td className="whitespace-nowrap px-4 py-4 text-right"><Count value={source.latestRun?.failure_count} tone={source.latestRun?.failure_count ? "danger" : "neutral"} /></td><td className="whitespace-nowrap px-4 py-4 text-right"><SuccessRate run={source.latestRun} /></td><td className="whitespace-nowrap px-4 py-4 text-right"><div className="flex justify-end gap-2">{source.latestRun?.status === "running" ? <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={stopping === source.key} onClick={(event) => { event.preventDefault(); void stopSource(source); }}>{stopping === source.key ? "停止中…" : "実行を停止"}</Button> : <Button type="button" size="sm" onClick={(event) => { event.preventDefault(); void runSource(source); }} disabled={running === source.key}>{running === source.key ? "起動中…" : <><Play className="mr-1.5 h-3.5 w-3.5" />実行</>}</Button>}</div></td></tr>)}</tbody></table></div></section>
  </main>;
}

function Count({ value, tone }: { value?: number; tone: "success" | "danger" | "neutral" }) { return <>{value === undefined ? <span className="text-slate-400">—</span> : <span className={`whitespace-nowrap ${tone === "success" ? "font-semibold text-emerald-700" : tone === "danger" ? "font-semibold text-red-700" : "text-slate-700"}`}>{value}<span className="ml-1 text-xs text-slate-400">件</span></span>}</>; }
function SuccessRate({ run }: { run: Source["latestRun"] }) { if (!run || run.status === "running") return <span className="text-slate-400">—</span>; const total = run.success_count + run.failure_count; if (total === 0) return <span className="text-slate-400">—</span>; const rate = (run.success_count / total) * 100; return <span className={rate === 100 ? "font-semibold text-emerald-700" : rate >= 80 ? "font-semibold text-amber-700" : "font-semibold text-red-700"}>{rate.toFixed(1)}%</span>; }
function ExecutionStatus({ run }: { run: Source["latestRun"] }) {
  if (!run) return <span className="text-xs text-slate-400">実行履歴なし</span>;
  if (run.status === "running") return <span className="inline-flex items-center border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">実行中</span>;
  if (run.status === "failed") return <div className="max-w-[170px]"><span className="inline-flex items-center border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">失敗</span>{run.error_message && <p className="mt-1 break-words text-xs leading-4 text-red-700" title={run.error_message}>原因: {run.error_message}</p>}</div>;
  return <span className="inline-flex items-center border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">完了</span>;
}
function Summary({ label, value, detail, icon, tone = "neutral" }: { label: string; value: string; detail: string; icon: React.ReactNode; tone?: "neutral" | "success" | "danger" }) { const colors = { neutral: "bg-slate-100 text-slate-600", success: "bg-emerald-50 text-emerald-700", danger: "bg-red-50 text-red-700" }; return <div className="border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`flex h-7 w-7 items-center justify-center ${colors[tone]}`}>{icon}</span></div><p className="mt-3 text-xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
