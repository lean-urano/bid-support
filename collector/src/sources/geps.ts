// bidAI(Python) app/crawler/sources/geps.py の移植。
// GEPS(政府電子調達システム)。実サイト構造での検証は未実施のベストエフォート実装
// (Python版コメントに"real selectors need to be verified against live site"とある通り)。
import * as cheerio from "cheerio";
import { createRateLimiter, fetchHtml } from "../html-crawler.js";
import { saveBids, type ScrapedBid } from "../bids.js";
import { failScraperRun, finishScraperRun, startScraperRun } from "../scraper-runs.js";

const GEPS_BASE = "https://www.geps.go.jp";
const GEPS_BID_LIST = "https://www.geps.go.jp/info";
const BID_KEYWORDS = ["公告", "入札", "調達", "案件", "公募", "選定"];

const rateLimit = createRateLimiter(1000);

function parseRows($: cheerio.CheerioAPI, baseUrl: string): ScrapedBid[] {
  const bids: ScrapedBid[] = [];
  $("table.bid-list tr, .procurement-list li, .notice-list .item").each((_, row) => {
    try {
      const linkEl = $(row).find("a").first();
      const href = linkEl.attr("href");
      if (!href) return;
      const title = linkEl.text().trim();
      if (!title || title.length < 5) return;

      bids.push({
        title,
        organization: "デジタル庁",
        category: null,
        location: null,
        budgetMin: null,
        budgetMax: null,
        announcedDate: null,
        deadline: null,
        detailUrl: new URL(href, baseUrl).toString(),
        rawData: { raw_text: $(row).text().replace(/\s+/g, " ").trim() },
      });
    } catch (err) {
      console.debug("Failed to parse row:", err);
    }
  });
  return bids;
}

function parseLinksFallback($: cheerio.CheerioAPI, baseUrl: string): ScrapedBid[] {
  const bids: ScrapedBid[] = [];
  const seenUrls = new Set<string>();

  $("a[href]").each((_, link) => {
    const href = $(link).attr("href") ?? "";
    const text = $(link).text().trim();
    if (text.length < 10) return;
    if (!BID_KEYWORDS.some((kw) => text.includes(kw) || href.includes(kw))) return;

    const url = new URL(href, baseUrl).toString();
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    bids.push({
      title: text,
      organization: "",
      category: null,
      location: null,
      budgetMin: null,
      budgetMax: null,
      announcedDate: null,
      deadline: null,
      detailUrl: url,
      rawData: { raw_text: text },
    });
  });

  return bids.slice(0, 100);
}

async function crawl(): Promise<ScrapedBid[]> {
  console.log("[geps] クロール開始");
  await rateLimit();
  const html = await fetchHtml(GEPS_BID_LIST);
  const $ = cheerio.load(html);

  let bids = parseRows($, GEPS_BID_LIST);
  if (bids.length === 0) bids = parseLinksFallback($, GEPS_BID_LIST);

  console.log(`[geps] ${bids.length}件取得完了`);
  return bids;
}

async function main() {
  const runId = Number(process.env.SCRAPER_RUN_ID) || await startScraperRun("geps");
  try {
    const bids = await crawl();
    const { newCount, updatedCount } = await saveBids(bids);
    await finishScraperRun(runId, { successCount: bids.length, failureCount: 0 });
    console.log(`[geps] ${newCount} new, ${updatedCount} updated`);
  } catch (err) {
    await failScraperRun(runId, err);
    throw err;
  }
}

main()
  .catch((err) => {
    console.error("[geps] クロール失敗:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
