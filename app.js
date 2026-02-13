/* ruin2itive — stable renderer
   RULE: browser only loads local JSON from /data.
   External feeds must be fetched by GitHub Actions, not client.
*/

function el(tag, cls, text){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function clear(node){
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderItems(listEl, items){
  clear(listEl);

  if (!Array.isArray(items) || items.length === 0){
    listEl.appendChild(el("div","loading","feed unavailable"));
    return;
  }

  for (const it of items){
    const a = el("a","item");
    a.href = it.url || "#";
    a.target = "_blank";
    a.rel = "noopener";

    a.appendChild(el("div","item-title", it.title || "untitled"));
    a.appendChild(el("div","item-meta", it.meta || ""));

    listEl.appendChild(a);
  }
}

async function loadLocalJson(path, timeoutMs){
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try{
    const res = await fetch(path, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function main(){
  const cryptoList = document.getElementById("cryptoList");
  const hnList = document.getElementById("hnList");
  const worldList = document.getElementById("worldList");

  // IMPORTANT: local relative path to avoid Pages subpath issues
  const DATA = "./data/home.json";

  try{
    const data = await loadLocalJson(DATA, 6500);

    // Expected schema:
    // { updated_iso, sections: { crypto: [...], hacker: [...], world: [...] } }
    const sections = (data && data.sections) ? data.sections : {};

    renderItems(cryptoList, sections.crypto);
    renderItems(hnList, sections.hacker || sections.hn);
    renderItems(worldList, sections.world);

  } catch (e){
    // Total failure -> still render gracefully
    renderItems(cryptoList, []);
    renderItems(hnList, []);
    renderItems(worldList, []);
  }
}

document.addEventListener("DOMContentLoaded", main);
