# Nolia 0.5.2 — correctif de confidentialité

Version corrective minimale de la v0.5.1, à la suite d'un audit indépendant.
Aucun changement d'architecture, de catalogue, d'interface ou d'intentions.

1. **`core/nolia-controller.js`** : la Map `known` ne garde plus que
   `{ kind, messageId?, intentId?, reason? }` (nouvelle fonction exportée
   `minimalClassification`). Les contrats (montants, références, téléphones…)
   et les slots (noms, numéros de compte) ne servent qu'à l'affichage et ne
   sont plus conservés. Les commentaires disent maintenant exactement ce qui
   reste en mémoire.
2. **`extension/content-script.js`** : les journaux ne contiennent que des codes
   fixes : `NOLIA_START_FAILED` au démarrage, `NOLIA_DISPLAY_REFUSED` pour un
   affichage refusé. Ni l'objet Error ni son message ne sont journalisés.
3. **Tests** : `tests/privacy-v052.test.js` (5 tests, qui échouent tous sur la
   v0.5.1). `tests/manifest-v051.test.js` accepte désormais la version 0.5.2.
4. **Documentation** : `AUDIT-v0.5.1.md` (section 0 ajoutée, deux lignes du
   tableau de sécurité corrigées), `README.md` (version et journaux).
5. **Outil Chrome** : `tools/chrome-smoke/chrome-smoke.mjs` lit la version dans
   le manifeste et vérifie l'absence de message console de Nolia hors codes
   fixes.
6. Version : `manifest.json` et `package.json` passent en 0.5.2.
