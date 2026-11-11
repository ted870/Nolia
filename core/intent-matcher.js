/**
 * Deterministic matching of a French sentence to a registered intent.
 *
 * The matcher never forces a text into the nearest intent: zero match, two
 * unresolved matches, a direction contradiction, a missing or ambiguous value,
 * several sentences or a long text all return a refusal with a reason code.
 */

import { normalizeText } from "./semantic-contract.js";
import { extractCriticalValues, maskCriticalValues } from "./value-extractor.js";
import {
  ALARM_CUES,
  INSTRUCTION_CUES,
  SECONDARY_CLAUSE_CUES,
  DIRECTION_CUES,
  INTENT_REGISTRY,
  NEGATION_CUES,
  WARNING_CUES
} from "./intent-registry.js";

export const MAX_INTENT_WORDS = 30;

const compiled = (list) => list.map((source) => new RegExp(source, "u"));
const NEGATIONS = compiled(NEGATION_CUES);
const SEND_CUES = compiled(DIRECTION_CUES.send);
const RECEIVE_CUES = compiled(DIRECTION_CUES.receive);
const WARNINGS = compiled(WARNING_CUES);
const ALARMS = Object.entries(ALARM_CUES).map(([name, source]) => [name, new RegExp(source, "u")]);

const CLAUSES = compiled(SECONDARY_CLAUSE_CUES);
const INSTRUCTIONS = Object.entries(INSTRUCTION_CUES).map(([name, source]) => [name, new RegExp(source, "u")]);

export function hasSecondaryClause(foldedText) {
  return CLAUSES.some((cue) => cue.test(foldedText));
}

export function detectInstructions(foldedText) {
  return INSTRUCTIONS.filter(([, cue]) => cue.test(foldedText)).map(([name]) => name);
}

export function detectAlarms(foldedText) {
  return ALARMS.filter(([, cue]) => cue.test(foldedText)).map(([name]) => name);
}

/**
 * Folded comparison form: masked values, lower case, no diacritics, single
 * apostrophe style. Used only for matching; displayed text is never folded.
 */
