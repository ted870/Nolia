/**
 * Nolia semantic contract.
 *
 * This module contains no Chrome or DOM API. It can run in a browser,
 * a Node.js test suite, or another JavaScript host.
 */

const ALLOWED_DIRECTIONS = new Set(["send", "receive", "neutral"]);

/**
 * Normalize human-readable text without changing its meaning.
 * NFC makes equivalent Unicode spellings comparable while preserving
 * characters such as ɛ, ɔ and ŋ.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  if (typeof value !== "string") {
    throw new TypeError("Expected a string value.");
  }

  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/**
 * Accept only inputs whose decimal representation is exact.
 * A JavaScript number above Number.MAX_SAFE_INTEGER has already been rounded
 * before reaching this module, so it is refused instead of silently altered.
 *
 * @param {unknown} value
 * @returns {string}
 */
function exactMoneyString(value) {
  if (typeof value === "string") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(
        "Money numbers must be safe integers; pass a string or bigint instead."
      );
    }
    return String(value);
  }
  throw new TypeError("Money values must be strings, bigints or safe integers.");
}

/**
 * Convert a monetary value to a canonical digit string.
 * No floating-point number is used, so a financial value cannot be rounded.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeMoney(value) {
  const normalized = exactMoneyString(value).replace(/[\s\u00A0\u202F]/gu, "");

  if (!/^\d+$/u.test(normalized)) {
    throw new TypeError("Money values must contain digits only.");
  }

  return normalized.replace(/^0+(?=\d)/u, "");
}

/**
 * @typedef {Object} SemanticContractInput
 * @property {string} id Stable identifier for the message or operation.
 * @property {"send"|"receive"|"neutral"} direction Meaning of the operation.
 * @property {string|number|bigint} amount Canonical transaction amount.
 * @property {string|number|bigint} fees Canonical fees amount.
 * @property {string} currency ISO currency code, for example XAF.
 * @property {string} beneficiary Beneficiary shown to the user.
 */

/**
 * Build an immutable semantic contract from extracted financial data.
 *
 * @param {SemanticContractInput} input
 * @returns {Readonly<{
 *   id: string,
 *   direction: "send"|"receive"|"neutral",
 *   amount: string,
 *   fees: string,
 *   currency: string,
 *   beneficiary: string
 * }>}
 */
export function createSemanticContract(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("A semantic contract input is required.");
  }

  const id = normalizeText(input.id);
  const direction = input.direction;
  const currency = normalizeText(input.currency).toUpperCase();
  const beneficiary = normalizeText(input.beneficiary);

  if (!id) throw new TypeError("The contract id cannot be empty.");
  if (!ALLOWED_DIRECTIONS.has(direction)) {
    throw new TypeError(`Unsupported direction: ${String(direction)}`);
  }
  if (!/^[A-Z]{3}$/u.test(currency)) {
    throw new TypeError("Currency must be a three-letter ISO code.");
  }
  if (!beneficiary) {
    throw new TypeError("The beneficiary cannot be empty.");
  }

  return Object.freeze({
    id,
    direction,
    amount: normalizeMoney(input.amount),
    fees: normalizeMoney(input.fees),
    currency,
    beneficiary
  });
}

/**
 * Compare the source contract with the contract reconstructed after rendering.
 * Empty errors means that the financial meaning was preserved.
 *
 * @param {ReturnType<typeof createSemanticContract>} source
 * @param {ReturnType<typeof createSemanticContract>} rendered
 * @returns {{valid: boolean, errors: Array<{field: string, code: string}>}}
 */
export function verifySemanticIntegrity(source, rendered) {
  const protectedFields = [
    ["direction", "DIRECTION_CHANGED"],
    ["amount", "AMOUNT_CHANGED"],
    ["fees", "FEES_CHANGED"],
    ["currency", "CURRENCY_CHANGED"],
    ["beneficiary", "BENEFICIARY_CHANGED"]
  ];

  const errors = protectedFields
    .filter(([field]) => source[field] !== rendered[field])
    .map(([field, code]) => ({ field, code }));

  return { valid: errors.length === 0, errors };
}
