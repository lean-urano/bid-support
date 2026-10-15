import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Socket } from "node:net";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { fetchInternalImage } = require("next/dist/server/image-optimizer");
const { serveStatic } = require("next/dist/server/serve-static");

test("切断済みクライアントでもローカル画像取得が完了する", async () => {
  // 実ファイルとNext.jsの配信処理を使い、実際の切断済みsocketを渡す。
  const socket = new Socket();
  socket.destroy();
  assert.equal(socket.writable, false);
  const file = path.resolve("public/images/features/bid-research-ai.png");
  const expected = await readFile(file);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      fetchInternalImage("/images/features/bid-research-ai.png", { method: "GET", socket }, {}, 50 * 1024 * 1024,
        (req: unknown, res: unknown) => serveStatic(req, res, file)),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("切断後の画像取得が完了しない")), 2000);
      }),
    ]);
    assert.deepEqual(result.buffer, expected);
    assert.equal(result.contentType, "image/png");
  } finally {
    clearTimeout(timeout);
  }
});
