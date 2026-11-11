/**
 * Install a target-language pack into the extension (local only).
 * Usage:
 *   npm run pack:langue -- chemin/vers/pack.json        validated pack (two people)
 *   npm run pack:provisoire -- chemin/vers/pack.json    machine translation, shown with [AUTO]
 *
 * The pack is checked with the same rules as the demo mode. If anything is
 * missing (status, two distinct validators, past date, empty translation,
 * [TEST] marker, protected slot, direction), nothing is written and every
 * reason is printed. The pack must also be for the language set in
 * core/target-language.js. On success core/locale-target-pack.js is
 * regenerated and the panel button is enabled after reloading the extension.
 */
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateLanguagePack } from "../core/language-pack.js";
import { moduleSource } from "./build-packs.js";
import { TARGET_LANGUAGE } from "../core/target-language.js";

const provisional = process.argv.includes("--provisional");
const path = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
if (!path) {
  console.error("Indiquez le fichier du pack : npm run pack:langue -- chemin/vers/pack.json");
  process.exit(2);
}

const pack = JSON.parse(await readFile(path, "utf8"));
const validation = validateLanguagePack(pack, {
  mode: provisional ? "provisional" : "demo",
  expectedLanguage: TARGET_LANGUAGE.code
});
if (!validation.ok) {
  console.error(`Pack refusé (${validation.reasons.length} motif(s)). Rien n'a été installé.`);
  for (const reason of validation.reasons) {
    console.error(`- ${reason.code}${reason.id ? ` [${reason.id}]` : ""} : ${reason.detail}`);
  }
  process.exit(1);
}

// NOLIA_TARGET_MODULE lets the tests write to a temporary file: they must
// never overwrite the module shipped with the extension.
const target = process.env.NOLIA_TARGET_MODULE
  ? pathToFileURL(process.env.NOLIA_TARGET_MODULE)
  : new URL("../core/locale-target-pack.js", import.meta.url);
await writeFile(
  target,
  moduleSource("TARGET_PACK", pack, [
    `${TARGET_LANGUAGE.label} pack shipped with the extension. Generated file: do not edit by hand.`,
    `Installed from ${path.replace(/\\/gu, "/").split("/").pop()} after demo-mode validation.`,
    provisional
      ? `PROVISIONAL machine translation by ${pack.meta.generatedBy} on ${pack.meta.generatedAt}: NOT validated by humans; shown with [AUTO].`
      : `Validated by ${pack.meta.validatedBy.length} people on ${pack.meta.validatedAt}.`
  ])
);
console.log(
  provisional
    ? `Pack ${TARGET_LANGUAGE.name} PROVISOIRE installé (${validation.coverage.present}/${validation.coverage.total} textes, affichés avec [AUTO]). Rechargez l'extension.`
    : `Pack ${TARGET_LANGUAGE.name} validé et installé dans core/locale-target-pack.js. Rechargez l'extension.`
);
