/**
 * Render a transfer message from a semantic contract, then verify the text.
 *
 * Protected values (direction, amount, fees, currency, beneficiary) come only
 * from the contract. The text produced by the template is parsed back into
 * values and compared with the contract, so a renderer that alters a protected
 * value is detected instead of trusted.
 *
 * Limit: the check proves that the text matches the template with the
 * contract's values. It does not prove that the template wording is correct;
 * that remains a human linguistic validation (see the pack metadata).
 */

import { renderMessage, TemplateError } from "./template-renderer.js";
import {
  createSemanticContract,
  verifySemanticIntegrity
} from "./semantic-contract.js";

const DIRECTIONS = Object.freeze(["send", "receive", "neutral"]);
const PROTECTED_SLOTS = Object.freeze([
  "direction",
  "amount",
  "fees",
  "currency",
  "beneficiary"
]);

const SLOT_TOKEN_PATTERN = /(\{[a-z][a-zA-Z0-9]*\})/u;

/**
 * @param {object} pack
 * @returns {Record<"send"|"receive"|"neutral", string>} Trimmed labels.
 */
function readDirectionLabels(pack, mode) {
  const labels = pack?.directionLabels;
  if (!labels || typeof labels !== "object") {
    throw new TemplateError(
      "DIRECTION_LABELS_MISSING",
      "The language pack must define a label for each direction."
    );
  }

  const result = {};
  for (const direction of DIRECTIONS) {
    const label = labels[direction];
    if (typeof label !== "string" || label.trim() === "") {
      throw new TemplateError(
        "DIRECTION_LABELS_MISSING",
        `Missing label for direction "${direction}".`
      );
    }
    const trimmed = label.trim();
    if (mode !== "test" && trimmed.includes("[TEST]")) {
      throw new TemplateError(
        "TEST_CONTENT_IN_DEMO",
        "Direction labels cannot be test data in demo mode."
      );
    }
    result[direction] = trimmed;
  }

  // Labels must map back to exactly one direction, or the inverse lookup
  // during verification would be ambiguous.
  const distinct = new Set(Object.values(result).map((label) => label.toLowerCase()));
  if (distinct.size !== DIRECTIONS.length) {
    throw new TemplateError(
      "DIRECTION_LABELS_AMBIGUOUS",
      "Each direction must have a distinct label."
    );
  }

  return result;
}

/**
 * @param {object} template
 */
function assertProtectedSlotsBound(template) {
  const required = new Set(template.requiredSlots ?? []);
  for (const slot of PROTECTED_SLOTS) {
    if (!required.has(slot)) {
      throw new TemplateError(
        "PROTECTED_SLOT_NOT_BOUND",
        `Template must declare the protected slot {${slot}}.`
      );
    }
  }
}

/**
 * Deterministically parse rendered text against a template.
 * Returns null when the text does not follow the template exactly.
 *
 * A slot value ends where the next literal segment of the template begins.
 * If a value itself contains that literal, the split is wrong and the later
 * comparison fails: the error is rejected, never silently accepted.
 *
 * @param {string} templateText
 * @param {string} rendered
 * @returns {Record<string, string> | null}
 */
export function parseRenderedSlots(templateText, rendered) {
  const parts = templateText.split(SLOT_TOKEN_PATTERN);
  const values = {};
  let position = 0;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (index % 2 === 0) {
      // Literal segment: must appear exactly at the current position.
      if (!rendered.startsWith(part, position)) return null;
      position += part.length;
      continue;
    }

    const name = part.slice(1, -1);
    const next = parts[index + 1];
    let value;

    if (next === undefined) {
      // Template ends with a slot: the value runs to the end of the text.
      value = rendered.slice(position);
      position = rendered.length;
    } else if (index + 1 === parts.length - 1) {
      // Final literal: the text must end with it, and the value sits before it.
      const end = rendered.length - next.length;
      if (end < position || !rendered.endsWith(next)) return null;
      value = rendered.slice(position, end);
      position = end;
    } else {
      // Two adjacent slots have no delimiter, so the boundary is undefined.
      if (next === "") return null;
      const end = rendered.indexOf(next, position);
      if (end < 0) return null;
      value = rendered.slice(position, end);
      position = end;
    }

    // A slot used twice (for example the currency) must carry the same value.
    if (Object.prototype.hasOwnProperty.call(values, name) && values[name] !== value) {
      return null;
    }
    values[name] = value;
  }

  return position === rendered.length ? values : null;
}

/**
 * Verify that rendered text reproduces the contract. Throws on any mismatch.
 *
 * @param {object} pack
 * @param {string} messageId
 * @param {string} text Rendered text to check.
 * @param {ReturnType<typeof createSemanticContract>} source Canonical contract.
 * @returns {ReturnType<typeof createSemanticContract>} Contract read back from the text.
 */
export function verifyTransferText(pack, messageId, text, source, options = {}) {
  const mode = options.mode ?? "demo";
  const template = pack.templates?.[messageId];
  if (!template) {
    throw new TemplateError("TEMPLATE_NOT_FOUND", `Unknown template: ${messageId}`);
  }

  const labels = readDirectionLabels(pack, mode);
  const values = parseRenderedSlots(template.text, text);
  if (!values || PROTECTED_SLOTS.some((slot) => !(slot in values))) {
    throw new TemplateError(
      "INTEGRITY_PARSE_FAILED",
      "The rendered text does not follow its template."
    );
  }

  const direction = DIRECTIONS.find(
    (candidate) => labels[candidate].toLowerCase() === values.direction.trim().toLowerCase()
  );
  if (!direction) {
    throw new TemplateError(
      "INTEGRITY_PARSE_FAILED",
      "The rendered direction label is not recognized."
    );
  }

  let readBack;
  try {
    readBack = createSemanticContract({
      id: source.id,
      direction,
      amount: values.amount,
      fees: values.fees,
      currency: values.currency,
      beneficiary: values.beneficiary
    });
  } catch (error) {
    throw new TemplateError(
      "INTEGRITY_PARSE_FAILED",
      `The rendered values are not valid financial data: ${error.message}`
    );
  }

  const result = verifySemanticIntegrity(source, readBack);
  if (!result.valid) {
    const codes = result.errors.map((error) => error.code).join(", ");
    throw new TemplateError(
      "INTEGRITY_FAILED",
      `The rendered text changed the protected meaning: ${codes}.`
    );
  }

  return readBack;
}

/**
 * Render a transfer summary from a contract. Slots are built from the
 * contract only; callers cannot override protected values.
 *
 * @param {object} pack Validated language pack (or TEST pack in test mode).
 * @param {string} messageId
 * @param {object} contract Output of createSemanticContract.
 * @param {{mode?: "demo"|"test"}} [options]
 * @returns {{text: string, contract: ReturnType<typeof createSemanticContract>}}
 */
export function renderTransfer(pack, messageId, contract, options = {}) {
  const mode = options.mode ?? "demo";
  const source = createSemanticContract(contract);

  const template = pack?.templates?.[messageId];
  if (!template) {
    throw new TemplateError("TEMPLATE_NOT_FOUND", `Unknown template: ${messageId}`);
  }
  assertProtectedSlotsBound(template);

  const labels = readDirectionLabels(pack, mode);
  const slots = {
    direction: labels[source.direction],
    amount: source.amount,
    fees: source.fees,
    currency: source.currency,
    beneficiary: source.beneficiary
  };

  const text = renderMessage(pack, messageId, slots, { mode });
  const readBack = verifyTransferText(pack, messageId, text, source, { mode });

  return { text, contract: readBack };
}
