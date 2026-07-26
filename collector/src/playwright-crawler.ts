// bidAI(Python)のPlaywrightCrawlerを移植。JSレンダリングが必要なソース用。
// geps/gifu/nexco-eastの3ソースは静的HTMLのため現時点では未使用だが、
// 今後追加するソースでJS描画が必要な場合はこれを使う。
import { chromium } from "playwright";

export async function fetchRenderedHtml(url: string, waitSelector?: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; TenderSupportBot/1.0)",
      locale: "ja-JP",
    });
    const page = await context.newPage();
    await page.goto(url, { timeout: 30000, waitUntil: "networkidle" });

    if (waitSelector) {
      try {
        await page.waitForSelector(waitSelector, { timeout: 10000 });
      } catch {
        console.warn(`Selector ${waitSelector} not found on ${url}`);
      }
    }

    return await page.content();
  } finally {
    await browser.close();
  }
}
