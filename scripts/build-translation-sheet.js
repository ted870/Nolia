/**
 * Generate the ewondo translation sheets from the code (local, deterministic).
 * Usage: npm run sheet:ewondo
 *
 * docs/fiche-traduction-ewondo.csv   66 catalog messages (64 exact + 2 dynamic)
 * docs/fiche-intentions-ewondo.csv   intent explanations and fallback notices
 *
 * The "Traduction proposée" column is always empty: translations are written
 * by ewondo speakers, never generated.
 */
import { writeFile, mkdir } from "node:fs/promises";
import {
  SAFINUM_DYNAMIC_MESSAGE_CATALOG,
  SAFINUM_MESSAGE_CATALOG
} from "../core/message-catalog.js";
import { INTENT_REGISTRY, intentForCatalogId } from "../core/intent-registry.js";
import { FALLBACK_TEMPLATE_IDS } from "../core/intent-renderer.js";

const HEADER = [
  "Identifiant", "Écran", "Texte français", "Intention", "Gravité", "Éléments protégés",
  "Traduction proposée", "Validateur 1", "Date 1", "Validateur 2", "Date 2", "Statut", "Commentaires"
];

const SCREEN_BY_PREFIX = [
  [/^(security\.alertTitle|security\.verifyBeneficiaryBeforeContinue)$/u, "3 – Bénéficiaire (alerte après tentative sans cocher la vérification)"],
  [/^confirmation\.requiredBeforeSubmit$/u, "4 – Récapitulatif (erreur après tentative sans cocher la confirmation)"],
  [/^(environment|app|step)\./u, "Commun (en-tête et navigation)"],
  [/^common\./u, "Commun (plusieurs écrans)"],
  [/^(balance|transaction)\./u, "1 – Solde"],
  [/^security\.demoWarning$/u, "Commun (pied de page) – à confirmer"],
  [/^security\./u, "1 – Solde (encart Sécurité) – à confirmer"],
  [/^fees\./u, "2 – Frais"],
  [/^beneficiary\./u, "3 – Bénéficiaire"],
  [/^summary\./u, "4 – Récapitulatif"],
  [/^receipt\./u, "5 – Confirmation"],
  [/^error\./u, "6 – Erreur (AMOUNT_002)"]
];

const SEVERITY = { normal: "normale", warning: "avertissement", critical: "critique" };

const PROTECTED = {
  "balance.greeting": "{name} : nom de la personne, jamais traduit",
  "balance.accountNumber": "{account} : numéro de compte, jamais traduit",
  "security.demoWarning": "« Safinum Pay » (marque)",
  "fees.safinumAccount": "« Safinum » (marque)",
  "fees.mobileMoney": "« Mobile Money » (nom de service, à garder tel quel sauf décision contraire)",
  "error.title": "Code AMOUNT_002 affiché à côté : jamais traduit",
  "error.insufficientBalance": "Code AMOUNT_002 affiché à côté : jamais traduit",
  "security.alertTitle": "Code SECURITY_001 affiché à côté : jamais traduit",
  "security.verifyBeneficiaryBeforeContinue": "Code SECURITY_001 affiché à côté : jamais traduit",
  "confirmation.requiredBeforeSubmit": "Code CONFIRM_001 affiché à côté : jamais traduit"
};

function screenOf(id) {
  return SCREEN_BY_PREFIX.find(([pattern]) => pattern.test(id))?.[1] ?? "À confirmer";
}

function commentOf(entry) {
  const notes = [];
  if (entry.slotNames) notes.push("Message dynamique : garder l'emplacement entre accolades, sa place peut suivre l'ordre de la phrase ewondo");
  if (entry.role === "action") notes.push("Bouton : formulation courte et impérative");
  if (entry.severity === "critical") notes.push("Message critique : le sens ne doit être ni atténué ni ambigu");
  else if (entry.id === "confirmation.requiredBeforeSubmit") {
    notes.push("Instruction obligatoire : conserver clairement l’obligation de confirmer avant validation");
  } else if (entry.severity === "warning") notes.push("Avertissement de sécurité : ne pas atténuer");
  if (/^[^a-z]*[A-Z]{3,}[^a-z]*$/u.test(entry.source)) notes.push("Affiché en majuscules par le site");
  if (entry.id === "summary.confirmTransfer") notes.push("Dernière action avant l'envoi de l'argent");
  if (/^(step|common)\./u.test(entry.id) && entry.role !== "action") notes.push("Libellé court réutilisé sur plusieurs écrans");
  return notes.join(" ; ");
}

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[";\n,]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
};
export const toCsv = (rows) => "﻿" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n") + "\r\n";

export function buildMessageRows() {
  const entries = [...SAFINUM_MESSAGE_CATALOG, ...SAFINUM_DYNAMIC_MESSAGE_CATALOG];
  return entries.map((entry) => [
    entry.id,
    screenOf(entry.id),
    entry.source,
    intentForCatalogId(entry.id)?.id ?? "aucune (libellé exact)",
    SEVERITY[entry.severity],
    PROTECTED[entry.id] ?? "Aucun dans le texte ; les valeurs voisines (montants, noms, numéros) restent en français",
    "", "", "", "", "",
    "à traduire",
    commentOf(entry)
  ]);
}

export function buildIntentRows() {
  const intents = INTENT_REGISTRY.map((intent) => [
    intent.id,
    "Toute page (paraphrase reconnue)",
    `Explication du sens. Exemples français : ${intent.examples.join(" / ")}`,
    intent.id,
    SEVERITY[intent.severity],
    "Aucun chiffre dans l'explication : Nolia ajoute elle-même les valeurs entre parenthèses",
    "", "", "", "", "",
    "à traduire",
    `Sens : ${intent.direction === "send" ? "envoi (argent qui sort)" : intent.direction === "receive" ? "réception (argent qui entre)" : "neutre"} ; le texte français reste affiché avant l'explication`
  ]);
  const fallbacks = [
    [FALLBACK_TEMPLATE_IDS.normal, "Nolia n'a pas reconnu ce message. Le texte français est conservé.", "normale"],
    [FALLBACK_TEMPLATE_IDS.warning, "Attention : Nolia n'a pas reconnu ce message. Vérifiez avant de continuer.", "avertissement"]
  ].map(([id, sense, severity]) => [
    id, "Toute page (message inconnu)", `Sens à rendre : ${sense}`, "mode dégradé", severity,
    "Aucun chiffre : Nolia ajoute les valeurs certaines entre parenthèses", "", "", "", "", "",
    "à traduire", "Ne jamais laisser croire que le message a été compris"
  ]);
  return [...intents, ...fallbacks];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mkdir(new URL("../docs/", import.meta.url), { recursive: true });
  const messages = buildMessageRows();
  const intents = buildIntentRows();
  await writeFile(new URL("../docs/fiche-traduction-ewondo.csv", import.meta.url), toCsv([HEADER, ...messages]));
  await writeFile(new URL("../docs/fiche-intentions-ewondo.csv", import.meta.url), toCsv([HEADER, ...intents]));
  console.log(`fiche-traduction-ewondo.csv : ${messages.length} lignes ; fiche-intentions-ewondo.csv : ${intents.length} lignes`);
}

export { HEADER };
