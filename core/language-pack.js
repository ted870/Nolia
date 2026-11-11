/**
 * Local language-pack loader (v0.5.1).
 *
 * One schema for every pack: the 63 Safinum catalog messages (61 exact texts
 * and 2 dynamic messages with protected slots), the 16 intents and the 2
 * degraded-mode notices. A pack is checked as a whole before any of it can be
 * displayed, and every reason for a refusal is reported, so the Nolia panel
 * can say exactly why a pack is not usable.
 *
 * Modes:
 * - "test": only the artificial TEST pack, every text starting with [TEST];
 * - "provisional": machine-generated Ewondo, visibly marked and never passed
 *   off as human-validated;
 * - "demo": only a pack validated by two distinct named people on a past date.
 *
 * No network, no eval, no storage. The pack is a plain object.
 */

import {
  SAFINUM_DYNAMIC_MESSAGE_CATALOG,
  SAFINUM_MESSAGE_CATALOG
} from "./message-catalog.js";
import { INTENT_REGISTRY } from "./intent-registry.js";
import { FALLBACK_TEMPLATE_IDS } from "./intent-renderer.js";
import { extractPlaceholders, isPastIsoDate, renderMessage, TemplateError } from "./template-renderer.js";
import { normalizeText } from "./semantic-contract.js";

const TEST_MARKER = "[TEST]";

/** Every template a complete pack must provide, with its required slots. */
export const PACK_REQUIREMENTS = Object.freeze([
  ...SAFINUM_MESSAGE_CATALOG.map((entry) =>
    Object.freeze({ id: entry.id, kind: "message", source: entry.source, requiredSlots: Object.freeze([]) })
  ),
  ...SAFINUM_DYNAMIC_MESSAGE_CATALOG.map((entry) =>
    Object.freeze({ id: entry.id, kind: "dynamic", source: entry.source, requiredSlots: entry.slotNames })
  ),
  ...INTENT_REGISTRY.map((intent) =>
    Object.freeze({
      id: intent.id,
      kind: "intent",
      source: intent.examples[0],
      requiredSlots: Object.freeze([]),
      direction: intent.direction
    })
  ),
  ...Object.values(FALLBACK_TEMPLATE_IDS).map((id) =>
    Object.freeze({ id, kind: "fallback", source: id, requiredSlots: Object.freeze([]), direction: "neutral" })
  )
]);

export const CATALOG_MESSAGE_IDS = Object.freeze(
  PACK_REQUIREMENTS.filter((item) => item.kind === "message" || item.kind === "dynamic").map((item) => item.id)
);

function sameSet(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((item) => b.has(item));
}

function checkMeta(pack, mode, reasons) {
  const meta = pack?.meta;
  if (!meta || typeof meta !== "object") {
    reasons.push({ code: "INVALID_PACK", detail: "Métadonnées du pack absentes." });
    return;
  }
  if (mode === "test") {
    if (meta.status !== "test" || meta.languageCode !== "TEST") {
      reasons.push({ code: "INVALID_TEST_PACK", detail: "Le mode TEST n'accepte que le pack TEST." });
    }
    return;
  }

  if (mode === "provisional") {
    if (meta.status !== "provisional" || meta.languageCode !== "ewo") {
      reasons.push({
        code: "INVALID_PROVISIONAL_PACK",
        detail: "Le mode provisoire exige un pack ewondo marqué provisional."
      });
    }
    if (meta.humanValidated !== false) {
      reasons.push({
        code: "PROVISIONAL_STATUS_AMBIGUOUS",
        detail: "Le pack provisoire doit déclarer humanValidated: false."
      });
    }
    if (typeof meta.generatedBy !== "string" || !meta.generatedBy.trim()) {
      reasons.push({
        code: "GENERATOR_MISSING",
        detail: "La source de génération automatique doit être déclarée."
      });
    }
    if (String(meta.languageName ?? "").includes(TEST_MARKER)) {
      reasons.push({ code: "TEST_CONTENT_IN_PROVISIONAL", detail: "Le pack TEST ne peut pas servir de pack provisoire." });
    }
    return;
  }

  if (meta.status !== "validated") {
    reasons.push({ code: "PACK_NOT_VALIDATED", detail: `Statut du pack : ${String(meta.status)} (validated requis).` });
  }
  if (meta.languageCode === "TEST" || String(meta.languageName ?? "").includes(TEST_MARKER)) {
    reasons.push({ code: "TEST_CONTENT_IN_DEMO", detail: "Le pack TEST ne peut pas servir en démonstration." });
  }
  const raw = Array.isArray(meta.validatedBy) ? meta.validatedBy : [];
  const names = raw
    .filter((name) => typeof name === "string")
    .map((name) => name.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase())
    .filter(Boolean);
  if (names.length < 2 || names.length !== raw.length) {
    reasons.push({ code: "VALIDATORS_MISSING", detail: "Deux validateurs nommés sont requis." });
  } else if (new Set(names).size < 2) {
    reasons.push({ code: "VALIDATORS_NOT_DISTINCT", detail: "Les deux validateurs doivent être deux personnes distinctes." });
  }
  if (names.some((name) => name.includes("[test]"))) {
    reasons.push({ code: "TEST_CONTENT_IN_DEMO", detail: "Un nom de validateur est marqué [TEST]." });
  }
  if (!isPastIsoDate(meta.validatedAt)) {
    reasons.push({
      code: "VALIDATION_DATE_INVALID",
      detail: "Date de validation absente, invalide ou future (format AAAA-MM-JJ)."
    });
  }
}

