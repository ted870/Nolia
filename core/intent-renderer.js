/**
 * Display builder for intents and degraded mode (v0.5.0).
 *
 * The French source is always kept as the start of the display. Nolia appends
 * a validated explanation followed by the critical values copied by code from
 * the contract, never from the language pack:
 *
 *   "<French text> — <validated explanation> (15 000 FCFA · SAF-…)"
 *
 * Before returning, the appended part is read back and compared with the
 * contract. A pack whose explanation contains a digit, a placeholder or a
 * direction that differs from the contract is refused.
 */

import { renderMessage, TemplateError } from "./template-renderer.js";
import { normalizeText } from "./semantic-contract.js";
import {
  createIntentContract,
  readBackValues,
  verifyIntentIntegrity
} from "./intent-contract.js";

export const DISPLAY_SEPARATOR = " — ";
export const FACT_SEPARATOR = " · ";
export const FALLBACK_TEMPLATE_IDS = Object.freeze({
  normal: "fallback.unrecognized",
  warning: "fallback.unrecognized_warning"
});

function factsOf(contract) {
  return contract.values.map((value) => value.raw).join(FACT_SEPARATOR);
}

function renderExplanation(pack, templateId, contract, mode) {
  const template = pack?.templates?.[templateId];
  if (!template) throw new TemplateError("TEMPLATE_NOT_FOUND", `Unknown template: ${templateId}`);
  if (template.direction !== contract.direction) {
    throw new TemplateError(
      "INTEGRITY_FAILED",
      `The template direction differs from the contract: DIRECTION_CHANGED.`
    );
  }
  if (Array.isArray(template.requiredSlots) && template.requiredSlots.length > 0) {
    throw new TemplateError("VALUE_SLOT_IN_EXPLANATION", "Explanations carry no slots; values are appended by code.");
  }
  const explanation = renderMessage(pack, templateId, {}, { mode });
  if (/\d/u.test(explanation)) {
    throw new TemplateError("VALUE_IN_TEMPLATE", "An explanation cannot contain digits.");
  }
  return normalizeText(explanation);
}

/**
 * Verify a display text against a contract. Exported so that tests (and any
 * future renderer) can prove that an altered display is refused.
 *
 * @param {ReturnType<typeof createIntentContract>} contract Source contract.
 * @param {{templateId: string, direction: string}} rendering What the display claims to be.
 * @param {string} text Full display text.
 * @param {string} originalText French source that must open the display.
 */
export function verifyDisplayText(contract, rendering, text, originalText) {
  if (typeof text !== "string" || !text.startsWith(`${originalText}${DISPLAY_SEPARATOR}`)) {
    throw new TemplateError("ORIGINAL_NOT_PRESERVED", "The French source must stay visible.");
  }
  const values = readBackValues(text.slice(originalText.length));
  if (!values) throw new TemplateError("INTEGRITY_PARSE_FAILED", "The display carries an ambiguous value.");

  let readBack;
  try {
    readBack = createIntentContract({ intentId: rendering.templateId, direction: rendering.direction, values });
  } catch (error) {
    throw new TemplateError("INTEGRITY_FAILED", `The display changed the protected meaning: ${error.message}`);
  }
  const result = verifyIntentIntegrity(contract, readBack);
  if (!result.valid) {
    const codes = result.errors.map((error) => error.code).join(", ");
    const failure = new TemplateError("INTEGRITY_FAILED", `The display changed the protected meaning: ${codes}.`);
    failure.integrityErrors = result.errors;
    throw failure;
  }
  return readBack;
}

function buildAndVerify(pack, templateId, contract, originalText, mode, marker = "") {
  if (typeof originalText !== "string" || !normalizeText(originalText)) {
    throw new TemplateError("ORIGINAL_MISSING", "The French source text is required.");
  }
  const rendered = renderExplanation(pack, templateId, contract, mode);
  const explanation = marker ? `${marker} ${rendered}` : rendered;
  const facts = factsOf(contract);
  const addition = facts ? `${explanation} (${facts})` : explanation;
  const text = `${originalText}${DISPLAY_SEPARATOR}${addition}`;
  const readBack = verifyDisplayText(
    contract,
    { templateId, direction: pack.templates[templateId].direction },
    text,
    originalText
  );
  return Object.freeze({ text, addition, contract: readBack });
}

/**
 * @param {object} pack Validated pack, or the TEST pack in test mode.
 * @param {ReturnType<typeof createIntentContract>} contract
 * @param {{mode?: "demo"|"test", originalText: string, templateId?: string}} options
 */
export function renderIntent(pack, contract, options = {}) {
  const mode = options.mode ?? "demo";
  const templateId = options.templateId ?? contract.intentId;
  return buildAndVerify(pack, templateId, contract, options.originalText, mode, options.marker);
}

/**
 * Degraded mode: the French text stays, Nolia states that it did not
 * recognize the message and lists only the values extracted with certainty.
 *
 * @param {object} pack
 * @param {{severity: "normal"|"warning", contract: ReturnType<typeof createIntentContract>}} notice
 * @param {{mode?: "demo"|"test", originalText: string}} options
 */
export function renderFallback(pack, notice, options = {}) {
  const mode = options.mode ?? "demo";
  const templateId = FALLBACK_TEMPLATE_IDS[notice.severity] ?? FALLBACK_TEMPLATE_IDS.warning;
  if (notice.contract.intentId !== templateId) {
    throw new TemplateError("INTEGRITY_FAILED", "Fallback contract and template differ: INTENT_CHANGED.");
  }
  return buildAndVerify(pack, templateId, notice.contract, options.originalText, mode, options.marker);
}
