#!/usr/bin/env node
/**
 * Build data/home.json from RSS/Atom feeds.
 * Runs in GitHub Actions and commits the JSON back to the repo.
 */

const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");

const OUT = path.join(process.cwd(), "data", "home.json");
const parser = new Parser({ timeout: 20000 });

function pick(items, n) {
  return (items || []).slice(0, n);
}

function fmtTime(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString("en-US", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  } catch {
    return "time unknown";
  }
}

async function readFeed({ url, source, limit }) {
  const feed = await parser.parseURL(url);
  const items = pick(feed.items, limit).map(it => {
    const title = (it.title || "").trim();
    const link = (it.link || it.guid || "").trim();
    const date = it.isoDate || it.pubDate || "";
    return {
      title: title || "(untitled)",
      url: link || url,
      source,
      time: fmtTime(date)
    };
  });

  // Filter obvious junk
  return items.filter(x => x.title && x.url);
}

async function main() {
  // Choose sources that actually provide RSS/Atom.
  // If you change sources, do it here (commit controlled).
  const SOURCES = {
    crypto: [
      // Decrypt RSS (works reliably compared to scraping the HTML front page)
      { url: "https://decrypt.co/feed", source: "decrypt", limit: 5 },
    ],
    hacker: [
      // Hacker News front page RSS
      { url: "https://news.ycombinator.com/rss", source: "hn", limit: 5 },
    ],
    world: [
      // World news RSS options:
      // Reuters has limited RSS availability; BBC provides RSS reliably.
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "bbc", limit: 5 },
    ],
  };

  const now = new Date();
  const payload = {
    updated_iso: now.toISOString(),
    updated_local: now.toLocaleString(),
    sections: { crypto: [], hacker: [], world: [] }
  };

  // Build sections with hard fail isolation
  for (const key of Object.keys(SOURCES)) {
    const list = SOURCES[key];
    const all = [];
    for (const f of list) {
      try {
        const items = await readFeed(f);
        all.push(...items);
      } catch (e) {
        // leave source out; front-end will show "feed unavailable" if empty
      }
    }
    payload.sections[key] = all.slice(0, 5);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
