# Nolia v0.5.0 — notes techniques

Branche : `feature/v0.5.0-intentions` (la branche `main` reste sur la v0.4.0).
Traitement entièrement local, déterministe, sans API externe ni dépendance npm.

## Chaîne de traitement

```
texte visible
  → 1. catalogue exact (v0.4.0, inchangé)          → message (+ intention associée)
  → 2. numéro d'étape / valeur protégée seule       → ignored / protected
  → 3. registre d'intentions (paraphrase)           → intent + contrat de sens
  → 4. phrase non reconnue                          → fallback (mode dégradé)
  → 5. fragment court                               → unknown (intact, sans avis)
```

| Module | Rôle |
| --- | --- |
| `core/value-extractor.js` | Montants (FCFA, F CFA, XAF, EUR, USD), téléphones, comptes, références, codes d'erreur, dates, nombres nus. Pas de flottant ; virgule décimale = valeur ambiguë. |
| `core/intent-registry.js` | 16 intentions, distinctes du catalogue, 3 formulations françaises minimum chacune. |
| `core/intent-matcher.js` | Appariement par groupes d'indices obligatoires, indices interdits, négation, mots d'alerte, sens envoyer/recevoir. |
| `core/intent-contract.js` | Contrat figé (intention, sens, valeurs) et comparaison champ par champ. |
| `core/intent-renderer.js` | Affichage « texte français — explication validée (valeurs) », relu puis vérifié. |
| `core/text-analyzer.js` | Orchestration des cinq étapes ci-dessus. |
| `core/display-renderer.js` | Aiguillage message / intention / repli pour l'adaptateur DOM. |
| `core/locale-test-pack.js` | Copie module de `locales/test.json` (testée identique). |

## Codes de refus

`NO_INTENT`, `AMBIGUOUS_INTENT`, `DIRECTION_CONFLICT`, `UNEXPLAINED_ALARM`,
`AMBIGUOUS_VALUE`, `REQUIRED_VALUE_MISSING`, `UNSUPPORTED_CURRENCY`,
`MULTI_SENTENCE`, `TOO_LONG` (appariement) ; `INTEGRITY_FAILED` avec
`AMOUNT_CHANGED`, `CURRENCY_CHANGED`, `DIRECTION_CHANGED`, `INTENT_CHANGED`,
`PHONE_CHANGED`, `REFERENCE_CHANGED`, `ACCOUNT_CHANGED`, `ERROR_CODE_CHANGED`,
`DATE_CHANGED`, `NUMBER_CHANGED` ; `VALUE_IN_TEMPLATE`, `ORIGINAL_NOT_PRESERVED`
(affichage).

## Choix techniques à vérifier par l'équipe

1. **Le français reste affiché pour les intentions et le mode dégradé.** Nolia
   ajoute l'explication après le texte d'origine au lieu de le remplacer. Seuls
   les messages exacts du catalogue pourront être remplacés. Motif : une
   paraphrase peut contenir un sens que la règle n'a pas capté.
2. **Les valeurs ne sont jamais dans la traduction.** Les explications ewondo ne
   contiennent ni emplacement ni chiffre ; Nolia ajoute les valeurs entre
   parenthèses, copiées du contrat. Cela évite l'ordre des mots français mais
   impose une présentation « explication (valeurs) » à valider avec des
   locuteurs.
3. **Une seule phrase par intention, 30 mots maximum.** Un message de deux
   phrases passe en mode dégradé, même si chaque phrase est connue.
4. **Mots d'alerte.** Bloqué, suspendu, fraude, expiré, plafond, délai… font
   refuser toute intention qui ne les prend pas explicitement en charge.
5. **Seuil du mode dégradé.** Avis ajouté seulement si la phrase compte au
   moins 4 mots, ou 2 mots avec une alerte ou une valeur. En dessous, le texte
   reste intact sans avis. À mesurer sur l'écran réel (64 textes inconnus
   relevés en v0.3.0).
6. **Devises.** Toute devise autre que XAF fait refuser l'intention.
7. **Sens « both ».** Un texte qui contient à la fois des indices d'envoi et de
   réception est refusé pour toute intention orientée.
8. **`locale-test-pack.js`.** Le manifeste n'expose que `core/*.js` ; le pack de
   test est donc dupliqué en module plutôt que d'élargir
   `web_accessible_resources`. Un test garantit l'identité des deux fichiers.
9. **Jeu de tests indépendant écrit par l'équipe technique.** 44 phrases. Il a
   révélé trois lacunes corrigées pendant le développement (« effectuer » lu
   comme « effectué », « n'a jamais été envoyé », « fictifs »). Il mesure le
   comportement du moteur, pas la couverture réelle : un second jeu écrit par
   une personne extérieure reste nécessaire.
10. **Non testé dans Chrome.** Le branchement du content script n'a été vérifié
    qu'en Node. Le parcours Safinum doit être refait avec
    `globalThis.__noliaTestMode.enable()`.

## Commandes

```bash
npm test                  # 157 tests
npm run coverage:intents  # couverture du jeu indépendant
npm run sheet:ewondo      # régénère docs/fiche-*.csv depuis le code
```