export function foldText(text) {
  return normalizeText(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’`´]/gu, "'")
    .toLowerCase();
}

/**
 * Abbreviations whose final dot does not end a sentence. Compared without
 * case; values (dates, amounts, references) are already masked before this.
 */
const ABBREVIATIONS = Object.freeze([
  "m", "mm", "mme", "mmes", "mlle", "dr", "pr", "me", "st", "ste", "sté", "cie",
  "réf", "ref", "tél", "tel", "n", "no", "num", "env", "etc", "ex", "cf",
  "min", "max", "av", "bd", "qté", "art", "vol", "p", "fcfa", "doc"
]);
const ABBREVIATION_PATTERN = new RegExp(
  `(^|[\\s(«"'’])((?:${ABBREVIATIONS.join("|")}))\\.(?=\\s|$)`,
  "giu"
);
const DOT_PLACEHOLDER = "\u2024"; // one dot leader, never typed by Safinum

/** Line break with text on both sides: two visual lines are two statements. */
export function hasLineBreak(rawText) {
  return typeof rawText === "string" && /\S[^\S\r\n]*[\r\n\u2028\u2029]+\s*\S/u.test(rawText);
}

/**
 * Count sentences without relying on the capital letter that follows.
 * A boundary is a run of . ! ? … or ; followed by whitespace and more text.
 * "p. ex." and other known abbreviations do not split.
 */
export function countSentences(maskedText) {
  const protectedText = maskedText
    .replace(/\bp\.\s*ex\./giu, `p${DOT_PLACEHOLDER} ex${DOT_PLACEHOLDER}`)
    .replace(ABBREVIATION_PATTERN, (_, before, word) => `${before}${word}${DOT_PLACEHOLDER}`);
  return protectedText
    .split(/[.!?…;]+(?=\s+\S)/u)
    .map((part) => part.trim())
    .filter((part) => /\p{L}/u.test(part)).length;
}

export function countWords(foldedText) {
  return (foldedText.match(/[\p{L}{][\p{L}'{}-]*/gu) ?? []).length;
}

/** @returns {"send"|"receive"|"both"|"none"} */
export function detectDirection(foldedText) {
  const send = SEND_CUES.some((cue) => cue.test(foldedText));
  const receive = RECEIVE_CUES.some((cue) => cue.test(foldedText));
  if (send && receive) return "both";
  if (send) return "send";
  if (receive) return "receive";
  return "none";
}

export function hasWarningCue(foldedText) {
  return WARNINGS.some((cue) => cue.test(foldedText));
}

function cueMatches(intent, folded, wordCount) {
  if (intent.maxWords !== null && wordCount > intent.maxWords) return false;
  if (!intent.requiredCues.every((group) => group.some((cue) => cue.test(folded)))) return false;
  if (intent.forbiddenCues.some((cue) => cue.test(folded))) return false;
  if (intent.positive && NEGATIONS.some((cue) => cue.test(folded))) return false;
  return true;
}

function unexplainedAlarms(intent, alarms) {
  return alarms.filter((alarm) => !intent.acceptedAlarms.includes(alarm));
}

function resolveSupersession(candidates) {
  const beaten = new Set(candidates.flatMap((intent) => intent.supersedes));
  return candidates.filter((intent) => !beaten.has(intent.id));
}

function directionConflict(intent, detected) {
  if (detected === "both") return intent.direction !== "neutral";
  if (intent.direction === "send") return detected === "receive";
  if (intent.direction === "receive") return detected === "send";
  return false;
}

/**
 * @param {string} text Raw French text from the page.
 * @param {{registry?: typeof INTENT_REGISTRY}} [options]
 */
export function matchIntent(text, options = {}) {
  const registry = options.registry ?? INTENT_REGISTRY;
  const rawText = typeof options.rawText === "string" ? options.rawText : text;
  const normalized = normalizeText(text);
  const extraction = extractCriticalValues(normalized);
  const masked = maskCriticalValues(normalized, extraction.values);
  const folded = foldText(masked);
  const wordCount = countWords(folded);
  const detectedDirection = detectDirection(folded);
  const alarms = detectAlarms(folded);

  const base = {
    values: extraction.values,
    detectedDirection,
    alarms: Object.freeze(alarms),
    warning: hasWarningCue(folded) || alarms.length > 0
  };
  const refuse = (reason, extra = {}) =>
    Object.freeze({ status: "refused", reason, intent: null, ...base, ...extra });

  if (!/\p{L}/u.test(masked)) return refuse("NO_WORDING");
  if (hasLineBreak(rawText) || countSentences(masked) > 1) return refuse("MULTI_SENTENCE");
  if (hasSecondaryClause(folded)) return refuse("SECONDARY_CLAUSE");
  if (wordCount > MAX_INTENT_WORDS) return refuse("TOO_LONG");

  const candidates = resolveSupersession(
    registry.filter((intent) => cueMatches(intent, folded, wordCount))
  );

  if (candidates.length === 0) return refuse("NO_INTENT");
  if (candidates.length > 1) {
    return refuse("AMBIGUOUS_INTENT", {
      candidateIds: Object.freeze(candidates.map((intent) => intent.id).sort())
    });
  }

  const [intent] = candidates;
  const refusedFor = (reason) => refuse(reason, { candidateIds: Object.freeze([intent.id]) });

  if (unexplainedAlarms(intent, alarms).length > 0) return refusedFor("UNEXPLAINED_ALARM");
  if (detectInstructions(folded).some((name) => !intent.acceptedInstructions.includes(name))) {
    return refusedFor("UNCOVERED_INSTRUCTION");
  }
  if (directionConflict(intent, detectedDirection)) return refusedFor("DIRECTION_CONFLICT");
  if (extraction.ambiguous) return refusedFor("AMBIGUOUS_VALUE");
  for (const type of intent.requiredValues) {
    if (!extraction.values.some((value) => value.type === type)) {
      return refusedFor("REQUIRED_VALUE_MISSING");
    }
  }
  if (extraction.values.some((value) => value.type === "amount" && value.currency !== "XAF")) {
    // Safinum uses XAF only; a foreign currency is a meaning Nolia does not cover.
    return refusedFor("UNSUPPORTED_CURRENCY");
  }

  return Object.freeze({ status: "matched", reason: null, intent, ...base });
}
