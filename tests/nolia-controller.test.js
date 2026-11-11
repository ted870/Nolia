import test from "node:test";
import assert from "node:assert/strict";

import { createNoliaController } from "../core/nolia-controller.js";
import { createNoliaPanel } from "../core/nolia-panel.js";
import { extractVisibleText } from "../core/dom-extractor.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { TARGET_PACK } from "../core/locale-target-pack.js";
import { DISPLAY_SEPARATOR } from "../core/intent-renderer.js";
import { syntheticValidatedPack } from "./helpers/synthetic-pack.js";
import {
  FakeDocument,
  addText,
  fakeMutationObserverFor,
  flushMutations
} from "./helpers/fake-dom.js";

const PAGE = Object.freeze({
  continue: "Continuer",
  greeting: "Bonjour, Paul Ndzana",
  error: "Solde insuffisant pour effectuer ce transfert.",
  amount: "25 000 FCFA",
  code: "AMOUNT_002",
  paraphrase: "Marie Atangana vous a envoyé 20 000 FCFA.",
  unknown: "Le bénéficiaire est temporairement bloqué pour vérification.",
  fragment: "Bienvenue"
});

function setup({ target = TARGET_PACK } = {}) {
  const document = new FakeDocument();
  const nodes = {};
  for (const [key, text] of Object.entries(PAGE)) {
    nodes[key] = addText(document, document.body, text, key === "continue" ? "button" : "p");
  }
  const input = document.createElement("input");
  input.setAttribute("value", "25000");
  document.body.append(input);

  const statuses = [];
  const controller = createNoliaController({
    root: document.documentElement,
    packs: { test: TEST_PACK, target },
    version: "0.5.1",
    onStatus: (status) => statuses.push(status),
    MutationObserverImpl: fakeMutationObserverFor(document),
    scheduleTask: (task) => task()
  });
  controller.start();
  return { document, nodes, input, controller, statuses };
}

const textsOf = (nodes) => Object.fromEntries(Object.entries(nodes).map(([key, node]) => [key, node.nodeValue]));

test("observation mode classifies the page and changes nothing", () => {
  const { nodes, controller } = setup();
  const status = controller.status;
  assert.equal(status.mode, "observation");
  assert.equal(status.recognizedCount, 4); // continue, greeting, error, paraphrase (intent)
  assert.equal(status.protectedCount, 2); // amount, error code
  assert.equal(status.unknownCount, 2); // unknown sentence (fallback) + fragment
  assert.deepEqual(textsOf(nodes), PAGE);
});

test("activating TEST mode displays [TEST] texts and keeps protected values intact", () => {
  const { nodes, input, controller } = setup();
  const result = controller.enableTest();
  assert.equal(result.enabled, true);
  assert.equal(controller.status.mode, "test");
  assert.equal(nodes.continue.nodeValue, "[TEST] Continuer");
  assert.equal(nodes.greeting.nodeValue, "[TEST] Bonjour, Paul Ndzana");
  assert.equal(nodes.error.nodeValue, "[TEST] Solde insuffisant pour effectuer ce transfert.");
  assert.equal(nodes.amount.nodeValue, PAGE.amount);
  assert.equal(nodes.code.nodeValue, PAGE.code);
  assert.equal(nodes.fragment.nodeValue, PAGE.fragment);
  assert.equal(
    nodes.paraphrase.nodeValue,
    `${PAGE.paraphrase}${DISPLAY_SEPARATOR}[TEST] INTENTION TRANSFER RECEIVED (20 000 FCFA)`
  );
  assert.ok(nodes.unknown.nodeValue.startsWith(PAGE.unknown + DISPLAY_SEPARATOR + "[TEST] ATTENTION, MESSAGE NON RECONNU"));
  assert.equal(input.getAttribute("value"), "25000");
  assert.equal(controller.status.displayErrorCount, 0);
});

test("restoring French puts back every original text exactly, without reloading", () => {
  const { nodes, controller } = setup();
  controller.enableTest();
  const result = controller.restoreFrench();
  assert.equal(result.restored, 5); // continue, greeting, error, paraphrase, unknown
  assert.equal(result.hostChanged, 0);
  assert.deepEqual(textsOf(nodes), PAGE);
  assert.equal(controller.status.mode, "observation");
  assert.equal(controller.status.displayedCount, 0);
});

test("activation, deactivation and reactivation can be repeated", () => {
  const { nodes, controller } = setup();
  for (let round = 0; round < 3; round += 1) {
    controller.enableTest();
    assert.equal(nodes.continue.nodeValue, "[TEST] Continuer");
    controller.restoreFrench();
    assert.deepEqual(textsOf(nodes), PAGE);
  }
});

