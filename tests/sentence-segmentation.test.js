import test from "node:test";
import assert from "node:assert/strict";

import { analyzeTextRecord } from "../core/text-analyzer.js";
import { countSentences, hasLineBreak, matchIntent } from "../core/intent-matcher.js";
import { maskCriticalValues } from "../core/value-extractor.js";
import { normalizeText } from "../core/semantic-contract.js";

/** Simulate a DOM record: the extractor collapses whitespace, the node keeps it. */
const record = (raw) => ({ text: normalizeText(raw), node: { nodeType: 3, nodeValue: raw } });
const analyze = (raw) => analyzeTextRecord(record(raw));
const sentences = (text) => countSentences(maskCriticalValues(text));

test("second sentence with a capital letter is refused (v0.5.0 behaviour kept)", () => {
  const result = analyze("Le transfert a échoué. Veuillez réessayer.");
  assert.equal(result.kind, "fallback");
  assert.equal(result.reason, "MULTI_SENTENCE");
});

test("second sentence starting with a lower-case letter is refused", () => {
  const result = analyze("Le transfert a échoué. veuillez réessayer.");
  assert.equal(result.kind, "fallback");
  assert.equal(result.reason, "MULTI_SENTENCE");
  assert.equal(result.severity, "warning");
});

test("second sentence after a line break is refused even without punctuation", () => {
  for (const raw of ["Le transfert a échoué\nveuillez réessayer", "Votre virement a bien été effectué.\r\nVotre compte sera débité demain"]) {
    assert.equal(hasLineBreak(raw), true);
    const result = analyze(raw);
    assert.equal(result.kind, "fallback", JSON.stringify(raw));
    assert.equal(result.reason, "MULTI_SENTENCE");
  }
});

test("a line break also counts when matchIntent receives the raw text", () => {
  assert.equal(matchIntent("Le virement a échoué réessayez", { rawText: "Le virement a échoué\nréessayez" }).reason, "MULTI_SENTENCE");
});

test("several punctuation marks are one boundary, and every mark splits", () => {
  assert.equal(sentences("Le transfert a échoué !!! Réessayez."), 2);
  assert.equal(sentences("Solde insuffisant ?! rechargez votre compte."), 2);
  assert.equal(sentences("Opération refusée… contactez votre agence."), 2);
  assert.equal(sentences("Transfert effectué ; vérifiez le reçu."), 2);
  assert.equal(analyze("Solde insuffisant ?! Rechargez.").kind, "fallback");
});

test("trailing punctuation alone does not create a second sentence", () => {
  assert.equal(sentences("Le virement a échoué !!!"), 1);
  assert.equal(sentences("Votre virement a bien été effectué."), 1);
});

test("reasonable abbreviations, dates and amounts do not split a sentence", () => {
  assert.equal(sentences("Votre transfert a été effectué, réf. SAF-2026-AB12."), 1);
  assert.equal(sentences("Transfert reçu de M. Ndzana le 12 nov. 2026."), 1);
  assert.equal(sentences("Montant débité de votre compte : 10.500 F CFA."), 1);
  assert.equal(sentences("Frais : 200 FCFA, etc. pour cet envoi."), 1);
  assert.equal(sentences("Vérifiez le n° du destinataire, p. ex. le préfixe."), 1);
  assert.equal(sentences("Transfert reçu de Mme Abena, tél. 677001122."), 1);
  assert.equal(analyze("Votre transfert a été effectué, réf. SAF-2026-AB12.").intentId, "transfer.sent_success");
  assert.equal(analyze("Transfert reçu de M. Ndzana.").intentId, "transfer.received");
});

for (const connector of ["mais", "cependant", "toutefois", "pourtant", "puis", "ensuite"]) {
  test(`a clause added with "${connector}" goes to degraded mode`, () => {
    const result = analyze(`Votre virement a été effectué, ${connector} il sera vérifié par la banque.`);
    assert.equal(result.kind, "fallback");
    assert.equal(result.reason, "SECONDARY_CLAUSE");
    assert.equal(result.severity, "warning");
  });
}

test("an instruction not covered by the intent goes to degraded mode", () => {
  for (const text of [
    "Le paiement a échoué, contactez votre agence.",
    "Le virement a échoué, veuillez patienter.",
    "Solde insuffisant, rechargez votre compte Mobile Money.",
    "Votre transfert a été effectué, cliquez ici pour le reçu."
  ]) {
    const result = analyze(text);
    assert.equal(result.kind, "fallback", text);
    assert.equal(result.reason, "UNCOVERED_INSTRUCTION", text);
  }
});

test("a retry instruction is covered by the failure intents only", () => {
  assert.equal(analyze("Le paiement a échoué, veuillez réessayer plus tard.").intentId, "transfer.failed");
  assert.equal(analyze("Votre virement a bien été effectué, réessayez demain.").kind, "fallback");
});

test("degraded mode keeps the French text: no partial translation of a compound message", () => {
  const result = analyze("Votre virement a été effectué, mais il sera vérifié.");
  assert.notEqual(result.kind, "intent");
  assert.equal(result.contract.intentId, "fallback.unrecognized_warning");
});
