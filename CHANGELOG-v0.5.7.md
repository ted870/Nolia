# Nolia v0.5.7 — pack éwondo validé par deux locuteurs

Date : 13 novembre 2026. Branche : `feature/v0.5.7-ewondo-valide` (depuis la v0.5.6).

## 1. Validation humaine

Les 84 textes éwondo de la v0.5.6 ont été lus et confirmés directement dans
Chrome, dans le contexte de l'interface Safinum, par deux locuteurs :

| Validateur | Date |
| --- | --- |
| Mballa | 13 novembre 2026 |
| Menounga | 13 novembre 2026 |

Les deux locuteurs ont lu l'ensemble des 84 phrases et confirmé qu'elles ont du
sens. Cette validation linguistique en contexte est distincte du contrôle
Chrome automatisé sur la page simulée.

## 2. Changements

- `locales/ewondo_provisoire.json` devient `locales/ewondo.json` :
  `status: "validated"`, `validatedBy: ["Mballa", "Menounga"]`,
  `validatedAt: "2026-11-13"`, et chaque gabarit passe à `status: "validated"`.
- `core/locale-target-pack.js` est régénéré depuis ce pack
  (`npm run pack:ewondo -- locales/ewondo.json`).
- Le préfixe `[AUTO]` disparaît : il n'est ajouté que par le mode provisoire.
- Le bouton redevient « Activer l'éwondo » et le panneau affiche « Mode éwondo »
  sans la mention « traduction automatique, à vérifier ».
- Les textes eux-mêmes sont inchangés par rapport à la v0.5.6 : seules les
  métadonnées de validation changent.

## 3. Tests

Cinq tests supposaient que le module livré était provisoire. Ils sont adaptés
pour vérifier l'état « validé » (et le test du modèle vide lit désormais
`locales/template.json` directement). Aucun test n'est supprimé, et les trois
états restent couverts séparément.

- `npm test` : **288 réussis, 0 échec**.
- Outil Chrome : nouvelle option `--validated`, qui vérifie l'absence de
  `[AUTO]`, le bouton actif, le mode éwondo et la restauration exacte.
  **38 sur 38** sur la page Safinum **simulée**.

## 4. Ce qui reste ouvert

Trois points linguistiques avaient été signalés et n'ont pas fait l'objet d'une
correction : « nkukuma » pour « secret » (le lexique donne « ndímba »),
« A kom » pour « Modifier », « syebe » pour « réussi ». Ils sont conservés tels
que validés par les deux locuteurs.
