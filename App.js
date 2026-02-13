/* app.js — tiny renderer; no frameworks; fast */

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fmtDate(iso) {
  if (!iso) return "";
  // keep it simple & fast: YYYY-MM-DD if possible
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : String(iso).slice(0, 10);
}

function renderFeed(el, items, fallbackSource) {
  if (!el) return;

  if (!Array.isArray(items) || items.length === 0) {
    el.innerHTML = `<div class="feed__loading">no items yet.</div>`;
    return;
  }

  el.innerHTML = items.slice(0, 8).map(it => {
    const title = esc(it.title || it.name || "untitled");
    const url = esc(it.url || it.link || "#");
    const src = esc((it.source || fallbackSource || "").toLowerCase());
    const date = esc(fmtDate(it.date || it.published || it.published_at || it.created_at));
    const meta = [src, date].filter(Boolean).join(" · ");

    return `
      <div class="feed__item">
        <a class="feed__title" href="${url}" target="_blank" rel="noopener">${title}</a>
        ${meta ? `<div class="feed__meta">${meta}</div>` : ``}
      </div>
    `;
  }).join("");
}

async function main() {
  const cryptoEl = document.getElementById("feed-crypto");
  const hnEl = document.getElementById("feed-hn");

  // You already generate this file in your build script.
  // Path expected: /data/home.json
  const url = "./data/home.json?v=" + Date.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("home.json missing");
    const data = await res.json();

    const crypto = data?.sections?.crypto || data?.crypto || [];
    const hn = data?.sections?.hacker || data?.sections?.hn || [];

    renderFeed(cryptoEl, crypto, "decrypt");
    renderFeed(hnEl, hn, "hn");
  } catch (e) {
    renderFeed(cryptoEl, [], "decrypt");
    renderFeed(hnEl, [], "hn");
  }
}

main();
