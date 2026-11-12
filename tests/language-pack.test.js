import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  CATALOG_MESSAGE_IDS,
  PACK_REQUIREMENTS,
  loadLanguagePack,
  renderCatalogMessage,
  validateLanguagePack
} from "../core/language-pack.js";
import {
  SAFINUM_DYNAMIC_MESSAGE_CATALOG,
  SAFINUM_MESSAGE_CATALOG
} from "../core/message-catalog.js";
import { INTENT_REGISTRY } from "../core/intent-registry.js";
import { TEST_PACK } from "../core/locale-test-pack.js";
import { EWO_PACK } from "../core/locale-ewo-pack.js";
import { syntheticValidatedPack } from "./helpers/synthetic-pack.js";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const codes = (validation) => validation.reasons.map((reason) => reason.code);
const demo = (pack) => validateLanguagePack(pack, { mode: "demo" });

// ------------------------------------------------------------------ schema

test("the pack schema contains the 63 catalog ids, the 16 intents and the 2 fallbacks", () => {
  const catalogIds = [...SAFINUM_MESSAGE_CATALOG, ...SAFINUM_DYNAMIC_MESSAGE_CATALOG].map((entry) => entry.id);
  assert.equal(CATALOG_MESSAGE_IDS.length, 63);
  assert.deepEqual([...CATALOG_MESSAGE_IDS].sort(), [...catalogIds].sort());
  assert.equal(PACK_REQUIREMENTS.filter((item) => item.kind === "intent").length, INTENT_REGISTRY.length);
  assert.equal(INTENT_REGISTRY.length, 16);
  assert.equal(PACK_REQUIREMENTS.filter((item) => item.kind === "fallback").length, 2);
  assert.equal(PACK_REQUIREMENTS.length, 81);
});

test("the dynamic messages keep their protected slots in the schema", () => {
  const byId = Object.fromEntries(PACK_REQUIREMENTS.map((item) => [item.id, item]));
  assert.deepEqual([...byId["balance.greeting"].requiredSlots], ["name"]);
  assert.deepEqual([...byId["balance.accountNumber"].requiredSlots], ["account"]);
});

test("the ewondo model and the TEST pack contain every id of the schema", async () => {
  for (const path of ["../locales/template.json", "../locales/test.json"]) {
    const pack = await readJson(path);
    for (const requirement of PACK_REQUIREMENTS) {
      assert.ok(pack.templates[requirement.id], `${path} lacks ${requirement.id}`);
      assert.deepEqual(pack.templates[requirement.id].requiredSlots, [...requirement.requiredSlots]);
    }
  }
});

test("the ewondo model is an empty draft: no translation and no validator invented", async () => {
  const model = await readJson("../locales/template.json");
  assert.equal(model.meta.languageCode, "ewo");
  assert.equal(model.meta.status, "draft");
  assert.deepEqual(model.meta.validatedBy, []);
  assert.equal(model.meta.validatedAt, null);
  for (const requirement of PACK_REQUIREMENTS) {
    assert.equal(model.templates[requirement.id].text, "", requirement.id);
    assert.equal(model.templates[requirement.id].status, "draft", requirement.id);
  }
});

test("the shipped ewondo module is the draft model until a validated pack is installed", async () => {
  assert.deepEqual(JSON.parse(JSON.stringify(EWO_PACK)), await readJson("../locales/template.json"));
});

// ------------------------------------------------------------ TEST vs demo

test("the TEST pack is accepted in test mode and every text is marked [TEST]", () => {
  assert.deepEqual(validateLanguagePack(TEST_PACK, { mode: "test" }).reasons, []);
  for (const requirement of PACK_REQUIREMENTS) {
    assert.ok(TEST_PACK.templates[requirement.id].text.startsWith("[TEST]"), requirement.id);
  }
});

test("the TEST pack is refused in demo mode", () => {
  const validation = demo(TEST_PACK);
  assert.equal(validation.ok, false);
  assert.ok(codes(validation).includes("PACK_NOT_VALIDATED"));
  assert.ok(codes(validation).includes("TEST_CONTENT_IN_DEMO"));
  assert.throws(() => loadLanguagePack(TEST_PACK, { mode: "demo" }), (error) => error.code === "PACK_REFUSED");
});

test("the draft ewondo model is refused in demo mode with readable reasons", () => {
  const validation = demo(EWO_PACK);
  assert.equal(validation.ok, false);
  assert.ok(codes(validation).includes("PACK_NOT_VALIDATED"));
  assert.ok(codes(validation).includes("VALIDATORS_MISSING"));
  assert.ok(codes(validation).includes("VALIDATION_DATE_INVALID"));
});

