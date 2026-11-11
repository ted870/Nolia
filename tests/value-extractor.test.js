import test from "node:test";
import assert from "node:assert/strict";

import {
  extractCriticalValues,
  maskCriticalValues,
  valueSignature
} from "../core/value-extractor.js";

const sig = (text) => valueSignature(extractCriticalValues(text).values);

test("extracts grouped amounts in every Safinum currency spelling without floats", () => {
  assert.deepEqual(sig("Envoi de 25 000 FCFA"), ["amount:25000 XAF"]);
  assert.deepEqual(sig("Envoi de 25.000 F CFA"), ["amount:25000 XAF"]);
  assert.deepEqual(sig("Envoi de 25 000 XAF"), ["amount:25000 XAF"]);
  assert.deepEqual(sig("XAF 1 000 000 envoyés"), ["amount:1000000 XAF"]);
  assert.deepEqual(sig("Montant : 9007199254740993 FCFA"), ["amount:9007199254740993 XAF"]);
});

test("a decimal comma makes the amount ambiguous instead of rounding it", () => {
  const result = extractCriticalValues("Frais : 25,50 FCFA");
  assert.equal(result.ambiguous, true);
  assert.equal(result.values[0].canonical, null);
});

test("keeps foreign currencies distinct so a currency change is visible", () => {
  assert.deepEqual(sig("100 € ou 2 dollars"), ["amount:100 EUR", "amount:2 USD"]);
});

test("extracts phones, accounts, references, error codes, dates and bare numbers", () => {
  assert.deepEqual(
    sig("Réf SAF-2026-13J0O3, code AMOUNT_002, compte CM 001 2345 6789 01, tél. +237 6 99 12 34 56, le 12 nov. 2026, 3 essais"),
    [
      "account:CM0012345678901",
      "date:12 nov. 2026",
      "errorCode:AMOUNT_002",
      "number:3",
      "phone:699123456",
      "reference:SAF-2026-13J0O3"
    ].sort()
  );
});

test("the same phone written with or without the country code has one canonical form", () => {
  assert.deepEqual(sig("+237 699 12 34 56"), sig("699123456"));
});

test("masking keeps the wording and removes only the values", () => {
  assert.equal(
    maskCriticalValues("Paul vous a envoyé 15 000 FCFA."),
    "Paul vous a envoyé {amount} ."
  );
});

test("extraction is deterministic", () => {
  const text = "Transfert de 5 000 FCFA vers 677001122, réf. SAF-AB-12";
  assert.deepEqual(extractCriticalValues(text), extractCriticalValues(text));
});
