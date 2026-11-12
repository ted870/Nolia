import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createNoliaController } from "../core/nolia-controller.js";
import { createNoliaPanel } from "../core/nolia-panel.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { EWO_PACK } from "../core/locale-ewo-pack.js";
import { FakeDocument, addText, fakeMutationObserverFor } from "./helpers/fake-dom.js";

function setup() {
  const document = new FakeDocument();
  const node = addText(document, document.body, "Continuer", "button");
  let panel = null;
  const controller = createNoliaController({
    root: document.documentElement,
    packs: { test: TEST_PACK, ewo: EWO_PACK },
    version: "0.5.1",
    onStatus: (status) => panel?.render(status),
    MutationObserverImpl: fakeMutationObserverFor(document),
    scheduleTask: (task) => task()
  });
  panel = createNoliaPanel({ document, controller });
  panel.mount(document.body);
  controller.start();
  return { document, node, controller, panel };
}

test("the panel host is marked data-nolia-ignore and uses a closed shadow root", () => {
  const { panel } = setup();
  assert.ok(panel.host.hasAttribute("data-nolia-ignore"));
  assert.equal(panel.shadowRoot.mode, "closed");
  assert.equal(panel.host.childNodes.length, 0, "nothing in the light DOM");
});

test("styles live only inside the shadow root", () => {
  const { panel } = setup();
  const style = panel.shadowRoot.childNodes.find((node) => node.tagName === "STYLE");
  assert.ok(style);
  assert.match(style.textContent, /:host \{ all: initial;/u);
  assert.equal(panel.host.getAttribute("style"), null);
});

test("the panel shows name, version, mode and the three counters", () => {
  const { panel, controller } = setup();
  const { title, mode, counters } = panel.elements;
  assert.equal(title.textContent, "Nolia 0.5.1");
  assert.equal(mode.textContent, "Observation");
  assert.equal(counters.recognizedCount.textContent, String(controller.status.recognizedCount));
  assert.equal(counters.protectedCount.textContent, "0");
  assert.equal(counters.unknownCount.textContent, "0");
});

test("the TEST button activates the mode and the restore button brings French back", () => {
  const { panel, node } = setup();
  const { testButton, restoreButton, mode } = panel.elements;
  assert.equal(restoreButton.disabled, true);
  testButton.click();
  assert.equal(mode.textContent, "Mode TEST");
  assert.equal(testButton.getAttribute("aria-pressed"), "true");
  assert.equal(node.nodeValue, "[TEST] Continuer");
  assert.equal(restoreButton.disabled, false);
  restoreButton.click();
  assert.equal(node.nodeValue, "Continuer");
  assert.equal(mode.textContent, "Observation");
});

test("the ewondo button is disabled and the refusal reason is visible", () => {
  const { panel, node } = setup();
  const { ewoButton, reason } = panel.elements;
  assert.equal(ewoButton.disabled, true);
  assert.equal(reason.hidden, false);
  assert.match(reason.textContent, /^Éwondo indisponible : aucun pack validé\./u);
  assert.match(reason.textContent, /draft/u);
  ewoButton.click(); // disabled: nothing happens
  assert.equal(node.nodeValue, "Continuer");
});

test("the panel can be collapsed to a pill and reopened", () => {
  const { panel } = setup();
  panel.setCollapsed(true);
  assert.ok(panel.host.hasAttribute("data-collapsed"));
  panel.setCollapsed(false);
  assert.equal(panel.host.hasAttribute("data-collapsed"), false);
});

test("the panel and the content script use no innerHTML, outerHTML, eval or new Function", async () => {
  for (const path of [
    "../core/nolia-panel.js",
    "../core/nolia-controller.js",
    "../core/language-pack.js",
    "../extension/content-script.js"
  ]) {
    const source = (await readFile(new URL(path, import.meta.url), "utf8"))
      .split("\n")
      .filter((line) => !/^\s*(\*|\/\/)/u.test(line))
      .join("\n");
    assert.doesNotMatch(source, /\.(innerHTML|outerHTML)\s*=|\beval\(|new Function\(|insertAdjacentHTML/u, path);
  }
});
