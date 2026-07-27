// bidAI(Python)のHTMLCrawler/BaseCrawlerを移植した薄い共通ヘルパー群。
// 各ソース(sources/*.ts)はこれらを使ってfetch+リトライ+レート制限+PDFテキスト抽出を行う。
import pdfParse from "pdf-parse";

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; BidSupportBot/1.0; procurement info collector)",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// bidAIの@retry(stop_after_attempt(3), wait_exponential(multiplier=2, min=4, max=30))と同じ挙動。
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === attempts - 1) break;
      const waitMs = Math.min(30000, Math.max(4000, 2 ** (i + 1) * 1000));
      await sleep(waitMs);
    }
  }
  throw lastError;
}

// 直近リクエストからの経過時間を見て最小間隔を確保する、ソースごとの簡易レートリミッタ。
export function createRateLimiter(delayMs = 1000) {
  let lastRequestAt = 0;
  return async function rateLimit(): Promise<void> {
    const elapsed = Date.now() - lastRequestAt;
    if (lastRequestAt !== 0 && elapsed < delayMs) {
      await sleep(delayMs - elapsed);
    }
    lastRequestAt = Date.now();
  };
}

export async function fetchHtml(url: string, headers: Record<string, string> = {}): Promise<string> {
  return withRetry(async () => {
    const res = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
    return res.text();
  });
}

export interface DownloadedPdf {
  url: string;
  text: string;
}

export async function downloadPdfText(url: string): Promise<DownloadedPdf> {
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`pdf fetch failed: ${url} -> ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  try {
    const parsed = await pdfParse(buffer);
    return { url, text: parsed.text ?? "" };
  } catch (err) {
    console.warn(`PDF text extraction failed ${url}:`, err);
    return { url, text: "" };
  }
}
