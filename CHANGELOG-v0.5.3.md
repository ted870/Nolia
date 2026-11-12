# Nolia 0.5.3 — trois textes du parcours réel

Version corrective minimale de la v0.5.2
(`Nolia_Extension_Chrome_v0.5.2.zip`, SHA-256
`ea962db8b1dd52391e572ae8def0c5da71f192c13a2dfa1dced403a233951efe`).

Origine : parcours complet observé sur la vraie page Safinum le 11 novembre
2026, sans l'extension. Son installation était bloquée par une politique
administrateur dans l'environnement de vérification.

## Ajouts au catalogue (63 → 66 messages)

| Identifiant | Texte français | Rôle | Sévérité | Valeur protégée affichée à côté |
| --- | --- | --- | --- | --- |
| `security.alertTitle` | Alerte de sécurité | security | warning | SECURITY_001 |
| `security.verifyBeneficiaryBeforeContinue` | Alerte de sécurité : vérifiez le numéro du bénéficiaire avant de continuer. | security | warning | SECURITY_001 |
| `confirmation.requiredBeforeSubmit` | Vous devez confirmer les informations avant de valider le transfert. | confirmation | warning | CONFIRM_001 |

- Les entrées sont ajoutées **à la fin** du catalogue : les 63 identifiants
  existants et leur ordre ne changent pas.
- Les codes `SECURITY_001` et `CONFIRM_001` étaient déjà protégés par le motif
  des codes d'erreur (`[A-Z]+_\d{3}`). Ils ne figurent dans aucun pack et ne
  sont jamais traduits. Des tests le vérifient.
- Le schéma linguistique passe de 81 à 84 gabarits : 66 messages, 16 intentions
  et 2 messages de repli.

## Association à une intention existante

`security.verifyBeneficiaryBeforeContinue` est ajouté à la liste `catalogIds` de
l'intention `beneficiary.verify_before_confirm`. Sans cela, un test existant
échouait : un texte du catalogue ne doit jamais être reconnu comme une
intention différente de celle à laquelle il est rattaché. Or ce texte
correspond, par son sens, à cette intention. Seule cette ligne change : les
indices, le sens, les exemples et le nombre d'intentions (16) sont identiques.

## Fichiers

Modifiés :
- Code : `core/message-catalog.js`, `core/intent-registry.js` (une ligne `catalogIds`)
- Packs (régénérés) : `locales/template.json`, `locales/test.json`, `core/locale-test-pack.js`, `core/locale-ewo-pack.js`
- Fiche (régénérée) : `docs/fiche-traduction-ewondo.csv`
- Scripts : `scripts/build-translation-sheet.js` (écran et codes protégés des trois lignes)
- Version : `manifest.json`, `package.json` (0.5.3)
- Tests de comptage : `tests/intent-registry.test.js`, `tests/language-pack.test.js`, `tests/translation-sheet.test.js` (63 → 66, 81 → 84) ; `tests/manifest-v051.test.js` (accepte 0.5.3)
- Documentation : `README.md`
- Outil Chrome : `tools/chrome-smoke/mock-safinum.html`, `tools/chrome-smoke/chrome-smoke.mjs`

Créés : `tests/catalog-v053.test.js` (8 tests), `CHANGELOG-v0.5.3.md`, `AUDIT-v0.5.3.md`.

Inchangés : architecture, 16 intentions (hormis l'association ci-dessus),
protections de confidentialité de la v0.5.2 (`core/nolia-controller.js`,
`extension/content-script.js`, `core/dom-text-adapter.js`,
`core/dom-observer.js`), panneau, chargeur de pack.
