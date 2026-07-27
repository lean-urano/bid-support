// bidAI(Python) app/crawler/sources/gifu.py の移植。
// 岐阜県入札情報。一覧ページ(search.php)から詳細ページURLを収集し、
// 各詳細ページの構造化フィールド(工事名・予定価格・締切日等)を抽出する。
import * as cheerio from "cheerio";
import { createRateLimiter, downloadPdfText, fetchHtml, sleep } from "../html-crawler.js";
import { saveBids, type ScrapedBid } from "../bids.js";

const BASE_URL = "https://www.pref.gifu.lg.jp";
const LIST_URL = `${BASE_URL}/bid/search/search.php`;
const REIWA_OFFSET = 2018;

const rateLimit = createRateLimiter(1000);

function parseJapaneseDate(text: string): string | null {
  const patterns: Array<{ re: RegExp; reiwa: boolean }> = [
    { re: /(\d{4})[年/\-.](\d{1,2})[月/\-.](\d{1,2})/, reiwa: false },
    { re: /令和(\d+)年(\d{1,2})月(\d{1,2})日/, reiwa: true },
    { re: /R(\d+)\.(\d{1,2})\.(\d{1,2})/, reiwa: true },
  ];
  for (const { re, reiwa } of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const y = reiwa ? Number(m[1]) + REIWA_OFFSET : Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return null;
}

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[,，\s円]/g, "");
  const m = cleaned.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function extractArticleId(url: string): string {
  const m = url.match(/\/bid\/bid\/(\d+)\.html/);
  return m ? m[1] : url;
}

async function fetchList(): Promise<string[]> {
  await rateLimit();
  const html = await fetchHtml(LIST_URL);
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/\/bid\/bid\/\d+\.html/.test(href)) {
      const fullUrl = new URL(href, BASE_URL).toString();
      if (!seen.has(fullUrl)) {
        seen.add(fullUrl);
        urls.push(fullUrl);
      }
    }
  });
  return urls;
}

async function parseDetail(html: string, url: string): Promise<ScrapedBid | null> {
  const $ = cheerio.load(html);
  const main = $("#main");
  if (main.length === 0) return null;

  // <h3>フィールド名</h3><div class="detail_writing">値</div> を順に処理
  const fields = new Map<string, string>();
  main.find("h3").each((_, h3) => {
    const fieldName = $(h3).text().trim();
    const valueDiv = $(h3).next("div.detail_writing");
    if (valueDiv.length > 0) {
      fields.set(fieldName, valueDiv.text().trim());
    }
  });
  if (fields.size === 0) return null;

  const titleKeys = ["工事名", "業務名", "物品名", "件名", "調達件名"];
  let title = titleKeys.map((k) => fields.get(k)).find((v) => v);
  if (!title) title = $("h1").first().text().trim() || undefined;
  if (!title) return null;

  const budgetKeys = ["予定価格（円）", "予定価格", "上限額（円）"];
  const budgetMaxRaw = budgetKeys.map((k) => fields.get(k)).find((v) => v);
  const budgetMax = budgetMaxRaw ? parsePrice(budgetMaxRaw) : null;

  const deadlineKeys = ["開札(入札)予定日", "入札予定日", "開札予定日"];
  const deadlineRaw = deadlineKeys.map((k) => fields.get(k)).find((v) => v);
  const deadline = deadlineRaw ? parseJapaneseDate(deadlineRaw) : null;

  // 公告日: detail_freeセクション(「令和X年X月X日」)から取得。無ければページ更新日にフォールバック。
  let announcedDate: string | null = null;
  const detailFree = main.find(".detail_free");
  if (detailFree.length > 0) announcedDate = parseJapaneseDate(detailFree.text());
  if (!announcedDate) {
    const dateSpan = $(".content_header_wrap span:not(.open_page_id):not(.print_link)").first();
    if (dateSpan.length > 0) announcedDate = parseJapaneseDate(dateSpan.text());
  }

  const category = fields.get("工事種別") ?? fields.get("業務種別") ?? fields.get("物品種別") ?? null;
  const orgLink = $("#content_header a").first();
  const organization = orgLink.length > 0 ? orgLink.text().trim() : "岐阜県";
  const location = fields.get("工事場所") ?? fields.get("業務場所") ?? null;

  const articleId = extractArticleId(url);
  const pdfEntries: Array<{ label: string; url: string }> = [];
  const pdfTexts: string[] = [];
  const pdfLinks: Array<{ label: string; href: string }> = [];
  main.find("a[href]").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    if (href.toLowerCase().includes(".pdf")) {
      pdfLinks.push({ label: $(a).text().trim(), href: new URL(href, BASE_URL).toString() });
    }
  });
  for (const { label, href } of pdfLinks) {
    try {
      await rateLimit();
      const { text } = await downloadPdfText(href);
      pdfEntries.push({ label, url: href });
      if (text) pdfTexts.push(text);
    } catch (err) {
      console.warn(`PDF download failed ${href}:`, err);
      pdfEntries.push({ label, url: href });
    }
  }

  let rawText = [...fields.entries()].map(([k, v]) => `${k}:${v}`).join(" ");
  if (location) rawText = `${location} ${rawText}`;
  if (pdfTexts.length > 0) rawText = `${rawText}\n${pdfTexts.join("\n")}`;

  return {
    title: title.slice(0, 200),
    organization,
    category,
    location,
    budgetMin: null,
    budgetMax,
    announcedDate,
    deadline,
    detailUrl: url,
    rawData: {
      prefecture: "21",
      external_id: articleId,
      pdf_urls: pdfEntries,
      raw_text: rawText.slice(0, 10000),
      extracted_data: pdfTexts.length > 0 ? { pdf_text: pdfTexts.join("\n") } : null,
    },
  };
}

async function crawl(): Promise<ScrapedBid[]> {
  console.log("[gifu] クロール開始");
  const detailUrls = await fetchList();
  console.log(`[gifu] ${detailUrls.length}件の詳細ページを取得`);

  const bids: ScrapedBid[] = [];
  for (const url of detailUrls) {
    try {
      await rateLimit();
      const html = await fetchHtml(url);
      const bid = await parseDetail(html, url);
      if (bid) bids.push(bid);
    } catch (err) {
      console.debug(`詳細ページ取得失敗 ${url}:`, err);
    }
    await sleep(200);
  }

  console.log(`[gifu] ${bids.length}件取得完了`);
  return bids;
}

async function main() {
  const bids = await crawl();
  const { newCount, updatedCount } = await saveBids(bids);
  console.log(`[gifu] ${newCount} new, ${updatedCount} updated`);
}

main()
  .catch((err) => {
    console.error("[gifu] クロール失敗:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
