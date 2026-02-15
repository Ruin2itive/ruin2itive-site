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
  try {
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
    if (items.length > 0) return items.slice(0, 5);
    console.warn(`Hacker News API returned no valid items, using fallback`);
  } catch (err) {
    console.warn(`Hacker News fetch failed: ${err.message}, using fallback`);
  }
  
  // Fallback to Hacker News homepage if fetch fails or produces no items
  return [
    {
      title: "Visit Hacker News",
      url: "https://news.ycombinator.com/",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News Newest Stories",
      url: "https://news.ycombinator.com/newest",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News Best Stories",
      url: "https://news.ycombinator.com/best",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News Ask",
      url: "https://news.ycombinator.com/ask",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News Show",
      url: "https://news.ycombinator.com/show",
      source: "hn",
      time: ""
    }
  ];
}

async function getBbcTop5() {
  // BBC RSS (stable)
  const rssUrl = "https://feeds.bbci.co.uk/news/rss.xml";

  try {
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
    if (items.length > 0) return items.slice(0, 5);
    console.warn(`BBC RSS returned no valid items, using fallback`);
  } catch (err) {
    console.warn(`BBC fetch failed: ${err.message}, using fallback`);
  }
  
  // Fallback to BBC News homepage if fetch fails or produces no items
  return [
    {
      title: "Visit BBC World News",
      url: "https://www.bbc.com/news",
      source: "world",
      time: ""
    }
  ];
}

async function getCryptoTop5() {
  // Decrypt.co RSS feed for crypto news
  const rssUrl = "https://decrypt.co/feed";

  try {
    const res = await fetch(rssUrl, { 
      redirect: "follow",
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ruin2itive-bot/1.0)'
      }
    });
    if (!res.ok) throw new Error(`RSS failed ${res.status}`);
    const xml = await res.text();

    const items = [];
    const itemBlocks = xml.split("<item>").slice(1, 6); // grab up to 5 items
    for (const block of itemBlocks) {
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
      const link = (block.match(/<link>(.*?)<\/link>/) || [])[1];
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1];
      if (!title || !link) continue;
      items.push({
        title: title.trim(),
        url: link.trim(),
        source: "crypto",
        time: pubDate ? pubDate.trim() : ""
      });
    }
    if (items.length > 0) return items.slice(0, 5);
    console.warn(`Decrypt RSS returned no valid items, using fallback`);
  } catch (err) {
    console.warn(`Decrypt fetch failed: ${err.message}, using fallback`);
  }
  
  // Fallback to Decrypt homepage and sections if fetch fails or produces no items
  return [
    {
      title: "Visit Decrypt - Crypto News",
      url: "https://decrypt.co/",
      source: "crypto",
      time: ""
    },
    {
      title: "Bitcoin News",
      url: "https://decrypt.co/price/bitcoin",
      source: "crypto",
      time: ""
    },
    {
      title: "Ethereum News",
      url: "https://decrypt.co/price/ethereum",
      source: "crypto",
      time: ""
    },
    {
      title: "NFT News",
      url: "https://decrypt.co/learn/what-are-nfts-non-fungible-tokens",
      source: "crypto",
      time: ""
    },
    {
      title: "DeFi News",
      url: "https://decrypt.co/learn/what-is-defi",
      source: "crypto",
      time: ""
    }
  ];
}

async function getHacksterTop3() {
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
    const itemBlocks = xml.split("<item>").slice(1, 4); // grab the top 3 items
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
  
  // Fallback to top 3 individual Arduino project links if fetch fails or produces no items
  return [
    {
      title: "Browse Arduino Projects on Hackster",
      url: "https://www.hackster.io/arduino/projects",
      source: "hackster",
      time: ""
    },
    {
      title: "Explore Hackster News",
      url: "https://www.hackster.io/news",
      source: "hackster",
      time: ""
    },
    {
      title: "View All Projects",
      url: "https://www.hackster.io/projects",
      source: "hackster",
      time: ""
    }
  ];
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
  try { payload.sections.crypto = await getCryptoTop5(); } catch { payload.sections.crypto = []; }
  // getHacksterTop3 has its own fallback, so we can safely await it
  payload.sections.projects = await getHacksterTop3();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
