async function loadHome() {
  const bust = Date.now();
  const url = `./data/home.json?v=${bust}`;

  const feeds = document.querySelectorAll(".feed[data-feed]");
  const updatedEl = document.getElementById("updated");

  function setStatus(feedKey, text, detail) {
    const el = document.querySelector(`.feed[data-feed="${feedKey}"]`);
    if (!el) return;
    el.innerHTML = `
      <div class="feed-status">${text}</div>
      ${detail ? `<div class="feed-meta">${detail}</div>` : ""}
    `;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`home.json HTTP ${res.status}`);

    const data = await res.json();

    const updated = data.updated_local || data.updated_iso || "unknown";
    updatedEl.textContent = `updated · ${updated}`;

    renderFeed("crypto", data.sections?.crypto, "decrypt");
    renderFeed("hacker", data.sections?.hacker, "hn");
    renderFeed("world", data.sections?.world, "world");

  } catch (err) {
    console.error(err);
    for (const f of feeds) {
      const k = f.getAttribute("data-feed");
      setStatus(k, "feed unavailable", "load failed");
    }
    updatedEl.textContent = "updated · error";
  }

  function renderFeed(key, items, sourceLabel) {
    if (!Array.isArray(items) || items.length === 0) {
      setStatus(key, "feed unavailable", `${sourceLabel} · no articles found`);
      return;
    }

    const el = document.querySelector(`.feed[data-feed="${key}"]`);
    const lis = items.slice(0, 5).map(item => {
      const title = escapeHtml(item.title || "untitled");
      const href = item.url || "#";
      const meta = [
        sourceLabel,
        item.published ? new Date(item.published).toLocaleString() : null
      ].filter(Boolean).join(" · ");

      return `
        <li class="feed-item">
          <a class="feed-link" href="${href}" target="_blank" rel="noopener">
            <p class="feed-title">${title}</p>
            <div class="feed-meta">${escapeHtml(meta)}</div>
          </a>
        </li>
      `;
    }).join("");

    el.innerHTML = `
      <ul class="feed-list">${lis}</ul>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

document.addEventListener("DOMContentLoaded", loadHome);
