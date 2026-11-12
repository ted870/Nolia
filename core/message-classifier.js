import { normalizeText } from "./semantic-contract.js";
import { findCatalogEntry } from "./message-catalog.js";

const ACCOUNT_PATTERN = /^CM(?:[\s\u00A0\u202F]+\d+){4,}$/iu;
const PHONE_PATTERN = /^(?:\+?237[\s.-]*)?(?:\d[\s.-]*){9}$/u;
const REFERENCE_PATTERN = /^SAF-[A-Z0-9-]+$/iu;
const ERROR_CODE_PATTERN = /^[A-Z]+_\d{3}$/u;
const DATE_PATTERN = /^\d{2}\s+(?:janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)\s+\d{4}$/iu;

function protectedReason(record, text) {
  if (Array.isArray(record.financialTokens) && record.financialTokens.length > 0) {
    return "financial-value";
  }
  if (ACCOUNT_PATTERN.test(text)) return "account-number";
  if (PHONE_PATTERN.test(text)) return "phone-number";
  if (REFERENCE_PATTERN.test(text)) return "reference";
  if (ERROR_CODE_PATTERN.test(text)) return "error-code";
  if (DATE_PATTERN.test(text)) return "date";
  return null;
}

/** Classify text without changing, storing or transmitting its contents. */
export function classifyTextRecord(record) {
  if (!record || typeof record.text !== "string") {
    throw new TypeError("A text record is required.");
  }

  const text = normalizeText(record.text);
  const entry = findCatalogEntry(text);
  if (entry) {
    return Object.freeze({
      kind: "message",
      messageId: entry.id,
      role: entry.role,
      severity: entry.severity
    });
  }

  const reason = protectedReason(record, text);
  if (reason) return Object.freeze({ kind: "protected", reason });
  return Object.freeze({ kind: "unknown" });
}
