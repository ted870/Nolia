import test from "node:test";
import assert from "node:assert/strict";

import { TemplateError } from "../core/template-renderer.js";
import {
  parseRenderedSlots,
  renderTransfer,
  verifyTransferText
} from "../core/transfer-renderer.js";
import { createSemanticContract } from "../core/semantic-contract.js";

const contract = createSemanticContract({
  id: "transfer-summary",
  direction: "send",
  amount: "250000",
  fees: "500",
  currency: "XAF",
  beneficiary: "Amina Ngo Bell"
});

const TEMPLATE =
  "{direction} {amount} {currency} à {beneficiary}. Frais : {fees} {currency}.";

function makePack({
  labels = { send: "Envoi", receive: "Réception", neutral: "Information" },
  requiredSlots = ["direction", "amount", "currency", "beneficiary", "fees"],
  text = TEMPLATE,
  mode = "demo"
} = {}) {
  return {
    meta: {
      languageCode: mode === "test" ? "TEST" : "xx-demo",
      status: mode === "test" ? "test" : "validated",
      validatedBy: ["Validateur A", "Validateur B"],
      validatedAt: "2026-11-09"
    },
    directionLabels: labels,
    templates: {
      "transfer.summary": {
        status: mode === "test" ? "test" : "validated",
        text,
        requiredSlots
      }
    }
  };
}

test("renders the text from the contract alone and reads the contract back", () => {
  const { text, contract: readBack } = renderTransfer(
    makePack(),
    "transfer.summary",
    contract
  );

  assert.equal(text, "Envoi 250000 XAF à Amina Ngo Bell. Frais : 500 XAF.");
  assert.deepEqual(readBack, contract);
});

test("rejects a template that does not bind every protected slot", () => {
  const pack = makePack({
    text: "{amount} {currency} à {beneficiary}. Frais : {fees} {currency}.",
    requiredSlots: ["amount", "currency", "beneficiary", "fees"]
  });

  assert.throws(
    () => renderTransfer(pack, "transfer.summary", contract),
    (error) => error instanceof TemplateError && error.code === "PROTECTED_SLOT_NOT_BOUND"
  );
});

test("rejects missing direction labels", () => {
  const pack = makePack({ labels: { send: "Envoi", receive: "Réception" } });

  assert.throws(
    () => renderTransfer(pack, "transfer.summary", contract),
    (error) => error.code === "DIRECTION_LABELS_MISSING"
  );
});

test("rejects direction labels that are not distinct", () => {
  const pack = makePack({
    labels: { send: "Envoi", receive: "envoi", neutral: "Information" }
  });

  assert.throws(
    () => renderTransfer(pack, "transfer.summary", contract),
    (error) => error.code === "DIRECTION_LABELS_AMBIGUOUS"
  );
});

test("rejects test labels in demo mode", () => {
  const pack = makePack({
    labels: { send: "[TEST] ENVOI", receive: "Réception", neutral: "Information" }
  });

  assert.throws(
    () => renderTransfer(pack, "transfer.summary", contract),
    (error) => error.code === "TEST_CONTENT_IN_DEMO"
  );
});

test("parses rendered text back into slot values", () => {
  assert.deepEqual(
    parseRenderedSlots(TEMPLATE, "Envoi 250000 XAF à Amina. Frais : 500 XAF."),
    {
      direction: "Envoi",
      amount: "250000",
      currency: "XAF",
      beneficiary: "Amina",
      fees: "500"
    }
  );
});

test("returns null when the text departs from the template structure", () => {
  assert.equal(
    parseRenderedSlots(TEMPLATE, "Envoi 250000 XAF à Amina. Frais : 500 XAF. extra"),
    null
  );
  assert.equal(
    parseRenderedSlots(TEMPLATE, "Envoi 250000 XAF à Amina. Frais : 500 EUR."),
    null,
    "a currency used twice must carry the same value"
  );
});

test("detects a tampered amount", () => {
  assert.throws(
    () =>
      verifyTransferText(
        makePack(),
        "transfer.summary",
        "Envoi 200000 XAF à Amina Ngo Bell. Frais : 500 XAF.",
        contract
      ),
    (error) => error.code === "INTEGRITY_FAILED" && /AMOUNT_CHANGED/u.test(error.message)
  );
});

test("detects a tampered direction", () => {
  assert.throws(
    () =>
      verifyTransferText(
        makePack(),
        "transfer.summary",
        "Réception 250000 XAF à Amina Ngo Bell. Frais : 500 XAF.",
        contract
      ),
    (error) => error.code === "INTEGRITY_FAILED" && /DIRECTION_CHANGED/u.test(error.message)
  );
});

test("detects a tampered beneficiary and fees", () => {
  assert.throws(
    () =>
      verifyTransferText(
        makePack(),
        "transfer.summary",
        "Envoi 250000 XAF à Amina Bell. Frais : 0 XAF.",
        contract
      ),
    (error) =>
      error.code === "INTEGRITY_FAILED" &&
      /FEES_CHANGED/u.test(error.message) &&
      /BENEFICIARY_CHANGED/u.test(error.message)
  );
});

test("rejects text that is not the template at all", () => {
  assert.throws(
    () => verifyTransferText(makePack(), "transfer.summary", "Bonjour", contract),
    (error) => error.code === "INTEGRITY_PARSE_FAILED"
  );
});

test("test mode renders the TEST pack through the same path", () => {
  const pack = makePack({
    mode: "test",
    labels: { send: "[TEST] ENVOI", receive: "[TEST] RECEPTION", neutral: "[TEST] NEUTRE" },
    text: "[TEST] {beneficiary} | {fees} {currency} | {direction} | {amount} {currency}"
  });

  const { text } = renderTransfer(pack, "transfer.summary", contract, { mode: "test" });
  assert.equal(text, "[TEST] Amina Ngo Bell | 500 XAF | [TEST] ENVOI | 250000 XAF");
});