test("text added dynamically after loading is detected, and displayed in TEST mode", () => {
  const { document, controller } = setup();
  const before = controller.status.recognizedCount;
  const added = addText(document, document.body, "Votre transfert a été envoyé avec succès.");
  flushMutations(document);
  assert.equal(added.nodeValue, "Votre transfert a été envoyé avec succès.");
  assert.equal(controller.status.recognizedCount, before + 1);

  controller.enableTest();
  const later = addText(document, document.body, "Le virement a échoué.");
  flushMutations(document);
  assert.ok(later.nodeValue.startsWith("Le virement a échoué." + DISPLAY_SEPARATOR + "[TEST] INTENTION TRANSFER FAILED"));
  controller.restoreFrench();
  assert.equal(later.nodeValue, "Le virement a échoué.");
});

test("Nolia's own writes are not re-analyzed as page text", () => {
  const { document, controller } = setup();
  controller.enableTest();
  const recognized = controller.status.recognizedCount;
  flushMutations(document); // deliver the characterData mutations caused by Nolia
  assert.equal(controller.status.recognizedCount, recognized);
  assert.equal(controller.status.displayErrorCount, 0);
});

test("a text changed by the site while Nolia displays it is never overwritten", () => {
  const { document, nodes, controller } = setup();
  controller.enableTest();
  nodes.error.nodeValue = "Transfert reçu de la part de Jean Essomba."; // the site updates the node
  flushMutations(document);
  // The new site text is analyzed and displayed in TEST mode from its own source.
  assert.ok(nodes.error.nodeValue.startsWith("Transfert reçu de la part de Jean Essomba." + DISPLAY_SEPARATOR));
  controller.restoreFrench();
  assert.equal(nodes.error.nodeValue, "Transfert reçu de la part de Jean Essomba.");
});

test("a site change between Nolia's display and the restoration has priority", () => {
  const { nodes, controller } = setup();
  controller.enableTest();
  nodes.continue.nodeValue = "Patientez"; // not yet delivered to the observer
  const result = controller.restoreFrench();
  assert.equal(result.hostChanged, 1);
  assert.equal(nodes.continue.nodeValue, "Patientez");
});

test("the shipped provisional Ewondo pack enables only the visibly automatic mode", () => {
  const { nodes, controller } = setup();
  assert.equal(controller.status.targetAvailable, false);
  assert.equal(controller.status.provisionalAvailable, true);
  assert.deepEqual(controller.status.provisionalCoverage, { present: 84, total: 84 });
  const result = controller.enableTargetLanguage();
  assert.equal(result.enabled, true);
  assert.equal(controller.status.mode, "provisoire");
  assert.match(nodes.continue.nodeValue, /^\[AUTO\]/u);
  assert.equal(nodes.amount.nodeValue, PAGE.amount);
  assert.equal(nodes.code.nodeValue, PAGE.code);
  controller.restoreFrench();
  assert.deepEqual(textsOf(nodes), PAGE);
});

test("a validated pack is displayed through the same path in target-language mode, then restored", () => {
  const { nodes, controller } = setup({ target: syntheticValidatedPack() });
  assert.equal(controller.status.targetAvailable, true);
  assert.equal(controller.enableTargetLanguage().enabled, true);
  assert.equal(controller.status.mode, "langue");
  assert.equal(nodes.continue.nodeValue, "CONTROLE Continuer");
  assert.equal(nodes.greeting.nodeValue, "CONTROLE Bonjour, Paul Ndzana");
  assert.ok(nodes.paraphrase.nodeValue.endsWith("(20 000 FCFA)"));
  controller.restoreFrench();
  assert.deepEqual(textsOf(nodes), PAGE);
});

test("the TEST pack cannot be smuggled in as the target-language pack", () => {
  const { controller } = setup({ target: TEST_PACK });
  assert.equal(controller.status.targetAvailable, false);
  assert.equal(controller.enableTargetLanguage().enabled, false);
});

test("the status exposes counters and ids only, never page text", () => {
  const { controller } = setup();
  controller.enableTest();
  const serialized = JSON.stringify(controller.status);
  for (const fragment of ["Paul", "Ndzana", "Atangana", "25 000", "20 000", "AMOUNT_002", "bloqué"]) {
    assert.equal(serialized.includes(fragment), false, fragment);
  }
});

test("the Nolia panel is never analyzed by the extractor or counted", () => {
  const { document, controller } = setup();
  const before = controller.status;
  const panel = createNoliaPanel({ document, controller });
  panel.mount(document.body);
  flushMutations(document);
  const after = controller.status;
  assert.equal(after.recognizedCount, before.recognizedCount);
  assert.equal(after.unknownCount, before.unknownCount);
  const extracted = extractVisibleText(document.documentElement).map((record) => record.text);
  for (const label of ["Activer le mode TEST", "Restaurer le français", "Messages reconnus", "Nolia"]) {
    assert.equal(extracted.includes(label), false, label);
  }
});
