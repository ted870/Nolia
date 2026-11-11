import test from "node:test";
import assert from "node:assert/strict";

import {
  SAFINUM_MESSAGE_CATALOG,
  findCatalogEntry,
  matchCatalogMessage,
  validateMessageCatalog
} from "../core/message-catalog.js";
import { classifyTextRecord } from "../core/message-classifier.js";
import { extractFinancialTokens } from "../core/dom-extractor.js";

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
      severity: "warning",
      slots: {}
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

test("catalog lookup is insensitive to visual capitalization", () => {
  assert.equal(findCatalogEntry("Votre compte").id, "balance.accountHeading");
  assert.equal(findCatalogEntry("Frais de transfert").id, "fees.title");
});

test("extracts protected slots from mixed messages", () => {
  const greeting = matchCatalogMessage("Bonjour, Amina");
  assert.equal(greeting.entry.id, "balance.greeting");
  assert.deepEqual(greeting.slots, { name: "Amina" });

  const account = matchCatalogMessage("Numéro de compte : CM 001 2345 6789 01");
  assert.equal(account.entry.id, "balance.accountNumber");
  assert.deepEqual(account.slots, { account: "CM 001 2345 6789 01" });
});

test("protects names, brands, currency, dates and short codes", () => {
  assert.equal(classifyTextRecord(record("Amina Ngo Bell")).reason, "person-name");
  assert.equal(classifyTextRecord(record("Jean-Paul Mbarga")).reason, "person-name");
  assert.equal(classifyTextRecord(record("Safinum Pay")).reason, "brand");
  assert.equal(classifyTextRecord(record("FCFA")).reason, "currency");
  assert.equal(classifyTextRecord(record("05 nov. 2026")).reason, "date");
  assert.equal(classifyTextRecord(record("AN")).reason, "short-code");
});

test("ignores structural step numbers but not an unseen sentence", () => {
  assert.deepEqual(classifyTextRecord(record("3")), {
    kind: "ignored",
    reason: "step-number"
  });
  assert.deepEqual(classifyTextRecord(record("Nouvelle opération à vérifier.")), {
    kind: "unknown"
  });
});

test("classifies every observed balance-screen text", () => {
  const observed = [
    "Environnement de test — données fictives, aucune transaction réelle.",
    "Protocole de test", "Retour au hackathon", "Safinum Pay", "Banque en ligne",
    "EN", "AN", "Amina Ngo Bell", "1", "Solde", "2", "Frais", "3",
    "Bénéficiaire", "4", "Récapitulatif", "5", "Confirmation", "Votre compte",
    "Bonjour, Amina", "Consultez votre solde et lancez un transfert en toute sécurité.",
    "Solde disponible", "250 000 FCFA", "Numéro de compte : CM 001 2345 6789 01",
    "Compte courant", "Effectuer un transfert", "Consulter les frais",
    "Transactions récentes", "Paiement marchand", "05 nov. 2026", "-12 500 FCFA",
    "Salaire reçu", "04 nov. 2026", "+180 000 FCFA", "Transfert reçu",
    "02 nov. 2026", "+50 000 FCFA", "Facture électricité", "31 oct. 2026",
    "-7 500 FCFA", "Sécurité",
    "Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.",
    "Connexion sécurisée",
    "Safinum Pay — environnement de démonstration. Ne saisissez aucune donnée personnelle réelle."
  ];

  const unknown = observed.filter((text) => classifyTextRecord(
    record(text, extractFinancialTokens(text))
  ).kind === "unknown");
  assert.deepEqual(unknown, []);
});

test("classifies every journey-specific text observed on the remaining screens", () => {
  const observed = [
    "Frais de transfert",
    "Choisissez le type de transfert et le montant. Les frais sont calculés automatiquement.",
    "Type d'opération", "Transfert instantané et gratuit", "Montant à envoyer",
    "FCFA", "Frais", "Gratuit", "0 FCFA", "Total à débiter", "25 000 FCFA",
    "Solde après opération", "225 000 FCFA", "Retour", "Continuer",
    "Bénéficiaire",
    "Renseignez les informations du destinataire. Vérifiez toujours le numéro avant de valider.",
    "Ce bénéficiaire n'a jamais été utilisé sur ce compte. Vérifiez le numéro avant de continuer.",
    "Nom du bénéficiaire", "Numéro de téléphone", "Motif du transfert", "Note (optionnel)",
    "J'ai vérifié le nom et le numéro du bénéficiaire.",
    "Récapitulatif", "Vérifiez les informations avant de confirmer le transfert.",
    "Montant", "Total débité", "Jean-Paul Mbarga", "Téléphone", "+237 6 99 12 34 56",
    "Référence", "SAF-2026-ZEH6N7", "Opération", "Compte Safinum",
    "Je confirme que les informations ci-dessus sont correctes.", "Modifier",
    "Confirmer le transfert", "Transfert effectué",
    "Votre transfert a été envoyé avec succès.", "Statut", "Succès", "Nouveau transfert",
    "Une erreur est survenue", "Solde insuffisant pour effectuer ce transfert.", "AMOUNT_002"
  ];

  const unknown = observed.filter((text) => classifyTextRecord(
    record(text, extractFinancialTokens(text))
  ).kind === "unknown");
  assert.deepEqual(unknown, []);
});
