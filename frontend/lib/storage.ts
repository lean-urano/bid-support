import { randomUUID } from "node:crypto";
import path from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const uploadsDir = process.env.COMPANY_DOCS_DIR ?? path.join(process.cwd(), "uploads", "company-documents");

function extname(filename: string) {
  const ext = path.extname(filename);
  return /^\.[a-zA-Z0-9]{1,10}$/.test(ext) ? ext : "";
}

export async function saveUploadedFile(file: File): Promise<{ storedPath: string; size: number }> {
  await mkdir(uploadsDir, { recursive: true });
  const storedPath = `${randomUUID()}${extname(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, storedPath), buffer);
  return { storedPath, size: buffer.byteLength };
}

export async function readStoredFile(storedPath: string): Promise<Buffer> {
  return readFile(path.join(uploadsDir, storedPath));
}

export async function deleteStoredFile(storedPath: string): Promise<void> {
  await rm(path.join(uploadsDir, storedPath), { force: true });
}
