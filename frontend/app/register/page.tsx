"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DocumentType = "terms" | "privacy";

const inputClass =
  "h-10 rounded-lg border-slate-200 bg-white px-3 text-sm shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20";
const labelClass = "mb-2 text-xs font-semibold text-slate-700";

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className={labelClass}>
        {label}
        {required ? <span className="text-blue-600" aria-label="必須">*</span> : <span className="font-normal text-slate-400">（任意）</span>}
      </Label>
      {children}
      {hint ? <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2.2} />
        <h2 className="text-sm font-bold tracking-wide text-slate-800">{title}</h2>
      </div>
      <CardContent className="grid gap-5 p-5">{children}</CardContent>
    </Card>
  );
}

function SelectField({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <Field label={label} required={required}>
      <select required={required} className={`${inputClass} w-full appearance-none border`} defaultValue="">
        <option value="" disabled>選択してください</option>
        {children}
      </select>
    </Field>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [reviewed, setReviewed] = useState<Record<DocumentType, boolean>>({ terms: false, privacy: false });
  const [representative, setRepresentative] = useState(false);
  const [documentOpen, setDocumentOpen] = useState<DocumentType | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalStatus, setPostalStatus] = useState<"idle" | "loading" | "success" | "not-found" | "error">("idle");

  const canSubmit = useMemo(() => reviewed.terms && reviewed.privacy && representative, [reviewed, representative]);

  const reviewDocument = (document: DocumentType) => {
    setDocumentOpen(null);
    setReviewed((current) => ({ ...current, [document]: true }));
  };

  const fillAddressFromPostalCode = async () => {
    const normalizedPostalCode = postalCode.replace(/[^0-9]/g, "");
    if (normalizedPostalCode.length !== 7) {
      setPostalStatus("not-found");
      return;
    }

    setPostalStatus("loading");
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizedPostalCode}`);
      if (!response.ok) throw new Error("postal lookup failed");
      const data: { results?: Array<{ address1: string; address2: string; address3: string }> } = await response.json();
      const result = data.results?.[0];
      if (!result) {
        setPostalStatus("not-found");
        return;
      }
      setPrefecture(result.address1);
      setCity(result.address2);
      setAddress(result.address3);
      setPostalStatus("success");
    } catch {
      setPostalStatus("error");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#eef3f9] px-4 py-12 text-slate-900 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <Card className="mx-auto max-w-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="px-6 py-12 text-center sm:px-12">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-7 w-7" /></div>
              <h1 className="mt-5 text-xl font-bold text-slate-900">登録申請を受け付けました</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">入力いただいたメールアドレスに、確認メールをお送りします。メールの案内に沿って登録を完了してください。</p>
              <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">ログイン画面へ <ArrowRight className="h-4 w-4" /></Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f9] px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-[22px] font-extrabold tracking-tight text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white"><Building2 className="h-4 w-4" /></span>
              bidサポート
            </div>
            <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">新規企業登録</h1>
            <p className="mt-2 text-xs leading-5 text-slate-500"><span className="text-blue-600">*</span> は必須項目です。住所・連絡先は契約書面・請求の発行に使用します。</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Section icon={Building2} title="会社情報">
              <Field label="会社名（屋号・略称）" required>
                <Input required name="companyName" placeholder="例：株式会社〇〇" className={inputClass} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField label="法人格" required><option>株式会社</option><option>有限会社</option><option>合同会社</option><option>法人格なし（個人事業主・屋号等）</option></SelectField>
                <Field label="法人格の位置" required>
                  <div className="flex h-10 items-center gap-5 text-sm text-slate-600">
                    <label className="flex items-center gap-2"><input type="radio" name="corporatePosition" value="before" defaultChecked className="accent-blue-600" /> 前</label>
                    <label className="flex items-center gap-2"><input type="radio" name="corporatePosition" value="after" className="accent-blue-600" /> 後</label>
                  </div>
                </Field>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-xs">
                <p className="flex items-center gap-2 font-bold text-blue-700"><ClipboardList className="h-4 w-4" />契約書記載用 正式名称（自動）</p>
                <p className="mt-2 font-medium text-slate-500">会社名・法人格を入力すると表示されます</p>
              </div>
            </Section>

            <Section icon={MapPin} title="本店所在地">
              <Field label="郵便番号" required hint="半角数字7桁（ハイフン可）">
                <div className="flex gap-2">
                  <Input required name="postalCode" value={postalCode} onChange={(event) => { setPostalCode(event.target.value); setPostalStatus("idle"); }} inputMode="numeric" placeholder="123-4567" className={`${inputClass} max-w-[150px]`} />
                  <Button type="button" variant="outline" onClick={fillAddressFromPostalCode} disabled={postalStatus === "loading"} className="h-10 border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"><MapPin className="h-3.5 w-3.5" />{postalStatus === "loading" ? "検索中…" : "住所を自動入力"}</Button>
                </div>
                {postalStatus === "not-found" ? <p className="mt-2 text-xs font-medium text-amber-700">郵便番号が見つかりません。7桁の郵便番号を確認してください。</p> : null}
                {postalStatus === "error" ? <p className="mt-2 text-xs font-medium text-red-600">住所を取得できませんでした。時間をおいて再度お試しください。</p> : null}
                {postalStatus === "success" ? <p className="mt-2 text-xs font-medium text-emerald-700">住所を自動入力しました。</p> : null}
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="都道府県" required>
                  <select required name="prefecture" value={prefecture} onChange={(event) => setPrefecture(event.target.value)} className={`${inputClass} w-full appearance-none border`}>
                    <option value="" disabled>選択してください</option>
                    {["北海道", "東京都", "神奈川県", "愛知県", "大阪府", "福岡県"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="市区町村" required><Input required name="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="例：千代田区" className={inputClass} /></Field>
              </div>
              <Field label="番地" required><Input required name="address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="例：丸の内1-2-3" className={inputClass} /></Field>
              <Field label="建物名・部屋番号"><Input name="building" placeholder="例：丸の内ビル 5F" className={inputClass} /></Field>
            </Section>

            <Section icon={Phone} title="連絡先・会社属性">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="代表電話番号" required><Input required name="phone" type="tel" placeholder="03-1234-5678" className={inputClass} /></Field>
                <Field label="ウェブサイトURL"><Input name="website" type="url" placeholder="https://example.com" className={inputClass} /></Field>
                <SelectField label="業種" required><option>総合建設業</option><option>土木工事業</option><option>建築工事業</option><option>設備工事業</option><option>その他</option></SelectField>
                <SelectField label="従業員規模"><option>1〜9名</option><option>10〜49名</option><option>50〜99名</option><option>100名以上</option></SelectField>
              </div>
            </Section>

            <Section icon={UserRound} title="利用担当者">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="姓" required><Input required name="lastName" placeholder="例：山田" className={inputClass} /></Field>
                <Field label="名" required><Input required name="firstName" placeholder="例：太郎" className={inputClass} /></Field>
                <Field label="姓カナ" required><Input required name="lastNameKana" placeholder="例：ヤマダ" className={inputClass} /></Field>
                <Field label="名カナ" required><Input required name="firstNameKana" placeholder="例：タロウ" className={inputClass} /></Field>
                <Field label="部署"><Input name="department" placeholder="例：営業部" className={inputClass} /></Field>
                <Field label="役職"><Input name="title" placeholder="例：課長" className={inputClass} /></Field>
              </div>
              <Field label="担当者直通電話" hint="任意"><Input name="directPhone" type="tel" placeholder="例：090-1234-5678" className={inputClass} /></Field>
            </Section>

            <Section icon={LockKeyhole} title="ログイン情報">
              <Field label="メールアドレス（ログインID）" required><Input required name="email" type="email" placeholder="user@company.co.jp" className={inputClass} /></Field>
              <Field label="メールアドレス（確認用）" required><Input required name="emailConfirmation" type="email" placeholder="同じアドレスを再入力" className={inputClass} /></Field>
              <Field label="パスワード" required hint="8文字以上。英字・数字を組み合わせてください。">
                <div className="relative"><Input required name="password" type={showPassword ? "text" : "password"} minLength={8} placeholder="8文字以上" className={`${inputClass} pr-10`} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}><EyeOff className={`h-4 w-4 ${showPassword ? "hidden" : ""}`} /><Eye className={`h-4 w-4 ${showPassword ? "" : "hidden"}`} /></button></div>
              </Field>
            </Section>

            <Card className="rounded-xl border border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="space-y-4 p-5">
                <div><h2 className="text-sm font-bold text-slate-800">利用規約およびプライバシーポリシー</h2><p className="mt-1 text-xs text-slate-500">内容をご確認のうえ、同意してください。</p></div>
                {(["terms", "privacy"] as DocumentType[]).map((document) => {
                  const isTerms = document === "terms";
                  const isReviewed = reviewed[document];
                  return <button key={document} type="button" onClick={() => setDocumentOpen(document)} className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${isReviewed ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"}`}><FileText className={`h-4 w-4 ${isReviewed ? "text-emerald-600" : "text-blue-600"}`} /><span className="flex-1 text-sm font-bold text-blue-700">{isTerms ? "利用規約を確認する" : "プライバシーポリシーを確認する"}</span><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${isReviewed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{isReviewed ? "確認済み" : "未確認"}</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>;
                })}
                <label className="flex items-start gap-3 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-600"><input type="checkbox" checked={representative} onChange={(event) => setRepresentative(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-600" />私は会社を代表して、本サービスの契約およびサブスクリプションへの登録を行う権限を有しています。</label>
                <p className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />入力内容はSSLで安全に送信されます。</p>
              </CardContent>
            </Card>

            <Button type="submit" disabled={!canSubmit} className="h-12 w-full bg-blue-600 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300">登録を申し込む</Button>
            <div className="border-t border-slate-200 pt-5 text-center"><p className="text-xs text-slate-500">すでにアカウントをお持ちですか？</p><Link href="/login" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">ログイン画面へ <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          </form>
        </div>
      </div>

      {documentOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="document-title"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-blue-600">bidサポート</p><h2 id="document-title" className="mt-1 text-lg font-bold">{documentOpen === "terms" ? "利用規約" : "プライバシーポリシー"}</h2></div><button type="button" onClick={() => setDocumentOpen(null)} aria-label="閉じる" className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button></div><div className="mt-5 max-h-60 overflow-y-auto rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-600"><p>本サービスの利用条件および個人情報の取り扱いについて定めています。</p><p className="mt-3">サービスをご利用いただく前に内容をご確認ください。実際の運用時には、正式な文書内容をここに表示します。</p></div><Button type="button" onClick={() => reviewDocument(documentOpen)} className="mt-5 h-10 w-full bg-blue-600 font-bold text-white hover:bg-blue-700">内容を確認しました</Button></div></div> : null}
    </main>
  );
}
