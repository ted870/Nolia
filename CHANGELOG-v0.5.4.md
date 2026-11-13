# Nolia 0.5.4 — langue cible : bulu

Base : `Nolia_Extension_Chrome_v0.5.3-final.zip`
(SHA-256 `07489d7ca8f73f81421b4b16574ffa967e7c064be731202ecd2687051c934fb2`).

Décision du 11 novembre 2026 : la langue cible passe de l'éwondo au **bulu**
(ISO 639-3 `bum`, groupe Beti-Fang, proche de l'éwondo). Aucune phrase bulu
n'est incluse : le modèle reste vide, au statut draft.

## Changements

1. **Langue cible configurée à un seul endroit.** Nouveau fichier
   `core/target-language.js` (`code: "bum"`, `name: "bulu"`, `label: "Bulu"`).
   Le panneau, le modèle de pack, les fiches et le script d'installation lisent
   ces valeurs. Pour changer de langue plus tard, on ne modifie que ce fichier,
   puis on lance `npm run packs:build` et `npm run sheet:langue`.
2. **Noms internes neutres.** Le code ne parle plus d'« éwondo » mais de
   « langue cible ».

   | Avant | Après |
   | --- | --- |
   | `core/locale-ewo-pack.js` (`EWO_PACK`) | `core/locale-target-pack.js` (`TARGET_PACK`) |
   | `enableEwondo()` | `enableTargetLanguage()` |
   | mode `"ewondo"` | mode `"langue"` |
   | `ewondoAvailable` / `ewondoRefusal` | `targetAvailable` / `targetRefusal` |
   | `scripts/install-ewo-pack.js` | `scripts/install-language-pack.js` |
   | `npm run pack:ewo` | `npm run pack:bulu` (alias de `npm run pack:langue`) |
   | `npm run sheet:ewondo` | `npm run sheet:langue` |
   | `docs/fiche-*-ewondo.csv` | `docs/fiche-traduction-bulu.csv`, `docs/fiche-intentions-bulu.csv` |

3. **Panneau.** Il affiche « Activer le bulu », « Mode bulu » et « Bulu
   indisponible : aucun pack validé… ». Sa présentation ne change pas.
4. **Nouveau garde-fou : la langue du pack.** `validateLanguagePack` accepte
   l'option `expectedLanguage`. Le contrôleur et le script d'installation
   refusent un pack validé dans une autre langue (`WRONG_LANGUAGE`). Un futur
   pack éwondo ne pourra donc jamais s'afficher comme du bulu.
5. **Modèle de pack.** `locales/template.json` passe à
   `languageCode: "bum"` et `languageName: "Bulu (modèle à remplir)"`, avec
   84 entrées vides. Le pack TEST est inchangé, à part le numéro de version de
   ses métadonnées.
6. **Classeur des validateurs.** `Nolia_Traduction_Bulu_Validateurs_v0.5.4.xlsx`
   est fourni à part : les mêmes 84 éléments et les mêmes contrôles, adaptés au
   bulu.

Inchangés : catalogue (66 messages), 16 intentions, protections de valeurs,
confidentialité de la v0.5.2, segmentation, chargeur de pack (hors option
`expectedLanguage`).

## Tests

- 260 tests de la v0.5.3 : tous passent après renommage. Les identifiants
  changent (`enableEwondo` devient `enableTargetLanguage`, `EWO_PACK` devient
  `TARGET_PACK`, etc.), ainsi que les libellés attendus (« Éwondo
  indisponible » devient « Bulu indisponible », code `ewo` devient `bum`) et la
  version acceptée (0.5.4). Aucune vérification n'a été retirée.
- 7 nouveaux tests (`tests/target-language-v054.test.js`) : langue `bum`,
  modèle bulu vide, panneau en bulu, pack bulu validé utilisable, pack d'une
  autre langue refusé par le contrôleur et par le script d'installation, plus
  aucun fichier ni libellé « éwondo » dans l'extension.
- Total : **267 réussis, 0 échec**.
