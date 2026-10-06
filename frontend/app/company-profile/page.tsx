"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ANALYZABLE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 50;

interface ProfileForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  philosophy: string;
  specialties: string;
}

interface LicenseRow {
  key: string;
  licenseType: string;
  licenseNumber: string;
  validFrom: string;
  validUntil: string;
  notes: string;
}

interface AchievementRow {
  key: string;
  title: string;
  client: string;
  category: string;
  amount: string;
  completedYear: string;
  location: string;
  description: string;
}

interface DocumentRow {
  id: number;
  original_filename: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

const emptyProfile: ProfileForm = { name: "", address: "", phone: "", email: "", description: "", philosophy: "", specialties: "" };

function newKey() {
  return Math.random().toString(36).slice(2);
}

function emptyLicense(): LicenseRow {
  return { key: newKey(), licenseType: "", licenseNumber: "", validFrom: "", validUntil: "", notes: "" };
}

function emptyAchievement(): AchievementRow {
  return { key: newKey(), title: "", client: "", category: "", amount: "", completedYear: "", location: "", description: "" };
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function CompanyProfilePage() {
  useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/company-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setProfile({
          name: data.profile?.name ?? "",
          address: data.profile?.address ?? "",
          phone: data.profile?.phone ?? "",
          email: data.profile?.email ?? "",
          description: data.profile?.description ?? "",
          philosophy: data.profile?.philosophy ?? "",
          specialties: data.profile?.specialties ?? "",
        });
        setLicenses(
          (data.licenses ?? []).map((license: Record<string, string>) => ({
            key: newKey(),
            licenseType: license.license_type ?? "",
            licenseNumber: license.license_number ?? "",
            validFrom: license.valid_from ? String(license.valid_from).slice(0, 10) : "",
            validUntil: license.valid_until ? String(license.valid_until).slice(0, 10) : "",
            notes: license.notes ?? "",
          }))
        );
        setAchievements(
          (data.achievements ?? []).map((achievement: Record<string, string>) => ({
            key: newKey(),
            title: achievement.title ?? "",
            client: achievement.client ?? "",
            category: achievement.category ?? "",
            amount: achievement.amount ?? "",
            completedYear: achievement.completed_year ? String(achievement.completed_year) : "",
            location: achievement.location ?? "",
            description: achievement.description ?? "",
          }))
        );
        setDocuments(data.documents ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    setAnalyzeError(null);
    setAnalyzeMessage(null);
    setPendingFiles((prev) => {
      const merged = [...prev, ...Array.from(incoming)];
      return merged.slice(0, MAX_FILES);
    });
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (pendingFiles.length === 0) return;
    const oversized = pendingFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setAnalyzeError(`「${oversized.name}」が50MBの上限を超えています。`);
      return;
    }
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeMessage(null);
    try {
      const formData = new FormData();
      pendingFiles.forEach((file) => formData.append("files", file));
      const res = await fetch("/api/company-profile/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error ?? "AI解析に失敗しました。");
        if (data.documents) setDocuments(data.documents);
        return;
      }
      if (data.documents) setDocuments(data.documents);
      if (data.notice) setAnalyzeMessage(data.notice);
      if (data.extracted) {
        const extracted = data.extracted;
        setProfile((prev) => ({
          name: extracted.name || prev.name,
          address: extracted.address || prev.address,
          phone: extracted.phone || prev.phone,
          email: extracted.email || prev.email,
          description: extracted.description || prev.description,
          philosophy: extracted.philosophy || prev.philosophy,
          specialties: extracted.specialties || prev.specialties,
        }));
        if (Array.isArray(extracted.licenses) && extracted.licenses.length > 0) {
          setLicenses((prev) => [
            ...prev,
            ...extracted.licenses.map((license: Record<string, string | number | null>) => ({
              key: newKey(),
              licenseType: (license.licenseType as string) ?? "",
              licenseNumber: (license.licenseNumber as string) ?? "",
              validFrom: (license.validFrom as string) ?? "",
              validUntil: (license.validUntil as string) ?? "",
              notes: (license.notes as string) ?? "",
            })),
          ]);
        }
        if (Array.isArray(extracted.achievements) && extracted.achievements.length > 0) {
          setAchievements((prev) => [
            ...prev,
            ...extracted.achievements.map((achievement: Record<string, string | number | null>) => ({
              key: newKey(),
              title: (achievement.title as string) ?? "",
              client: (achievement.client as string) ?? "",
              category: (achievement.category as string) ?? "",
              amount: achievement.amount != null ? String(achievement.amount) : "",
              completedYear: achievement.completedYear != null ? String(achievement.completedYear) : "",
              location: (achievement.location as string) ?? "",
              description: (achievement.description as string) ?? "",
            })),
          ]);
        }
        setAnalyzeMessage((prev) => prev ?? "AIの解析結果をフォームに反映しました。内容を確認して保存してください。");
      }
      setPendingFiles([]);
    } catch {
      setAnalyzeError("AI解析中に通信エラーが発生しました。");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    const res = await fetch(`/api/company-profile/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocuments((prev) => prev.filter((document) => document.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/company-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          licenses: licenses.map((license) => ({
            licenseType: license.licenseType,
            licenseNumber: license.licenseNumber || null,
            validFrom: license.validFrom || null,
            validUntil: license.validUntil || null,
            notes: license.notes || null,
          })),
          achievements: achievements.map((achievement) => ({
            title: achievement.title,
            client: achievement.client || null,
            category: achievement.category || null,
            amount: achievement.amount ? Number(achievement.amount) : null,
            completedYear: achievement.completedYear ? Number(achievement.completedYear) : null,
            location: achievement.location || null,
            description: achievement.description || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "保存に失敗しました。");
        return;
      }
      setSavedAt(new Date());
    } catch {
      setSaveError("保存中に通信エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-24 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 企業情報を読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400" /> 企業情報入力
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            自社の基本情報・保有資格・工事実績を登録します。この情報は「入札案件調査AI」のおすすめ度スコア算出に使用されます。
            資格証や実績書類をアップロードすると、AIが内容を読み取ってフォームに自動反映します。
          </p>
        </div>

        {/* アップロード */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900">書類のアップロード</h2>
          <p className="mt-1 text-xs text-slate-500">
            対応形式：PDF・PNG・JPG・GIF・WEBP（1ファイル50MB、最大{MAX_FILES}件）。それ以外の形式は保存のみでAI解析は行われません。
          </p>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
              dragActive ? "border-blue-400 bg-blue-50/50" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <UploadCloud className="w-6 h-6 text-slate-400" />
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-blue-600">クリックして選択</span>、またはドラッグ&ドロップ
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ANALYZABLE_TYPES.join(",")}
              onChange={(event) => event.target.files && addFiles(event.target.files)}
            />
          </div>

          {pendingFiles.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {pendingFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatFileSize(file.size)}</span>
                  </span>
                  <button type="button" onClick={() => removePendingFile(index)} className="text-slate-400 hover:text-red-600 shrink-0" aria-label="ファイルを削除">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={pendingFiles.length === 0 || analyzing}
              className="h-9 px-4"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AIで解析してフォームに反映
            </Button>
            {analyzing && <span className="text-xs text-slate-500">解析には数十秒かかる場合があります</span>}
          </div>

          {analyzeMessage && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {analyzeMessage}
            </p>
          )}
          {analyzeError && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" /> {analyzeError}
            </p>
          )}
        </section>

        {/* 基本情報 */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900">基本情報</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="会社名" required>
              <Input value={profile.name} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} />
            </Field>
            <Field label="電話番号">
              <Input value={profile.phone} onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))} />
            </Field>
            <Field label="メールアドレス">
              <Input type="email" value={profile.email} onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))} />
            </Field>
            <Field label="所在地">
              <Input value={profile.address} onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))} />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field label="事業概要">
              <Textarea value={profile.description} onChange={(value) => setProfile((prev) => ({ ...prev, description: value }))} />
            </Field>
            <Field label="経営理念">
              <Textarea value={profile.philosophy} onChange={(value) => setProfile((prev) => ({ ...prev, philosophy: value }))} />
            </Field>
            <Field label="得意分野・重点業種">
              <Textarea value={profile.specialties} onChange={(value) => setProfile((prev) => ({ ...prev, specialties: value }))} />
            </Field>
          </div>
        </section>

        {/* 資格・許可 */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">保有資格・許可</h2>
            <button type="button" onClick={() => setLicenses((prev) => [...prev, emptyLicense()])} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> 行を追加
            </button>
          </div>

          {licenses.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">まだ登録されていません。</p>
          ) : (
            <div className="mt-4 space-y-4">
              {licenses.map((license, index) => (
                <div key={license.key} className="border border-slate-200 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => setLicenses((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                    aria-label="この資格を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <Field label="資格・許可の名称" required>
                      <Input
                        value={license.licenseType}
                        onChange={(event) => setLicenses((prev) => prev.map((l, i) => (i === index ? { ...l, licenseType: event.target.value } : l)))}
                      />
                    </Field>
                    <Field label="許可番号・登録番号">
                      <Input
                        value={license.licenseNumber}
                        onChange={(event) => setLicenses((prev) => prev.map((l, i) => (i === index ? { ...l, licenseNumber: event.target.value } : l)))}
                      />
                    </Field>
                    <Field label="取得日">
                      <Input
                        type="date"
                        value={license.validFrom}
                        onChange={(event) => setLicenses((prev) => prev.map((l, i) => (i === index ? { ...l, validFrom: event.target.value } : l)))}
                      />
                    </Field>
                    <Field label="有効期限">
                      <Input
                        type="date"
                        value={license.validUntil}
                        onChange={(event) => setLicenses((prev) => prev.map((l, i) => (i === index ? { ...l, validUntil: event.target.value } : l)))}
                      />
                    </Field>
                    <Field label="補足（等級・保有者名など）" className="sm:col-span-2">
                      <Input
                        value={license.notes}
                        onChange={(event) => setLicenses((prev) => prev.map((l, i) => (i === index ? { ...l, notes: event.target.value } : l)))}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 工事実績 */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">工事実績</h2>
            <button type="button" onClick={() => setAchievements((prev) => [...prev, emptyAchievement()])} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> 行を追加
            </button>
          </div>

          {achievements.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">まだ登録されていません。</p>
          ) : (
            <div className="mt-4 space-y-4">
              {achievements.map((achievement, index) => (
                <div key={achievement.key} className="border border-slate-200 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => setAchievements((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                    aria-label="この実績を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                    <Field label="工事名" required className="sm:col-span-2">
                      <Input
                        value={achievement.title}
                        onChange={(event) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, title: event.target.value } : a)))}
                      />
                    </Field>
                    <Field label="発注者">
                      <Input
                        value={achievement.client}
                        onChange={(event) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, client: event.target.value } : a)))}
                      />
                    </Field>
                    <Field label="工種">
                      <Input
                        value={achievement.category}
                        onChange={(event) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, category: event.target.value } : a)))}
                      />
                    </Field>
                    <Field label="契約金額（円）">
                      <Input
                        type="number"
                        value={achievement.amount}
                        onChange={(event) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, amount: event.target.value } : a)))}
                      />
                    </Field>
                    <Field label="竣工年">
                      <Input
                        type="number"
                        value={achievement.completedYear}
                        onChange={(event) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, completedYear: event.target.value } : a)))}
                      />
                    </Field>
                    <Field label="施工場所" className="sm:col-span-2">
                      <Input
                        value={achievement.location}
                        onChange={(event) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, location: event.target.value } : a)))}
                      />
                    </Field>
                    <Field label="工事概要" className="sm:col-span-2">
                      <Textarea value={achievement.description} onChange={(value) => setAchievements((prev) => prev.map((a, i) => (i === index ? { ...a, description: value } : a)))} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* アップロード済み書類 */}
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900">アップロード済み書類</h2>
          {documents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">アップロード済みの書類はありません。</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{document.original_filename}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatFileSize(document.file_size)} ・ {new Date(document.created_at).toLocaleDateString("ja-JP")}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <a href={`/api/company-profile/documents/${document.id}`} className="text-slate-400 hover:text-blue-600" aria-label="ダウンロード">
                      <Download className="w-4 h-4" />
                    </a>
                    <button type="button" onClick={() => handleDeleteDocument(document.id)} className="text-slate-400 hover:text-red-600" aria-label="削除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 保存 */}
        <div className="flex items-center gap-3 pb-4">
          <Button type="button" onClick={handleSave} disabled={saving} className="h-9 px-5">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            保存する
          </Button>
          {savedAt && !saveError && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> {savedAt.toLocaleTimeString("ja-JP")} に保存しました
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {saveError}
            </span>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={3}
      className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 leading-relaxed"
    />
  );
}
