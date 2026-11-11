/**
 * Synthetic PROVISIONAL pack for unit tests only. Texts are French control
 * phrases "AUTOMATIQUE …", never real Ewondo. Not shipped.
 */
import { TEST_PACK } from "../../core/locale-test-pack.js";
import { TARGET_LANGUAGE } from "../../core/target-language.js";

export function syntheticProvisionalPack({ drop = [] } = {}) {
  const pack = structuredClone(TEST_PACK);
  pack.meta = {
    languageCode: TARGET_LANGUAGE.code,
    languageName: `${TARGET_LANGUAGE.label} (traduction automatique)`,
    version: 1,
    status: "provisional",
    generatedBy: "Flagship/Lingo cameroon-int8 (essai)",
    generatedAt: "2026-11-10",
    validatedBy: [],
    validatedAt: null
  };
  delete pack.templates["transfer.summary"];
  for (const template of Object.values(pack.templates)) {
    template.status = "provisional";
    template.text = template.text.replace(/^\[TEST\]\s*/u, "AUTOMATIQUE ");
  }
  for (const id of drop) delete pack.templates[id];
  return pack;
}
