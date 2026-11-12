/**
 * Synthetic "validated" pack for unit tests only. Its texts are French
 * control phrases, not a real language, and its validator names are placeholders
 * (same convention as tests/transfer-renderer.test.js). It is never shipped.
 */
import { TEST_PACK } from "../../core/locale-test-pack.js";
import { TARGET_LANGUAGE } from "../../core/target-language.js";

export function syntheticValidatedPack() {
  const pack = structuredClone(TEST_PACK);
  pack.meta = {
    languageCode: TARGET_LANGUAGE.code, // texts stay French "CONTROLE …" control phrases
    languageName: "Pack de contrôle synthétique",
    version: 1,
    status: "validated",
    validatedBy: ["Validateur A", "Validateur B"],
    validatedAt: "2026-11-01"
  };
  pack.directionLabels = { send: "Envoi", receive: "Réception", neutral: "Information" };
  for (const [id, template] of Object.entries(pack.templates)) {
    template.status = "validated";
    template.text = template.text.replace(/^\[TEST\]\s*/u, "CONTROLE ");
    if (id === "transfer.summary") template.text = "{direction} {amount} {currency} à {beneficiary}. Frais : {fees} {currency}.";
  }
  return pack;
}
