/**
 * Nolia intent registry (v0.5.0).
 *
 * Distinct from core/message-catalog.js: the catalog lists exact Safinum
 * texts, the registry describes financial *meanings* (intents) and the French
 * cues that must all be present before a paraphrase is attached to one.
 *
 * Matching is deterministic: cues are regular expressions applied to a folded
 * form of the text (lower case, no diacritics, critical values masked as
 * {amount}, {phone}, ...). There is no scoring, no learning and no network.
 *
 * Rules per intent:
 * - requiredCues: every group must match at least once;
 * - forbiddenCues: any match rejects the intent;
 * - positive: true means a global negation/failure cue rejects the intent,
 *   so "n'a pas été envoyé" can never read as a success;
 * - requiredValues: value types that must be extracted from the text;
 * - direction: fixed meaning of the operation ("send", "receive", "neutral").
 *   A text whose own direction cues contradict it is refused;
 * - supersedes: intents that this more specific intent wins over when both
 *   match. Any other double match is ambiguous and goes to degraded mode.
 */

const INTENTS = [
  {
    id: "transfer.insufficient_balance",
    domain: "error",
    severity: "critical",
    direction: "neutral",
    catalogIds: ["error.insufficientBalance"],
    requiredCues: [
      ["\\bsolde", "\\bfonds\\b", "\\bprovision", "\\bargent\\b", "montant disponible"],
      ["insuffisan", "\\bdepass", "\\bmanque", "pas assez", "pas d'assez", "trop eleve", "superieur (a|au) (votre|ton|le) solde"]
    ],
    supersedes: ["transfer.failed", "error.generic", "balance.available_info"],
    acceptedAlarms: ["erreur", "echec", "impossible", "refus"],
    examples: [
      "Vous ne disposez pas d'assez de fonds.",
      "Le montant demandé dépasse votre solde disponible.",
      "Solde insuffisant pour réaliser cette opération."
    ]
  },
  {
    id: "transfer.sent_success",
    domain: "status",
    severity: "normal",
    direction: "send",
    positive: true,
    catalogIds: ["receipt.successMessage", "receipt.title"],
    requiredCues: [
      ["\\btransfert", "\\bvirement", "\\benvoi\\b", "\\bpaiement", "\\boperation", "\\btransaction", "vous avez (envoye|transfere|verse)"],
      ["(?<!vous a )\\benvoyee?s?\\b", "\\beffectuee?s?\\b", "\\breussie?s?\\b", "\\baboutie?s?\\b", "\\bexecutee?s?\\b", "\\bsucces\\b", "\\bterminee?s?\\b", "pris en compte", "\\btransferee?s?\\b"]
    ],
    forbiddenCues: ["\\brecu", "\\bcredite", "vous a (envoye|transfere|verse|paye)", "de la part de", "en provenance de"],
    examples: [
      "Votre virement a bien été effectué.",
      "L'envoi a réussi.",
      "Vous avez transféré l'argent avec succès."
    ]
  },
  {
    id: "transfer.received",
    domain: "status",
    severity: "normal",
    direction: "receive",
    positive: true,
    catalogIds: ["transaction.transferReceived"],
    requiredCues: [
      ["\\brecu", "\\bcredite", "vous a (envoye|transfere|verse|paye)", "de la part de", "en provenance de", "\\breception"],
      ["\\btransfert", "\\bvirement", "\\benvoi\\b", "\\bfonds\\b", "\\bargent\\b", "\\bcompte\\b", "\\bpaiement", "\\{amount\\}"]
    ],
    examples: [
      "Paul Ndzana vous a envoyé 15 000 FCFA.",
      "Votre compte a été crédité de 2 000 FCFA.",
      "Vous avez reçu un virement."
    ]
  },
  {
    id: "transfer.failed",
    domain: "error",
    severity: "critical",
    direction: "neutral",
    catalogIds: [],
    requiredCues: [
      ["\\btransfert", "\\bvirement", "\\benvoi\\b", "\\bpaiement", "\\boperation", "\\btransaction"],
      ["\\bechec", "\\bechou", "n'a (pas|jamais) (pu )?(ete|abouti|etre)", "\\bimpossible", "\\brefuse", "\\brejete", "\\bannulee?s?\\b", "\\binterrompue?s?\\b", "non effectue", "(pas|jamais) ete (effectue|envoye|execute)"]
    ],
    forbiddenCues: ["insuffisan", "\\bdepass", "pas assez", "pas d'assez"],
    supersedes: ["error.generic"],
    acceptedAlarms: ["erreur", "echec", "impossible", "refus", "annulation", "interruption"],
    examples: [
      "Le virement a échoué.",
      "Impossible d'effectuer le transfert.",
      "Votre opération n'a pas abouti."
    ]
  },
  {
    id: "beneficiary.verify_before_confirm",
    domain: "security",
    severity: "warning",
    direction: "neutral",
    catalogIds: ["security.verifyBeneficiary", "beneficiary.intro"],
    requiredCues: [
      ["\\bverifiez", "\\bverifier\\b", "\\bcontrolez", "\\bcontroler\\b", "assurez-vous", "\\brelisez"],
      ["\\bbeneficiaire", "\\bdestinataire", "\\bnumero", "nom du"]
    ],
    examples: [
      "Contrôlez le numéro du destinataire avant l'envoi.",
      "Assurez-vous que le nom du bénéficiaire est exact.", "Vérifiez le numéro du bénéficiaire avant de continuer."]
  },
  {
    id: "beneficiary.new_unknown",
    domain: "security",
    severity: "warning",
    direction: "neutral",
    catalogIds: ["beneficiary.newWarning"],
    requiredCues: [
      ["\\bbeneficiaire", "\\bdestinataire", "\\bnumero", "\\bcontact"],
      ["jamais (ete )?utilise", "\\bnouveau", "\\bnouvel", "\\binconnu", "premiere fois", "pas encore (ete )?utilise"]
    ],
    supersedes: ["beneficiary.verify_before_confirm"],
    examples: [
      "Vous n'avez encore jamais utilisé ce destinataire.",
      "Ce bénéficiaire est nouveau sur votre compte.", "Attention : nouveau destinataire."]
  },
  {
    id: "summary.verify_before_confirm",
    domain: "security",
    severity: "warning",
    direction: "neutral",
    catalogIds: ["summary.intro"],
    requiredCues: [
      ["\\bverifiez", "\\bverifier\\b", "\\bcontrolez", "\\bcontroler\\b", "\\brelisez", "assurez-vous"],
      ["\\binformations", "\\bdetails", "\\brecapitulatif", "\\bdonnees"],
      ["avant (de )?(confirmer|valider)", "avant (la )?(confirmation|validation)"]
    ],
    examples: ["Relisez les détails avant de valider l'opération.", "Vérifiez les détails avant la confirmation.", "Contrôlez le récapitulatif avant de valider."]
  },
  {
    id: "environment.test_data",
    domain: "security",
    severity: "warning",
    direction: "neutral",
    catalogIds: ["environment.testBanner"],
    requiredCues: [
      ["\\btest\\b", "\\bdemonstration", "\\bdemo\\b", "\\bfictif|\\bfictiv", "\\bsimulation", "\\bsimule"],
      ["\\bdonnees", "\\btransaction", "\\benvironnement", "\\bcompte", "\\boperation"]
    ],
    examples: ["Ceci est une simulation : les opérations sont fictives.", "Environnement de démonstration : aucune transaction n'est réelle.", "Les comptes affichés sont fictifs."]
  },
  {
    id: "security.no_personal_data",
    domain: "security",
    severity: "warning",
    direction: "neutral",
    catalogIds: ["security.demoWarning"],
    requiredCues: [
      ["ne saisissez", "n'entrez", "ne communiquez", "ne partagez", "ne donnez", "ne transmettez", "n'indiquez"],
      ["\\bdonnee", "\\binformation", "\\bcode", "mot de passe", "\\bpin\\b", "\\bpersonnel"]
    ],
    supersedes: ["environment.test_data"],
    acceptedAlarms: ["fraude"],
    examples: ["Ne communiquez jamais votre code secret.", "N'entrez aucune information personnelle.", "Ne donnez votre code PIN à personne."]
  },
  {
    id: "fees.free_transfer",
    domain: "fees",
    severity: "normal",
    direction: "neutral",
    catalogIds: ["fees.freeInstant", "fees.free"],
    requiredCues: [["\\bgratuit", "sans frais", "aucun frais", "frais offerts", "frais nuls", "pas de frais"]],
    examples: ["Aucun frais ne sera appliqué à ce transfert.", "Transfert gratuit.", "Pas de frais pour cet envoi."]
  },
  {
    id: "fees.amount_info",
    domain: "fees",
    severity: "normal",
    direction: "neutral",
    catalogIds: [],
    requiredCues: [["\\bfrais\\b"], ["\\{amount\\}"]],
    requiredValues: ["amount"],
    forbiddenCues: ["\\bgratuit", "sans frais", "aucun frais", "pas de frais", "\\btotal\\b", "\\bsolde"],
    examples: ["Les frais de cette opération s'élèvent à 500 FCFA.", "Frais : 200 FCFA.", "Des frais de 1 000 FCFA s'appliquent."]
  },
  {
    id: "transfer.total_debit",
    domain: "fees",
    severity: "normal",
    direction: "send",
    catalogIds: ["fees.totalDebit", "summary.totalDebited"],
    requiredCues: [["\\btotal\\b", "\\bmontant\\b", "\\bsomme\\b", "votre compte"], ["\\bdebit", "\\bpreleve", "\\bretire"]],
    forbiddenCues: ["\\brecu", "\\bcredit"],
    examples: ["Somme prélevée sur votre compte : 25 500 FCFA.", "Total débité : 10 200 FCFA.", "Montant retiré de votre compte : 3 000 FCFA."]
  },
  {
    id: "balance.available_info",
    domain: "balance",
    severity: "normal",
    direction: "neutral",
    catalogIds: ["balance.available"],
    requiredCues: [["\\bsolde"], ["\\bdisponible", "\\bactuel", "\\brestant", "est de", "s'eleve", "\\{amount\\}"]],
    forbiddenCues: ["insuffisan", "\\bdepass", "\\bmanque", "\\bapres\\b", "nouveau solde"],
    examples: ["Votre solde actuel est de 125 000 FCFA.", "Solde disponible : 45 000 FCFA.", "Votre solde s'élève à 8 000 FCFA."]
  },
  {
    id: "balance.after_operation",
    domain: "balance",
    severity: "normal",
    direction: "neutral",
    catalogIds: ["fees.balanceAfter"],
    requiredCues: [["\\bsolde", "\\breste"], ["apres (l'|cette |le |ce )?(operation|transfert|envoi)", "nouveau solde"]],
    forbiddenCues: ["insuffisan", "\\bdepass", "\\bmanque"],
    examples: ["Nouveau solde après le transfert : 99 500 FCFA.", "Solde restant après l'opération : 12 000 FCFA.", "Il vous reste 5 000 FCFA de solde après ce transfert."]
  },
  {
    id: "action.confirm_transfer",
    domain: "action",
    severity: "critical",
    direction: "send",
    catalogIds: ["summary.confirmTransfer"],
    maxWords: 5,
    requiredCues: [["^(confirmer|valider|executer|envoyer)\\b"], ["\\btransfert", "\\bvirement", "\\benvoi\\b", "\\bpaiement", "\\boperation", "\\bargent\\b"]],
    examples: ["Valider le virement", "Envoyer l'argent", "Confirmer le paiement"]
  },
  {
    id: "error.generic",
    domain: "error",
    severity: "critical",
    direction: "neutral",
    catalogIds: ["error.title"],
    requiredCues: [["\\berreur", "\\bprobleme", "\\bincident"], ["survenu", "produit", "\\brencontre", "\\btechnique", "\\binattendu"]],
    acceptedAlarms: ["erreur"],
    examples: ["Un problème technique s'est produit.", "Une erreur est survenue lors du traitement.", "Incident technique rencontré."]
  }
];

