// ruin2itive front page loader (reliability-first)

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function setStatus(id, text) {
  const n = document.getElementById(id);
  if (n) n.textContent = text;
}

function renderList(containerId, items) {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.innerHTML = "";
  for (const it of items) {
    const a = el("a", "item");
    a.href = it.url || "#";
    a.target = "_blank";
    a.rel = "noopener";

    const t = el("div", "item-title");
    t.textContent = it.title || "untitled";

    const m = el("div", "item-meta");
    m.textContent = it.meta || "";

    a.appendChild(t);
    a.appendChild(m);
    box.appendChild(a);
  }
}

async function safeFetchJson(url, timeoutMs = 6500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/*
  EXPECTED JSON shape:
  {
    "crypto":[{"title":"...","url":"...","meta":"decrypt · top"}],
    "hn":[{"title":"...","url":"...","meta":"hn · newest"}],
    "world":[{"title":"...","url":"...","meta":"ap · wire"}]
  }

  You can change the endpoint later, but keep it stable.
*/
async function main() {
  // If you already have an API endpoint, put it here:
  const FEED_URL = "./data/home.json";

  // Default “fail safe” statuses:
  setStatus("cryptoStatus", "loading…");
  setStatus("hnStatus", "loading…");
  setStatus("worldStatus", "loading…");

  try {
    const data = await safeFetchJson(FEED_URL);

    if (Array.isArray(data.crypto)) {
      setStatus("cryptoStatus", "");
      renderList("cryptoList", data.crypto);
    } else {
      setStatus("cryptoStatus", "feed unavailable");
    }

    if (Array.isArray(data.hn)) {
      setStatus("hnStatus", "");
      renderList("hnList", data.hn);
    } else {
      setStatus("hnStatus", "feed unavailable");
    }

    if (Array.isArray(data.world)) {
      setStatus("worldStatus", "");
      renderList("worldList", data.world);
    } else {
      setStatus("worldStatus", "feed unavailable");
    }

  } catch (e) {
    // HARD FAIL SAFE: never blank screen
    setStatus("cryptoStatus", "feed unavailable");
    setStatus("hnStatus", "feed unavailable");
    setStatus("worldStatus", "feed unavailable");
  }
}

document.addEventListener("DOMContentLoaded", main);
