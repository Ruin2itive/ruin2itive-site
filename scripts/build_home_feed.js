import fs from "node:fs";
import path from "node:path";

const OUT = "data/home.json";

async function fetchText(url){
  const res = await fetch(url, { headers: { "user-agent": "ruin2itive-site" } });
  if(!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  return await res.text();
}

// VERY small RSS parser (enough for titles/links)
function parseRssItems(xml, limit=5){
  const items = [];
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  for(const block of itemBlocks){
    if(items.length >= limit) break;
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]
      || block.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
      || "").trim().replace(/\s+/g," ");
    const link = (block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
    if(title && link) items.push({ title, url: link });
  }
  return items;
}

async function getDecryptTop5(){
  // Decrypt RSS
  const xml = await fetchText("https://decrypt.co/feed");
  const items = parseRssItems(xml, 5).map(x => ({
    ...x, source: "decrypt", time: new Date().toLocaleString()
  }));
  return items;
}

async function getHnTop5(){
  // HN front page via Algolia API
  const json = await (await fetch("https://hn.algolia.com/api/v1/search?tags=front_page")).json();
  const hits = (json.hits || []).slice(0,5).map(h => ({
    title: h.title || h.story_title || "untitled",
    url: h.url || (h.story_id ? `https://news.ycombinator.com/item?id=${h.story_id}` : "https://news.ycombinator.com/"),
    source: "hn",
    time: new Date().toLocaleString()
  }));
  return hits;
}

async function getWorldTop5(){
  // BBC World RSS (stable)
  const xml = await fetchText("https://feeds.bbci.co.uk/news/world/rss.xml");
  const items = parseRssItems(xml, 5).map(x => ({
    ...x, source: "world", time: new Date().toLocaleString()
  }));
  return items;
}

async function main(){
  const now = new Date();
  const payload = {
    updated_iso: now.toISOString(),
    updated_local: now.toLocaleString(),
    sections: {
      crypto: [],
      hacker: [],
      world: []
    }
  };

  // Hard fail isolation: one feed failing should not nuke all
  try{ payload.sections.crypto = await getDecryptTop5(); } catch(e){ console.error("decrypt failed:", e.message); }
  try{ payload.sections.hacker = await getHnTop5(); } catch(e){ console.error("hn failed:", e.message); }
  try{ payload.sections.world  = await getWorldTop5(); } catch(e){ console.error("world failed:", e.message); }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
