/* scripts/build_decrypt.js
   Pull Decrypt RSS, write /data/decrypt.json (top N)
*/

const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");

const OUT_FILE = path.join(process.cwd(), "data", "decrypt.json");
const FEED_URL = "https://decrypt.co/feed";
const MAX_ITEMS = 5;

function isoNow() {
  return new Date().toISOString();
}

function safeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

(async () => {
  try {
    const parser = new Parser({
      timeout: 15000,
      headers: {
        "User-Agent": "ruin2itive-bot/1.0 (+https://ruin2itive.org)"
      }
    });

    const feed = await parser.parseURL(FEED_URL);

    const items = (feed.items || [])
      .slice(0, MAX_ITEMS)
      .map((it) => {
        const title = safeText(it.title);
        const url = safeText(it.link);
        const pub = it.isoDate || it.pubDate || null;

        return {
          title: title || "Untitled",
          url: url || "https://decrypt.co/",
          stamp: pub ? new Date(pub).toISOString() : "UNKNOWN",
          source: "decrypt"
        };
      });

    const out = {
      updated: isoNow(),
      items: items.length ? items : [
        { title: "No items parsed", url: "https://decrypt.co/", stamp: "EMPTY", source: "decrypt" }
      ]
    };

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");

    console.log("Wrote:", OUT_FILE);
    console.log("updated:", out.updated);
    console.log("count:", out.items.length);
  } catch (err) {
    console.error("build_decrypt failed:", err?.message || err);
    process.exit(1);
  }
})();
