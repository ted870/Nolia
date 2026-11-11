import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { analyzeTextRecord } from "../core/text-analyzer.js";
import { createIntentContract, verifyIntentIntegrity } from "../core/intent-contract.js";
import {
  DISPLAY_SEPARATOR,
  renderFallback,
  renderIntent,
  verifyDisplayText
} from "../core/intent-renderer.js";
import { createDomTextAdapter } from "../core/dom-text-adapter.js";
import { createDisplayRenderer } from "../core/display-renderer.js";
import { TEST_PACK } from "../core/locale-test-pack.js";

const DRAFT_PACK = JSON.parse(
  await readFile(new URL("../locales/template.json", import.meta.url), "utf8")
);

const clone = (value) => JSON.parse(JSON.stringify(value));
const analyze = (text) => analyzeTextRecord({ text });
const codeOf = (fn) => {
  try {
    fn();
  } catch (error) {
    return { code: error.code, message: error.message };
  }
  return null;
};

const RECEIVED = "Marie Atangana vous a envoyé 20 000 FCFA.";
const SENT = "Vous avez envoyé 20 000 FCFA à Marie Atangana.";

// ---------------------------------------------------------------- inversion

test("inversion: 'vous a envoyé' is a reception, 'vous avez envoyé' is a sending", () => {
  assert.equal(analyze(RECEIVED).intentId, "transfer.received");
  assert.equal(analyze(RECEIVED).direction, "receive");
  assert.equal(analyze(SENT).intentId, "transfer.sent_success");
  assert.equal(analyze(SENT).direction, "send");
});

test("inversion: a contract cannot flip the fixed direction of an intent", () => {
  assert.throws(
    () => createIntentContract({ intentId: "transfer.received", direction: "send", values: [] }),
    /DIRECTION_CHANGED/u
  );
});

test("inversion: rendering a reception with the sending template is refused", () => {
  const { contract } = analyze(RECEIVED);
  const failure = codeOf(() =>
    renderIntent(TEST_PACK, contract, { mode: "test", originalText: RECEIVED, templateId: "transfer.sent_success" })
  );
  assert.equal(failure.code, "INTEGRITY_FAILED");
  assert.match(failure.message, /DIRECTION_CHANGED/u);
});

test("inversion: a pack whose template declares the opposite direction is refused", () => {
  const pack = clone(TEST_PACK);
  pack.templates["transfer.received"].direction = "send";
  const { contract } = analyze(RECEIVED);
  const failure = codeOf(() => renderIntent(pack, contract, { mode: "test", originalText: RECEIVED }));
  assert.equal(failure.code, "INTEGRITY_FAILED");
  assert.match(failure.message, /DIRECTION_CHANGED/u);
});

test("inversion: the integrity check reports DIRECTION_CHANGED on a flipped read-back", () => {
  const source = createIntentContract({ intentId: "custom.neutral", direction: "send", values: [] });
  const flipped = createIntentContract({ intentId: "custom.neutral", direction: "receive", values: [] });
  assert.deepEqual(verifyIntentIntegrity(source, flipped).errors, [
    { field: "direction", code: "DIRECTION_CHANGED" }
  ]);
});

test("inversion: mixed send and receive cues go to degraded mode", () => {
  const result = analyze("Vous avez reçu 10 000 FCFA envoyés à Paul.");
  assert.equal(result.kind, "fallback");
  assert.equal(result.reason, "DIRECTION_CONFLICT");
});

test("negation: a non-sent transfer is never displayed as a success", () => {
  for (const text of [
    "Votre transfert n'a pas été envoyé.",
    "Le virement n'a pas été effectué avec succès.",
    "Le transfert n'a jamais été envoyé."
  ]) {
    assert.notEqual(analyze(text).intentId, "transfer.sent_success", text);
  }
});

// ----------------------------------------------------------- modified amount

