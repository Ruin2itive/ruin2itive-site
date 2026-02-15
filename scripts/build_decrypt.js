#!/usr/bin/env node
/**
 * Generates data/decrypt.json
 * - Fetches crypto news from Decrypt.co RSS feed
 * - No npm dependencies required (Node 20 has global fetch)
 * - Includes retry logic for network resilience
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "data", "decrypt.json");
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ruin2itive-bot/1.0)'
        },
        ...options
      });
      
      if (!res.ok) {
        throw new Error(`RSS failed ${res.status}`);
      }
      
      return await res.text();
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(`Attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

async function fetchDecryptFeed() {
  const rssUrl = "https://decrypt.co/feed";

  try {
    const xml = await fetchWithRetry(rssUrl);

    const items = [];
    const itemBlocks = xml.split("<item>").slice(1, 6); // grab up to 5 items
    
    for (const block of itemBlocks) {
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
      const link = (block.match(/<link>(.*?)<\/link>/) || [])[1];
      
      if (!title || !link) continue;
      
      items.push({
        title: title.trim(),
        url: link.trim(),
        source: "decrypt",
        stamp: "LIVE"
      });
    }

    if (items.length > 0) {
      return {
        updated: new Date().toISOString(),
        items: items
      };
    }
    
    console.warn(`Decrypt RSS returned no valid items, using fallback`);
  } catch (err) {
    console.warn(`Decrypt fetch failed after retries: ${err.message}, using fallback`);
  }
  
  // Fallback to seed data if fetch fails
  // Using current timestamp with SEED stamp to indicate fallback data
  return {
    updated: new Date().toISOString(),
    items: [
      {
        title: "Decrypt - Crypto News & Analysis",
        url: "https://decrypt.co/",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "Bitcoin News - Decrypt",
        url: "https://decrypt.co/price/bitcoin",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "Ethereum News - Decrypt",
        url: "https://decrypt.co/price/ethereum",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "Web3 & Crypto Technology - Decrypt",
        url: "https://decrypt.co/learn",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "Latest Crypto News - Decrypt",
        url: "https://decrypt.co/news",
        source: "decrypt",
        stamp: "SEED"
      }
    ]
  };
}

async function main() {
  const data = await fetchDecryptFeed();
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
