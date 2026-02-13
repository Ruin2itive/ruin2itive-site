async function loadHome() {
  const updatedEl = document.getElementById("updated");
  const feeds = document.querySelectorAll(".feed");

  function setStatus(sectionKey, text) {
    const el = document.querySelector(`.feed[data-feed="${sectionKey}"] .feed-status`);
    if (el) el.textContent = text;
  }

  function render(sectionKey, items) {
    const list = document.querySelector(`.feed[data-feed="${sectionKey}"] .feed-list`);
    const status = document.querySelector(`.feed[data-feed="${sectionKey}"] .feed-status`);
    if (!list || !status) return;

    list.innerHTML = "";

    if (!items || items.length === 0) {
      status.textContent = "feed unavailable";
      return;
    }

    status.textContent = "";

    for (const it of items) {
      const li = document.createElement("li");
      li.className = "feed-item";

      const a = document.createElement("a");
      a.className = "feed-link";
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noopener";

      const h = document.createElement("div");
      h.className = "feed-title";
      h.textContent = it.title;

      const m = document.createElement("div");
      m.className = "feed-meta";
      m.textContent = `${it.source} · ${it.time}`;

      a.appendChild(h);
      a.appendChild(m);
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  try {
    // Avoid stale cache on GH Pages/CDN
    const res = await fetch(`./data/home.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const updated = data?.updated_local || data?.updated_iso || "unknown";
    updatedEl.textContent = `updated · ${updated}`;

    render("crypto", data?.sections?.crypto || []);
    render("hacker", data?.sections?.hacker || []);
    render("world", data?.sections?.world || []);
  } catch (e) {
    updatedEl.textContent = "updated · feed error";
    setStatus("crypto", "feed unavailable");
    setStatus("hacker", "feed unavailable");
    setStatus("world", "feed unavailable");
  }
}

document.addEventListener("DOMContentLoaded", loadHome);
