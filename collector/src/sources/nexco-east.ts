// bidAI(Python) app/crawler/sources/nexco_east.py の移植。
// NEXCO東日本 入札公告(受付中案件)。一覧を全ページ取得し、詳細ページのPDF本文もテキスト化する。
import * as cheerio from "cheerio";
import { createRateLimiter, downloadPdfText, fetchHtml, sleep } from "../html-crawler.js";
import { saveTenders, type ScrapedTender } from "../tenders.js";

const BASE_URL = "https://www.e-nexco.co.jp";
const SEARCH_URL = `${BASE_URL}/bids/public_notice/search_service`;

const rateLimit = createRateLimiter(1000);

function parseWarekiDate(text: string): string | null {
  const m = text.trim().match(/^R(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  const year = 2018 + Number(m[1]); // R1=2019, R8=2026
  return `${year}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

interface ListRow {
  detailUrl: string;
  organization: string;
  title: string;
  announcedDate: string | null;
  deadline: string | null;
  bidType: string;
  category: string;
}

async function fetchAllPages(): Promise<ListRow[]> {
  const results: ListRow[] = [];
  let page = 1;

  while (true) {
    await rateLimit();
    const url = `${SEARCH_URL}?rd_over_bids=1&page=${page}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const rows = $("table tbody tr");
    if (rows.length === 0) break;

    let foundAny = false;
    rows.each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length < 8) return;

      const linkTag = cols.eq(1).find("a").first();
      const detailHref = linkTag.attr("href") ?? "";
      if (!linkTag.length || !detailHref.startsWith("/")) return;

      foundAny = true;
      results.push({
        detailUrl: BASE_URL + detailHref,
        organization: cols.eq(0).text().trim(),
        title: linkTag.text().trim(),
        announcedDate: parseWarekiDate(cols.eq(2).text().trim()),
        deadline: parseWarekiDate(cols.eq(5).text().trim()),
        bidType: cols.eq(4).text().trim(),
        category: cols.eq(7).text().trim(),
      });
    });

    if (!foundAny) break;
    if (!html.includes(`page=${page + 1}`)) break;

    page += 1;
    await sleep(1000);
  }

  return results;
}

async function fetchDetail(row: ListRow): Promise<ScrapedTender | null> {
  await rateLimit();
  const html = await fetchHtml(row.detailUrl);
  const $ = cheerio.load(html);

  const pdfLinks: string[] = [];
  $("a[href$='.pdf' i]").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    pdfLinks.push(href.startsWith("http") ? href : BASE_URL + href);
  });

  // 公告本文PDF(*001.pdf)を優先。無ければ先頭のPDF。
  const primaryPdf = pdfLinks.find((u) => /\d+001\.pdf$/.test(u)) ?? pdfLinks[0];

  let rawText = "";
  if (primaryPdf) {
    try {
      const { text } = await downloadPdfText(primaryPdf);
      rawText = text;
      await sleep(500);
    } catch (err) {
      console.warn(`PDF download failed ${primaryPdf}:`, err);
    }
  }

  const caseMatch = row.detailUrl.match(/\/search_service\/(\d+)/);
  const caseNumber = caseMatch ? caseMatch[1] : null;

  return {
    title: row.title,
    organization: `東日本高速道路株式会社 ${row.organization}`,
    category: row.bidType,
    location: null,
    budgetMin: null,
    budgetMax: null,
    announcedDate: row.announcedDate,
    deadline: row.deadline,
    detailUrl: row.detailUrl,
    rawData: {
      bid_type: row.category,
      case_number: caseNumber,
      pdf_urls: pdfLinks,
      raw_text: rawText,
    },
  };
}

async function crawl(): Promise<ScrapedTender[]> {
  console.log("[nexco-east] クロール開始: 受付中案件");
  const rows = await fetchAllPages();
  console.log(`[nexco-east] ${rows.length}件の案件を検出`);

  const tenders: ScrapedTender[] = [];
  for (const row of rows) {
    try {
      const tender = await fetchDetail(row);
      if (tender) tenders.push(tender);
      await sleep(1000);
    } catch (err) {
      console.error(`Detail fetch error ${row.detailUrl}:`, err);
    }
  }

  console.log(`[nexco-east] ${tenders.length}件取得完了`);
  return tenders;
}

async function main() {
  const tenders = await crawl();
  const { newCount, updatedCount } = await saveTenders(tenders);
  console.log(`[nexco-east] ${newCount} new, ${updatedCount} updated`);
}

main()
  .catch((err) => {
    console.error("[nexco-east] クロール失敗:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
