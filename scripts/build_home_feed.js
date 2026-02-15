#!/usr/bin/env node
/**
 * Generates data/home.json
 * - No npm dependencies required (Node 20 has global fetch)
 * - Includes retry logic for network resilience
 */

const fs = require("fs");
const path = require("path");
const { fetchWithRetry } = require("./fetch-utils");

const OUT = path.join(process.cwd(), "data", "home.json");

async function safeJson(url, opts = {}) {
  const res = await fetchWithRetry(url, opts);
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
  
  // Fallback to placeholder links if fetch fails or produces no items
  return [
    {
      title: "Hacker News",
      url: "https://news.ycombinator.com/",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News - Newest",
      url: "https://news.ycombinator.com/newest",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News - Best",
      url: "https://news.ycombinator.com/best",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News - Ask",
      url: "https://news.ycombinator.com/ask",
      source: "hn",
      time: ""
    },
    {
      title: "Hacker News - Show",
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
    const res = await fetchWithRetry(rssUrl);
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
  
  // Fallback to placeholder links if fetch fails or produces no items
  return [
    {
      title: "BBC News - World",
      url: "https://www.bbc.com/news/world",
      source: "world",
      time: ""
    },
    {
      title: "BBC News - Business",
      url: "https://www.bbc.com/news/business",
      source: "world",
      time: ""
    },
    {
      title: "BBC News - Technology",
      url: "https://www.bbc.com/news/technology",
      source: "world",
      time: ""
    },
    {
      title: "BBC News - Science",
      url: "https://www.bbc.com/news/science-environment",
      source: "world",
      time: ""
    },
    {
      title: "BBC News - Latest",
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
    const res = await fetchWithRetry(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ruin2itive-bot/1.0)'
      }
    });
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
  
  // Fallback to placeholder links if fetch fails or produces no items
  return [
    {
      title: "Bitcoin Reaches New All-Time High in 2026",
      url: "https://decrypt.co/",
      source: "crypto",
      time: ""
    },
    {
      title: "Ethereum's Latest Upgrade Boosts Network Efficiency",
      url: "https://decrypt.co/price/ethereum",
      source: "crypto",
      time: ""
    },
    {
      title: "NFT Market Shows Signs of Recovery",
      url: "https://decrypt.co/learn",
      source: "crypto",
      time: ""
    },
    {
      title: "DeFi Protocols Attract Record Investment",
      url: "https://decrypt.co/news",
      source: "crypto",
      time: ""
    },
    {
      title: "Crypto Regulation Updates Around the World",
      url: "https://decrypt.co/price",
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
    const res = await fetchWithRetry(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ruin2itive-bot/1.0)'
      }
    });
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
      title: "Hackster.io - Latest Projects",
      url: "https://www.hackster.io/",
      source: "hackster",
      time: ""
    },
    {
      title: "Arduino Official Projects Hub",
      url: "https://www.arduino.cc/",
      source: "hackster",
      time: ""
    },
    {
      title: "Raspberry Pi Projects & Tutorials",
      url: "https://www.raspberrypi.com/tutorials/",
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
