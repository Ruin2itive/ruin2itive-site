/* ruin2itive.org feeds (client-side RSS pull)
   - Shows 2 newest items per source (UFO shows 1 by default)
   - Uses DOMParser (no build step)
*/

const FEEDS = {
  crypto: {
    label: "decrypt",
    url: "https://decrypt.co/feed",
    take: 2
  },
  hn: {
    label: "hn",
    // hnrss is usually reliable; if it fails, swap to https://news.ycombinator.com/rss
    url: "https://hnrss.org/newest?points=1",
    take: 2
  },
  ap: {
    label: "ap",
    // Many publishers don't keep official RSS stable; Google News RSS works consistently.
    // If you later find a stable AP RSS, replace this URL.
    url: "https://news.google.com/rss/search?q=site:apnews.com%20when:7d&hl=en-US&gl=US&ceid=US:en",
    take: 2
  },
  reuters: {
    label: "reuters",
    url: "https://news.google.com/rss/search?q=site:reuters.com%20when:7d&hl=en-US&gl=US&ceid=US:en",
    take: 2
  },
  bbc: {
    label: "bbc",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    take: 2
  },
  ufo: {
    label: "ufo",
    // The Black Vault podcast RSS (from a podcast directory listing)
    url: "https://www.theblackvault.com/documentarchive/feed/podcast/",
    take: 1
  }
};

function forceLowercaseBrand() {
  const el = document.getElementById("siteTitle");
  if (el) el.textContent = "ruin2itive";
  document.title = "ruin2itive.org";
}

function fmtDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function cleanTitle(t) {
  return (t || "").replace(/\s+/g, " ").trim();
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function parseRss(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");

  // RSS 2.0
  const items = Array.from(doc.querySelectorAll("item")).map(item => ({
    title: cleanTitle(item.querySelector("title")?.textContent || ""),
    link: (item.querySelector("link")?.textContent || "").trim(),
    date: (item.querySelector("pubDate")?.textContent || "").trim()
  }));

  // Atom fallback
  if (items.length === 0) {
    const entries = Array.from(doc.querySelectorAll("entry")).map(e => ({
      title: cleanTitle(e.querySelector("title")?.textContent || ""),
      link: (e.querySelector("link")?.getAttribute("href") || "").trim(),
      date: (e.querySelector("updated")?.textContent || e.querySelector("published")?.textContent || "").trim()
    }));
    return entries;
  }

  return items;
}

function renderFeed(container, items, sourceLabel) {
  container.innerHTML = "";

  const list = document.createElement("div");

  items.forEach(it => {
    const a = document.createElement("a");
    a.className = "item";
    a.href = it.link || "#";
    a.target = "_blank";
    a.rel = "noopener";

    const t = document.createElement("div");
    t.className = "item__title";
    t.textContent = it.title || "(untitled)";

    const m = document.createElement("div");
    m.className = "item__meta";

    const pill1 = document.createElement("span");
    pill1.className = "pill";
    pill1.textContent = sourceLabel;

    const d = fmtDate(it.date);
    const pill2 = document.createElement("span");
    pill2.className = "pill";
    pill2.textContent = d ? d : "";

    m.appendChild(pill1);
    if (d) m.appendChild(pill2);

    a.appendChild(t);
    a.appendChild(m);

    list.appendChild(a);
  });

  container.appendChild(list);
}

function renderError(container, label, msg) {
  container.innerHTML = `
    <div class="item" style="border-bottom:0;">
      <div class="item__title" style="font-size:18px;font-weight:700;">
        feed unavailable
      </div>
      <div class="item__meta">${label} · ${msg}</div>
    </div>
  `;
}

async function loadAllFeeds() {
  const feedEls = Array.from(document.querySelectorAll(".feed[data-feed]"));

  for (const el of feedEls) {
    const key = el.getAttribute("data-feed");
    const cfg = FEEDS[key];
    if (!cfg) continue;

    try {
      const xml = await fetchText(cfg.url);
      const parsed = parseRss(xml)
        .filter(x => x && x.title && x.link)
        .slice(0, cfg.take);

      renderFeed(el, parsed, cfg.label);
    } catch (err) {
      renderError(el, cfg.label, (err && err.message) ? err.message : "error");
    }
  }
}

forceLowercaseBrand();
loadAllFeeds();
