import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/storage";
import { findUserByEmail } from "@/lib/queries/users";
import { ensureCompanyProfile, getCompanyProfileFull, insertDocument } from "@/lib/queries/company-profile";
import { extractCompanyProfileFromFiles, isAnalyzableMimeType, type AnalyzableFile } from "@/lib/ai/company-profile-extractor";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 50;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "ファイルを選択してください。" }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `一度にアップロードできるのは${MAX_FILES}件までです。` }, { status: 400 });
  const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversized) return NextResponse.json({ error: `「${oversized.name}」が50MBの上限を超えています。` }, { status: 400 });

  const companyId = await ensureCompanyProfile();
  const uploader = await findUserByEmail(session.email);

  const savedDocuments = [];
  const analyzable: AnalyzableFile[] = [];
  for (const file of files) {
    const { storedPath, size } = await saveUploadedFile(file);
    const document = await insertDocument({
      companyId,
      uploadedBy: uploader?.id ?? null,
      originalFilename: file.name,
      storedPath,
      mimeType: file.type || null,
      fileSize: size,
    });
    savedDocuments.push(document);

    if (isAnalyzableMimeType(file.type)) {
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      analyzable.push({ filename: file.name, mimeType: file.type, base64 });
    }
  }

  if (analyzable.length === 0) {
    const data = await getCompanyProfileFull();
    return NextResponse.json({ extracted: null, documents: data.documents, notice: "PDFまたは画像ファイルが含まれていないため、AI解析は実行されませんでした。" });
  }

  try {
    const extracted = await extractCompanyProfileFromFiles(analyzable);
    const data = await getCompanyProfileFull();
    return NextResponse.json({ extracted, documents: data.documents });
  } catch (error) {
    const data = await getCompanyProfileFull();
    return NextResponse.json(
      { extracted: null, documents: data.documents, error: error instanceof Error ? error.message : "AI解析に失敗しました。" },
      { status: 502 }
    );
  }
}
