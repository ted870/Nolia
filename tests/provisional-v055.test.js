/**
 * v0.5.5: provisional (machine-translated) packs. They are shown only in a
 * separate mode, every text prefixed with [AUTO], never as validated.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { validateLanguagePack } from "../core/language-pack.js";
import { renderMessage } from "../core/template-renderer.js";
import { createNoliaController } from "../core/nolia-controller.js";
import { DISPLAY_SEPARATOR } from "../core/intent-renderer.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { TARGET_LANGUAGE } from "../core/target-language.js";
import { syntheticProvisionalPack } from "./helpers/provisional-pack.js";
import { syntheticValidatedPack } from "./helpers/synthetic-pack.js";
import { setupPanel, runInstall, writeTempPack } from "./helpers/target-helpers.js";
import { FakeDocument, addText, fakeMutationObserverFor, flushMutations } from "./helpers/fake-dom.js";

const codes = (validation) => validation.reasons.map((reason) => reason.code);
const provisional = (pack) => validateLanguagePack(pack, { mode: "provisional", expectedLanguage: TARGET_LANGUAGE.code });

test("a complete provisional pack is accepted in provisional mode only", () => {
  const pack = syntheticProvisionalPack();
  const validation = provisional(pack);
  assert.deepEqual(validation.reasons, []);
  assert.deepEqual(validation.coverage, { present: 84, total: 84 });
  const demo = validateLanguagePack(pack, { mode: "demo", expectedLanguage: TARGET_LANGUAGE.code });
  assert.equal(demo.ok, false);
  assert.ok(codes(demo).includes("PACK_NOT_VALIDATED"));
  assert.throws(() => renderMessage(pack, "common.continue", {}, { mode: "demo" }), (error) => error.code === "PACK_NOT_VALIDATED");
  assert.equal(renderMessage(pack, "common.continue", {}, { mode: "provisional" }), "AUTOMATIQUE Continuer");
});

test("a partial provisional pack is accepted and its coverage is reported", () => {
  const validation = provisional(syntheticProvisionalPack({ drop: ["common.continue", "transfer.received"] }));
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.coverage, { present: 82, total: 84 });
});

for (const [label, mutate, expected] of [
  ["it names a validator", (pack) => { pack.meta.validatedBy = ["Quelqu'un"]; }, "PROVISIONAL_CLAIMS_VALIDATION"],
  ["it carries a validation date", (pack) => { pack.meta.validatedAt = "2026-11-10"; }, "PROVISIONAL_CLAIMS_VALIDATION"],
  ["its tool is not named", (pack) => { pack.meta.generatedBy = " "; }, "GENERATOR_MISSING"],
  ["its generation date is in the future", (pack) => { pack.meta.generatedAt = "2999-01-01"; }, "GENERATION_DATE_INVALID"],
  ["its status is validated", (pack) => { pack.meta.status = "validated"; }, "PACK_NOT_PROVISIONAL"],
  ["a text already contains [AUTO]", (pack) => { pack.templates["common.back"].text = "[AUTO] retour"; }, "MARKER_IN_PROVISIONAL_TEXT"],
  ["a text contains [TEST]", (pack) => { pack.templates["common.back"].text = "[TEST] retour"; }, "MARKER_IN_PROVISIONAL_TEXT"],
  ["a template is marked validated", (pack) => { pack.templates["fees.free"].status = "validated"; }, "TEMPLATE_NOT_ALLOWED"],
  ["a protected slot is lost", (pack) => { pack.templates["balance.greeting"].text = "AUTOMATIQUE bonjour"; }, "PROTECTED_SLOT_MISSING"],
  ["an explanation contains a number", (pack) => { pack.templates["fees.amount_info"].text = "AUTOMATIQUE 500"; }, "VALUE_IN_TEMPLATE"],
  ["an intent direction is inverted", (pack) => { pack.templates["transfer.sent_success"].direction = "receive"; }, "DIRECTION_CHANGED"],
  ["it is for another language", (pack) => { pack.meta.languageCode = "bum"; }, "WRONG_LANGUAGE"],
  ["no text passed the checks", (pack) => { pack.templates = {}; }, "PACK_EMPTY"]
]) {
  test(`provisional mode refuses a pack when ${label}`, () => {
    const pack = syntheticProvisionalPack();
    mutate(pack);
    const validation = provisional(pack);
    assert.equal(validation.ok, false);
    assert.ok(codes(validation).includes(expected), `${expected} not in ${codes(validation).join(",")}`);
  });
}

test("the panel offers the automatic mode, says it is not validated and shows the coverage", () => {
  const { panel, controller } = setupPanel(syntheticProvisionalPack({ drop: ["common.back"] }));
  const { targetButton, reason } = panel.elements;
  assert.equal(controller.status.targetAvailable, false);
  assert.equal(controller.status.provisionalAvailable, true);
  assert.equal(targetButton.disabled, false);
  assert.equal(targetButton.textContent, "Activer l'éwondo (automatique)");
  assert.equal(reason.hidden, false);
  assert.equal(reason.getAttribute("class"), "notice");
  assert.equal(
    reason.textContent,
    "Traduction automatique (Flagship/Lingo cameroon-int8 (essai)), non validée par des humains : 83/84 textes, chacun précédé de [AUTO] ; les autres restent en français."
  );
});

test("provisional mode prefixes every text with [AUTO], keeps values, leaves missing texts in French, restores exactly", () => {
  const document = new FakeDocument();
  const texts = {
    continue: "Continuer",
    back: "Retour",
    greeting: "Bonjour, Paul Ndzana",
    paraphrase: "Marie Atangana vous a envoyé 20 000 FCFA.",
    unknown: "Le bénéficiaire est temporairement bloqué pour vérification.",
    amount: "25 000 FCFA"
  };
  const nodes = Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, addText(document, document.body, text)]));
  const controller = createNoliaController({
    root: document.documentElement,
    packs: { test: TEST_PACK, target: syntheticProvisionalPack({ drop: ["common.back"] }) },
    version: "0.5.5",
    MutationObserverImpl: fakeMutationObserverFor(document),
    scheduleTask: (task) => task()
  });
  controller.start();
  assert.equal(controller.enableTargetLanguage().enabled, true);
  assert.equal(controller.status.mode, "provisoire");

  assert.equal(nodes.continue.nodeValue, "[AUTO] AUTOMATIQUE Continuer");
  assert.equal(nodes.back.nodeValue, "Retour", "absent from the partial pack: stays in French");
  assert.equal(nodes.greeting.nodeValue, "[AUTO] AUTOMATIQUE Bonjour, Paul Ndzana");
  assert.equal(nodes.paraphrase.nodeValue, `${texts.paraphrase}${DISPLAY_SEPARATOR}[AUTO] AUTOMATIQUE INTENTION TRANSFER RECEIVED (20 000 FCFA)`);
  assert.ok(nodes.unknown.nodeValue.startsWith(`${texts.unknown}${DISPLAY_SEPARATOR}[AUTO] AUTOMATIQUE ATTENTION, MESSAGE NON RECONNU`));
  assert.equal(nodes.amount.nodeValue, "25 000 FCFA");
  assert.equal(controller.status.displayErrorCount, 0);

  const late = addText(document, document.body, "Confirmer le transfert");
  flushMutations(document);
  assert.equal(late.nodeValue, "[AUTO] AUTOMATIQUE Confirmer le transfert");

  controller.restoreFrench();
  for (const [key, text] of Object.entries(texts)) assert.equal(nodes[key].nodeValue, text, key);
  assert.equal(late.nodeValue, "Confirmer le transfert");
});

test("a validated pack still uses the validated mode, without [AUTO]", () => {
  const { controller, node } = setupPanel(syntheticValidatedPack());
  assert.equal(controller.status.provisionalAvailable, false);
  controller.enableTargetLanguage();
  assert.equal(controller.status.mode, "langue");
  assert.equal(node.nodeValue, "CONTROLE Continuer");
});

test("the install script needs --provisional for a provisional pack and never writes the shipped module", async () => {
  const path = await writeTempPack(syntheticProvisionalPack());
  const refused = await runInstall([path]);
  assert.equal(refused.ok, false);
  assert.match(refused.stderr, /PACK_NOT_VALIDATED/u);
  const installed = await runInstall([path, "--provisional"]);
  assert.equal(installed.ok, true);
  assert.match(installed.stdout, /PROVISOIRE installé \(84\/84 textes, affichés avec \[AUTO\]\)/u);
  assert.match(installed.output, /PROVISIONAL machine translation by Flagship\/Lingo cameroon-int8 \(essai\)/u);
});

test("the provisional status exposes no page text", () => {
  const { controller } = setupPanel(syntheticProvisionalPack());
  controller.enableTargetLanguage();
  const serialized = JSON.stringify(controller.status);
  assert.equal(serialized.includes("Continuer"), false);
});
