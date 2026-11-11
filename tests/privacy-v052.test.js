/**
 * v0.5.2 corrective tests (independent audit of v0.5.1):
 * 1. the controller's `known` map keeps kind, ids and reason only;
 * 2. the extension logs fixed codes only, never an Error or its message.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { createNoliaController, minimalClassification } from "../core/nolia-controller.js";
import { analyzeTextRecord } from "../core/text-analyzer.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { EWO_PACK } from "../core/locale-ewo-pack.js";
import { FakeDocument, addText, fakeMutationObserverFor, flushMutations } from "./helpers/fake-dom.js";

const SENSITIVE = ["Paul", "Ndzana", "Marie", "Atangana", "20 000", "20000", "CM 001", "SAF-2026", "677001122", "AMOUNT_002"];
const ALLOWED_KEYS = new Set(["kind", "messageId", "intentId", "reason"]);

// ------------------------------------------------- 1. minimal classification

test("minimalClassification keeps kind, messageId, intentId and reason only", () => {
  const cases = [
    analyzeTextRecord({ text: "Bonjour, Paul Ndzana" }), // message with slots
    analyzeTextRecord({ text: "Numéro de compte : CM 001 2345 6789 01" }), // message with slots
    analyzeTextRecord({ text: "Marie Atangana vous a envoyé 20 000 FCFA." }), // intent with contract values
    analyzeTextRecord({ text: "Votre transfert a été effectué, réf. SAF-2026-AB12." }), // intent with reference
    analyzeTextRecord({ text: "Votre plafond de 200 000 FCFA est atteint, appelez le 677001122." }) // fallback with values
  ];
  assert.ok(cases[0].slots?.name, "precondition: the full classification carries the slot");
  assert.ok(cases[2].contract?.values?.length, "precondition: the full classification carries contract values");
  for (const full of cases) {
    const minimal = minimalClassification(full);
    for (const key of Object.keys(minimal)) assert.ok(ALLOWED_KEYS.has(key), `unexpected key ${key}`);
    assert.equal("contract" in minimal, false);
    assert.equal("slots" in minimal, false);
    const serialized = JSON.stringify(minimal);
    for (const fragment of SENSITIVE) assert.equal(serialized.includes(fragment), false, `${fragment} in ${serialized}`);
  }
});

test("at run time, nothing stored per text node carries contract values or slots", () => {
  const document = new FakeDocument();
  const texts = [
    "Bonjour, Paul Ndzana",
    "Numéro de compte : CM 001 2345 6789 01",
    "Marie Atangana vous a envoyé 20 000 FCFA.",
    "Votre transfert a été effectué, réf. SAF-2026-AB12.",
    "Le bénéficiaire est temporairement bloqué pour vérification.",
    "Continuer"
  ];
  const nodes = new Set(texts.map((text) => addText(document, document.body, text)));

  // Spy on every Map.set whose key is one of the page's text nodes.
  const stored = [];
  const originalSet = Map.prototype.set;
  Map.prototype.set = function spy(key, value) {
    if (nodes.has(key)) stored.push({ map: this, value });
    return originalSet.call(this, key, value);
  };
  let controller;
  try {
    controller = createNoliaController({
      root: document.documentElement,
      packs: { test: TEST_PACK, ewo: EWO_PACK },
      version: "0.5.2",
      MutationObserverImpl: fakeMutationObserverFor(document),
      scheduleTask: (task) => task()
    });
    controller.start();
    controller.enableTest(); // second known.set path (enable)
    const added = addText(document, document.body, "Paul Ndzana vous a envoyé 15 000 FCFA.");
    nodes.add(added);
    flushMutations(document); // first known.set path (observer records)
  } finally {
    Map.prototype.set = originalSet;
  }

  // The classification map is the one whose values all have a `kind`.
  const classifications = stored.filter(({ value }) => value && typeof value === "object" && "kind" in value);
  assert.ok(classifications.length >= texts.length + 1, "both known.set paths were exercised");
  for (const { value } of classifications) {
    for (const key of Object.keys(value)) assert.ok(ALLOWED_KEYS.has(key), `known holds ${key}`);
    const serialized = JSON.stringify(value);
    for (const fragment of [...SENSITIVE, "15 000"]) assert.equal(serialized.includes(fragment), false, `${fragment} in known`);
  }

  // The adapter keeps the original text of displayed nodes: required to
  // restore French exactly. It is separate from `known` and is documented.
  const adapterEntries = stored.filter(({ value }) => value && "originalText" in value);
  assert.ok(adapterEntries.length > 0);
  controller.restoreFrench();
});

test("every known.set in the controller goes through minimalClassification", async () => {
  const source = await readFile(new URL("../core/nolia-controller.js", import.meta.url), "utf8");
  const calls = [...source.matchAll(/known\.set\(([^;]+)\);/gu)].map((match) => match[1]);
  assert.equal(calls.length, 2);
  for (const call of calls) assert.match(call, /^record\.node, minimalClassification\(classification\)$/u);
});

// ------------------------------------------------------ 2. fixed log codes

async function sourcesOf(directory) {
  const files = (await readdir(new URL(`../${directory}/`, import.meta.url))).filter((file) => file.endsWith(".js"));
  return Promise.all(
    files.map(async (file) => [`${directory}/${file}`, await readFile(new URL(`../${directory}/${file}`, import.meta.url), "utf8")])
  );
}

test("every console call in extension/ and core/ has a single fixed string literal", async () => {
  let count = 0;
  for (const [path, source] of [...(await sourcesOf("extension")), ...(await sourcesOf("core"))]) {
    for (const match of source.matchAll(/console\.(\w+)\(([^)]*)\)/gu)) {
      count += 1;
      assert.match(match[2].trim(), /^"[A-Z][A-Z0-9_]*"$/u, `${path}: console.${match[1]}(${match[2]})`);
    }
  }
  assert.ok(count >= 2);
});

test("a start failure logs exactly NOLIA_START_FAILED, without the Error or its message", async () => {
  const source = await readFile(new URL("../extension/content-script.js", import.meta.url), "utf8");
  const logged = [];
  const fakeConsole = {
    error: (...args) => logged.push(["error", ...args]),
    warn: (...args) => logged.push(["warn", ...args]),
    log: (...args) => logged.push(["log", ...args])
  };
  const sandbox = {
    __noliaContentScriptLoaded: false,
    __noliaStatus: null
  };
  const secret = "Paul Ndzana 20 000 FCFA SAF-2026-AB12";
  const chrome = {
    runtime: {
      getURL() {
        throw new Error(secret); // a failure whose message carries page-like text
      },
      getManifest: () => ({ version: "0.5.2" })
    }
  };
  // Run the content script with globalThis, console and chrome replaced.
  const run = new Function("globalThis", "console", "chrome", "document", `return (\n${source.trim().replace(/;\s*$/u, "")}\n);`);
  await run(sandbox, fakeConsole, chrome, {});
  assert.deepEqual(logged, [["error", "NOLIA_START_FAILED"]]);
  assert.equal(sandbox.__noliaStatus.state, "error");
  assert.equal(sandbox.__noliaStatus.errorCode, "NOLIA_START_FAILED");
  assert.equal(JSON.stringify(logged).includes("Paul"), false);
});
