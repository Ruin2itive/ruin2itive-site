// scripts/build_decrypt.js
// Pull Decrypt RSS, write /data/decrypt.json (top 3)

import fs from "node:fs";
import path from "node:path";
import Parser from "rss-parser";

const FEED_URL = "https://decrypt.co/feed";
const HOME = "https://decrypt.co/";
const OUT_PATH = path.join(process.cwd(), "data", "decrypt.json");
const MAX_ITEMS = 3;

function isoNow() {
  return new Date().toISOString();
}

function safeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(u) {
  try {
    const url = new URL(u, HOME);
    // Keep only decrypt.co links
    if (!url.hostname.endsWith("decrypt.co")) return null;

    // Strip tracking-ish params (optional)
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

async function main() {
  const parser = new Parser({
    timeout: 20000,
    headers: {
      "User-Agent": "ruin2itive-site (RSS fetch; GitHub Actions)",
      "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const feed = await parser.parseURL(FEED_URL);

  const rawItems = Array.isArray(feed?.items) ? feed.items : [];

  const mapped = rawItems
    .map((it) => {
      const title = safeText(it?.title);
      const url = normalizeUrl(it?.link || it?.guid);
      if (!title || !url) return null;

      return {
        title,
        url,
        stamp: "TOP",
        source: "decrypt",
      };
    })
    .filter(Boolean);

  const items = uniqBy(mapped, (x) => x.url).slice(0, MAX_ITEMS);

  const payload = {
    updated: isoNow(),
    items,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  const json = JSON.stringify(payload, null, 2) + "\n";
  fs.writeFileSync(OUT_PATH, json, "utf8");

  console.log(`Wrote ${OUT_PATH} (${items.length} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
