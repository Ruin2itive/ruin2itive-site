import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const OUT = path.join(process.cwd(), "data", "home.json");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ruin2itive-feed-bot/1.0"
    }
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return await res.text();
}

function pickArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

async function getRssTop(url, limit = 5) {
  const xml = await fetchText(url);
  const j = parser.parse(xml);

  // RSS 2.0: rss.channel.item
  const items = pickArray(j?.rss?.channel?.item).slice(0, limit);

  return items.map(it => ({
    title: it?.title ?? "",
    url: it?.link ?? "",
    published: it?.pubDate ? new Date(it.pubDate).toISOString() : null
  })).filter(x => x.title && x.url);
}

async function getHnTop(limit = 5) {
  // “front page-ish” by newest stories; tweak later if you want “top”
  const url = "https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=20";
  const txt = await fetchText(url);
  const j = JSON.parse(txt);

  const hits = (j?.hits || [])
    .filter(h => h?.title && h?.url)
    .slice(0, limit)
    .map(h => ({
      title: h.title,
      url: h.url,
      published: h?.created_at ? new Date(h.created_at).toISOString() : null
    }));

  return hits;
}

async function main() {
  const now = new Date();

  // Feeds (server-side) so the browser never CORS-fails.
  // If a feed fails, we degrade to empty array (site stays up).
  let crypto = [];
  let hacker = [];
  let world = [];

  try {
    // Decrypt RSS (works in Actions)
    crypto = await getRssTop("https://decrypt.co/feed", 5);
  } catch (e) {
    console.error("crypto feed failed:", e.message);
  }

  try {
    hacker = await getHnTop(5);
  } catch (e) {
    console.error("hacker feed failed:", e.message);
  }

  try {
    // BBC world RSS (swap later if you want Reuters/AP; many are paywalled/blocked)
    world = await getRssTop("https://feeds.bbci.co.uk/news/world/rss.xml", 5);
  } catch (e) {
    console.error("world feed failed:", e.message);
  }

  const payload = {
    updated_iso: now.toISOString(),
    updated_local: now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
    sections: { crypto, hacker, world }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUT}`);
  console.log(`Counts: crypto=${crypto.length} hacker=${hacker.length} world=${world.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
