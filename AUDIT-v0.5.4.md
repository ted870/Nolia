# Nolia 0.5.4 — audit de livraison

État au 11 novembre 2026. Changement : la langue cible passe de l'éwondo au
bulu (`bum`). Les audits précédents restent valables pour tout le reste
(`AUDIT-v0.5.1.md`, `AUDIT-v0.5.3.md`).

## 1. Vérifié

| Vérification | Résultat |
| --- | --- |
| `npm test` | **267 réussis, 0 échec**, 0 annulé, 0 ignoré |
| `npm run coverage:intents` | 53 phrases, **0 faux positif** |
| Chrome, page simulée | **32 vérifications sur 32**. Le panneau affiche « Activer le bulu », désactivé, avec « Bulu indisponible : aucun pack validé… » |
| Absence de libellé ou de fichier « éwondo » dans `core/` et `extension/` (hors commentaires) | Vérifié par test |
| Pack d'une autre langue (`ewo`) proposé comme pack bulu | Refusé par le contrôleur et par `npm run pack:bulu` (`WRONG_LANGUAGE`) |
| Classeur des validateurs bulu | 97 formules sans erreur. Les 8 scénarios réussissent : complet = « PRÊT POUR INTÉGRATION » ; emplacement manquant, chiffre, `[TEST]`, validateurs identiques, date future, rétrotraduction manquante et statut non validé sont détectés. Aucune cellule ne mentionne l'éwondo. |

## 2. Tests existants modifiés

Les 260 tests de la v0.5.3 sont conservés. Seuls changent :
- les identifiants renommés (`enableEwondo`, `EWO_PACK`, `ewondoAvailable`,
  `ewondoRefusal`, `locale-ewo-pack.js`, `install-ewo-pack.js`, chemins des
  fiches CSV) ;
- les libellés et codes attendus (« Éwondo indisponible » devient « Bulu
  indisponible », `ewo` devient `bum`, mode `"ewondo"` devient `"langue"`) ;
- la version acceptée par `tests/manifest-v051.test.js`, qui inclut maintenant
  0.5.4 ;
- le code de langue du pack synthétique de test, qui passe à `bum`. Ses textes
  restent des phrases de contrôle françaises « CONTROLE … », jamais du bulu.

Aucune vérification n'a été supprimée ni affaiblie.

## 3. Non vérifié

- **L'extension n'a pas été exécutée sur la vraie page Safinum** (site
  inaccessible depuis l'environnement de développement ; installation bloquée
  par une politique administrateur dans l'environnement de vérification).
- **Aucun texte bulu** : rien n'a été traduit ni validé. L'orthographe exacte
  utilisée par les validateurs (caractères spéciaux, notation des tons) n'est
  pas connue. Le classeur demande seulement de respecter l'orthographe
  normalisée et de ne pas simplifier les lettres spéciales.
- Le modèle français→bulu de Flagship / Lingo n'a été ni téléchargé ni testé.
  Il n'est pas intégré à l'extension.

## 4. Hypothèses

- Code de langue : ISO 639-3 `bum` pour le bulu du Cameroun.
- Les noms internes neutres (« langue cible ») sont préférés à un renommage
  « bulu » partout, pour que le prochain changement de langue ne touche que
  `core/target-language.js`.
