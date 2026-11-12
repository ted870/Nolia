/**
 * Render language templates without depending on Chrome or the DOM.
 *
 * A demo can use only language packs and templates that were explicitly
 * validated. Machine-generated text requires the explicit provisional mode.
 * Test data requires an explicit test mode and a visible [TEST] marker.
 */

const PLACEHOLDER_PATTERN = /\{([a-z][a-zA-Z0-9]*)\}/gu;
const TEST_MARKER = "[TEST]";

export class TemplateError extends Error {
  /**
   * @param {string} code Stable machine-readable error code.
   * @param {string} message Human-readable diagnostic.
   */
  constructor(code, message) {
    super(message);
    this.name = "TemplateError";
    this.code = code;
  }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function extractPlaceholders(text) {
  return [...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]);
}

/**
 * Check whether a pack is allowed in the requested runtime mode.
 *
 * @param {object} pack
 * @param {"demo"|"provisional"|"test"} mode
 */
function assertPackAllowed(pack, mode) {
  if (!pack || typeof pack !== "object" || !pack.meta) {
    throw new TemplateError("INVALID_PACK", "Language-pack metadata is missing.");
  }

  if (mode === "test") {
    if (pack.meta.status !== "test" || pack.meta.languageCode !== "TEST") {
      throw new TemplateError(
        "INVALID_TEST_PACK",
        "Test mode accepts only the explicit TEST language pack."
      );
    }
    return;
  }

  if (mode === "provisional") {
    if (
      pack.meta.status !== "provisional" ||
      pack.meta.languageCode !== "ewo" ||
      pack.meta.humanValidated !== false ||
      typeof pack.meta.generatedBy !== "string" ||
      !pack.meta.generatedBy.trim()
    ) {
      throw new TemplateError(
        "INVALID_PROVISIONAL_PACK",
        "Provisional mode accepts only a declared, machine-generated Ewondo pack."
      );
    }
    return;
  }

  if (pack.meta.status !== "validated") {
    throw new TemplateError(
      "PACK_NOT_VALIDATED",
      "The language pack has not been validated for the demo."
    );
  }

  const rawValidators = Array.isArray(pack.meta.validatedBy)
    ? pack.meta.validatedBy
    : [];
  const normalizedValidators = rawValidators
    .filter((name) => typeof name === "string")
    .map((name) => name.normalize("NFC").trim().toLowerCase())
    .filter(Boolean);

  if (
    normalizedValidators.length !== rawValidators.length ||
    new Set(normalizedValidators).size < 2 ||
    !isPastIsoDate(pack.meta.validatedAt)
  ) {
    throw new TemplateError(
      "VALIDATION_EVIDENCE_MISSING",
      "A demo pack needs two distinct named validators and a past validation date (YYYY-MM-DD)."
    );
  }

  if (normalizedValidators.some((name) => name.includes("[test]"))) {
    throw new TemplateError(
      "TEST_CONTENT_IN_DEMO",
      "Validator names cannot be test data in demo mode."
    );
  }
}

/**
 * @param {unknown} value
 * @param {number} [now] Milliseconds since epoch, injectable for tests.
 * @returns {boolean} True only for a strict YYYY-MM-DD date that is not in the future.
 */
export function isPastIsoDate(value, now = Date.now()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;

  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time)) return false;
  // Reject dates such as 2026-02-31 that Date silently rolls over.
  if (new Date(time).toISOString().slice(0, 10) !== value) return false;

  return time <= now;
}

/**
 * Render one message from a language pack.
 *
 * This function returns plain text. The future browser adapter must assign the
 * result with `textContent`, never `innerHTML`.
 *
 * @param {object} pack Language pack loaded from JSON.
 * @param {string} messageId Stable message identifier.
 * @param {Record<string, string|number|bigint>} slots Values to insert.
 * @param {{mode?: "demo"|"provisional"|"test"}} [options]
 * @returns {string}
 */
export function renderMessage(pack, messageId, slots, options = {}) {
  const mode = options.mode ?? "demo";

  if (mode !== "demo" && mode !== "provisional" && mode !== "test") {
    throw new TemplateError("INVALID_MODE", `Unsupported mode: ${mode}`);
  }

  assertPackAllowed(pack, mode);

  const template = pack.templates?.[messageId];
  if (!template) {
    throw new TemplateError("TEMPLATE_NOT_FOUND", `Unknown template: ${messageId}`);
  }

  const expectedStatus = mode === "test" ? "test" : mode === "provisional" ? "provisional" : "validated";
  if (template.status !== expectedStatus) {
    throw new TemplateError(
      "TEMPLATE_NOT_ALLOWED",
      `Template ${messageId} is not allowed in ${mode} mode.`
    );
  }

  if (typeof template.text !== "string" || !Array.isArray(template.requiredSlots)) {
    throw new TemplateError("INVALID_TEMPLATE", "Template text or required slots are invalid.");
  }

  if (mode === "test" && !template.text.startsWith(TEST_MARKER)) {
    throw new TemplateError(
      "TEST_MARKER_MISSING",
      "Every test template must start with [TEST]."
    );
  }

  if (mode !== "test" && template.text.includes(TEST_MARKER)) {
    throw new TemplateError(
      "TEST_CONTENT_IN_DEMO",
      "Test content cannot be rendered in demo mode."
    );
  }

  const placeholders = extractPlaceholders(template.text);
  const placeholderSet = new Set(placeholders);
  const requiredSet = new Set(template.requiredSlots);

  for (const requiredSlot of requiredSet) {
    if (!placeholderSet.has(requiredSlot)) {
      throw new TemplateError(
        "REQUIRED_SLOT_ABSENT",
        `Required slot {${requiredSlot}} is absent from the template.`
      );
    }
  }

  for (const placeholder of placeholderSet) {
    if (!requiredSet.has(placeholder)) {
      throw new TemplateError(
        "UNDECLARED_PLACEHOLDER",
        `Placeholder {${placeholder}} is not declared.`
      );
    }
    const hasOwnSlot = Object.prototype.hasOwnProperty.call(slots, placeholder);
    if (!hasOwnSlot || slots[placeholder] === null || slots[placeholder] === undefined) {
      throw new TemplateError(
        "SLOT_VALUE_MISSING",
        `No value was provided for {${placeholder}}.`
      );
    }
  }

  return template.text.replace(PLACEHOLDER_PATTERN, (_, slotName) => String(slots[slotName]));
}
