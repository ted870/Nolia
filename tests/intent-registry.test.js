import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  INTENT_REGISTRY,
  intentForCatalogId,
  validateIntentRegistry
} from "../core/intent-registry.js";
import { matchIntent } from "../core/intent-matcher.js";
import {
  SAFINUM_DYNAMIC_MESSAGE_CATALOG,
  SAFINUM_MESSAGE_CATALOG
} from "../core/message-catalog.js";
import { FALLBACK_TEMPLATE_IDS } from "../core/intent-renderer.js";
import { TEST_PACK } from "../core/locale-test-pack.js";

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

const catalogIds = new Set(
  [...SAFINUM_MESSAGE_CATALOG, ...SAFINUM_DYNAMIC_MESSAGE_CATALOG].map((entry) => entry.id)
);

test("the intent registry is valid and references only existing catalog ids", () => {
  assert.equal(validateIntentRegistry(INTENT_REGISTRY, catalogIds), true);
});

test("the registry is distinct from the exact-text catalog", () => {
  for (const intent of INTENT_REGISTRY) {
    assert.equal(catalogIds.has(intent.id), false, `intent id collides with catalog: ${intent.id}`);
  }
  // The catalog keeps its own size: intents add meanings, not exact texts.
  assert.equal(SAFINUM_MESSAGE_CATALOG.length + SAFINUM_DYNAMIC_MESSAGE_CATALOG.length, 63);
});

test("each intent has several French formulations", () => {
  for (const intent of INTENT_REGISTRY) {
    assert.ok(intent.examples.length >= 3, `${intent.id} needs at least three formulations`);
  }
});

test("every documented example matches its own intent and no other", () => {
  for (const intent of INTENT_REGISTRY) {
    for (const example of intent.examples) {
      const result = matchIntent(example);
      assert.equal(result.status, "matched", `${intent.id}: "${example}" -> ${result.reason}`);
      assert.equal(result.intent.id, intent.id, `"${example}"`);
    }
  }
});

test("an exact catalog text never matches a different intent than the one attached to it", () => {
  for (const entry of SAFINUM_MESSAGE_CATALOG) {
    const result = matchIntent(entry.source);
    if (result.status !== "matched") continue;
    assert.equal(result.intent.id, intentForCatalogId(entry.id)?.id ?? null, entry.id);
  }
});

test("the action button 'Effectuer un transfert' is not read as a completed transfer", () => {
  assert.notEqual(matchIntent("Effectuer un transfert").intent?.id, "transfer.sent_success");
});

test("template.json and test.json declare every intent and fallback with its direction", async () => {
  const draft = await readJson("../locales/template.json");
  const testPack = await readJson("../locales/test.json");
  for (const intent of INTENT_REGISTRY) {
    assert.equal(draft.templates[intent.id].status, "draft");
    assert.equal(draft.templates[intent.id].text, "");
    assert.equal(draft.templates[intent.id].direction, intent.direction);
    assert.equal(testPack.templates[intent.id].direction, intent.direction);
    assert.ok(testPack.templates[intent.id].text.startsWith("[TEST]"));
    assert.doesNotMatch(testPack.templates[intent.id].text, /\d/u);
  }
  for (const id of Object.values(FALLBACK_TEMPLATE_IDS)) {
    assert.equal(draft.templates[id].status, "draft");
    assert.ok(testPack.templates[id].text.startsWith("[TEST]"));
  }
});

test("the bundled TEST pack module is identical to locales/test.json", async () => {
  assert.deepEqual(JSON.parse(JSON.stringify(TEST_PACK)), await readJson("../locales/test.json"));
});

test("no real language pack is shipped in v0.5.0", async () => {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(new URL("../locales/", import.meta.url));
  assert.deepEqual(files.sort(), ["template.json", "test.json"]);
});

test("cues are plain ASCII because they are applied to folded text (no accent, no look-alike letter)", () => {
  for (const intent of INTENT_REGISTRY) {
    for (const cue of [...intent.requiredCues.flat(), ...intent.forbiddenCues]) {
      assert.match(cue.source, /^[\x20-\x7E]+$/u, `${intent.id}: ${cue.source}`);
    }
  }
});
