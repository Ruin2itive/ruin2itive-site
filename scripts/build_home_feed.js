#!/usr/bin/env node
/**
 * Generates data/home.json
 * - No npm dependencies required (Node 20 has global fetch)
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "data", "home.json");

async function safeJson(url, opts = {}) {
  const res = await fetch(url, { redirect: "follow", ...opts });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.json();
}

function fmtLocal(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * NOTE:
 * You previously used Decrypt scraping. That can break due to site changes/CORS.
 * For reliability-first, start with sources that have stable feeds/APIs.
 * Here, we keep your “seed” logic as fallback if parsing fails.
 */

async function getHnTop5() {
  // Hacker News: official Firebase API
  const ids = await safeJson("https://hacker-news.firebaseio.com/v0/topstories.json");
  const top = (ids || []).slice(0, 5);

  const items = [];
  for (const id of top) {
    const it = await safeJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    if (!it || !it.url || !it.title) continue;
    items.push({
      title: it.title,
      url: it.url,
      source: "hn",
      time: fmtLocal(new Date((it.time || 0) * 1000).toISOString())
    });
  }
  return items;
}

async function getBbcTop5() {
  // BBC RSS (stable)
  const rssUrl = "https://feeds.bbci.co.uk/news/rss.xml";

  // Very small RSS parse (no deps)
  const res = await fetch(rssUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`RSS failed ${res.status}`);
  const xml = await res.text();

  const items = [];
  const itemBlocks = xml.split("<item>").slice(1, 7); // grab a few
  for (const block of itemBlocks) {
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1];
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1];
    if (!title || !link) continue;
    items.push({
      title: title.trim(),
      url: link.trim(),
      source: "world",
      time: pubDate ? pubDate.trim() : ""
    });
  }
  return items.slice(0, 5);
}

async function getCryptoPlaceholder() {
  // Reliability-first placeholder until we pick a stable crypto source you like.
  // Keeps site working even if crypto source changes.
  return [{
    title: "Crypto feed not configured yet",
    url: "https://ruin2itive.org/",
    source: "crypto",
    time: ""
  }];
}

async function getHacksterTop1() {
  // Hackster.io RSS feed (stable)
  const rssUrl = "https://www.hackster.io/rss";

  try {
    // Very small RSS parse (no deps)
    const res = await fetch(rssUrl, { 
      redirect: "follow",
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ruin2itive-bot/1.0)'
      }
    });
    if (!res.ok) throw new Error(`RSS failed ${res.status}`);
    const xml = await res.text();

    const items = [];
    const itemBlocks = xml.split("<item>").slice(1, 2); // grab only the first item
    for (const block of itemBlocks) {
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
      const link = (block.match(/<link>(.*?)<\/link>/) || [])[1];
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1];
      if (!title || !link) continue;
      items.push({
        title: title.trim(),
        url: link.trim(),
        source: "hackster",
        time: pubDate ? pubDate.trim() : ""
      });
    }
    if (items.length > 0) return items;
    // If we got here, RSS was fetched but produced no valid items
    console.warn(`Hackster RSS returned no valid items, using fallback`);
  } catch (err) {
    console.warn(`Hackster fetch failed: ${err.message}, using fallback`);
  }
  
  // Fallback to a placeholder link if fetch fails or produces no items
  return [{
    title: "Explore Arduino Projects on Hackster.io",
    url: "https://www.hackster.io/arduino/projects",
    source: "hackster",
    time: ""
  }];
}

async function main() {
  const now = new Date();
  const payload = {
    updated_iso: now.toISOString(),
    updated_local: now.toLocaleString(),
    sections: {
      crypto: [],
      hacker: [],
      world: [],
      projects: []
    }
  };

  // Build each section with safe fallbacks
  try { payload.sections.hacker = await getHnTop5(); } catch { payload.sections.hacker = []; }
  try { payload.sections.world  = await getBbcTop5(); } catch { payload.sections.world  = []; }
  try { payload.sections.crypto = await getCryptoPlaceholder(); } catch { payload.sections.crypto = []; }
  // getHacksterTop1 has its own fallback, so we can safely await it
  payload.sections.projects = await getHacksterTop1();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
