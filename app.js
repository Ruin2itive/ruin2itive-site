function el(id){ return document.getElementById(id); }

function setStatus(kind, text){
  el(kind + "Status").textContent = text;
}

function clearList(kind){
  el(kind + "List").innerHTML = "";
}

function itemHTML(item){
  const safeTitle = item.title || "untitled";
  const safeUrl = item.url || "#";
  const source = item.source || "";
  const ts = item.time || "";
  return `
    <li class="feed-item">
      <a class="feed-link" href="${safeUrl}" target="_blank" rel="noreferrer">
        <p class="feed-title">${safeTitle}</p>
        <div class="feed-meta">${source}${source && ts ? " · " : ""}${ts}</div>
      </a>
    </li>
  `;
}

async function loadHome(){
  // Cache-bust so you see updates immediately after actions run
  const url = "./data/home.json?cb=" + Date.now();

  try{
    setStatus("crypto", "loading…");
    setStatus("hacker", "loading…");
    setStatus("world", "loading…");

    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error("home.json fetch failed: " + res.status);

    const data = await res.json();

    const updated = data.updated_local || data.updated_iso || "unknown";
    el("updatedLine").textContent = "updated · " + updated;

    const sections = data.sections || {};

    for(const kind of ["crypto","hacker","world"]){
      const items = (sections[kind] || []);
      clearList(kind);

      if(!items.length){
        setStatus(kind, "feed unavailable");
        continue;
      }

      setStatus(kind, ""); // hide "loading…"
      el(kind + "Status").style.display = "none";
      el(kind + "List").innerHTML = items.map(itemHTML).join("");
    }
  }catch(err){
    // Show a styled failure, but DO NOT break page rendering.
    for(const kind of ["crypto","hacker","world"]){
      setStatus(kind, "feed unavailable");
      clearList(kind);
    }
    el("updatedLine").textContent = "updated · feed error";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadHome);
