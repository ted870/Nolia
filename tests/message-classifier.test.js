import test from "node:test";
import assert from "node:assert/strict";

import {
  SAFINUM_MESSAGE_CATALOG,
  findCatalogEntry,
  validateMessageCatalog
} from "../core/message-catalog.js";
import { classifyTextRecord } from "../core/message-classifier.js";

function record(text, financialTokens = []) {
  return { text, financialTokens, interactive: false };
}

test("the observed Safinum catalog has unique ids and source texts", () => {
  assert.equal(validateMessageCatalog(), true);
  assert.ok(SAFINUM_MESSAGE_CATALOG.length >= 50);
});

test("recognizes a security warning with its severity", () => {
  assert.deepEqual(
    classifyTextRecord(record("Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.")),
    {
      kind: "message",
      messageId: "security.verifyBeneficiary",
      role: "security",
      severity: "warning"
    }
  );
});

test("recognizes the dynamic insufficient-balance error", () => {
  const result = classifyTextRecord(record("Solde insuffisant pour effectuer ce transfert."));
  assert.equal(result.kind, "message");
  assert.equal(result.messageId, "error.insufficientBalance");
  assert.equal(result.severity, "critical");
});

test("protects financial values, accounts, phones, references and error codes", () => {
  assert.equal(classifyTextRecord(record("25 000 FCFA", [{}])).reason, "financial-value");
  assert.equal(classifyTextRecord(record("CM 001 2345 6789 01")).reason, "account-number");
  assert.equal(classifyTextRecord(record("+237 6 99 12 34 56")).reason, "phone-number");
  assert.equal(classifyTextRecord(record("SAF-2026-13J0O3")).reason, "reference");
  assert.equal(classifyTextRecord(record("AMOUNT_002")).reason, "error-code");
});

test("leaves an unseen text unknown and untouched", () => {
  assert.deepEqual(classifyTextRecord(record("Message injecté jamais observé")), { kind: "unknown" });
});

test("catalog lookup normalizes harmless whitespace", () => {
  assert.equal(findCatalogEntry("  Confirmer   le transfert ").id, "summary.confirmTransfer");
});
