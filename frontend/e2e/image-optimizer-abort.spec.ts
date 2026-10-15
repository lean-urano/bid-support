import { createConnection } from "node:net";
import { test, expect } from "@playwright/test";

// UIで通常は使わない画像・サイズを使い、初回変換への切断も検証する。
// 確実な再現条件（切断済みsocket）はlib/image-optimizer.test.tsで別途検証する。
test("画像変換への接続を中断しても後続のHTTPリクエストが成功する", async ({ request, baseURL }) => {
  const origin = new URL(baseURL!);
  test.skip(origin.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(origin.hostname),
    "接続中断の検証はローカルPreviewだけで実行する");
  for (const width of [32, 48, 96, 256, 384, 640, 828, 1080, 1920]) {
    const imagePath = `/_next/image?url=%2Fimages%2Ffeatures%2Flegal-consultation-ai.png&w=${width}&q=75`;
    await new Promise<void>((resolve, reject) => {
      const socket = createConnection({ host: origin.hostname, port: Number(origin.port) });
      socket.setTimeout(5000, () => socket.destroy(new Error("Previewへの接続がタイムアウトしました")));
      socket.once("error", reject);
      socket.once("connect", () => {
        socket.write(`GET ${imagePath} HTTP/1.1\r\nHost: ${origin.host}\r\nAccept: image/webp\r\nConnection: close\r\n\r\n`);
        setTimeout(() => { socket.destroy(); resolve(); }, 1);
      });
    });
    const response = await request.get(imagePath, { headers: { Accept: "image/webp" }, timeout: 5000 });
    expect(response.status(), `${width}pxの切断後リクエスト`).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/webp");
    expect((await response.body()).length).toBeGreaterThan(0);
  }
});
