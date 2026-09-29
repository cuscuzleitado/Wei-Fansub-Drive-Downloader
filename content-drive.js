// Roda em drive.google.com / drive.usercontent.google.com.
// Só age em abas abertas pela fila da extensão (não mexe no seu uso normal do Drive).

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clickDownload() {
  // Página "não foi possível verificar vírus": formulário com "Baixar assim mesmo"
  const form = document.querySelector("#download-form");
  if (form) {
    const btn = form.querySelector('[type="submit"], button');
    if (btn) btn.click();
    else form.submit();
    return true;
  }
  const link = document.querySelector("#uc-download-link");
  if (link) { link.click(); return true; }

  // Fallback por texto
  const cand = [...document.querySelectorAll('a, button, input[type="submit"], [role="button"]')].find(
    (el) => /baixar assim mesmo|download anyway/i.test(el.innerText || el.value || "")
  );
  if (cand) { cand.click(); return true; }
  return false;
}

const ERROR_RE =
  /muitos usu[aá]rios|too many users|quota|cota|n[aã]o foi poss[ií]vel|solicitar acesso|request access|precisa de permiss[aã]o|you need access|n[aã]o existe|not found/i;

(async () => {
  let r = await chrome.runtime.sendMessage({ type: "is-queue-tab" });
  if (!r?.yes) {
    await sleep(700);
    r = await chrome.runtime.sendMessage({ type: "is-queue-tab" });
  }
  if (!r?.yes) return;

  for (let i = 0; i < 40; i++) {
    if (clickDownload()) return; // o background detecta o início do download
    if (i >= 6 && ERROR_RE.test(document.body?.innerText || "")) {
      const first = (document.body.innerText || "").trim().split("\n")[0].slice(0, 120);
      chrome.runtime.sendMessage({ type: "drive-error", msg: first || "erro no Drive" });
      return;
    }
    await sleep(500);
  }
  chrome.runtime.sendMessage({ type: "drive-error", msg: "botão de download não encontrado" });
})();
