// Fila sequencial: abre 1 aba do Drive por episódio, espera o download começar,
// fecha a aba e segue para o próximo.

const DOWNLOAD_TIMEOUT_MS = 30000; // por episódio (mantém abaixo do limite de inatividade do SW)
const PAUSE_MIN_MS = 1500;
const PAUSE_RAND_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const safe = (s) =>
  String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);

let state = null;   // { running, stop, title, items:[{num,id,status,msg}], note }
let current = null; // { tabId, num, done(result) }

const save = () => chrome.storage.local.set({ state });

// Se o service worker foi morto no meio de uma fila, marca como interrompida.
chrome.storage.local.get("state").then(({ state: s }) => {
  if (state || current || !s?.running) return;
  s.running = false;
  s.note = "Fila interrompida. Clique em iniciar para continuar (os concluídos são pulados).";
  s.items.forEach((i) => { if (i.status === "active") i.status = "pending"; });
  state = s;
  save();
});

function downloadOne(item) {
  return new Promise(async (resolve) => {
    let finished = false;
    let timer;
    const done = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const tabId = current?.tabId;
      current = null;
      if (tabId != null) chrome.tabs.remove(tabId).catch(() => {});
      resolve(result);
    };
    current = { tabId: null, num: item.num, done };
    timer = setTimeout(() => done({ ok: false, msg: "tempo esgotado" }), DOWNLOAD_TIMEOUT_MS);
    try {
      const url = `https://drive.google.com/uc?export=download&id=${item.id}`;
      const tab = await chrome.tabs.create({ url, active: false });
      if (current) current.tabId = tab.id;
      else chrome.tabs.remove(tab.id).catch(() => {});
    } catch (e) {
      done({ ok: false, msg: String(e) });
    }
  });
}

async function runQueue() {
  for (const item of state.items) {
    if (state.stop) break;
    if (item.status === "done") continue;
    item.status = "active";
    item.msg = "";
    await save();
    const r = await downloadOne(item);
    item.status = r.ok ? "done" : "error";
    item.msg = r.msg || "";
    await save();
    if (state.stop) break;
    await sleep(PAUSE_MIN_MS + Math.random() * PAUSE_RAND_MS);
  }
  state.running = false;
  state.items.forEach((i) => { if (i.status === "active") i.status = "pending"; });
  await save();
}

// Download começou => episódio concluído.
chrome.downloads.onCreated.addListener(() => {
  if (current) current.done({ ok: true });
});

// Renomeia: "<Drama>/<Drama> - EP01.ext"
chrome.downloads.onDeterminingFilename.addListener((dl, suggest) => {
  if (!current || !state) return;
  const ext = (dl.filename.match(/\.[^.\\/]+$/) || [""])[0];
  const name = safe(state.title);
  suggest({
    filename: `${name}/${name} - EP${pad(current.num)}${ext}`,
    conflictAction: "uniquify",
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "start": {
      if (state?.running) { sendResponse({ ok: false, msg: "já está rodando" }); break; }
      state = {
        running: true,
        stop: false,
        title: msg.title,
        note: "",
        items: msg.items.map((i) => ({ num: i.num, id: i.id, status: "pending", msg: "" })),
      };
      save().then(runQueue);
      sendResponse({ ok: true });
      break;
    }
    case "stop": {
      if (state) state.stop = true;
      if (current) current.done({ ok: false, msg: "parado" });
      sendResponse({ ok: true });
      break;
    }
    case "is-queue-tab": {
      sendResponse({ yes: !!current && sender.tab?.id === current.tabId });
      break;
    }
    case "drive-error": {
      if (current && sender.tab?.id === current.tabId) current.done({ ok: false, msg: msg.msg });
      sendResponse({ ok: true });
      break;
    }
  }
});
