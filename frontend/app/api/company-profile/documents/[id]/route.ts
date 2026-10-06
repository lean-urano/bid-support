import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteDocument, getDocument } from "@/lib/queries/company-profile";
import { deleteStoredFile, readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const document = await getDocument(Number(id));
  if (!document) return NextResponse.json({ error: "not found" }, { status: 404 });

  const buffer = await readStoredFile(document.stored_path);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mime_type ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.original_filename)}`,
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const document = await getDocument(Number(id));
  if (!document) return NextResponse.json({ error: "not found" }, { status: 404 });

  await deleteStoredFile(document.stored_path);
  await deleteDocument(document.id);
  return NextResponse.json({ ok: true });
}
