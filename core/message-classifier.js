import { normalizeText } from "./semantic-contract.js";
import { matchCatalogMessage } from "./message-catalog.js";

const ACCOUNT_PATTERN = /^CM(?:[\s\u00A0\u202F]+\d+){4,}$/iu;
const PHONE_PATTERN = /^(?:\+?237[\s.-]*)?(?:\d[\s.-]*){9}$/u;
const REFERENCE_PATTERN = /^SAF-[A-Z0-9-]+$/iu;
const ERROR_CODE_PATTERN = /^[A-Z]+_\d{3}$/u;
const DATE_PATTERN = /^\d{2}\s+(?:janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)\s+\d{4}$/iu;
const CURRENCY_PATTERN = /^(?:FCFA|XAF)$/iu;
const SHORT_CODE_PATTERN = /^[A-Z]{2}$/u;
const STEP_NUMBER_PATTERN = /^[1-5]$/u;
const PERSON_NAME_PATTERN = /^[\p{Lu}][\p{L}'’.-]+(?:\s+[\p{Lu}][\p{L}'’.-]+){1,3}$/u;
const PROTECTED_BRANDS = new Set(["Safinum Pay"]);

function protectedReason(record, text) {
  if (Array.isArray(record.financialTokens) && record.financialTokens.length > 0) {
    return "financial-value";
  }
  if (ACCOUNT_PATTERN.test(text)) return "account-number";
  if (PHONE_PATTERN.test(text)) return "phone-number";
  if (REFERENCE_PATTERN.test(text)) return "reference";
  if (ERROR_CODE_PATTERN.test(text)) return "error-code";
  if (DATE_PATTERN.test(text)) return "date";
  if (CURRENCY_PATTERN.test(text)) return "currency";
  if (SHORT_CODE_PATTERN.test(text)) return "short-code";
  if (PROTECTED_BRANDS.has(text)) return "brand";
  if (PERSON_NAME_PATTERN.test(text)) return "person-name";
  return null;
}

/** Classify text without changing, storing or transmitting its contents. */
export function classifyTextRecord(record) {
  if (!record || typeof record.text !== "string") {
    throw new TypeError("A text record is required.");
  }

  const text = normalizeText(record.text);
  const match = matchCatalogMessage(text);
  if (match) {
    return Object.freeze({
      kind: "message",
      messageId: match.entry.id,
      role: match.entry.role,
      severity: match.entry.severity,
      slots: match.slots
    });
  }

  const reason = protectedReason(record, text);
  if (reason) return Object.freeze({ kind: "protected", reason });
  if (STEP_NUMBER_PATTERN.test(text)) {
    return Object.freeze({ kind: "ignored", reason: "step-number" });
  }
  return Object.freeze({ kind: "unknown" });
}