test("a complete pack validated by two people on a past date is accepted", () => {
  const pack = loadLanguagePack(syntheticValidatedPack(), { mode: "demo" });
  assert.equal(Object.isFrozen(pack.templates["common.continue"]), true);
});

for (const [label, mutate, expected] of [
  ["status is not validated", (pack) => { pack.meta.status = "reviewed"; }, "PACK_NOT_VALIDATED"],
  ["a required translation is empty", (pack) => { pack.templates["error.insufficientBalance"].text = "  "; }, "TRANSLATION_EMPTY"],
  ["a required translation is missing", (pack) => { delete pack.templates["summary.confirmTransfer"]; }, "TEMPLATE_MISSING"],
  ["[TEST] appears in a translation", (pack) => { pack.templates["common.back"].text = "CONTROLE [TEST] retour"; }, "TEST_CONTENT_IN_DEMO"],
  ["one template is still a draft", (pack) => { pack.templates["fees.free"].status = "draft"; }, "TEMPLATE_NOT_ALLOWED"],
  ["only one validator is named", (pack) => { pack.meta.validatedBy = ["Validateur A"]; }, "VALIDATORS_MISSING"],
  ["a validator name is empty", (pack) => { pack.meta.validatedBy = ["Validateur A", "  "]; }, "VALIDATORS_MISSING"],
  ["the two validators are the same person", (pack) => { pack.meta.validatedBy = ["Validateur A", "  validateur   a "]; }, "VALIDATORS_NOT_DISTINCT"],
  ["the validation date is absent", (pack) => { pack.meta.validatedAt = null; }, "VALIDATION_DATE_INVALID"],
  ["the validation date is invalid", (pack) => { pack.meta.validatedAt = "2026-02-31"; }, "VALIDATION_DATE_INVALID"],
  ["the validation date is in the future", (pack) => { pack.meta.validatedAt = "2999-01-01"; }, "VALIDATION_DATE_INVALID"],
  ["a protected slot has disappeared", (pack) => { pack.templates["balance.greeting"].text = "CONTROLE Bonjour"; }, "PROTECTED_SLOT_MISSING"],
  ["a protected slot is duplicated", (pack) => { pack.templates["balance.accountNumber"].text = "{account} {account}"; }, "PROTECTED_SLOT_MISSING"],
  ["an unknown slot is added", (pack) => { pack.templates["common.fees"].text = "CONTROLE {amount}"; }, "UNDECLARED_PLACEHOLDER"],
  ["an intent explanation hard-codes a number", (pack) => { pack.templates["fees.amount_info"].text = "CONTROLE 500"; }, "VALUE_IN_TEMPLATE"],
  ["an intent direction is inverted", (pack) => { pack.templates["transfer.received"].direction = "send"; }, "DIRECTION_CHANGED"]
]) {
  test(`demo mode refuses a pack when ${label}`, () => {
    const pack = syntheticValidatedPack();
    mutate(pack);
    const validation = demo(pack);
    assert.equal(validation.ok, false);
    assert.ok(codes(validation).includes(expected), `${expected} not in ${codes(validation).join(",")}`);
  });
}

// ---------------------------------------------------------------- rendering

test("a validated pack may place a protected slot anywhere in the sentence", () => {
  const pack = syntheticValidatedPack();
  pack.templates["balance.greeting"].text = "{name}, CONTROLE salutation";
  const loaded = loadLanguagePack(pack, { mode: "demo" });
  const text = renderCatalogMessage(
    loaded,
    { kind: "message", messageId: "balance.greeting", slots: { name: "Paul Ndzana" } },
    { mode: "demo" }
  );
  assert.equal(text, "Paul Ndzana, CONTROLE salutation");
});

test("rendering refuses a catalog message whose slot value is missing", () => {
  assert.throws(
    () => renderCatalogMessage(TEST_PACK, { kind: "message", messageId: "balance.greeting", slots: {} }, { mode: "test" }),
    (error) => error.code === "SLOT_VALUE_MISSING"
  );
});

// -------------------------------------------------------- install script

test("the install script refuses the draft model and writes nothing", async () => {
  const modulePath = new URL("../core/locale-ewo-pack.js", import.meta.url);
  const before = (await stat(modulePath)).mtimeMs;
  const run = promisify(execFile);
  await assert.rejects(
    run(process.execPath, ["scripts/install-ewo-pack.js", "locales/template.json"], {
      cwd: new URL("..", import.meta.url)
    }),
    (error) => error.code === 1 && /PACK_NOT_VALIDATED/u.test(error.stderr)
  );
  assert.equal((await stat(modulePath)).mtimeMs, before);
});