/** Global cues that negate or invert a positive statement. */
export const NEGATION_CUES = Object.freeze([
  "\\bne\\b", "\\bn'", "\\bpas\\b", "\\bjamais\\b", "\\baucun", "\\bechec", "\\bechou",
  "\\bimpossible", "\\brefus", "\\bannul", "\\bbloqu", "\\bsuspend", "\\berreur",
  "\\brejet", "\\binterromp", "\\bnon\\b", "\\ben attente", "\\ben cours"
]);

/**
 * Alarm cues. A text containing an alarm is attached to an intent only if the
 * intent lists that alarm in `acceptedAlarms`; otherwise the extra meaning
 * ("bloqué", "suspendu", "fraude"...) would be hidden by the explanation.
 */
export const ALARM_CUES = Object.freeze({
  blocage: "\\bbloqu",
  suspension: "\\bsuspen",
  fraude: "\\bfraud",
  expiration: "\\bexpir",
  annulation: "\\bannul",
  refus: "\\b(refus|rejet)",
  echec: "\\b(echec|echou)",
  impossible: "\\bimpossible",
  interdiction: "\\binterdi",
  erreur: "\\berreur",
  interruption: "\\binterromp",
  piratage: "\\bpirat",
  plafond: "\\b(plafond|limite)",
  delai: "\\b(delai|retard|en attente)"
});

