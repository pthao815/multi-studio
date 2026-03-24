import * as cheerio from "cheerio";

export interface ScrapeResult {
  title: string;
  content: string;
}

/**
 * Fetch and scrape a URL — extract page title and main body text.
 * Strips scripts, styles, nav, footer, and other non-content elements.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MultiStudioBot/1.0; +https://multi-studio.vercel.app)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, aside, [role='navigation'], [role='banner'], [role='complementary']").remove();
  $(".sidebar, .menu, .ad, .advertisement, .cookie-banner").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || "Untitled";

  // Try to find main content area; fall back to body
  const mainSelectors = ["article", "main", ".post-content", ".entry-content", ".article-body", "#content", ".content"];
  let content = "";

  for (const selector of mainSelectors) {
    const el = $(selector);
    if (el.length > 0) {
      content = el.text();
      break;
    }
  }

  if (!content) {
    content = $("body").text();
  }

  // Normalize whitespace
  content = content.replace(/\s+/g, " ").trim();

  if (content.length < 100) {
    throw new Error("Could not extract enough text from this URL. Try pasting the content manually.");
  }

  // Cap at ~20k characters to stay within Claude context budget
  return {
    title,
    content: content.slice(0, 20000),
  };
}
