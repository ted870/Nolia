import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PACK_REQUIREMENTS, validateLanguagePack } from "../core/language-pack.js";
import { PROVISIONAL_EWO_PACK } from "../core/locale-ewo-provisional-pack.js";

test("the provisional module and JSON are identical", async () => {
  const json = JSON.parse(await readFile(new URL("../locales/ewo-provisional.json", import.meta.url), "utf8"));
  assert.deepEqual(JSON.parse(JSON.stringify(PROVISIONAL_EWO_PACK)), json);
});

test("every required text is present, machine-labelled and free of TEST markers", () => {
  for (const requirement of PACK_REQUIREMENTS) {
    const template = PROVISIONAL_EWO_PACK.templates[requirement.id];
    assert.ok(template, requirement.id);
    assert.equal(template.status, "provisional", requirement.id);
    assert.ok(template.text.trim(), requirement.id);
    assert.equal(template.humanValidated, false, requirement.id);
    assert.doesNotMatch(template.text, /\[TEST\]/u, requirement.id);
  }
  assert.equal(validateLanguagePack(PROVISIONAL_EWO_PACK, { mode: "provisional" }).ok, true);
});

test("the automatic-review report contains no unresolved structural flag", async () => {
  const report = await readFile(
    new URL("../docs/rapport-traduction-automatique-ewondo.csv", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(report, /placeholder-mismatch|empty|digit-in-explanation|test-marker/u);
});
