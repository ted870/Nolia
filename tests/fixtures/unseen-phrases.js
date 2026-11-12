/**
 * Independent test set (v0.5.0).
 *
 * Written separately from core/message-catalog.js and from the `examples` of
 * core/intent-registry.js: none of these sentences appears in the catalog
 * (checked by tests/intent-unseen.test.js). Each entry states the expected
 * outcome. `values` lists the critical values that must be preserved, in the
 * canonical form "type:canonical".
 *
 * Categories:
 * - paraphrase: known meaning, new wording;
 * - new-values: known meaning, new amount, name or number;
 * - inversion: send/receive traps;
 * - negation: positive wording turned negative;
 * - unknown: meaning not covered, must go to degraded mode;
 * - ambiguous: uncertain value or mixed signals, must go to degraded mode;
 * - fragment: too short to deserve a notice, must stay untouched.
 */
export const UNSEEN_PHRASES = Object.freeze([
  // paraphrase
  { category: "paraphrase", text: "Fonds insuffisants pour cette opération.", kind: "intent", intentId: "transfer.insufficient_balance" },
  { category: "paraphrase", text: "Votre solde ne permet pas ce transfert : il est insuffisant.", kind: "intent", intentId: "transfer.insufficient_balance" },
  { category: "paraphrase", text: "Il vous manque de l'argent sur votre solde pour continuer.", kind: "intent", intentId: "transfer.insufficient_balance" },
  { category: "paraphrase", text: "Erreur : solde insuffisant.", kind: "intent", intentId: "transfer.insufficient_balance" },
  { category: "paraphrase", text: "Le transfert a bien été effectué.", kind: "intent", intentId: "transfer.sent_success" },
  { category: "paraphrase", text: "Opération terminée avec succès.", kind: "intent", intentId: "transfer.sent_success" },
  { category: "paraphrase", text: "Le paiement a échoué, veuillez réessayer plus tard.", kind: "intent", intentId: "transfer.failed" },
  { category: "paraphrase", text: "La transaction a été refusée.", kind: "intent", intentId: "transfer.failed" },
  { category: "paraphrase", text: "Vérifiez bien le nom du destinataire.", kind: "intent", intentId: "beneficiary.verify_before_confirm" },
  { category: "paraphrase", text: "Ce destinataire est inconnu sur ce compte.", kind: "intent", intentId: "beneficiary.new_unknown" },
  { category: "paraphrase", text: "Contrôlez les informations avant de confirmer.", kind: "intent", intentId: "summary.verify_before_confirm" },
  { category: "paraphrase", text: "Les données affichées sont fictives, il s'agit d'un test.", kind: "intent", intentId: "environment.test_data" },
  { category: "paraphrase", text: "Ne partagez jamais votre mot de passe.", kind: "intent", intentId: "security.no_personal_data" },
  { category: "paraphrase", text: "Ce transfert est sans frais.", kind: "intent", intentId: "fees.free_transfer" },
  { category: "paraphrase", text: "Confirmer l'envoi", kind: "intent", intentId: "action.confirm_transfer" },
  { category: "paraphrase", text: "Une erreur inattendue est survenue.", kind: "intent", intentId: "error.generic" },

  // new values
  { category: "new-values", text: "Solde insuffisant : il manque 7 500 FCFA.", kind: "intent", intentId: "transfer.insufficient_balance", values: ["amount:7500 XAF"] },
  { category: "new-values", text: "Le montant de 1 250 000 FCFA dépasse votre solde.", kind: "intent", intentId: "transfer.insufficient_balance", values: ["amount:1250000 XAF"] },
  { category: "new-values", text: "Votre transfert de 42 000 FCFA a été effectué, référence SAF-2026-XY12.", kind: "intent", intentId: "transfer.sent_success", values: ["amount:42000 XAF", "reference:SAF-2026-XY12"] },
  { category: "new-values", text: "Frais appliqués : 350 FCFA.", kind: "intent", intentId: "fees.amount_info", values: ["amount:350 XAF"] },
  { category: "new-values", text: "Votre solde disponible est de 98 765 FCFA.", kind: "intent", intentId: "balance.available_info", values: ["amount:98765 XAF"] },
  { category: "new-values", text: "Montant débité de votre compte : 10.500 F CFA.", kind: "intent", intentId: "transfer.total_debit", values: ["amount:10500 XAF"] },

  // inversion send / receive
  { category: "inversion", text: "Marie Atangana vous a envoyé 20 000 FCFA.", kind: "intent", intentId: "transfer.received", direction: "receive", values: ["amount:20000 XAF"] },
  { category: "inversion", text: "Vous avez envoyé 20 000 FCFA à Marie Atangana.", kind: "intent", intentId: "transfer.sent_success", direction: "send", values: ["amount:20000 XAF"] },
  { category: "inversion", text: "Vous avez reçu un transfert de 3 000 FCFA.", kind: "intent", intentId: "transfer.received", direction: "receive", values: ["amount:3000 XAF"] },
  { category: "inversion", text: "Transfert reçu de la part de Jean Essomba.", kind: "intent", intentId: "transfer.received", direction: "receive" },
  { category: "inversion", text: "Vous avez reçu 10 000 FCFA envoyés à Paul.", kind: "fallback", reason: "DIRECTION_CONFLICT", values: ["amount:10000 XAF"] },

  // negation
  { category: "negation", text: "Votre transfert n'a pas été effectué.", kind: "intent", intentId: "transfer.failed" },
  { category: "negation", text: "Le transfert n'a jamais été envoyé.", kind: "intent", intentId: "transfer.failed" },
  { category: "negation", text: "Vous n'avez pas reçu de transfert aujourd'hui.", kind: "fallback", reason: "NO_INTENT" },

  // unknown meaning: degraded mode
  { category: "unknown", text: "Le bénéficiaire est temporairement bloqué pour vérification.", kind: "fallback", reason: "NO_INTENT", severity: "warning" },
  { category: "unknown", text: "Votre compte est bloqué : solde insuffisant.", kind: "fallback", reason: "UNEXPLAINED_ALARM", severity: "warning" },
  { category: "unknown", text: "Votre carte bancaire sera livrée la semaine prochaine.", kind: "fallback", reason: "NO_INTENT", severity: "normal" },
  { category: "unknown", text: "Votre plafond de 200 000 FCFA est atteint pour aujourd'hui.", kind: "fallback", severity: "warning", values: ["amount:200000 XAF"] },
  { category: "unknown", text: "Le transfert est en attente de validation par votre agence.", kind: "fallback", reason: "NO_INTENT", severity: "warning" },
  { category: "unknown", text: "Le transfert a échoué. Contactez le +237 6 77 00 11 22.", kind: "fallback", reason: "MULTI_SENTENCE", severity: "warning", values: ["phone:677001122"] },
  { category: "unknown", text: "Suspicion de fraude détectée sur votre transfert.", kind: "fallback", severity: "warning" },

  // ambiguous: degraded mode
  { category: "ambiguous", text: "Les frais s'élèvent à 125,50 FCFA.", kind: "fallback", reason: "AMBIGUOUS_VALUE", severity: "warning" },
  { category: "ambiguous", text: "Transfert de 100 € effectué avec succès.", kind: "fallback", reason: "UNSUPPORTED_CURRENCY", severity: "warning", values: ["amount:100 EUR"] },
  { category: "ambiguous", text: "Nouveau bénéficiaire : vérifiez le numéro, ou le solde sera insuffisant.", kind: "fallback", reason: "AMBIGUOUS_INTENT", severity: "warning" },

  // adversarial (v0.5.1): segmentation, added clauses, uncovered instructions
  { category: "adversarial", text: "Le transfert a échoué. veuillez réessayer.", kind: "fallback", reason: "MULTI_SENTENCE", severity: "warning" },
  { category: "adversarial", text: "Votre virement a bien été effectué !! Vérifiez votre reçu.", kind: "fallback", reason: "MULTI_SENTENCE" },
  { category: "adversarial", text: "Le virement a été effectué, mais les frais seront prélevés deux fois.", kind: "fallback", reason: "SECONDARY_CLAUSE", severity: "warning" },
  { category: "adversarial", text: "Le transfert est effectué, toutefois le bénéficiaire doit confirmer.", kind: "fallback", reason: "SECONDARY_CLAUSE" },
  { category: "adversarial", text: "Solde insuffisant ; ensuite votre compte sera fermé.", kind: "fallback", reason: "MULTI_SENTENCE" },
  { category: "adversarial", text: "Opération effectuée puis annulée par la banque.", kind: "fallback", reason: "SECONDARY_CLAUSE" },
  { category: "adversarial", text: "Le paiement a échoué, appelez le service client.", kind: "fallback", reason: "UNCOVERED_INSTRUCTION", severity: "warning" },
  { category: "adversarial", text: "Votre transfert a été effectué, réf. SAF-2026-QR77.", kind: "intent", intentId: "transfer.sent_success", values: ["reference:SAF-2026-QR77"] },
  { category: "adversarial", text: "Transfert reçu de M. Ndzana le 3 nov. 2026.", kind: "intent", intentId: "transfer.received", values: ["date:3 nov. 2026"] },

  // fragments: left untouched without notice
  { category: "fragment", text: "Bienvenue", kind: "unknown" },
  { category: "fragment", text: "Aide", kind: "unknown" },
  { category: "fragment", text: "Paul Ndzana", kind: "protected" },
  { category: "fragment", text: "15 000 FCFA", kind: "protected" }
]);
