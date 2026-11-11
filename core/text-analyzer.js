/**
 * Nolia v0.5.0 analysis pipeline.
 *
 * Order, from the safest to the most permissive:
 * 1. exact catalog text (unchanged v0.4.0 classifier);
 * 2. structural step numbers and standalone protected values;
 * 3. registered intent recognized from a French paraphrase;
 * 4. degraded mode for a sentence whose meaning is not recognized;
 * 5. unknown fragment, left untouched without any notice.
 *
 * Nothing here reads or writes the DOM, logs text or uses the network.
 */

import { normalizeText } from "./semantic-contract.js";
import { classifyTextRecord } from "./message-classifier.js";
import { intentForCatalogId } from "./intent-registry.js";
import { foldText, matchIntent } from "./intent-matcher.js";
import { createIntentContract } from "./intent-contract.js";
import { maskCriticalValues } from "./value-extractor.js";
import { FALLBACK_TEMPLATE_IDS } from "./intent-renderer.js";

/** A sentence needs this many words (values excluded) to deserve a notice. */
export const FALLBACK_MIN_WORDS = 4;

const WARNING_REASONS = new Set([
  "DIRECTION_CONFLICT",
  "AMBIGUOUS_INTENT",
  "AMBIGUOUS_VALUE",
  "UNSUPPORTED_CURRENCY",
  "REQUIRED_VALUE_MISSING",
  "UNEXPLAINED_ALARM",
  "SECONDARY_CLAUSE",
  "UNCOVERED_INSTRUCTION"
]);

function wordingWords(text) {
  const folded = foldText(maskCriticalValues(text)).replace(/\{[a-zA-Z]+\}/gu, " ");
  return (folded.match(/\p{L}[\p{L}'-]*/gu) ?? []).length;
}

function fallbackNotice(match) {
  const certain = match.values.filter((value) => !value.ambiguous);
  const severity =
    match.warning ||
    WARNING_REASONS.has(match.reason) ||
    // Several statements or a refusal for safety may hide a financial meaning.
    (match.reason !== "NO_INTENT" && match.reason !== "NO_WORDING") ||
    certain.some((value) => value.type === "amount")
      ? "warning"
      : "normal";
  const templateId = FALLBACK_TEMPLATE_IDS[severity];

  return Object.freeze({
    kind: "fallback",
    reason: match.reason,
    severity,
    candidateIds: match.candidateIds ?? Object.freeze([]),
    uncertainValueCount: match.values.length - certain.length,
    contract: createIntentContract({ intentId: templateId, direction: "neutral", values: certain })
  });
}

/**
 * @param {{text: string, financialTokens?: Array<unknown>}} record
 */
export function analyzeTextRecord(record) {
  const classification = classifyTextRecord(record);

  if (classification.kind === "message") {
    const intent = intentForCatalogId(classification.messageId);
    return Object.freeze({ ...classification, intentId: intent?.id ?? null });
  }
  if (classification.kind === "ignored") return classification;

  const text = normalizeText(record.text);
  const words = wordingWords(text);

  // Standalone values (an amount, a phone, a name...) stay protected. A
  // sentence that merely contains an amount continues to intent matching.
  if (classification.kind === "protected") {
    if (classification.reason !== "financial-value" || words < 2) return classification;
  }

  // The DOM extractor collapses line breaks; the raw node text keeps them so
  // that a second line is still seen as a second statement.
  const rawText = typeof record.rawText === "string"
    ? record.rawText
    : typeof record.node?.nodeValue === "string" ? record.node.nodeValue : record.text;
  const match = matchIntent(text, { rawText });
  // A text made only of critical values (for example "25 000 FCFA") is a
  // protected value even when the DOM extractor did not tag it.
  if (words === 0 && match.values.length > 0) {
    return Object.freeze({ kind: "protected", reason: "critical-value" });
  }
  if (match.status === "matched") {
    return Object.freeze({
      kind: "intent",
      intentId: match.intent.id,
      severity: match.intent.severity,
      direction: match.intent.direction,
      contract: createIntentContract({
        intentId: match.intent.id,
        direction: match.intent.direction,
        values: match.values
      })
    });
  }

  // A refusal for any reason other than "no intent at all" means Nolia saw a
  // financial meaning it cannot explain safely: it always earns a notice.
  const refusedForSafety = match.reason !== "NO_INTENT" && match.reason !== "NO_WORDING";
  if (
    words >= FALLBACK_MIN_WORDS ||
    (words >= 2 && (match.warning || match.values.length > 0 || refusedForSafety))
  ) {
    return fallbackNotice(match);
  }

  return classification.kind === "protected" ? classification : Object.freeze({ kind: "unknown" });
}
