/**
 * Install a validated ewondo pack into the extension (local only).
 * Usage: npm run pack:ewo -- chemin/vers/ewo.json
 *
 * The pack is checked with the same rules as the demo mode. If anything is
 * missing (status, two distinct validators, past date, empty translation,
 * [TEST] marker, protected slot, direction), nothing is written and every
 * reason is printed. On success core/locale-ewo-pack.js is regenerated and
 * the Nolia panel will offer "Activer l'éwondo" after reloading the extension.
 */
import { readFile, writeFile } from "node:fs/promises";
import { validateLanguagePack } from "../core/language-pack.js";
import { moduleSource } from "./build-packs.js";

const path = process.argv[2];
if (!path) {
  console.error("Indiquez le fichier du pack : npm run pack:ewo -- chemin/vers/ewo.json");
  process.exit(2);
}

const pack = JSON.parse(await readFile(path, "utf8"));
const validation = validateLanguagePack(pack, { mode: "demo" });
if (!validation.ok) {
  console.error(`Pack refusé (${validation.reasons.length} motif(s)). Rien n'a été installé.`);
  for (const reason of validation.reasons) {
    console.error(`- ${reason.code}${reason.id ? ` [${reason.id}]` : ""} : ${reason.detail}`);
  }
  process.exit(1);
}

await writeFile(
  new URL("../core/locale-ewo-pack.js", import.meta.url),
  moduleSource("EWO_PACK", pack, [
    "Ewondo pack shipped with the extension. Generated file: do not edit by hand.",
    `Installed from ${path.replace(/\\/gu, "/").split("/").pop()} after demo-mode validation.`,
    `Validated by ${pack.meta.validatedBy.length} people on ${pack.meta.validatedAt}.`
  ])
);
console.log("Pack éwondo validé et installé dans core/locale-ewo-pack.js. Rechargez l'extension.");
