import { normalizeText } from "./semantic-contract.js";

/** Stable identifiers for messages observed in the rendered Safinum journey. */
const ENTRIES = [
  ["environment.testBanner", "Environnement de test — données fictives, aucune transaction réelle.", "security", "warning"],
  ["environment.protocol", "Protocole de test", "navigation"],
  ["environment.backToHackathon", "Retour au hackathon", "navigation"],
  ["app.bankOnline", "Banque en ligne", "label"],
  ["step.balance", "Solde", "navigation"],
  ["common.fees", "Frais", "label"],
  ["common.beneficiary", "Bénéficiaire", "label"],
  ["common.summary", "Récapitulatif", "heading"],
  ["step.confirmation", "Confirmation", "navigation"],
  ["balance.accountHeading", "VOTRE COMPTE", "heading"],
  ["balance.intro", "Consultez votre solde et lancez un transfert en toute sécurité.", "instruction"],
  ["balance.available", "SOLDE DISPONIBLE", "label"],
  ["balance.currentAccount", "Compte courant", "label"],
  ["balance.startTransfer", "Effectuer un transfert", "action"],
  ["balance.checkFees", "Consulter les frais", "action"],
  ["balance.recentTransactions", "TRANSACTIONS RÉCENTES", "heading"],
  ["transaction.merchantPayment", "Paiement marchand", "transaction-label"],
  ["transaction.salaryReceived", "Salaire reçu", "transaction-label"],
  ["transaction.transferReceived", "Transfert reçu", "transaction-label"],
  ["transaction.electricityBill", "Facture électricité", "transaction-label"],
  ["security.title", "Sécurité", "security", "warning"],
  ["security.verifyBeneficiary", "Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.", "security", "warning"],
  ["security.secureConnection", "Connexion sécurisée", "security"],
  ["security.demoWarning", "Safinum Pay — environnement de démonstration. Ne saisissez aucune donnée personnelle réelle.", "security", "warning"],
  ["fees.title", "FRAIS DE TRANSFERT", "heading"],
  ["fees.intro", "Choisissez le type de transfert et le montant. Les frais sont calculés automatiquement.", "instruction"],
  ["fees.operationType", "TYPE D'OPÉRATION", "label"],
  ["fees.safinumAccount", "Compte Safinum", "option"],
  ["fees.mobileMoney", "Mobile Money", "option"],
  ["fees.otherBank", "Autre banque", "option"],
  ["fees.freeInstant", "Transfert instantané et gratuit", "information"],
  ["fees.amountToSend", "MONTANT À ENVOYER", "label"],
  ["fees.free", "Gratuit", "label"],
  ["fees.totalDebit", "Total à débiter", "label"],
  ["fees.balanceAfter", "Solde après opération", "label"],
  ["beneficiary.intro", "Renseignez les informations du destinataire. Vérifiez toujours le numéro avant de valider.", "instruction", "warning"],
  ["beneficiary.newWarning", "Ce bénéficiaire n'a jamais été utilisé sur ce compte. Vérifiez le numéro avant de continuer.", "security", "warning"],
  ["beneficiary.name", "NOM DU BÉNÉFICIAIRE", "label"],
  ["beneficiary.phone", "NUMÉRO DE TÉLÉPHONE", "label"],
  ["beneficiary.reason", "MOTIF DU TRANSFERT", "label"],
  ["beneficiary.note", "NOTE (OPTIONNEL)", "label"],
  ["beneficiary.checked", "J'ai vérifié le nom et le numéro du bénéficiaire.", "confirmation", "warning"],
  ["summary.intro", "Vérifiez les informations avant de confirmer le transfert.", "instruction", "warning"],
  ["summary.amount", "Montant", "label"],
  ["summary.totalDebited", "Total débité", "label"],
  ["summary.phone", "Téléphone", "label"],
  ["summary.reference", "Référence", "label"],
  ["summary.operation", "Opération", "label"],
  ["summary.confirmCorrect", "Je confirme que les informations ci-dessus sont correctes.", "confirmation", "warning"],
  ["summary.edit", "Modifier", "action"],
  ["summary.confirmTransfer", "Confirmer le transfert", "action", "critical"],
  ["receipt.title", "Transfert effectué", "heading"],
  ["receipt.successMessage", "Votre transfert a été envoyé avec succès.", "status"],
  ["receipt.status", "Statut", "label"],
  ["receipt.success", "Succès", "status"],
  ["receipt.newTransfer", "Nouveau transfert", "action"],
  ["error.title", "Une erreur est survenue", "error", "critical"],
  ["error.insufficientBalance", "Solde insuffisant pour effectuer ce transfert.", "error", "critical"],
  ["error.close", "Fermer", "action"],
  ["common.back", "Retour", "action"],
  ["common.continue", "Continuer", "action"]
];

function makeEntry([id, source, role, severity = "normal"]) {
  return Object.freeze({ id, source, role, severity });
}

export const SAFINUM_MESSAGE_CATALOG = Object.freeze(ENTRIES.map(makeEntry));

export const SAFINUM_DYNAMIC_MESSAGE_CATALOG = Object.freeze([
  Object.freeze({
    id: "balance.greeting",
    source: "Bonjour, {name}",
    role: "heading",
    severity: "normal",
    pattern: /^Bonjour,\s*(.+)$/iu,
    slotNames: Object.freeze(["name"])
  }),
  Object.freeze({
    id: "balance.accountNumber",
    source: "Numéro de compte : {account}",
    role: "label",
    severity: "normal",
    pattern: /^Numéro de compte\s*:\s*(.+)$/iu,
    slotNames: Object.freeze(["account"])
  })
]);

function sourceKey(text) {
  return normalizeText(text).toLocaleLowerCase("fr");
}

const ENTRY_BY_SOURCE = new Map(
  SAFINUM_MESSAGE_CATALOG.map((entry) => [sourceKey(entry.source), entry])
);

export function findCatalogEntry(text) {
  return ENTRY_BY_SOURCE.get(sourceKey(text)) ?? null;
}

export function matchCatalogMessage(text) {
  const normalized = normalizeText(text);
  const exact = findCatalogEntry(normalized);
  if (exact) return Object.freeze({ entry: exact, slots: Object.freeze({}) });

  for (const entry of SAFINUM_DYNAMIC_MESSAGE_CATALOG) {
    const match = normalized.match(entry.pattern);
    if (!match) continue;
    const slots = Object.fromEntries(
      entry.slotNames.map((slotName, index) => [slotName, normalizeText(match[index + 1])])
    );
    return Object.freeze({ entry, slots: Object.freeze(slots) });
  }

  return null;
}

export function validateMessageCatalog(entries = SAFINUM_MESSAGE_CATALOG) {
  const ids = new Set();
  const sources = new Set();
  for (const entry of entries) {
    const source = sourceKey(entry.source);
    if (!entry.id || ids.has(entry.id)) {
      throw new TypeError(`Duplicate or missing message id: ${String(entry.id)}`);
    }
    if (!source || sources.has(source)) {
      throw new TypeError(`Duplicate or empty source text: ${source}`);
    }
    ids.add(entry.id);
    sources.add(source);
  }
  for (const entry of SAFINUM_DYNAMIC_MESSAGE_CATALOG) {
    if (!entry.id || ids.has(entry.id) || !(entry.pattern instanceof RegExp)) {
      throw new TypeError(`Duplicate or invalid dynamic message id: ${String(entry.id)}`);
    }
    ids.add(entry.id);
  }
  return true;
}
