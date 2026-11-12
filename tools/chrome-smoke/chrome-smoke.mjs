// Real Chrome check of the unpacked Nolia extension on a SIMULATED Safinum page.
// safinum.cm is mapped to a local HTTPS server: the extension and its manifest
// are loaded unchanged. Usage: node chrome-smoke.mjs <extension-dir> <out-dir>
import https from "node:https";
import { readFileSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const [extDir, outDir] = process.argv.slice(2);
const html = readFileSync(new URL("./mock-safinum.html", import.meta.url));
const requests = [];
const server = https
  .createServer(
    { key: readFileSync(new URL("./key.pem", import.meta.url)), cert: readFileSync(new URL("./cert.pem", import.meta.url)) },
    (req, res) => {
      requests.push(req.url);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    }
  )
  .listen(8443, "127.0.0.1");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "OK  " : "ÉCHEC"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--headless=new",
    "--no-sandbox",
    `--disable-extensions-except=${extDir}`,
    `--load-extension=${extDir}`,
    "--host-resolver-rules=MAP safinum.cm 127.0.0.1:8443",
    "--ignore-certificate-errors",
    "--no-proxy-server",
    "--window-size=1280,900"
  ]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const consoleErrors = [];
  const external = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith("https://safinum.cm/") && !url.startsWith("chrome-extension://")) external.push(url);
  });

  await page.goto("https://safinum.cm/hackathon-test", { waitUntil: "load" });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const cdp = await page.createCDPSession();

  async function panel() {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const found = {};
    const walk = (node, inPanel = false) => {
      const attrs = node.attributes ?? [];
      const isHost = attrs.includes("data-nolia-panel");
      const here = inPanel || isHost;
      if (isHost) found.host = node;
      if (here && node.nodeName === "BUTTON") (found.buttons ??= []).push(node);
      for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) walk(child, here);
    };
    walk(root);
    return found;
  }
  async function nodeText(node) {
    const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: node.backendNodeId });
    const { result } = await cdp.send("Runtime.callFunctionOn", {
      objectId: object.objectId,
      functionDeclaration: "function () { return [this.textContent, this.disabled === true]; }",
      returnByValue: true
    });
    return result.value;
  }
  async function clickButton(label) {
    const { buttons } = await panel();
    for (const button of buttons) {
      const [text] = await nodeText(button);
      if (text === label) {
        const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: button.backendNodeId });
        const [x1, y1, , , x3, y3] = model.content;
        await page.mouse.click((x1 + x3) / 2, (y1 + y3) / 2);
        await new Promise((resolve) => setTimeout(resolve, 400));
        return true;
      }
    }
    return false;
  }
  async function panelText() {
    const { host } = await panel();
    const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: host.shadowRoots[0].backendNodeId });
    const { result } = await cdp.send("Runtime.callFunctionOn", {
      objectId: object.objectId,
      functionDeclaration: "function () { return this.textContent; }",
      returnByValue: true
    });
    return result.value;
  }
  const bodyText = () => page.evaluate(() => document.body.innerText);
  // Exact restoration check: keep a reference to every text node and its value.
  const snapshotTextNodes = () => page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    window.__nodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) window.__nodes.push([node, node.nodeValue]);
    return window.__nodes.length;
  });
  const changedTextNodes = () => page.evaluate(() => window.__nodes.filter(([node, value]) => node.nodeValue !== value).length);

  const found = await panel();
  check("extension chargée et panneau Nolia présent", Boolean(found.host));
  check("panneau en Shadow DOM fermé", found.host?.shadowRoots?.[0]?.shadowRootType === "closed");
  check("page hôte ne voit pas le contenu du panneau", await page.evaluate(() => {
    const host = document.querySelector("[data-nolia-panel]");
    return host !== null && host.shadowRoot === null && host.textContent === "";
  }));
  const initialPanel = await panelText();
  check("panneau affiche nom et version", initialPanel.includes("Nolia 0.5.1"), initialPanel.slice(0, 40));
  check("panneau en mode Observation", initialPanel.includes("Observation"));
  const counts = initialPanel.match(/Messages reconnus(\d+)Textes protégés(\d+)Messages inconnus(\d+)/u);
  check("compteurs affichés", Boolean(counts), counts ? `reconnus ${counts[1]}, protégés ${counts[2]}, inconnus ${counts[3]}` : initialPanel);
  check("raison du refus éwondo visible", /Éwondo indisponible : aucun pack validé\..*draft/u.test(initialPanel));
  const buttons = await Promise.all((await panel()).buttons.map(nodeText));
  const ewo = buttons.find(([text]) => text === "Activer l'éwondo");
  check("bouton éwondo désactivé", ewo?.[1] === true);

  const original = await bodyText();
  const snapshotSize = await snapshotTextNodes();
  const inputBefore = await page.evaluate(() => document.getElementById("amount").value);
  await page.screenshot({ path: `${outDir}/1-observation.png` });

  check("clic « Activer le mode TEST »", await clickButton("Activer le mode TEST"));
  const testText = await bodyText();
  check("message exact affiché en [TEST]", testText.includes("[TEST] Récapitulatif") && testText.includes("[TEST] Confirmer le transfert"));
  check("message dynamique avec nom protégé", testText.includes("[TEST] Bonjour, Paul Ndzana"));
  check("montants et références inchangés", ["125 000 FCFA", "25 500 FCFA", "SAF-2026-13J0O3", "+237 6 99 12 34 56", "CM 001 2345 6789 01"].every((value) => testText.includes(value)));
  check("formulation reconnue : français conservé + valeurs", testText.includes("Paul Ndzana vous a envoyé 15 000 FCFA. — [TEST] INTENTION TRANSFER RECEIVED (15 000 FCFA)"));
  check("message inconnu : français conservé + avertissement", testText.includes("Le bénéficiaire est temporairement bloqué pour vérification. — [TEST] ATTENTION, MESSAGE NON RECONNU"));
  check("« Effectuer un transfert » non lu comme transfert effectué", !testText.includes("INTENTION TRANSFER SENT SUCCESS"));
  check("champ de saisie intact", (await page.evaluate(() => document.getElementById("amount").value)) === inputBefore);
  check("panneau en mode TEST", (await panelText()).includes("Mode TEST"));
  await page.screenshot({ path: `${outDir}/2-mode-test.png` });

  // Site buttons still work: click the page's own buttons (outside the panel).
  await page.click("#confirm");
  check("bouton du site toujours fonctionnel", (await page.evaluate(() => window.__clicks)) === 1);
  await page.click("#trigger");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const dynamicText = await bodyText();
  check("notification ajoutée après chargement traitée", dynamicText.includes("[TEST] Une erreur est survenue") && dynamicText.includes("[TEST] Solde insuffisant pour effectuer ce transfert."));
  check("code AMOUNT_002 intact", dynamicText.includes("AMOUNT_002") && !dynamicText.includes("[TEST] AMOUNT_002"));
  check("deux phrases (minuscule) → mode dégradé", dynamicText.includes("Le transfert a échoué. veuillez réessayer. — [TEST] ATTENTION, MESSAGE NON RECONNU"));
  await page.screenshot({ path: `${outDir}/3-notification-dynamique.png` });

  check("clic « Restaurer le français »", await clickButton("Restaurer le français"));
  const restored = await bodyText();
  const changed = await changedTextNodes();
  check("français restauré exactement, nœud par nœud", changed === 0 && !restored.includes("[TEST]"), `${snapshotSize} nœuds comparés, ${changed} différent(s)`);
  check("notification ajoutée restaurée exactement", restored.includes("Une erreur est survenue\n\nSolde insuffisant pour effectuer ce transfert.\n\nAMOUNT_002\n\nLe transfert a échoué. veuillez réessayer.") && !restored.includes("veuillez réessayer. — "));
  check("panneau revenu en Observation", (await panelText()).includes("Observation"));
  await page.screenshot({ path: `${outDir}/4-restaure.png` });

  check("réactivation du mode TEST", await clickButton("Activer le mode TEST") && (await bodyText()).includes("[TEST] Continuer"));
  await clickButton("Restaurer le français");

  await page.setViewport({ width: 390, height: 800 });
  await page.reload({ waitUntil: "load" });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const mobile = await panel();
  check("écran étroit : panneau replié en pastille", mobile.host?.attributes?.includes("data-collapsed"));
  await page.screenshot({ path: `${outDir}/5-ecran-etroit.png` });

  check("aucune requête réseau hors page Safinum simulée", external.length === 0, external.join(", "));
  check("aucune erreur console", consoleErrors.length === 0, consoleErrors.join(" | "));
} finally {
  await browser.close();
  server.close();
  writeFileSync(`${outDir}/chrome-smoke-results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((result) => !result.ok).length;
  console.log(`\n${results.length - failed}/${results.length} vérifications Chrome réussies`);
  process.exitCode = failed === 0 ? 0 : 1;
}
