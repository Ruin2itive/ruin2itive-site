/*
  ruin2itive.org feeds (client-side RSS pull, CORS-safe via proxy)
  - Shows newest items per source (crypto/hn=3, AP/Reuters/BBC=2, UFO=1)
  - Uses multiple proxy fallbacks to avoid "feed unavailable"
*/

const FEEDS = {
  crypto: {
    label: "decrypt",
    url: "https://decrypt.co/feed",
    take: 3
  },
  hn: {
    label: "hn",
    url: "https://hnrss.org/newest?points=1",
    take: 3
  },

  // World news: we use Google News RSS queries because AP/Reuters often don't keep stable public RSS endpoints.
  ap: {
    label: "ap",
    url: "https://news.google.com/rss/search?q=site%3Aapnews.com%20when%3A1d&hl=en-US&gl=US&ceid=US:en",
    take: 2
  },
  reuters: {
    label: "reuters",
    url: "https://news.google.com/rss/search?q=site%3Areuters.com%20when%3A1d&hl=en-US&gl=US&ceid=US:en",
    take: 2
  },
  bbc: {
    label: "bbc",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    take: 2
  },

  // UFO/UAP: choose “most recent” by a Google News query (reliable + always fresh)
  ufo: {
    label: "ufo",
    url: "https://news.google.com/rss/search?q=(ufo%20OR%20uap)%20when%3A1d&hl=en-US&gl=US&ceid=US:en",
    take: 1
  }
};

// Proxies that typically send permissive CORS headers.
// We try them in order until one works.
const PROXIES = [
  (u) => `https://r.jina.ai/http://` + u.replace(/^https?:\/\//, ""),   // r.jina.ai text proxy
  (u) => `https://r.jina.ai/https://` + u.replace(/^https?:\/\//, ""),  // sometimes helps depending on target
];

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", () => {
  loadAll().catch((e) => console.error(e));
});

async function loadAll() {
  await loadFeedInto("feed-crypto", FEEDS.crypto);
  await loadFeedInto("feed-hn", FEEDS.hn);

  await loadFeedInto("feed-ap", FEEDS.ap);
  await loadFeedInto("feed-reuters", FEEDS.reuters);
  await loadFeedInto("feed-bbc", FEEDS.bbc);

  await loadFeedInto("feed-ufo", FEEDS.ufo);
}

// ---------- rendering ----------
async function loadFeedInto(containerId, feed) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `<div class="feed-loading">loading...</div>`;

  try {
    const xmlText = await fetchViaProxies(feed.url);
    const items = parseFeed(xmlText);
    const newest = items
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, feed.take);

    if (!newest.length) {
      throw new Error("empty feed");
    }

    el.innerHTML = newest.map((it) => renderHeadline(it, feed.label)).join("");
  } catch (err) {
    el.innerHTML = renderError(feed.label, err);
  }
}

function renderHeadline(item, label) {
  const safeTitle = escapeHtml(item.title || "(untitled)");
  const href = item.link || "#";
  const date = item.date ? item.date : "";
  const meta = `${label}${date ? " · " + date : ""}`;

  return `
    <a class="headline" href="${href}" target="_blank" rel="noopener">
      <div class="headline-title">${safeTitle}</div>
      <div class="headline-meta">${escapeHtml(meta)}</div>
    </a>
  `;
}

function renderError(label, err) {
  const msg = (err && err.message) ? err.message : String(err || "load failed");
  return `
    <div class="err">
      <div class="err-title">feed unavailable</div>
      <div class="err-meta">${escapeHtml(label)} · ${escapeHtml(msg)}</div>
    </div>
  `;
}

// ---------- fetch ----------
async function fetchViaProxies(url) {
  // First try direct (some feeds allow CORS)
  const direct = await tryFetch(url);
  if (direct.ok) return direct.text;

  // Then try proxies
  for (const make of PROXIES) {
    const proxied = make(url);
    const r = await tryFetch(proxied);
    if (r.ok) return r.text;
  }

  throw new Error("load failed");
}

async function tryFetch(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, text: "" };
    const text = await res.text();
    if (!text || text.length < 40) return { ok: false, text: "" };
    return { ok: true, text };
  } catch {
    return { ok: false, text: "" };
  }
}

// ---------- parsing (RSS + Atom) ----------
function parseFeed(xmlText) {
  const cleaned = stripProxyWrapping(xmlText);

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, "text/xml");

  // If XML parse failed, DOMParser returns <parsererror>
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("bad xml");
  }

  // RSS <item>
  const rssItems = Array.from(doc.getElementsByTagName("item"));
  if (rssItems.length) {
    return rssItems.map((n) => ({
      title: textOf(n, "title"),
      link: textOf(n, "link"),
      date: normalizeDate(textOf(n, "pubDate") || textOf(n, "date")),
      ts: dateToTs(textOf(n, "pubDate") || textOf(n, "date")),
    }));
  }

  // Atom <entry>
  const entries = Array.from(doc.getElementsByTagName("entry"));
  if (entries.length) {
    return entries.map((n) => {
      const linkEl = n.getElementsByTagName("link")[0];
      const href = linkEl ? (linkEl.getAttribute("href") || "") : "";
      const updated = textOf(n, "updated") || textOf(n, "published");
      return {
        title: textOf(n, "title"),
        link: href,
        date: normalizeDate(updated),
        ts: dateToTs(updated),
      };
    });
  }

  return [];
}

function stripProxyWrapping(text) {
  // r.jina.ai sometimes prepends lines; attempt to extract XML start
  const idx = text.indexOf("<?xml");
  if (idx >= 0) return text.slice(idx);
  const idx2 = text.indexOf("<rss");
  if (idx2 >= 0) return text.slice(idx2);
  const idx3 = text.indexOf("<feed");
  if (idx3 >= 0) return text.slice(idx3);
  return text;
}

function textOf(parent, tag) {
  const el = parent.getElementsByTagName(tag)[0];
  if (!el || !el.textContent) return "";
  return el.textContent.trim();
}

function normalizeDate(s) {
  const ts = dateToTs(s);
  if (!ts) return "";
  const d = new Date(ts);
  // yyyy-mm-dd
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateToTs(s) {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
