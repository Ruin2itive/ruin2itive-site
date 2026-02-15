#!/usr/bin/env node
/**
 * Generates data/decrypt.json
 * - Fetches crypto news from Decrypt.co RSS feed
 * - No npm dependencies required (Node 20 has global fetch)
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "data", "decrypt.json");

async function fetchDecryptFeed() {
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
    console.warn(`Decrypt fetch failed: ${err.message}, using fallback`);
  }
  
  // Fallback to seed data if fetch fails
  // Using current timestamp with SEED stamp to indicate fallback data
  return {
    updated: new Date().toISOString(),
    items: [
      {
        title: "Bitcoin Reaches New All-Time High in 2026",
        url: "https://decrypt.co/news/bitcoin-reaches-new-all-time-high-2026",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "Ethereum's Latest Upgrade Boosts Network Efficiency",
        url: "https://decrypt.co/news/ethereum-latest-upgrade-boosts-network",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "NFT Market Shows Signs of Recovery",
        url: "https://decrypt.co/news/nft-market-shows-signs-recovery",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "DeFi Protocols Attract Record Investment",
        url: "https://decrypt.co/news/defi-protocols-attract-record-investment",
        source: "decrypt",
        stamp: "SEED"
      },
      {
        title: "Crypto Regulation Updates Around the World",
        url: "https://decrypt.co/news/crypto-regulation-updates-worldwide",
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
