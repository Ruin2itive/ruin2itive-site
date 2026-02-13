#!/usr/bin/env node
/**
 * ruin2itive.org feed builder
 * Writes: data/home.json
 *
 * Notes:
 * - This runs in GitHub Actions (server-side) to avoid browser CORS failures.
 * - World news sources use Google News RSS search for stability.
 * - AP/Reuters/BBC show 2 newest items each.
 * - UFO/UAP shows 1 newest item ("most recent UFO sighting").
 */

const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");

const OUT = path.join(__dirname, "..", "data", "home.json");
const parser = new Parser({ timeout: 20000 });

const FEEDS = {
  crypto: {
    label: "decrypt",
    url: "https://decrypt.co/feed",
    take: 2,
  },

  hn: {
    label: "hn",
    url: "https://hnrss.org/newest?points=1",
    take: 2,
  },

  ap: {
    label: "associated press",
    url: "https://news.google.com/rss/search?q=site:apnews.com%20when:7d&hl=en-US&gl=US&ceid=US:en",
    take: 2,
  },

  reuters: {
    label: "reuters",
    url: "https://news.google.com/rss/search?q=site:reuters.com%20when:7d&hl=en-US&gl=US&ceid=US:en",
    take: 2,
  },

  bbc: {
    label: "bbc",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    take: 2,
  },

  ufo: {
    label: "ufo / uap",
    url: "https://news.google.com/rss/search?q=ufo%20sighting%20when:7d&hl=en-US&gl=US&ceid=US:en",
    take: 1,
  },
};

function safeText(v) {
  return (v || "").toString().replace(/\s+/g, " ").trim();
}

function pickDate(item) {
  return safeText(
    item.isoDate ||
      item.pubDate ||
      item.published ||
      item.updated ||
      item.date ||
      ""
  );
}

async function fetchFeed(key) {
  const cfg = FEEDS[key];

  try {
    const feed = await parser.parseURL(cfg.url);
    const items = (feed.items || []).slice(0, cfg.take);

    return {
      ok: true,
      items: items.map((it) => ({
        title: safeText(it.title),
        url: safeText(it.link),
        date: pickDate(it),
        source: cfg.label,
      })),
    };
  } catch (e) {
    return {
      ok: false,
      items: [],
      error: safeText(e && e.message ? e.message : String(e)),
    };
  }
}

async function main() {
  const now = new Date();

  const keys = Object.keys(FEEDS);
  const results = await Promise.all(keys.map(async (k) => [k, await fetchFeed(k)]));
  const byKey = Object.fromEntries(results);

  const payload = {
    updated_iso: now.toISOString(),
    sections: {
      projects: [
        {
          title: "ruin2itive",
          url: "https://github.com/ruin2itive/ruin2itive-site",
          meta: "github · src",
        },
        {
          title: "arduino",
          url: "https://hackster.io/",
          meta: "hackster · hardware",
        },
        {
          title: "raspberry pi",
          url: "https://www.instructables.com/",
          meta: "instructables · diy",
        },
      ],

      markets_crypto: byKey.crypto,
      hacker_news: byKey.hn,

      world_news: {
        ap: byKey.ap,
        reuters: byKey.reuters,
        bbc: byKey.bbc,
      },

      ufo_uap: byKey.ufo,
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
