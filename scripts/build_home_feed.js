#!/usr/bin/env node
/**
 * Builds /data/home.json for GitHub Pages (no CORS issues on client)
 * - Decrypt: parses homepage for top stories
 * - Hacker News: uses official Firebase API
 * - World: uses Reuters RSS (lightweight)
 */

import fs from "fs";
import path from "path";

const OUT = "data/home.json";

async function fetchText(url){
  const r = await fetch(url, { headers: { "User-Agent": "ruin2itive-bot/1.0" } });
  if(!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return await r.text();
}

async function fetchJson(url){
  const r = await fetch(url, { headers: { "User-Agent": "ruin2itive-bot/1.0" } });
  if(!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return await r.json();
}

function pickDecrypt(html){
  // Simple, stable strategy: pull unique https://decrypt.co/ links and guess titles from surrounding text.
  // If Decrypt changes markup, we still usually get working URLs; titles may degrade gracefully.
  const urls = [];
  const re = /https:\/\/decrypt\.co\/\d+\/[a-z0-9-]+/gi;
  let m;
  while((m = re.exec(html)) !== null){
    const u = m[0];
    if(!urls.includes(u)) urls.push(u);
    if(urls.length >= 8) break;
  }
  return urls.slice(0,5).map(u => ({
    title: u.split("/").slice(-1)[0].replace(/-/g," "),
    url: u,
    source: "decrypt"
  }));
}

function pickReutersFromRss(xml){
  // Minimal RSS parse (no deps)
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while((m = itemRe.exec(xml)) !== null && items.length < 6){
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                  block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || "";
    const link = (block.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim() || "";
    if(title && link){
      items.push({ title, url: link, source:"reuters" });
    }
  }
  return items.slice(0,5);
}

async function getDecryptTop5(){
  const html = await fetchText("https://decrypt.co/");
  return pickDecrypt(html);
}

async function getHnTop5(){
  // New stories: https://hacker-news.firebaseio.com/v0/newstories.json
  const ids = await fetchJson("https://hacker-news.firebaseio.com/v0/newstories.json");
  const top = ids.slice(0,10);
  const items = [];
  for(const id of top){
    try{
      const it = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if(it && it.title && it.url){
        items.push({ title: it.title, url: it.url, source:"hn" });
      }
      if(items.length >= 5) break;
    }catch{}
  }
  return items.slice(0,5);
}

async function getWorldTop5(){
  // Reuters World News RSS (lightweight, stable)
  const xml = await fetchText("https://feeds.reuters.com/Reuters/worldNews");
  return pickReutersFromRss(xml);
}

async function main(){
  const now = new Date();
  const payload = {
    updated_iso: now.toISOString(),
    updated_local: now.toLocaleString(),
    sections: {
      crypto: [],
      hn: [],
      world: []
    }
  };

  // Build each section with graceful failure
  try{ payload.sections.crypto = await getDecryptTop5(); }
  catch{ payload.sections.crypto = []; }

  try{ payload.sections.hn = await getHnTop5(); }
  catch{ payload.sections.hn = []; }

  try{ payload.sections.world = await getWorldTop5(); }
  catch{ payload.sections.world = []; }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
