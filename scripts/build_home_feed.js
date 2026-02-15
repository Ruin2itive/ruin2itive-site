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
  
  // Fallback to placeholder links if fetch fails or produces no items
  return [
    {
      title: "Ask HN: What are you working on?",
      url: "https://news.ycombinator.com/item?id=39000001",
      source: "hn",
      time: ""
    },
    {
      title: "Show HN: New Open Source Project",
      url: "https://news.ycombinator.com/item?id=39000002",
      source: "hn",
      time: ""
    },
    {
      title: "The Evolution of Web Development",
      url: "https://news.ycombinator.com/item?id=39000003",
      source: "hn",
      time: ""
    },
    {
      title: "Artificial Intelligence Advances in 2026",
      url: "https://news.ycombinator.com/item?id=39000004",
      source: "hn",
      time: ""
    },
    {
      title: "Building Scalable Systems: Best Practices",
      url: "https://news.ycombinator.com/item?id=39000005",
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
  
  // Fallback to placeholder links if fetch fails or produces no items
  return [
    {
      title: "Read World News on BBC",
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
  
  // Fallback to placeholder links if fetch fails or produces no items
  return [
    {
      title: "Bitcoin Reaches New All-Time High in 2026",
      url: "https://decrypt.co/news/bitcoin-reaches-new-all-time-high-2026",
      source: "crypto",
      time: ""
    },
    {
      title: "Ethereum's Latest Upgrade Boosts Network Efficiency",
      url: "https://decrypt.co/news/ethereum-latest-upgrade-boosts-network",
      source: "crypto",
      time: ""
    },
    {
      title: "NFT Market Shows Signs of Recovery",
      url: "https://decrypt.co/news/nft-market-shows-signs-recovery",
      source: "crypto",
      time: ""
    },
    {
      title: "DeFi Protocols Attract Record Investment",
      url: "https://decrypt.co/news/defi-protocols-attract-record-investment",
      source: "crypto",
      time: ""
    },
    {
      title: "Crypto Regulation Updates Around the World",
      url: "https://decrypt.co/news/crypto-regulation-updates-worldwide",
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
      title: "Arduino Powered Retro Desk Clock",
      url: "https://www.hackster.io/news/arduino-powered-retro-desk-clock-brings-back-the-charm-of-analog-timekeeping-e9f6c8f8b5a4",
      source: "hackster",
      time: ""
    },
    {
      title: "ESP32-Based Smart Home Controller",
      url: "https://www.hackster.io/news/esp32-based-smart-home-controller-makes-automation-accessible-d7e5b9a6c3f2",
      source: "hackster",
      time: ""
    },
    {
      title: "Arduino Environmental Monitoring Station",
      url: "https://www.hackster.io/news/arduino-environmental-monitoring-station-tracks-air-quality-c8d6a7b4e1f9",
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
