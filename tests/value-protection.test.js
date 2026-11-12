/**
 * Adversarial tests (v0.5.1): each one must FAIL (be refused) when a
 * protected value is altered. Nolia never blocks a transaction: these tests
 * prove only that Nolia refuses to display an altered text.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { analyzeTextRecord } from "../core/text-analyzer.js";
import { createIntentContract, verifyIntentIntegrity } from "../core/intent-contract.js";
import { DISPLAY_SEPARATOR, renderFallback, renderIntent, verifyDisplayText } from "../core/intent-renderer.js";
import { renderTransfer, verifyTransferText } from "../core/transfer-renderer.js";
import { createSemanticContract } from "../core/semantic-contract.js";
import { createDomTextAdapter } from "../core/dom-text-adapter.js";
import { createDisplayRenderer } from "../core/display-renderer.js";
import { extractCriticalValues } from "../core/value-extractor.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { syntheticValidatedPack } from "./helpers/synthetic-pack.js";

const analyze = (text) => analyzeTextRecord({ text });
const refusalOf = (fn) => {
  try {
    fn();
  } catch (error) {
    return `${error.code ?? error.name}: ${error.message}`;
  }
  return null;
};

// A transfer summary with every protected field (validated synthetic pack).
const PACK = syntheticValidatedPack();
const TRANSFER = createSemanticContract({
  id: "transfer.summary",
  direction: "send",
  amount: "25000",
  fees: "500",
  currency: "XAF",
  beneficiary: "Amina Ngo Bell"
});
const RENDERED = renderTransfer(PACK, "transfer.summary", TRANSFER).text;
const verifyTransfer = (text) => () => verifyTransferText(PACK, "transfer.summary", text, TRANSFER);

test("reference: the untouched transfer summary is accepted", () => {
  assert.equal(RENDERED, "Envoi 25000 XAF à Amina Ngo Bell. Frais : 500 XAF.");
});

test("25 000 FCFA becoming 20 000 FCFA is refused (transfer and intent)", () => {
  assert.match(refusalOf(verifyTransfer(RENDERED.replace("25000", "20000"))), /AMOUNT_CHANGED/u);

  const source = "Paul vous a envoyé 25 000 FCFA.";
  const { contract } = analyze(source);
  const display = renderIntent(TEST_PACK, contract, { mode: "test", originalText: source }).text;
  assert.match(
    refusalOf(() => verifyDisplayText(contract, { templateId: "transfer.received", direction: "receive" }, display.replace("(25 000 FCFA)", "(20 000 FCFA)"), source)),
    /AMOUNT_CHANGED/u
  );
});

test("send becoming receive is refused (transfer, intent contract and pack)", () => {
  assert.match(refusalOf(verifyTransfer(RENDERED.replace("Envoi", "Réception"))), /DIRECTION_CHANGED/u);
  assert.throws(() => createIntentContract({ intentId: "transfer.sent_success", direction: "receive" }), /DIRECTION_CHANGED/u);
  const { contract } = analyze("Vous avez envoyé 25 000 FCFA à Paul.");
  assert.match(
    refusalOf(() => renderIntent(TEST_PACK, contract, { mode: "test", originalText: "x", templateId: "transfer.received" })),
    /DIRECTION_CHANGED/u
  );
});

test("fees disappearing is refused", () => {
  // From the display text.
  assert.match(refusalOf(verifyTransfer("Envoi 25000 XAF à Amina Ngo Bell.")), /INTEGRITY_PARSE_FAILED/u);
  // From a template that no longer binds {fees}.
  const pack = syntheticValidatedPack();
  pack.templates["transfer.summary"] = { status: "validated", text: "{direction} {amount} {currency} à {beneficiary}.", requiredSlots: ["direction", "amount", "currency", "beneficiary"] };
  assert.match(refusalOf(() => renderTransfer(pack, "transfer.summary", TRANSFER)), /PROTECTED_SLOT_NOT_BOUND/u);
  // From an intent display that drops the fee amount.
  const source = "Votre transfert de 25 000 FCFA a été effectué, frais 500 FCFA.";
  const notice = analyze(source); // amount + fees: two meanings, so degraded mode
  assert.equal(notice.reason, "AMBIGUOUS_INTENT");
  const rendering = { templateId: notice.contract.intentId, direction: "neutral" };
  const display = `${source}${DISPLAY_SEPARATOR}[TEST] ATTENTION, MESSAGE NON RECONNU (25 000 FCFA)`;
  assert.match(refusalOf(() => verifyDisplayText(notice.contract, rendering, display, source)), /^INTEGRITY_FAILED: .*: AMOUNT_CHANGED\.$/u);
});

test("two amounts swapped are refused", () => {
  // Amount and fees swapped in the transfer summary.
  assert.match(refusalOf(verifyTransfer("Envoi 500 XAF à Amina Ngo Bell. Frais : 25000 XAF.")), /AMOUNT_CHANGED, FEES_CHANGED/u);
  // Two amounts listed in the other order in an intent display.
  const source = "Votre transfert de 25 000 FCFA a été effectué, frais 500 FCFA.";
  const notice = analyze(source);
  const good = renderFallback(TEST_PACK, notice, { mode: "test", originalText: source }).text;
  assert.ok(good.endsWith("(25 000 FCFA · 500 FCFA)"));
  const swapped = good.replace("(25 000 FCFA · 500 FCFA)", "(500 FCFA · 25 000 FCFA)");
  const rendering = { templateId: notice.contract.intentId, direction: "neutral" };
  assert.match(refusalOf(() => verifyDisplayText(notice.contract, rendering, swapped, source)), /^INTEGRITY_FAILED: .*: ORDER_CHANGED\.$/u);
});

test("a replaced beneficiary is refused (transfer summary and dynamic message)", () => {
  assert.match(refusalOf(verifyTransfer(RENDERED.replace("Amina Ngo Bell", "Jean Essomba"))), /BENEFICIARY_CHANGED/u);
  const node = { nodeType: 3, nodeValue: "Bonjour, Paul Ndzana" };
  const record = { text: "Bonjour, Paul Ndzana", node };
  const classification = analyze("Bonjour, Paul Ndzana");
  const adapter = createDomTextAdapter({ renderText: () => "[TEST] Bonjour, Jean Essomba" });
  assert.throws(() => adapter.applyRecord(record, classification), /Protected slot \{name\} was not preserved/u);
  assert.equal(node.nodeValue, "Bonjour, Paul Ndzana");
});

test("a text containing both send and receive is refused", () => {
  for (const text of ["Vous avez reçu 10 000 FCFA envoyés à Paul.", "Vous avez envoyé et reçu 5 000 FCFA."]) {
    const result = analyze(text);
    assert.notEqual(result.kind, "intent", text);
  }
  assert.equal(analyze("Vous avez reçu 10 000 FCFA envoyés à Paul.").reason, "DIRECTION_CONFLICT");
});

test("a currency other than XAF is never accepted without an explicit rule", () => {
  for (const text of ["Transfert de 100 € effectué avec succès.", "Paul vous a envoyé 50 USD.", "Votre solde disponible est de 300 EUR."]) {
    const result = analyze(text);
    assert.equal(result.kind, "fallback", text);
    assert.equal(result.reason, "UNSUPPORTED_CURRENCY", text);
  }
  const { contract } = analyze("Paul vous a envoyé 25 000 FCFA.");
  const display = `Paul vous a envoyé 25 000 FCFA.${DISPLAY_SEPARATOR}[TEST] INTENTION TRANSFER RECEIVED (25 000 EUR)`;
  assert.match(refusalOf(() => verifyDisplayText(contract, { templateId: "transfer.received", direction: "receive" }, display, "Paul vous a envoyé 25 000 FCFA.")), /CURRENCY_CHANGED/u);
  assert.match(refusalOf(verifyTransfer(RENDERED.replace("25000 XAF", "25000 EUR"))), /INTEGRITY_PARSE_FAILED|CURRENCY_CHANGED/u);
});

test("phone, account, reference, error code and date changes are refused", () => {
  const source = "Votre transfert a été effectué, réf. SAF-2026-AB12.";
  const { contract } = analyze(source);
  const base = { templateId: "transfer.sent_success", direction: "send" };
  const good = renderIntent(TEST_PACK, contract, { mode: "test", originalText: source }).text;
  const altered = source + good.slice(source.length).replace("AB12", "AB13"); // only Nolia's part
  assert.match(refusalOf(() => verifyDisplayText(contract, base, altered, source)), /REFERENCE_CHANGED/u);

  const values = (text) => extractCriticalValues(text).values;
  const pairs = [
    ["Tél. 677001122", "Tél. 677001123", "PHONE_CHANGED"],
    ["Compte CM 001 2345 6789 01", "Compte CM 001 2345 6789 02", "ACCOUNT_CHANGED"],
    ["Code AMOUNT_002", "Code AMOUNT_003", "ERROR_CODE_CHANGED"],
    ["Le 12 nov. 2026", "Le 13 nov. 2026", "DATE_CHANGED"]
  ];
  for (const [before, after, code] of pairs) {
    const source = createIntentContract({ intentId: "probe", direction: "neutral", values: values(before) });
    const altered = createIntentContract({ intentId: "probe", direction: "neutral", values: values(after) });
    assert.deepEqual(verifyIntentIntegrity(source, altered).errors.map((error) => error.code), [code], before);
  }
});

test("the site changing the text while Nolia observes it is never overwritten", () => {
  const node = { nodeType: 3, nodeValue: "Continuer" };
  const adapter = createDomTextAdapter({ renderText: createDisplayRenderer(TEST_PACK, { mode: "test" }) });
  const classification = analyze("Continuer");

  // 1. The site changed the node after Nolia read it: the stale record is refused.
  node.nodeValue = "Patientez";
  assert.equal(adapter.applyRecord({ text: "Continuer", node }, classification).outcome, "stale-record");
  assert.equal(node.nodeValue, "Patientez");

  // 2. The site changes the node after Nolia displayed it: restoration leaves the site's text.
  node.nodeValue = "Continuer";
  assert.equal(adapter.applyRecord({ text: "Continuer", node }, classification).outcome, "applied");
  node.nodeValue = "Transfert en cours";
  assert.deepEqual(adapter.restore(), { restored: 0, hostChanged: 1 });
  assert.equal(node.nodeValue, "Transfert en cours");
});

test("degraded mode never hides the French text and keeps certain values only", () => {
  const source = "Votre plafond de 200 000 FCFA est atteint, frais 25,50 FCFA.";
  const notice = analyze(source);
  assert.equal(notice.kind, "fallback");
  assert.equal(notice.severity, "warning");
  const node = { nodeType: 3, nodeValue: source };
  const adapter = createDomTextAdapter({ renderText: createDisplayRenderer(TEST_PACK, { mode: "test" }) });
  adapter.applyRecord({ text: source, node }, notice);
  assert.ok(node.nodeValue.startsWith(source + DISPLAY_SEPARATOR));
  assert.ok(node.nodeValue.endsWith("(200 000 FCFA)"), "the ambiguous 25,50 FCFA is not presented as certain");
});

test("degraded mode distinguishes a normal unknown message from a sensitive warning", () => {
  assert.equal(analyze("Votre carte bancaire sera livrée la semaine prochaine.").severity, "normal");
  assert.equal(analyze("Votre compte sera suspendu demain.").severity, "warning");
});