test("amount: the display carries the exact source amount", () => {
  const { contract } = analyze(RECEIVED);
  const { text, addition } = renderIntent(TEST_PACK, contract, { mode: "test", originalText: RECEIVED });
  assert.ok(text.startsWith(RECEIVED + DISPLAY_SEPARATOR));
  assert.match(addition, /\(20 000 FCFA\)$/u);
});

test("amount: a display whose amount was altered is refused with AMOUNT_CHANGED", () => {
  const { contract } = analyze(RECEIVED);
  const { text } = renderIntent(TEST_PACK, contract, { mode: "test", originalText: RECEIVED });
  const tampered = text.replace(/\(20 000 FCFA\)$/u, "(21 000 FCFA)");
  const failure = codeOf(() =>
    verifyDisplayText(contract, { templateId: "transfer.received", direction: "receive" }, tampered, RECEIVED)
  );
  assert.equal(failure.code, "INTEGRITY_FAILED");
  assert.match(failure.message, /AMOUNT_CHANGED/u);
});

test("amount: a removed or added amount is refused", () => {
  const { contract } = analyze(RECEIVED);
  const rendering = { templateId: "transfer.received", direction: "receive" };
  const base = `${RECEIVED}${DISPLAY_SEPARATOR}[TEST] INTENTION TRANSFER RECEIVED`;
  assert.match(codeOf(() => verifyDisplayText(contract, rendering, base, RECEIVED)).message, /AMOUNT_CHANGED/u);
  assert.match(
    codeOf(() => verifyDisplayText(contract, rendering, `${base} (20 000 FCFA · 500 FCFA)`, RECEIVED)).message,
    /AMOUNT_CHANGED/u
  );
});

test("amount: a currency change is reported as CURRENCY_CHANGED", () => {
  const { contract } = analyze(RECEIVED);
  const tampered = `${RECEIVED}${DISPLAY_SEPARATOR}[TEST] INTENTION TRANSFER RECEIVED (20 000 EUR)`;
  const failure = codeOf(() =>
    verifyDisplayText(contract, { templateId: "transfer.received", direction: "receive" }, tampered, RECEIVED)
  );
  assert.match(failure.message, /CURRENCY_CHANGED/u);
});

test("amount: a pack cannot hard-code a number in an explanation", () => {
  const pack = clone(TEST_PACK);
  pack.templates["transfer.received"].text = "[TEST] RECU 25000";
  const { contract } = analyze(RECEIVED);
  assert.equal(
    codeOf(() => renderIntent(pack, contract, { mode: "test", originalText: RECEIVED })).code,
    "VALUE_IN_TEMPLATE"
  );
});

test("amount: phones, references and error codes are protected the same way", () => {
  const source = "Votre transfert de 42 000 FCFA a été effectué, référence SAF-2026-XY12.";
  const { contract } = analyze(source);
  const { text } = renderIntent(TEST_PACK, contract, { mode: "test", originalText: source });
  const tampered = text.replace("SAF-2026-XY12)", "SAF-2026-XY13)");
  const failure = codeOf(() =>
    verifyDisplayText(contract, { templateId: "transfer.sent_success", direction: "send" }, tampered, source)
  );
  assert.match(failure.message, /REFERENCE_CHANGED/u);
});

test("amount: the DOM adapter refuses a renderer that alters a value", () => {
  const node = { nodeType: 3, nodeValue: RECEIVED };
  const classification = analyze(RECEIVED);
  const adapter = createDomTextAdapter({
    renderText: () => `${RECEIVED}${DISPLAY_SEPARATOR}[TEST] RECU (21 000 FCFA)`
  });
  assert.throws(() => adapter.applyRecord({ text: RECEIVED, node }, classification), /not preserved/u);
  assert.equal(node.nodeValue, RECEIVED);
});

test("amount: the DOM adapter refuses a display that drops the French source", () => {
  const node = { nodeType: 3, nodeValue: RECEIVED };
  const adapter = createDomTextAdapter({ renderText: () => "[TEST] RECU (20 000 FCFA)" });
  assert.throws(() => adapter.applyRecord({ text: RECEIVED, node }, analyze(RECEIVED)), /French source/u);
  assert.equal(node.nodeValue, RECEIVED);
});

