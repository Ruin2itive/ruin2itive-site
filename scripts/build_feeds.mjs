#!/usr/bin/env node
/**
 * ruin2itive.org feed prebuilder (server-side)
 * - Fetches RSS/Atom over the network
 * - Parses XML
 * - Writes stable JSON into /data/*.json
 * - Frontend fetches local JSON (no CORS)
 */

import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data");

const FEEDS = {
  crypto: {
    label: "decrypt",
    url: "https://decrypt.co/feed",
    take: 2
  },
  hn: {
    label: "hn",
    url: "https://hnrss.org/newest?points=1",
    take: 2
  },

  // world news (each should render 2 newest)
  ap: {
    label: "associated press",
    url: "https://news.google.com/rss/search?q=site%3Aapnews.com%20when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
    take: 2
  },
  reuters: {
    label: "reuters",
    url: "https://news.google.com/rss/search?q=site%3Areuters.com%20when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
    take: 2
  },
  bbc: {
    label: "bbc",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    take: 2
  },

  // ufo / uap (1 newest)
  ufo: {
    label: "ufo / uap",
    url: "https://news.google.com/rss/search?q=(ufo%20OR%20uap%20OR%20unidentified%20aerial%20phenomena)%20when%3A7d&hl=en-US&gl=US&ceid=US%3Aen",
    take: 1
  }
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true
});

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toIsoOrEmpty(s) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function pickFirst(v) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function normalizeItemsFromXml(xmlObj) {
  // RSS 2.0
  if (xmlObj?.rss?.channel) {
    const channel = xmlObj.rss.channel;
    let items = channel.item || [];
    if (!Array.isArray(items)) items = [items];
    return items.map((it) => ({
      title: (it.title && String(it.title)) || "",
      link: (it.link && String(it.link)) || "",
      date: toIsoOrEmpty(it.pubDate || it.date || "")
    }));
  }

  // Atom
  if (xmlObj?.feed?.entry) {
    let entries = xmlObj.feed.entry || [];
    if (!Array.isArray(entries)) entries = [entries];
    return entries.map((e) => {
      // Atom link can be object(s) with @href
      let link = "";
      const l = e.link;
      if (typeof l === "string") link = l;
      else if (Array.isArray(l)) {
        const alt = l.find((x) => x?.["@_rel"] === "alternate") || l[0];
        link = alt?.["@_href"] || "";
      } else if (typeof l === "object") {
        link = l?.["@_href"] || "";
      }
      return {
        title: (e.title && String(pickFirst(e.title))) || "",
        link: String(link || ""),
        date: toIsoOrEmpty(e.updated || e.published || "")
      };
    });
  }

  return [];
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": "ruin2itive-feed-prebuilder/1.0",
        "accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
      },
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });
}

function cleanItem(x) {
  return {
    title: (x.title || "").trim(),
    url: (x.link || "").trim(),
    date: x.date || ""
  };
}

async function buildOne(key, cfg) {
  const outPath = path.join(OUT_DIR, `${key}.json`);
  const meta = {
    key,
    label: cfg.label,
    source_url: cfg.url,
    take: cfg.take,
    built_at: new Date().toISOString()
  };

  try {
    const xmlText = await fetchText(cfg.url);
    const xmlObj = parser.parse(xmlText);
    const rawItems = normalizeItemsFromXml(xmlObj);
    const newest = sortNewest(rawItems)
      .map(cleanItem)
      .filter((x) => x.title && x.url)
      .slice(0, cfg.take);

    const payload = { meta, items: newest };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`[ok] ${key}: wrote ${outPath} (${newest.length} items)`);
    return { ok: true };
  } catch (err) {
    // If a feed fails, we still write a file so frontend can render a stable "unavailable" state.
    const payload = {
      meta,
      error: String(err?.message || err),
      items: []
    };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`[fail] ${key}: wrote ${outPath} (error)`);
    return { ok: false };
  }
}

async function main() {
  ensureDir(OUT_DIR);

  // Build all feeds serially (less brittle + kinder to sources)
  let okCount = 0;
  let failCount = 0;

  for (const [key, cfg] of Object.entries(FEEDS)) {
    const r = await buildOne(key, cfg);
    if (r.ok) okCount++;
    else failCount++;
  }

  // A small index the frontend can use if you want later
  const index = {
    built_at: new Date().toISOString(),
    feeds: Object.entries(FEEDS).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      take: cfg.take,
      file: `data/${key}.json`
    })),
    ok: okCount,
    failed: failCount
  };
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log(`[done] ok=${okCount} failed=${failCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
