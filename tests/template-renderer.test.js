import test from "node:test";
import assert from "node:assert/strict";

import { renderMessage, TemplateError } from "../core/template-renderer.js";

const slots = {
  direction: "ENVOYER",
  amount: "250 000",
  currency: "FCFA",
  beneficiary: "Mɛlɛŋ́",
  fees: "500"
};

function makePack({
  packStatus = "validated",
  templateStatus = "validated",
  text = "{beneficiary} reçoit {amount} {currency}. Frais : {fees} {currency}. Action : {direction}."
} = {}) {
  return {
    meta: {
      languageCode: packStatus === "test" ? "TEST" : "xx-demo",
      languageName: packStatus === "test" ? "[TEST]" : "Langue de test technique",
      status: packStatus,
      validatedBy: ["Validateur A", "Validateur B"],
      validatedAt: "2026-11-09"
    },
    templates: {
      "transfer.summary": {
        status: templateStatus,
        text,
        requiredSlots: ["direction", "amount", "currency", "beneficiary", "fees"]
      }
    }
  };
}

test("renders placeholders in the order chosen by the language template", () => {
  const output = renderMessage(makePack(), "transfer.summary", slots);

  assert.equal(
    output,
    "Mɛlɛŋ́ reçoit 250 000 FCFA. Frais : 500 FCFA. Action : ENVOYER."
  );
});

test("blocks a draft language pack in demo mode", () => {
  assert.throws(
    () => renderMessage(makePack({ packStatus: "draft" }), "transfer.summary", slots),
    (error) => error instanceof TemplateError && error.code === "PACK_NOT_VALIDATED"
  );
});

test("requires two validators and a validation date", () => {
  const pack = makePack();
  pack.meta.validatedBy = ["one-validator"];

  assert.throws(
    () => renderMessage(pack, "transfer.summary", slots),
    (error) => error.code === "VALIDATION_EVIDENCE_MISSING"
  );
});

test("blocks a test pack unless test mode is explicit", () => {
  const pack = makePack({
    packStatus: "test",
    templateStatus: "test",
    text: "[TEST] {amount} {currency} vers {beneficiary}; {direction}; frais {fees} {currency}."
  });

  assert.throws(
    () => renderMessage(pack, "transfer.summary", slots),
    (error) => error.code === "PACK_NOT_VALIDATED"
  );

  assert.match(
    renderMessage(pack, "transfer.summary", slots, { mode: "test" }),
    /^\[TEST\]/u
  );
});

test("rejects an unmarked test template", () => {
  const pack = makePack({
    packStatus: "test",
    templateStatus: "test",
    text: "{amount} {currency} vers {beneficiary}; {direction}; frais {fees} {currency}."
  });

  assert.throws(
    () => renderMessage(pack, "transfer.summary", slots, { mode: "test" }),
    (error) => error.code === "TEST_MARKER_MISSING"
  );
});

test("rejects a template that omits a required slot", () => {
  const pack = makePack({
    text: "{beneficiary} reçoit {amount} {currency}. Frais : {fees} {currency}."
  });

  assert.throws(
    () => renderMessage(pack, "transfer.summary", slots),
    (error) => error.code === "REQUIRED_SLOT_ABSENT"
  );
});

test("rejects a missing runtime slot value", () => {
  const incompleteSlots = { ...slots };
  delete incompleteSlots.beneficiary;

  assert.throws(
    () => renderMessage(makePack(), "transfer.summary", incompleteSlots),
    (error) => error.code === "SLOT_VALUE_MISSING"
  );
});

test("does not treat inherited Object properties as slot values", () => {
  const pack = makePack();
  pack.templates["transfer.summary"].text = "{constructor} {amount}";
  pack.templates["transfer.summary"].requiredSlots = ["constructor", "amount"];

  assert.throws(
    () => renderMessage(pack, "transfer.summary", { amount: "5" }),
    (error) => error.code === "SLOT_VALUE_MISSING"
  );
});

test("requires validator names to be distinct after normalization", () => {
  const pack = makePack();
  pack.meta.validatedBy = ["Validateur A", "  validateur a  "];

  assert.throws(
    () => renderMessage(pack, "transfer.summary", slots),
    (error) => error.code === "VALIDATION_EVIDENCE_MISSING"
  );
});

test("rejects a test marker among validator names in demo mode", () => {
  const pack = makePack();
  pack.meta.validatedBy = ["Validateur A", "[TEST] Validateur B"];

  assert.throws(
    () => renderMessage(pack, "transfer.summary", slots),
    (error) => error.code === "TEST_CONTENT_IN_DEMO"
  );
});

test("rejects a validation date that is malformed or in the future", () => {
  for (const validatedAt of ["2026-02-31", "2026-11-09T10:00", "2999-01-01", null]) {
    const pack = makePack();
    pack.meta.validatedAt = validatedAt;

    assert.throws(
      () => renderMessage(pack, "transfer.summary", slots),
      (error) => error.code === "VALIDATION_EVIDENCE_MISSING",
      `should reject ${validatedAt}`
    );
  }
});