/** Direction cues, used to refuse a contradiction with the intent direction. */
export const DIRECTION_CUES = Object.freeze({
  receive: Object.freeze([
    "\\brecu", "\\bcredite", "vous a (envoye|transfere|verse|paye)", "de la part de",
    "en provenance de", "\\breception"
  ]),
  send: Object.freeze([
    "(?<!vous a )\\benvoyee?s?\\b", "vous avez (envoye|transfere|verse|paye)", "\\bdebit",
    "\\bpreleve", "a destination de", "\\bvers le\\b", "\\bmontant a envoyer"
  ])
});

/** Cues that make an unknown sentence a warning in degraded mode. */
export const WARNING_CUES = Object.freeze([
  "\\bbloqu", "\\berreur", "\\battention", "\\bechec", "\\bechou", "\\brefus",
  "\\bsuspend", "\\burgent", "\\bverifi", "\\bimpossible", "\\binterdit", "\\brisque",
  "\\bfraude", "\\bexpire", "\\bannul", "\\brejet"
]);

const ALLOWED_DIRECTIONS = new Set(["send", "receive", "neutral"]);
const ALLOWED_SEVERITIES = new Set(["normal", "warning", "critical"]);

function compileList(list) {
  return Object.freeze((list ?? []).map((source) => new RegExp(source, "u")));
}

