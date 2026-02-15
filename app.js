function el(root, sel) { return root.querySelector(sel); }

function setStatus(sectionEl, text) {
  const s = sectionEl.querySelector("[data-status]");
  if (s) s.textContent = text;
}

function renderList(sectionEl, items) {
  const ul = sectionEl.querySelector("[data-list]");
  ul.innerHTML = "";

  if (!items || !items.length) {
    setStatus(sectionEl, "feed unavailable");
    return;
  }

  // Filter out items without valid URLs
  const validItems = items.filter(it => it.url);

  if (validItems.length === 0) {
    setStatus(sectionEl, "feed unavailable");
    return;
  }

  // Hide status when we have items
  setStatus(sectionEl, "");

  for (const it of validItems) {
    const li = document.createElement("li");
    li.className = "feed-item";

    const a = document.createElement("a");
    a.className = "feed-link";
    a.href = it.url;
    a.target = "_blank";
    a.rel = "noopener";

    const h = document.createElement("h3");
    h.className = "feed-title";
    h.textContent = it.title || "(untitled)";

    const meta = document.createElement("div");
    meta.className = "feed-meta";
    meta.textContent = `${it.source || "source"} · ${it.time || ""}`.trim();

    a.appendChild(h);
    a.appendChild(meta);
    li.appendChild(a);
    ul.appendChild(li);
  }
}

async function loadHome() {
  // cache-bust so you don’t get “old” JSON
  const url = `./data/home.json?v=${Date.now()}`;

  const cryptoEl = document.getElementById("feed-crypto");
  const hackerEl = document.getElementById("feed-hacker");
  const worldEl  = document.getElementById("feed-world");

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`home.json HTTP ${res.status}`);

    const data = await res.json();

    renderList(cryptoEl, data?.sections?.crypto || []);
    renderList(hackerEl, data?.sections?.hacker || []);
    renderList(worldEl,  data?.sections?.world  || []);

    const updated = document.getElementById("updated");
    if (updated) {
      updated.textContent = `updated · ${data.updated_local || data.updated_iso || "unknown"}`;
    }
  } catch (e) {
    setStatus(cryptoEl, "feed unavailable");
    setStatus(hackerEl, "feed unavailable");
    setStatus(worldEl,  "feed unavailable");

    const updated = document.getElementById("updated");
    if (updated) updated.textContent = "updated · error";
  }
}

document.addEventListener("DOMContentLoaded", loadHome);
