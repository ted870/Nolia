# Nolia 0.5.5 — retour à l'éwondo et mode provisoire [AUTO]

Base : `Nolia_Extension_Chrome_v0.5.4.zip`
(SHA-256 `c15d8d513e2f091cfccb7bdcac9d63d678798c32a7e8cbd0d2e1bdc6bb9e6cb6`).

Décisions du 11 novembre 2026, prises avec l'équipe :
1. **Langue cible : retour à l'éwondo** (`ewo`). Le modèle Flagship / Lingo
   existe dans les deux sens (français→éwondo et éwondo→français), ce qui
   permet la rétrotraduction.
2. **Afficher des traductions automatiques avant la validation humaine**, dans
   un mode séparé et toujours marqué `[AUTO]`.

## 1. Langue cible

- `core/target-language.js` : `code: "ewo"`, `name: "éwondo"`,
  `label: "Éwondo"`, avec deux nouveaux champs : `slug: "ewondo"` (noms de
  fichiers) et `withArticle: "l'éwondo"` (« Activer l'éwondo »).
- Le modèle `locales/template.json`, le module `core/locale-target-pack.js`
  et les fiches `docs/fiche-*-ewondo.csv` sont régénérés. Les fiches bulu sont
  supprimées.
- Les commandes `npm run pack:ewondo` et `npm run pack:provisoire` remplacent
  `pack:bulu`.

## 2. Mode provisoire

| Élément | Règle |
| --- | --- |
| Statut du pack | `provisional`, accepté **uniquement** par le mode provisoire. Le mode validé (démonstration) le refuse toujours. |
| Preuves exigées | `generatedBy` (l'outil de traduction) et `generatedAt` (date passée). **Aucun** `validatedBy` ni `validatedAt` : un pack automatique qui nomme un validateur est refusé. |
| Contenu | Pack partiel autorisé. Un texte rejeté par les contrôles est simplement absent, et ce message reste en français. Les contrôles habituels s'appliquent à chaque texte présent : emplacements, aucun chiffre dans les explications, sens envoyer / recevoir, langue. |
| Affichage | Chaque texte est préfixé `[AUTO]`, y compris les explications d'intention et les avis du mode dégradé. Le pack ne peut pas contenir `[AUTO]` ni `[TEST]` lui-même. |
| Panneau | Le bouton devient « Activer l'éwondo (automatique) ». Le mode s'affiche « Mode éwondo — traduction automatique, à vérifier ». Un avis permanent donne la source et la couverture (par exemple 79/84 textes). |
| Priorité | Un pack validé passe toujours par le mode validé, sans `[AUTO]`. |
| Installation | `npm run pack:provisoire -- fichier.json` (`--provisional`). Sans cette option, un pack provisoire est refusé. |

Fichiers modifiés :
- `core/template-renderer.js` : mode `provisional` et `AUTO_MARKER` ;
- `core/language-pack.js` : validation provisoire et couverture ;
- `core/intent-renderer.js` : marqueur optionnel avant l'explication ;
- `core/display-renderer.js` : préfixe et `canRender` pour les packs partiels ;
- `core/nolia-controller.js` : mode `provisoire` ;
- `core/nolia-panel.js` : bouton, mode et avis ;
- `scripts/install-language-pack.js` : `--provisional`, et la variable
  `NOLIA_TARGET_MODULE` qui redirige l'écriture du module.

## 3. Défaut corrigé pendant le développement

Le test v0.5.4 « le script refuse un pack d'une autre langue » utilisait un
pack synthétique au code `ewo`. Avec le retour à l'éwondo, ce pack est devenu
valide, et le test **a réécrit le vrai fichier** `core/locale-target-pack.js`.
Le fichier a été restauré. Depuis, tous les tests qui lancent le script
d'installation écrivent dans un fichier temporaire (`NOLIA_TARGET_MODULE`), et
vérifient que le module livré n'a pas changé.

## 4. Notebook de traduction provisoire (fourni à part)

`Nolia_Ewondo_Provisoire_Colab.ipynb` fonctionne dans Google Colab, sans rien
installer sur le poste. Il :
1. traduit les 84 textes du français vers l'éwondo, puis les retraduit vers le
   français ;
2. rejette les mauvaises traductions selon 9 règles : emplacement, identique au
   français, chiffre, marqueur, négation perdue ou ajoutée, envoyer / recevoir
   inversé, confirmer / annuler inversé, chrF inférieur à 30 ;
3. produit `ewondo_provisoire.json` et `rapport_retrotraduction.csv`.

## Tests

- **288 réussis, 0 échec** :
  - les 260 tests de la v0.5.3 ;
  - 8 tests sur la langue cible (`tests/target-language.test.js`, qui remplace
    le fichier v0.5.4) ;
  - 20 tests sur le mode provisoire (`tests/provisional-v055.test.js`).
- Tests existants adaptés :
  - `tests/language-pack.test.js` : code de langue lu depuis `TARGET_LANGUAGE`,
    script d'installation redirigé ;
  - `tests/nolia-panel.test.js` : libellé lu depuis `TARGET_LANGUAGE` ;
  - `tests/manifest-v051.test.js` : version 0.5.5 acceptée.

  Aucune vérification n'a été retirée.
- Nouveaux fichiers d'aide aux tests : `tests/helpers/provisional-pack.js`
  (phrases « AUTOMATIQUE … », jamais livrées) et
  `tests/helpers/target-helpers.js`.
