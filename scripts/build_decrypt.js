/**
 * build_decrypt.js
 * - Fetches Decrypt homepage
 * - Extracts top 3 article links (heuristic: /<digits>/ slug urls)
 * - Writes data/decrypt.json
 *
 * Deterministic output:
 * - stable fields
 * - sorted by first-seen order on page
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_PATH = path.resolve(__dirname, "..", "data", "decrypt.json");
const HOME_URL = "https://decrypt.co/";

function isoNow() {
  return new Date().toISOString();
}

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function normUrl(href) {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return "https://decrypt.co" + href;
  return null;
}

function isArticlePath(u) {
  // Decrypt article pattern typically: https://decrypt.co/<digits>/<slug>
  try {
    const url = new URL(u);
    if (url.hostname !== "decrypt.co") return false;
    return /^\/\d+\//.test(url.pathname);
  } catch {
    return false;
  }
}

async function main() {
  const res = await fetch(HOME_URL, {
    headers: {
      "user-agent": "ruin2itive-bot/1.0 (static site builder)",
      "accept": "text/html,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Decrypt fetch failed: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Collect candidate article links in DOM order
  const seen = new Set();
  const items = [];

  $("a").each((_, a) => {
    const href = $(a).attr("href");
    const url = normUrl(href);
    if (!url) return;
    if (!isArticlePath(url)) return;
    if (seen.has(url)) return;

    // Title heuristic:
    // 1) If link wraps an h3, use that
    // 2) else use trimmed link text
    let title = $(a).find("h3").first().text().trim();
    if (!title) title = $(a).text().trim();

    // Keep only sane titles
    if (!title) return;
    if (title.length < 10) return;

    seen.add(url);
    items.push({
      title,
      url,
      stamp: "NOW",
      source: "decrypt",
    });
  });

  const top3 = items.slice(0, 3);

  const out = {
    updated: isoNow(),
    items: top3,
  };

  ensureDir(OUT_PATH);
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  if (top3.length < 3) {
    // Still write file (deterministic), but fail CI so you notice feed breakage.
    throw new Error(`Only extracted ${top3.length} Decrypt items (expected 3).`);
  }

  console.log(`Wrote ${OUT_PATH} (${top3.length} items)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
