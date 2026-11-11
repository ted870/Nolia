import test from "node:test";
import assert from "node:assert/strict";

import { UNSEEN_PHRASES } from "./fixtures/unseen-phrases.js";
import { analyzeTextRecord } from "../core/text-analyzer.js";
import { findCatalogEntry, matchCatalogMessage } from "../core/message-catalog.js";
import { INTENT_REGISTRY } from "../core/intent-registry.js";
import { normalizeText } from "../core/semantic-contract.js";

const exampleTexts = new Set(
  INTENT_REGISTRY.flatMap((intent) => intent.examples.map((example) => normalizeText(example).toLowerCase()))
);

test("the independent set is absent from the catalog and from the registry examples", () => {
  assert.ok(UNSEEN_PHRASES.length >= 40);
  for (const phrase of UNSEEN_PHRASES) {
    assert.equal(findCatalogEntry(phrase.text), null, phrase.text);
    assert.equal(matchCatalogMessage(phrase.text), null, phrase.text);
    assert.equal(exampleTexts.has(normalizeText(phrase.text).toLowerCase()), false, phrase.text);
  }
});

for (const phrase of UNSEEN_PHRASES) {
  test(`[${phrase.category}] ${phrase.text}`, () => {
    const result = analyzeTextRecord({ text: phrase.text });
    assert.equal(result.kind, phrase.kind);
    if (phrase.intentId) assert.equal(result.intentId, phrase.intentId);
    if (phrase.direction) assert.equal(result.direction, phrase.direction);
    if (phrase.reason) assert.equal(result.reason, phrase.reason);
    if (phrase.severity) assert.equal(result.severity, phrase.severity);
    if (phrase.values) {
      assert.deepEqual(
        result.contract.values.map((value) => `${value.type}:${value.canonical}`).sort(),
        [...phrase.values].sort()
      );
    }
  });
}

test("coverage of the independent set is measured, not assumed", () => {
  const byCategory = {};
  for (const phrase of UNSEEN_PHRASES) {
    const result = analyzeTextRecord({ text: phrase.text });
    const bucket = (byCategory[phrase.category] ??= { total: 0, asExpected: 0 });
    bucket.total += 1;
    if (result.kind === phrase.kind && (!phrase.intentId || result.intentId === phrase.intentId)) {
      bucket.asExpected += 1;
    }
  }
  for (const [category, bucket] of Object.entries(byCategory)) {
    assert.equal(bucket.asExpected, bucket.total, category);
  }
});

test("no unknown or ambiguous sentence is forced into an intent (no false positive)", () => {
  const traps = UNSEEN_PHRASES.filter((phrase) => ["unknown", "ambiguous"].includes(phrase.category));
  for (const phrase of traps) {
    assert.notEqual(analyzeTextRecord({ text: phrase.text }).kind, "intent", phrase.text);
  }
});
