/**
 * v0.5.3: three texts observed on the real Safinum journey are added to the
 * catalog. Their codes SECURITY_001 and CONFIRM_001 stay protected values.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { classifyTextRecord } from "../core/message-classifier.js";
import { analyzeTextRecord } from "../core/text-analyzer.js";
import { findCatalogEntry } from "../core/message-catalog.js";
import { INTENT_REGISTRY } from "../core/intent-registry.js";
import { extractCriticalValues } from "../core/value-extractor.js";
import { createNoliaController } from "../core/nolia-controller.js";
import { CATALOG_MESSAGE_IDS, validateLanguagePack } from "../core/language-pack.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { TARGET_PACK } from "../core/locale-target-pack.js";
import { buildMessageRows } from "../scripts/build-translation-sheet.js";
import { FakeDocument, addText, fakeMutationObserverFor, flushMutations } from "./helpers/fake-dom.js";

const NEW_MESSAGES = Object.freeze([
  ["security.alertTitle", "Alerte de sécurité", "security"],
  ["security.verifyBeneficiaryBeforeContinue", "Alerte de sécurité : vérifiez le numéro du bénéficiaire avant de continuer.", "security"],
  ["confirmation.requiredBeforeSubmit", "Vous devez confirmer les informations avant de valider le transfert.", "confirmation"]
]);
const CODES = Object.freeze(["SECURITY_001", "CONFIRM_001"]);

test("the three observed texts are recognized exactly, with severity warning", () => {
  for (const [id, text, role] of NEW_MESSAGES) {
    assert.deepEqual(classifyTextRecord({ text }), {
      kind: "message",
      messageId: id,
      role,
      severity: "warning",
      slots: {}
    });
    assert.equal(findCatalogEntry(`  ${text.toUpperCase()} `).id, id, "same tolerance as the other catalog texts");
  }
});

test("a near-miss of a new text is not taken for the catalog text", () => {
  assert.equal(findCatalogEntry("Alerte de sécurité :"), null);
  assert.equal(findCatalogEntry("Vous devez confirmer les informations avant de valider le virement."), null);
});

test("the catalog grows from 63 to 66 and the intents stay at 16", () => {
  assert.equal(CATALOG_MESSAGE_IDS.length, 66);
  for (const [id] of NEW_MESSAGES) assert.ok(CATALOG_MESSAGE_IDS.includes(id), id);
  assert.equal(INTENT_REGISTRY.length, 16);
});

test("only the verify-beneficiary text is attached to an existing intent, by association", () => {
  assert.equal(analyzeTextRecord({ text: NEW_MESSAGES[0][1] }).intentId, null);
  assert.equal(analyzeTextRecord({ text: NEW_MESSAGES[1][1] }).intentId, "beneficiary.verify_before_confirm");
  assert.equal(analyzeTextRecord({ text: NEW_MESSAGES[2][1] }).intentId, null);
});

test("SECURITY_001 and CONFIRM_001 are protected values, never translated", () => {
  for (const code of CODES) {
    assert.deepEqual(classifyTextRecord({ text: code }), { kind: "protected", reason: "error-code" });
    assert.equal(analyzeTextRecord({ text: code }).kind, "protected");
    assert.deepEqual(
      extractCriticalValues(`Code ${code}`).values.map((value) => `${value.type}:${value.canonical}`),
      [`errorCode:${code}`]
    );
    for (const pack of [TEST_PACK, TARGET_PACK]) {
      assert.equal(JSON.stringify(pack).includes(code), false, `${code} must not be a pack entry`);
    }
  }
});

test("the target-language model has the three entries empty and in draft; the TEST pack marks them [TEST]", async () => {
  const model = JSON.parse(await readFile(new URL("../locales/template.json", import.meta.url), "utf8"));
  for (const [id, text] of NEW_MESSAGES) {
    assert.deepEqual(model.templates[id], { status: "draft", requiredSlots: [], text: "", source: text });
    assert.equal(TEST_PACK.templates[id].text, `[TEST] ${text}`);
    assert.equal(TEST_PACK.templates[id].status, "test");
  }
  assert.equal(validateLanguagePack(TEST_PACK, { mode: "test" }).ok, true);
  assert.equal(validateLanguagePack(TEST_PACK, { mode: "demo" }).ok, false);
});

test("the translation sheet lists the three texts and their protected codes", () => {
  const rows = new Map(buildMessageRows().map((row) => [row[0], row]));
  assert.match(rows.get("security.alertTitle")[5], /SECURITY_001/u);
  assert.match(rows.get("security.verifyBeneficiaryBeforeContinue")[5], /SECURITY_001/u);
  assert.match(rows.get("confirmation.requiredBeforeSubmit")[5], /CONFIRM_001/u);
  for (const [id] of NEW_MESSAGES) {
    assert.equal(rows.get(id)[4], "avertissement");
    assert.equal(rows.get(id)[6], "", "no target-language text is invented");
  }
});

test("TEST mode shows a [TEST] wording for each text, keeps the codes and restores French exactly", () => {
  const document = new FakeDocument();
  const nodes = {};
  for (const [id, text] of NEW_MESSAGES) nodes[id] = addText(document, document.body, text);
  const codeNodes = CODES.map((code) => addText(document, document.body, code, "span"));

  const controller = createNoliaController({
    root: document.documentElement,
    packs: { test: TEST_PACK, target: TARGET_PACK },
    version: "0.5.3",
    MutationObserverImpl: fakeMutationObserverFor(document),
    scheduleTask: (task) => task()
  });
  controller.start();
  assert.equal(controller.status.recognizedCount, 3);
  assert.equal(controller.status.protectedCount, 2);

  controller.enableTest();
  for (const [id, text] of NEW_MESSAGES) assert.equal(nodes[id].nodeValue, `[TEST] ${text}`);
  assert.deepEqual(codeNodes.map((node) => node.nodeValue), CODES);

  // A notification injected after loading, with its code, is handled the same way.
  const late = addText(document, document.body, "Alerte de sécurité");
  const lateCode = addText(document, document.body, "SECURITY_001", "span");
  flushMutations(document);
  assert.equal(late.nodeValue, "[TEST] Alerte de sécurité");
  assert.equal(lateCode.nodeValue, "SECURITY_001");

  const result = controller.restoreFrench();
  assert.equal(result.restored, 4);
  for (const [id, text] of NEW_MESSAGES) assert.equal(nodes[id].nodeValue, text);
  assert.equal(late.nodeValue, "Alerte de sécurité");
  assert.deepEqual(codeNodes.map((node) => node.nodeValue), CODES);
  assert.equal(lateCode.nodeValue, "SECURITY_001");
});