function compileIntent(intent) {
  return Object.freeze({
    id: intent.id,
    domain: intent.domain,
    severity: intent.severity,
    direction: intent.direction,
    positive: intent.positive === true,
    catalogIds: Object.freeze([...(intent.catalogIds ?? [])]),
    requiredCues: Object.freeze(intent.requiredCues.map(compileList)),
    forbiddenCues: compileList(intent.forbiddenCues),
    requiredValues: Object.freeze([...(intent.requiredValues ?? [])]),
    supersedes: Object.freeze([...(intent.supersedes ?? [])]),
    maxWords: intent.maxWords ?? null,
    acceptedAlarms: Object.freeze([...(intent.acceptedAlarms ?? [])]),
    examples: Object.freeze([...(intent.examples ?? [])])
  });
}

export const INTENT_REGISTRY = Object.freeze(INTENTS.map(compileIntent));

const INTENT_BY_ID = new Map(INTENT_REGISTRY.map((intent) => [intent.id, intent]));
const INTENT_BY_CATALOG_ID = new Map(
  INTENT_REGISTRY.flatMap((intent) => intent.catalogIds.map((catalogId) => [catalogId, intent]))
);

export function getIntent(id) {
  return INTENT_BY_ID.get(id) ?? null;
}

/** Intent attached to an exact catalog message, or null for plain labels. */
export function intentForCatalogId(catalogId) {
  return INTENT_BY_CATALOG_ID.get(catalogId) ?? null;
}

/**
 * Structural validation. `catalogIds` lets the test suite check that every
 * referenced catalog entry exists without the registry importing the catalog.
 */
export function validateIntentRegistry(registry = INTENT_REGISTRY, knownCatalogIds = null) {
  const ids = new Set();
  const claimedCatalogIds = new Set();
  for (const intent of registry) {
    if (!intent.id || ids.has(intent.id)) {
      throw new TypeError(`Duplicate or missing intent id: ${String(intent.id)}`);
    }
    if (!ALLOWED_DIRECTIONS.has(intent.direction)) {
      throw new TypeError(`Intent ${intent.id} has an invalid direction.`);
    }
    if (!ALLOWED_SEVERITIES.has(intent.severity)) {
      throw new TypeError(`Intent ${intent.id} has an invalid severity.`);
    }
    if (intent.requiredCues.length === 0 || intent.requiredCues.some((group) => group.length === 0)) {
      throw new TypeError(`Intent ${intent.id} needs non-empty cue groups.`);
    }
    for (const alarm of intent.acceptedAlarms) {
      if (!(alarm in ALARM_CUES)) throw new TypeError(`Intent ${intent.id} accepts unknown alarm ${alarm}.`);
    }
    for (const catalogId of intent.catalogIds) {
      if (claimedCatalogIds.has(catalogId)) {
        throw new TypeError(`Catalog id ${catalogId} is attached to two intents.`);
      }
      if (knownCatalogIds && !knownCatalogIds.has(catalogId)) {
        throw new TypeError(`Intent ${intent.id} references unknown catalog id ${catalogId}.`);
      }
      claimedCatalogIds.add(catalogId);
    }
    ids.add(intent.id);
  }
  for (const intent of registry) {
    for (const other of intent.supersedes) {
      if (!ids.has(other) || other === intent.id) {
        throw new TypeError(`Intent ${intent.id} supersedes an invalid intent ${other}.`);
      }
    }
  }
  return true;
}
