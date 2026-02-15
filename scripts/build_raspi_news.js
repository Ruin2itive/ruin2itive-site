#!/usr/bin/env node
/**
 * Generates data/raspi.json
 * - Fetches top 5 articles from Raspberry Pi News RSS feed
 * - No npm dependencies required (Node 20 has global fetch)
 * - Includes retry logic for network resilience
 */

const fs = require("fs");
const path = require("path");
const { fetchTextWithRetry } = require("./fetch-utils");

const OUT = path.join(process.cwd(), "data", "raspi.json");

async function fetchRaspiNews() {
  const rssUrl = "https://www.raspberrypi.com/news/feed/";

  try {
    const xml = await fetchTextWithRetry(rssUrl);

    const items = [];
    const itemBlocks = xml.split("<item>").slice(1, 4); // grab up to 3 items
    
    for (const block of itemBlocks) {
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
      const link = (block.match(/<link>(.*?)<\/link>/) || [])[1];
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1];
      
      if (!title || !link) continue;
      
      items.push({
        title: title.trim(),
        url: link.trim(),
        source: "raspberry_pi",
        time: pubDate ? pubDate.trim() : ""
      });
    }

    if (items.length > 0) {
      return {
        updated: new Date().toISOString(),
        items: items.slice(0, 3)
      };
    }
    
    console.warn(`Raspberry Pi RSS returned no valid items, using fallback`);
  } catch (err) {
    console.warn(`Raspberry Pi fetch failed after retries: ${err.message}, using fallback`);
  }
  
  // Fallback to seed data if fetch fails
  return {
    updated: new Date().toISOString(),
    items: [
      {
        title: "Raspberry Pi Official Site",
        url: "https://www.raspberrypi.com/",
        source: "raspberry_pi",
        time: ""
      },
      {
        title: "Raspberry Pi News",
        url: "https://www.raspberrypi.com/news/",
        source: "raspberry_pi",
        time: ""
      },
      {
        title: "Raspberry Pi Products",
        url: "https://www.raspberrypi.com/products/",
        source: "raspberry_pi",
        time: ""
      }
    ]
  };
}

async function main() {
  const data = await fetchRaspiNews();
  
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
