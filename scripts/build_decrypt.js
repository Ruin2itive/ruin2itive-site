#!/usr/bin/env node
/**
 * scripts/build_decrypt.js
 * Fetch Decrypt RSS and write ./data/decrypt.json (top 3)
 */

import fs from "node:fs";
import path from "node:path";
import Parser from "rss-parser";

const OUT_PATH = path.join(process.cwd(), "data", "decrypt.json");
const FEED_URL = "https://decrypt.co/feed";
const HOME = "https://decrypt.co/";
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
    // keep only decrypt.co links
    if (!url.hostname.endsWith("decrypt.co")) return null;
    // remove hash
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function main() {
  const parser = new Parser({
    timeout: 20000,
    headers: {
      "User-Agent": "ruin2itive-feedbot/1.0 (+https://ruin2itive.org)"
    }
  });

  let feed;
  try {
    feed = await parser.parseURL(FEED_URL);
  } catch (err) {
    console.error("Failed to fetch Decrypt RSS:", err?.message || err);
    process.exit(1);
  }

  const itemsRaw = Array.isArray(feed?.items) ? feed.items : [];

  const mapped = itemsRaw.map((it) => {
    const title = safeText(it?.title);
    const url =
      normalizeUrl(it?.link) ||
      normalizeUrl(it?.guid) ||
      normalizeUrl(it?.id);

    // RSS often has isoDate; fallback to pubDate if needed
    const dateStr = it?.isoDate || it?.pubDate || null;
    const date = dateStr ? new Date(dateStr) : null;
    const stamp =
      date && !isNaN(date.getTime())
        ? date.toISOString().slice(0, 10) // YYYY-MM-DD
        : "DECRYPT";

    if (!title || !url) return null;

    return {
      title,
      url,
      stamp,
      source: "decrypt"
    };
  }).filter(Boolean);

  // De-dupe by URL, then take top N
  const items = uniqBy(mapped, (x) => x.url).slice(0, MAX_ITEMS);

  const payload = {
    updated: isoNow(),
    items
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUT_PATH} (${items.length} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
#!/usr/bin/env node
/**
 * scripts/build_decrypt.js
 * Fetch Decrypt RSS and write ./data/decrypt.json (top 3)
 */

import fs from "node:fs";
import path from "node:path";
import Parser from "rss-parser";

const OUT_PATH = path.join(process.cwd(), "data", "decrypt.json");
const FEED_URL = "https://decrypt.co/feed";
const HOME = "https://decrypt.co/";
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
    // keep only decrypt.co links
    if (!url.hostname.endsWith("decrypt.co")) return null;
    // remove hash
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function main() {
  const parser = new Parser({
    timeout: 20000,
    headers: {
      "User-Agent": "ruin2itive-feedbot/1.0 (+https://ruin2itive.org)"
    }
  });

  let feed;
  try {
    feed = await parser.parseURL(FEED_URL);
  } catch (err) {
    console.error("Failed to fetch Decrypt RSS:", err?.message || err);
    process.exit(1);
  }

  const itemsRaw = Array.isArray(feed?.items) ? feed.items : [];

  const mapped = itemsRaw.map((it) => {
    const title = safeText(it?.title);
    const url =
      normalizeUrl(it?.link) ||
      normalizeUrl(it?.guid) ||
      normalizeUrl(it?.id);

    // RSS often has isoDate; fallback to pubDate if needed
    const dateStr = it?.isoDate || it?.pubDate || null;
    const date = dateStr ? new Date(dateStr) : null;
    const stamp =
      date && !isNaN(date.getTime())
        ? date.toISOString().slice(0, 10) // YYYY-MM-DD
        : "DECRYPT";

    if (!title || !url) return null;

    return {
      title,
      url,
      stamp,
      source: "decrypt"
    };
  }).filter(Boolean);

  // De-dupe by URL, then take top N
  const items = uniqBy(mapped, (x) => x.url).slice(0, MAX_ITEMS);

  const payload = {
    updated: isoNow(),
    items
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUT_PATH} (${items.length} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
