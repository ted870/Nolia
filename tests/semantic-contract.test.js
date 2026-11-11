import test from "node:test";
import assert from "node:assert/strict";

import {
  createSemanticContract,
  normalizeText,
  verifySemanticIntegrity
} from "../core/semantic-contract.js";

const source = createSemanticContract({
  id: "transfer-summary",
  direction: "send",
  amount: "250 000",
  fees: "500",
  currency: "XAF",
  beneficiary: "Amina Ngo Bell"
});

test("accepts an operation whose protected meaning is unchanged", () => {
  const rendered = createSemanticContract({ ...source });
  assert.deepEqual(verifySemanticIntegrity(source, rendered), {
    valid: true,
    errors: []
  });
});

test("rejects a modified amount", () => {
  const rendered = createSemanticContract({ ...source, amount: "200000" });
  const result = verifySemanticIntegrity(source, rendered);

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    { field: "amount", code: "AMOUNT_CHANGED" }
  ]);
});

test("rejects an inversion from send to receive", () => {
  const rendered = createSemanticContract({ ...source, direction: "receive" });
  const result = verifySemanticIntegrity(source, rendered);

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    { field: "direction", code: "DIRECTION_CHANGED" }
  ]);
});

test("rejects modified fees and beneficiary", () => {
  const rendered = createSemanticContract({
    ...source,
    fees: "0",
    beneficiary: "Amina Bell"
  });
  const result = verifySemanticIntegrity(source, rendered);

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    { field: "fees", code: "FEES_CHANGED" },
    { field: "beneficiary", code: "BENEFICIARY_CHANGED" }
  ]);
});

test("preserves Cameroonian characters and normalizes equivalent tones", () => {
  const decomposedTone = "Mɛlɛŋ\u0301";
  const composedTone = decomposedTone.normalize("NFC");

  assert.equal(normalizeText("  Ɛ ɔ ŋ  "), "Ɛ ɔ ŋ");
  assert.equal(normalizeText(decomposedTone), composedTone);
});

test("rejects malformed financial values", () => {
  assert.throws(
    () => createSemanticContract({ ...source, amount: "25O000" }),
    /digits only/u
  );
});

test("refuses JavaScript numbers above the safe integer range", () => {
  assert.throws(
    () => createSemanticContract({ ...source, amount: 12345678901234567890 }),
    /safe integers/u
  );
});

test("accepts exact bigint and safe-integer amounts", () => {
  const fromBigint = createSemanticContract({
    ...source,
    amount: 12345678901234567890n
  });
  const fromSafeNumber = createSemanticContract({ ...source, amount: 250000 });

  assert.equal(fromBigint.amount, "12345678901234567890");
  assert.equal(fromSafeNumber.amount, "250000");
});