function checkTemplate(pack, requirement, mode, reasons) {
  const template = pack?.templates?.[requirement.id];
  const fail = (code, detail) => reasons.push({ code, id: requirement.id, detail });
  if (!template || typeof template !== "object") return fail("TEMPLATE_MISSING", "Traduction absente.");

  const expectedStatus = mode === "test" ? "test" : mode === "provisional" ? "provisional" : "validated";
  if (template.status !== expectedStatus) {
    return fail("TEMPLATE_NOT_ALLOWED", `Statut ${String(template.status)} (${expectedStatus} requis).`);
  }
  if (typeof template.text !== "string" || normalizeText(template.text) === "") {
    return fail("TRANSLATION_EMPTY", "Traduction obligatoire vide.");
  }
  if (mode === "test" && !template.text.startsWith(TEST_MARKER)) {
    fail("TEST_MARKER_MISSING", "Chaque texte TEST doit commencer par [TEST].");
  }
  if (mode !== "test" && template.text.includes(TEST_MARKER)) {
    fail("TEST_CONTENT_IN_DEMO", "[TEST] apparaît dans une traduction.");
  }

  const placeholders = extractPlaceholders(template.text);
  const declared = Array.isArray(template.requiredSlots) ? template.requiredSlots : null;
  if (!declared || !sameSet(declared, requirement.requiredSlots)) {
    fail("REQUIRED_SLOTS_MISMATCH", `Emplacements déclarés attendus : ${requirement.requiredSlots.map((slot) => `{${slot}}`).join(", ") || "aucun"}.`);
  }
  for (const slot of requirement.requiredSlots) {
    if (placeholders.filter((name) => name === slot).length !== 1) {
      fail("PROTECTED_SLOT_MISSING", `L'emplacement protégé {${slot}} doit apparaître exactement une fois.`);
    }
  }
  for (const name of placeholders) {
    if (!requirement.requiredSlots.includes(name)) fail("UNDECLARED_PLACEHOLDER", `Emplacement inconnu {${name}}.`);
  }
  if ((requirement.kind === "intent" || requirement.kind === "fallback")) {
    if (/\d/u.test(template.text)) fail("VALUE_IN_TEMPLATE", "Une explication ne peut contenir aucun chiffre.");
    if (template.direction !== requirement.direction) {
      fail("DIRECTION_CHANGED", `Sens attendu : ${requirement.direction}.`);
    }
  }
  return undefined;
}

/**
 * Check a whole pack. Never throws for content problems: returns every reason.
 * @param {object} pack
 * @param {{mode?: "demo"|"provisional"|"test"}} [options]
 * @returns {{ok: boolean, mode: string, reasons: Array<{code: string, id?: string, detail: string}>}}
 */
export function validateLanguagePack(pack, { mode = "demo" } = {}) {
  if (mode !== "demo" && mode !== "provisional" && mode !== "test") {
    throw new TypeError(`Unsupported mode: ${mode}`);
  }
  const reasons = [];
  if (!pack || typeof pack !== "object") {
    reasons.push({ code: "INVALID_PACK", detail: "Aucun pack fourni." });
    return { ok: false, mode, reasons };
  }
  checkMeta(pack, mode, reasons);
  for (const requirement of PACK_REQUIREMENTS) checkTemplate(pack, requirement, mode, reasons);
  return { ok: reasons.length === 0, mode, reasons };
}

/** Short human summary of a refusal, for the panel (no page content in it). */
export function summarizeRefusal(validation) {
  if (validation.ok) return "";
  const byCode = new Map();
  for (const reason of validation.reasons) {
    const entry = byCode.get(reason.code) ?? { count: 0, detail: reason.detail };
    entry.count += 1;
    byCode.set(reason.code, entry);
  }
  return [...byCode.entries()]
    .map(([, { count, detail }]) => (count > 1 ? `${count} gabarits : ${detail}` : detail))
    .join(" · ");
}

/**
 * Load a pack for a mode, or throw PACK_REFUSED with every reason attached.
 * @returns {object} The same pack, frozen deeply.
 */
export function loadLanguagePack(pack, { mode = "demo" } = {}) {
  const validation = validateLanguagePack(pack, { mode });
  if (!validation.ok) {
    const error = new TemplateError("PACK_REFUSED", summarizeRefusal(validation));
    error.reasons = validation.reasons;
    throw error;
  }
  return deepFreeze(structuredClone(pack));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/**
 * Render one of the 63 catalog messages. Slot values come from the page text
 * (for example the name in "Bonjour, {name}") and must appear unchanged.
 */
export function renderCatalogMessage(pack, classification, { mode = "demo" } = {}) {
  if (classification?.kind !== "message") throw new TypeError("A catalog message is required.");
  const slots = classification.slots ?? {};
  const text = renderMessage(pack, classification.messageId, slots, { mode });
  for (const [name, value] of Object.entries(slots)) {
    const occurrences = text.split(String(value)).length - 1;
    if (occurrences < 1) {
      throw new TemplateError("INTEGRITY_FAILED", `Protected slot {${name}} was not preserved.`);
    }
  }
  return text;
}
