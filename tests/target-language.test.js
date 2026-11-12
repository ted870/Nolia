/**
 * Target language (v0.5.4: Bulu; v0.5.5: back to Ewondo), set in one place.
 * Written against TARGET_LANGUAGE so that a future change touches only
 * core/target-language.js and the first test below.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { TARGET_LANGUAGE } from "../core/target-language.js";
import { TARGET_PACK } from "../core/locale-target-pack.js";
import { validateLanguagePack } from "../core/language-pack.js";
import { SHEET_FILES } from "../scripts/build-translation-sheet.js";
import { syntheticValidatedPack } from "./helpers/synthetic-pack.js";
import { OTHER_LANGUAGE, runInstall, setupPanel, writeTempPack } from "./helpers/target-helpers.js";

const root = new URL("../", import.meta.url);

test("the target language is Ewondo, ISO 639-3 ewo (v0.5.5)", () => {
  assert.deepEqual({ ...TARGET_LANGUAGE }, {
    code: "ewo", name: "éwondo", label: "Éwondo", slug: "ewondo", withArticle: "l'éwondo"
  });
});

test("the empty model stays separate from the shipped provisional Ewondo pack", async () => {
  const model = JSON.parse(await readFile(new URL("locales/template.json", root), "utf8"));
  const provisional = JSON.parse(await readFile(new URL("locales/ewo-provisional.json", root), "utf8"));
  assert.equal(model.meta.languageCode, TARGET_LANGUAGE.code);
  assert.equal(model.meta.languageName, `${TARGET_LANGUAGE.label} (modèle à remplir)`);
  assert.equal(model.meta.status, "draft");
  assert.deepEqual(model.meta.validatedBy, []);
  assert.equal(provisional.meta.status, "provisional");
  assert.equal(provisional.meta.humanValidated, false);
  assert.deepEqual(provisional.meta.validatedBy, []);
  assert.deepEqual(JSON.parse(JSON.stringify(TARGET_PACK)), provisional);
  assert.equal(Object.values(model.templates).filter((template) => template.text !== "").length, 1,
    "only the historical transfer.summary example keeps a French draft sentence");
});

test("the panel names the target language and exposes the automatic mode honestly", () => {
  const { panel, node } = setupPanel(TARGET_PACK);
  const { targetButton, reason, mode } = panel.elements;
  assert.equal(targetButton.textContent, `Activer ${TARGET_LANGUAGE.withArticle} (automatique)`);
  assert.equal(targetButton.disabled, false);
  assert.match(reason.textContent, /non validée par des humains/u);
  assert.match(reason.textContent, /84\/84 textes/u);
  targetButton.click();
  assert.equal(mode.textContent, "Mode éwondo — traduction automatique, à vérifier");
  assert.match(node.nodeValue, /^\[AUTO\]/u);
});

test("a validated pack enables the button and the mode is shown in the target language", () => {
  const { panel, node, controller } = setupPanel(syntheticValidatedPack());
  assert.equal(panel.elements.targetButton.disabled, false);
  panel.elements.targetButton.click();
  assert.equal(controller.status.mode, "langue");
  assert.equal(panel.elements.mode.textContent, "Mode éwondo");
  assert.equal(node.nodeValue, "CONTROLE Continuer");
  panel.elements.restoreButton.click();
  assert.equal(node.nodeValue, "Continuer");
});

test("a pack validated for another language is refused", () => {
  const other = syntheticValidatedPack();
  other.meta.languageCode = OTHER_LANGUAGE;
  const validation = validateLanguagePack(other, { mode: "demo", expectedLanguage: TARGET_LANGUAGE.code });
  assert.deepEqual(validation.reasons.map((reason) => reason.code), ["WRONG_LANGUAGE"]);
  const { controller, panel } = setupPanel(other);
  assert.equal(controller.status.targetAvailable, false);
  assert.equal(controller.enableTargetLanguage().enabled, false);
  assert.match(panel.elements.reason.textContent, new RegExp(`langue attendue : ${TARGET_LANGUAGE.code}`, "u"));
});

test("the install script refuses a pack in another language (shipped module untouched)", async () => {
  const other = syntheticValidatedPack();
  other.meta.languageCode = OTHER_LANGUAGE;
  const result = await runInstall([await writeTempPack(other)]);
  assert.equal(result.ok, false);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /WRONG_LANGUAGE/u);
});

test("the install script installs a validated target-language pack only into the redirected file", async () => {
  const result = await runInstall([await writeTempPack(syntheticValidatedPack())]);
  assert.equal(result.ok, true);
  assert.match(result.output, /export const TARGET_PACK/u);
});

test("the translation sheets follow the target language; no other language's file is left", async () => {
  assert.deepEqual(SHEET_FILES, { messages: "fiche-traduction-ewondo.csv", intents: "fiche-intentions-ewondo.csv" });
  const docs = await readdir(new URL("docs/", root));
  assert.ok(docs.includes(SHEET_FILES.messages) && docs.includes(SHEET_FILES.intents));
  assert.equal(docs.some((file) => /bulu/iu.test(file)), false);
  for (const directory of ["core", "extension"]) {
    for (const file of await readdir(new URL(`${directory}/`, root))) {
      const source = await readFile(new URL(`${directory}/${file}`, root), "utf8");
      const visible = source.split("\n").filter((line) => !/^\s*(\*|\/\/|\/\*\*)/u.test(line)).join("\n");
      assert.doesNotMatch(visible, /\b[Bb]ulu\b/u, `${directory}/${file}`);
    }
  }
});
