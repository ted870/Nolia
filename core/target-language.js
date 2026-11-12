/**
 * Target language of Nolia: the ONLY place to change it.
 *
 * The pack schema, the checks and the display path do not depend on the
 * language. The panel labels, the empty model (locales/template.json), the
 * translation sheets and the validators' workbook read these values.
 *
 * v0.5.4: Bulu (bum). v0.5.5: back to Ewondo (ISO 639-3 "ewo"), decision of
 * 11 Nov 2026, because a French<->Ewondo model exists in both directions
 * (needed for the back-translation checks of provisional packs).
 */
export const TARGET_LANGUAGE = Object.freeze({
  code: "ewo",
  name: "éwondo", // lower case, inside sentences
  label: "Éwondo", // capitalised, start of a sentence or title
  slug: "ewondo", // ASCII, for file names
  withArticle: "l'éwondo" // "Activer l'éwondo"
});