// --------------------------------------------------------- no correspondence

test("no match: an unknown meaning keeps the French text and adds only a notice and certain facts", () => {
  const source = "Votre plafond de 200 000 FCFA est atteint pour aujourd'hui.";
  const notice = analyze(source);
  assert.equal(notice.kind, "fallback");
  assert.equal(notice.severity, "warning");
  const { text } = renderFallback(TEST_PACK, notice, { mode: "test", originalText: source });
  assert.equal(
    text,
    `${source}${DISPLAY_SEPARATOR}[TEST] ATTENTION, MESSAGE NON RECONNU : VÉRIFIEZ AVANT DE CONTINUER (200 000 FCFA)`
  );
});

test("no match: the blocked-beneficiary example is not assimilated to any intent", () => {
  const source = "Le bénéficiaire est temporairement bloqué pour vérification.";
  const notice = analyze(source);
  assert.equal(notice.kind, "fallback");
  assert.deepEqual(notice.candidateIds, []);
  assert.deepEqual(notice.contract.values, []);
});

test("no match: an ambiguous amount is not presented as a certain fact", () => {
  const notice = analyze("Les frais s'élèvent à 125,50 FCFA.");
  assert.equal(notice.kind, "fallback");
  assert.equal(notice.uncertainValueCount, 1);
  assert.deepEqual(notice.contract.values, []);
});

test("no match: a short unknown fragment is left untouched by the adapter", () => {
  const node = { nodeType: 3, nodeValue: "Bienvenue" };
  const adapter = createDomTextAdapter({ renderText: createDisplayRenderer(TEST_PACK, { mode: "test" }) });
  const result = adapter.applyRecord({ text: "Bienvenue", node }, analyze("Bienvenue"));
  assert.equal(result.outcome, "skipped");
  assert.equal(node.nodeValue, "Bienvenue");
});

test("no match: degraded display is applied through the adapter and restored exactly", () => {
  const source = "Votre carte bancaire sera livrée la semaine prochaine.";
  const node = { nodeType: 3, nodeValue: source };
  const adapter = createDomTextAdapter({ renderText: createDisplayRenderer(TEST_PACK, { mode: "test" }) });
  const result = adapter.applyRecord({ text: source, node }, analyze(source));
  assert.equal(result.outcome, "applied");
  assert.equal(result.kind, "fallback");
  assert.ok(node.nodeValue.startsWith(source + DISPLAY_SEPARATOR + "[TEST]"));
  assert.deepEqual(adapter.restore(), { restored: 1, hostChanged: 0 });
  assert.equal(node.nodeValue, source);
});

// ------------------------------------------------------------- demo gating

test("demo mode refuses the draft template pack for intents and fallbacks", () => {
  const { contract } = analyze(RECEIVED);
  assert.equal(
    codeOf(() => renderIntent(DRAFT_PACK, contract, { mode: "demo", originalText: RECEIVED })).code,
    "PACK_NOT_VALIDATED"
  );
  const notice = analyze("Votre carte bancaire sera livrée la semaine prochaine.");
  assert.equal(
    codeOf(() => renderFallback(DRAFT_PACK, notice, { mode: "demo", originalText: "x" })).code,
    "PACK_NOT_VALIDATED"
  );
});

test("demo mode refuses the TEST pack", () => {
  const { contract } = analyze(RECEIVED);
  assert.equal(
    codeOf(() => renderIntent(TEST_PACK, contract, { mode: "demo", originalText: RECEIVED })).code,
    "PACK_NOT_VALIDATED"
  );
});

test("exact catalog messages keep the v0.4.0 behaviour and gain an intent label", () => {
  const result = analyze("Solde insuffisant pour effectuer ce transfert.");
  assert.equal(result.kind, "message");
  assert.equal(result.messageId, "error.insufficientBalance");
  assert.equal(result.intentId, "transfer.insufficient_balance");
});
