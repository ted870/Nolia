/**
 * Nolia critical-value extractor (v0.5.0).
 *
 * Extracts, from free French text, every value that must never be altered:
 * amounts with currency, phone numbers, account numbers, references, error
 * codes, dates and bare numbers. No Chrome or DOM API, no floating point,
 * no network. The same input always yields the same output.
 *
 * Values are returned in reading order with their exact source text (`raw`)
 * and a canonical form (`canonical`) used for comparisons.
 */

import { normalizeMoney, normalizeText } from "./semantic-contract.js";

const SPACE = "[\\s\\u00A0\\u202F]";
// French grouping: 1 to 3 digits, then groups of exactly 3 digits separated
// by a space, a non-breaking space or a dot. Otherwise a plain digit run.
const GROUPED_NUMBER = `(?:\\d{1,3}(?:(?:${SPACE}|\\.)\\d{3})+|\\d+)`;
const DECIMAL_PART = `(?:,\\d+)?`;

const CURRENCY_ALIASES = Object.freeze([
  ["francs?" + SPACE + "+cfa", "XAF"],
  ["f" + SPACE + "*cfa", "XAF"],
  ["fcfa", "XAF"],
  ["xaf", "XAF"],
  ["eur", "EUR"],
  ["euros?", "EUR"],
  ["€", "EUR"],
  ["usd", "USD"],
  ["dollars?", "USD"],
  ["\\$", "USD"]
]);

const CURRENCY_SOURCE = CURRENCY_ALIASES.map(([source]) => source).join("|");

/**
 * Ordered rules. Earlier rules win when two candidates overlap, so a phone or
 * an account number is never re-read as a bare number.
 */
const RULES = Object.freeze([
  {
    type: "account",
    pattern: new RegExp(`\\bCM(?:${SPACE}*\\d+){4,}`, "giu"),
    canonical: (raw) => raw.toUpperCase().replace(/[\s  ]+/gu, "")
  },
  {
    type: "reference",
    pattern: /\bSAF-[A-Z0-9]+(?:-[A-Z0-9]+)*/giu,
    canonical: (raw) => raw.toUpperCase()
  },
  {
    type: "errorCode",
    pattern: /\b[A-Z]+_\d{3}\b/gu,
    canonical: (raw) => raw
  },
  {
    type: "date",
    pattern: new RegExp(
      `\\b\\d{1,2}(?:[/.-]\\d{1,2}[/.-]\\d{2,4}|${SPACE}+(?:janv\\.?|janvier|févr\\.?|février|mars|avr\\.?|avril|mai|juin|juil\\.?|juillet|août|sept\\.?|septembre|oct\\.?|octobre|nov\\.?|novembre|déc\\.?|décembre)${SPACE}+\\d{4})`,
      "giu"
    ),
    canonical: (raw) => normalizeText(raw).toLowerCase()
  },
  {
    // Amount followed by its currency: "25 000 FCFA", "25.000 F CFA".
    type: "amount",
    pattern: new RegExp(
      `(?<![\\d,])${GROUPED_NUMBER}${DECIMAL_PART}${SPACE}*(?:${CURRENCY_SOURCE})(?![\\p{L}\\d])`,
      "giu"
    )
  },
  {
    // Currency written first: "XAF 25 000".
    type: "amount",
    pattern: new RegExp(
      `(?<![\\p{L}])(?:XAF|FCFA|EUR|USD)${SPACE}*${GROUPED_NUMBER}${DECIMAL_PART}(?![\\d,])`,
      "giu"
    )
  },
  {
    type: "phone",
    pattern: /(?<![\d+])(?:\+?237[\s. -]*)?[26](?:[\s. -]*\d){8}(?!\d)/gu,
    canonical: (raw) => {
      const digits = raw.replace(/\D/gu, "");
      return digits.length === 12 && digits.startsWith("237") ? digits.slice(3) : digits;
    }
  },
  {
    type: "number",
    pattern: new RegExp(`(?<![\\d,])${GROUPED_NUMBER}${DECIMAL_PART}(?![\\d])`, "gu")
  }
]);

function readCurrency(raw) {
  const lower = raw.toLowerCase();
  for (const [source, code] of CURRENCY_ALIASES) {
    const anchored = new RegExp(`(?:^|[\\d\\s\\u00A0\\u202F])(?:${source})$|^(?:${source})(?=[\\d\\s\\u00A0\\u202F])`, "iu");
    if (anchored.test(lower)) return code;
  }
  return null;
}

/**
 * Turn "25 000", "25.000" or "25000" into "25000". A decimal comma makes the
 * value ambiguous for a currency without minor units, so it is reported and
 * never silently rounded.
 */
function readDigits(numberText) {
  if (/,/u.test(numberText)) return { canonical: null, ambiguous: true };
  const digits = numberText.replace(/[\s  .]/gu, "");
  return { canonical: normalizeMoney(digits), ambiguous: false };
}

function buildAmount(raw) {
  const currency = readCurrency(raw);
  const numberText = raw.replace(new RegExp(`(?:${CURRENCY_SOURCE})`, "giu"), "").trim();
  const { canonical, ambiguous } = readDigits(numberText);
  return {
    type: "amount",
    raw,
    amount: canonical,
    currency,
    canonical: ambiguous ? null : `${canonical} ${currency}`,
    ambiguous
  };
}

function buildNumber(raw) {
  const { canonical, ambiguous } = readDigits(raw);
  return { type: "number", raw, canonical, ambiguous };
}

/**
 * @param {string} text
 * @returns {Readonly<{
 *   values: ReadonlyArray<Readonly<{type: string, raw: string, canonical: string|null, ambiguous: boolean, start: number, end: number, amount?: string|null, currency?: string|null}>>,
 *   ambiguous: boolean
 * }>}
 */
export function extractCriticalValues(text) {
  if (typeof text !== "string") throw new TypeError("Expected a string value.");
  const source = text.normalize("NFC");
  const taken = [];
  const values = [];

  const overlaps = (start, end) => taken.some(([a, b]) => start < b && end > a);

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const raw = match[0].trim();
      if (!raw) continue;
      const start = match.index + match[0].indexOf(raw);
      const end = start + raw.length;
      if (overlaps(start, end)) continue;

      let value;
      if (rule.type === "amount") value = buildAmount(raw);
      else if (rule.type === "number") value = buildNumber(raw);
      else value = { type: rule.type, raw, canonical: rule.canonical(raw), ambiguous: false };

      taken.push([start, end]);
      values.push(Object.freeze({ ...value, start, end }));
    }
  }

  values.sort((left, right) => left.start - right.start);
  return Object.freeze({
    values: Object.freeze(values),
    ambiguous: values.some((value) => value.ambiguous)
  });
}

/**
 * Canonical signature of a value list, independent of order and formatting.
 * Two texts carry the same critical values exactly when their signatures match.
 *
 * @param {ReadonlyArray<{type: string, canonical: string|null}>} values
 * @returns {string[]}
 */
export function valueSignature(values) {
  return values.map((value) => `${value.type}:${value.canonical}`).sort();
}

/** Remove the critical values from a text, keeping only the wording. */
export function maskCriticalValues(text, values = extractCriticalValues(text).values) {
  let result = "";
  let position = 0;
  for (const value of values) {
    result += text.normalize("NFC").slice(position, value.start) + ` {${value.type}} `;
    position = value.end;
  }
  result += text.normalize("NFC").slice(position);
  return normalizeText(result);
}
