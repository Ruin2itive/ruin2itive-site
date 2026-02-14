import fs from "node:fs";
import path from "node:path";

const OUT_PATH = path.join(process.cwd(), "data", "decrypt.json");
const HOME = "https://decrypt.co/";

function nowISO() {
  return new Date().toISOString();
}

function uniq(arr) {
  return [...new Set(arr)];
}

function normalizeUrl(u) {
  try {
    const url = new URL(u, HOME);
    // keep only decrypt.co links
    if (!url.hostname.endsWith("decrypt.co")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Heuristic extraction:
 * - Find hrefs that look like Decrypt articles (commonly /<id>/<slug> or /news/<id>/...)
 * - Keep first 3 unique.
 *
 * NOTE: "Top 3" is defined as the first 3 matching article links found on the Decrypt homepage HTML.
 */
function extractTop3(html) {
  const hrefs = [];

  // Find href="...":
  const re = /href\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    hrefs.push(m[1]);
  }

  const candidates = hrefs
    .map(normalizeUrl)
    .filter(Boolean)
    .filter((u) => {
      // Common Decrypt article URL patterns:
      // https://decrypt.co/123456/some-slug
      // https://decrypt.co/news/123456/some-slug (varies)
      const p = new URL(u).pathname;
      const looksLikeArticle =
        /^\/\d+\/[^\/]+/.test(p) ||
        /^\/\d+\/.+/.test(p) ||
        /^\/news\/\d+\/.+/.test(p);
      return looksLikeArticle;
    });

  const top = uniq(candidates).slice(0, 3);

  return top.map((url) => ({
    title: "Decrypt: " + new URL(url).pathname.replaceAll("/", " ").trim(),
    url,
    stamp: "TOP",
    source: "decrypt",
  }));
}

async function main() {
  const res = await fetch(HOME, {
    headers: {
      "user-agent": "ruin2itive-feed-bot/1.0 (+https://ruin2itive.org)",
      "accept": "text/html,*/*",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Decrypt homepage: HTTP ${res.status}`);
  }

  const html = await res.text();
  const items = extractTop3(html);

  // If extraction fails, keep a safe fallback.
  const safeItems = (items && items.length === 3)
    ? items
    : [
        { title: "Decrypt (fallback)", url: HOME, stamp: "FALLBACK", source: "decrypt" },
        { title: "Decrypt (fallback)", url: HOME, stamp: "FALLBACK", source: "decrypt" },
        { title: "Decrypt (fallback)", url: HOME, stamp: "FALLBACK", source: "decrypt" },
      ];

  const out = {
    updated: nowISO(),
    items: safeItems,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUT_PATH} (${out.items.length} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
