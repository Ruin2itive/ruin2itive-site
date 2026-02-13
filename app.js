async function loadHome() {
  try {
    const res = await fetch("data/home.json", { cache: "no-store" });
    if (!res.ok) throw new Error("home.json not found");

    const data = await res.json();

    renderSection("crypto", data.crypto);
    renderSection("hn", data.hn);
    renderSection("ap", data.ap);
    renderSection("reuters", data.reuters);
    renderSection("bbc", data.bbc);
    renderSection("ufo", data.ufo);

  } catch (err) {
    console.error(err);
  }
}

function renderSection(id, items) {
  const el = document.getElementById(id);
  if (!el || !items) return;

  el.innerHTML = items.map(item => `
    <div class="item">
      <a href="${item.link}" target="_blank">
        ${item.title}
      </a>
    </div>
  `).join("");
}

loadHome();
