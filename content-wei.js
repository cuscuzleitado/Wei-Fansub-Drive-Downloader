// Roda em weifansub.com.br. Só mostra o painel em páginas que tenham episódios com link do Drive.

function extractId(href) {
  const m = href.match(/\/file\/d\/([\w-]+)/) || href.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}

function parseEpisodes() {
  const root = document.querySelector(".post-content") || document.body;
  const eps = [];
  root.querySelectorAll("p").forEach((p) => {
    const strong = p.querySelector("strong");
    if (!strong) return;
    const m = strong.textContent.match(/EPIS[ÓO]DIO\s*(\d+)/i);
    if (!m) return; // ignora TRAILER etc.
    const a = [...p.querySelectorAll("a[href]")].find((x) =>
      /^https?:\/\/(drive|docs)\.google\.com\//.test(x.href)
    );
    eps.push({ num: parseInt(m[1], 10), id: a ? extractId(a.href) : null });
  });
  return eps;
}

const episodes = parseEpisodes();
if (episodes.some((e) => e.id)) initPanel();

function initPanel() {
  const title = document.title.split(/\s[–-]\s/)[0].trim() || "Drama";

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      *{box-sizing:border-box;font-family:system-ui,sans-serif;font-size:13px}
      .fab{background:#6e88ba;color:#fff;border:0;border-radius:999px;padding:10px 16px;cursor:pointer;box-shadow:0 2px 8px #0006}
      .box{display:none;width:280px;max-height:70vh;background:#1e1e24;color:#eee;border-radius:10px;box-shadow:0 4px 16px #000a;overflow:hidden}
      .box.open{display:flex;flex-direction:column}
      .head{padding:10px 12px;font-weight:600;border-bottom:1px solid #333}
      .list{overflow:auto;padding:6px 12px;flex:1}
      .row{display:flex;align-items:center;gap:8px;padding:3px 0}
      .row.off{opacity:.4}
      .st{margin-left:auto}
      .foot{padding:8px 12px;border-top:1px solid #333;display:flex;gap:8px;align-items:center}
      button.b{background:#3a4a6b;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer}
      button.b:disabled{opacity:.5;cursor:default}
      .note{padding:0 12px 8px;color:#f0b;font-size:12px}
    </style>
    <button class="fab">⬇ Drive</button>
    <div class="box">
      <div class="head">${title} — ${episodes.filter((e) => e.id).length} eps</div>
      <div class="list"></div>
      <div class="note"></div>
      <div class="foot">
        <label><input type="checkbox" class="all" checked> todos</label>
        <button class="b start" style="margin-left:auto">Iniciar</button>
        <button class="b stop">Parar</button>
      </div>
    </div>`;
  document.body.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const list = $(".list");
  const ICON = { pending: "·", active: "⏳", done: "✅", error: "❌" };

  episodes.forEach((e) => {
    const row = document.createElement("div");
    row.className = "row" + (e.id ? "" : " off");
    row.dataset.num = e.num;
    row.innerHTML = `<input type="checkbox" ${e.id ? "checked" : "disabled"}>
      <span>EP ${String(e.num).padStart(2, "0")}${e.id ? "" : " (sem link do Drive)"}</span>
      <span class="st"></span>`;
    list.appendChild(row);
  });

  $(".fab").onclick = () => $(".box").classList.toggle("open");
  $(".all").onchange = (ev) =>
    list.querySelectorAll("input:not(:disabled)").forEach((c) => (c.checked = ev.target.checked));

  $(".start").onclick = () => {
    const items = [];
    list.querySelectorAll(".row").forEach((row) => {
      const num = +row.dataset.num;
      const ep = episodes.find((e) => e.num === num);
      if (ep?.id && row.querySelector("input").checked) items.push({ num, id: ep.id });
    });
    if (!items.length) return;
    chrome.runtime.sendMessage({ type: "start", title, items });
  };
  $(".stop").onclick = () => chrome.runtime.sendMessage({ type: "stop" });

  function render(state) {
    const mine = state && state.title === title;
    $(".note").textContent = mine ? state.note || "" : "";
    $(".start").disabled = !!(state && state.running);
    list.querySelectorAll(".row").forEach((row) => {
      const it = mine && state.items.find((i) => i.num === +row.dataset.num);
      const st = row.querySelector(".st");
      st.textContent = it ? ICON[it.status] : "";
      st.title = it?.msg || "";
    });
  }

  chrome.storage.local.get("state").then(({ state }) => render(state));
  chrome.storage.onChanged.addListener((ch) => ch.state && render(ch.state.newValue));
}
