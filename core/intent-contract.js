/**
 * Meaning contract for an intent (v0.5.0).
 *
 * The contract freezes what a paraphrase is about (intent, direction) and the
 * exact critical values found in the French source. Any display built from it
 * is read back and compared field by field before it can reach the page.
 */

import { getIntent } from "./intent-registry.js";
import { extractCriticalValues } from "./value-extractor.js";

const DIRECTIONS = new Set(["send", "receive", "neutral"]);

const CHANGE_CODES = Object.freeze({
  amount: "AMOUNT_CHANGED",
  phone: "PHONE_CHANGED",
  account: "ACCOUNT_CHANGED",
  reference: "REFERENCE_CHANGED",
  errorCode: "ERROR_CODE_CHANGED",
  date: "DATE_CHANGED",
  number: "NUMBER_CHANGED"
});

function freezeValue(value) {
  if (!value || typeof value.type !== "string" || !(value.type in CHANGE_CODES)) {
    throw new TypeError("Unsupported critical value.");
  }
  if (value.ambiguous || typeof value.canonical !== "string") {
    throw new TypeError("An ambiguous value cannot enter a contract.");
  }
  const frozen = { type: value.type, raw: value.raw, canonical: value.canonical };
  if (value.type === "amount") {
    frozen.amount = value.amount;
    frozen.currency = value.currency;
  }
  return Object.freeze(frozen);
}

/**
 * @param {{intentId: string, direction: "send"|"receive"|"neutral", values?: Array<object>}} input
 */
export function createIntentContract(input) {
  if (!input || typeof input !== "object") throw new TypeError("A contract input is required.");
  const { intentId, direction } = input;
  if (typeof intentId !== "string" || !intentId) throw new TypeError("The intent id is required.");
  if (!DIRECTIONS.has(direction)) throw new TypeError(`Unsupported direction: ${String(direction)}`);

  const intent = getIntent(intentId);
  if (intent && intent.direction !== direction) {
    // The direction of a registered intent is fixed; a contract cannot flip it.
    throw new TypeError(`DIRECTION_CHANGED: intent ${intentId} is ${intent.direction}.`);
  }

  return Object.freeze({
    intentId,
    direction,
    values: Object.freeze((input.values ?? []).map(freezeValue))
  });
}

function sortedCanonicals(values, type, key = "canonical") {
  return values.filter((value) => value.type === type).map((value) => value[key]).sort();
}

function sameList(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

/**
 * Compare a source contract with the contract read back from a display.
 * @returns {{valid: boolean, errors: Array<{field: string, code: string}>}}
 */
export function verifyIntentIntegrity(source, readBack) {
  const errors = [];
  if (source.intentId !== readBack.intentId) errors.push({ field: "intentId", code: "INTENT_CHANGED" });
  if (source.direction !== readBack.direction) errors.push({ field: "direction", code: "DIRECTION_CHANGED" });

  for (const [type, code] of Object.entries(CHANGE_CODES)) {
    if (type === "amount") {
      const sameDigits = sameList(
        sortedCanonicals(source.values, "amount", "amount"),
        sortedCanonicals(readBack.values, "amount", "amount")
      );
      const sameCurrencies = sameList(
        sortedCanonicals(source.values, "amount", "currency"),
        sortedCanonicals(readBack.values, "amount", "currency")
      );
      if (!sameDigits) errors.push({ field: "amount", code });
      else if (!sameCurrencies) errors.push({ field: "currency", code: "CURRENCY_CHANGED" });
      else if (!sameList(sortedCanonicals(source.values, "amount"), sortedCanonicals(readBack.values, "amount"))) {
        errors.push({ field: "amount", code });
      }
      continue;
    }
    if (!sameList(sortedCanonicals(source.values, type), sortedCanonicals(readBack.values, type))) {
      errors.push({ field: type, code });
    }
  }

  // Same values but in another order (for example amount and fees swapped):
  // the display lists values in the order of the French source.
  if (errors.length === 0) {
    const sequence = (values) => values.map((value) => `${value.type}:${value.canonical}`).join("|");
    if (sequence(source.values) !== sequence(readBack.values)) {
      errors.push({ field: "order", code: "ORDER_CHANGED" });
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Read the critical values carried by a display text (used for verification). */
export function readBackValues(text) {
  const extraction = extractCriticalValues(text);
  if (extraction.ambiguous) return null;
  return extraction.values;
}
