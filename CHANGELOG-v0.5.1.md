# Nolia 0.5.1 — changements depuis 0.5.0

Base : `Nolia_Extension_Chrome_v0.5.0.zip`
(SHA-256 `9177e8564af278074cb083bcce4f160c973560ee4e8962cd180bbc1add220c31`).
Les 157 tests de la v0.5.0 passent toujours, sans aucune modification.

## Corrections

### 1. Phrases multiples (P0)
- Une nouvelle phrase est détectée après `.`, `!`, `?`, `…` ou `;` suivi d'un
  espace, **quelle que soit la casse** de la lettre suivante. En v0.5.0, la
  coupure exigeait une majuscule, donc « Le transfert a échoué. veuillez
  réessayer. » passait.
- Un **retour à la ligne** entre deux textes compte comme une nouvelle
  phrase. L'extracteur DOM aplatit les espaces : l'analyseur relit donc le texte
  brut du nœud (`record.node.nodeValue`) pour ce contrôle.
- Les abréviations courantes ne coupent pas une phrase : M., Mme, réf., tél.,
  n°, etc., p. ex., cf., min., max. Les dates et les montants étaient déjà
  masqués avant le découpage.
- Les connecteurs « mais, cependant, toutefois, pourtant, puis, ensuite,
  néanmoins, par contre, en revanche, sauf, sinon, par ailleurs » font passer
  le texte en mode dégradé (`SECONDARY_CLAUSE`).
- Une consigne non couverte par l'intention (contactez, appelez, cliquez,
  patientez, veuillez…) fait passer le texte en mode dégradé
  (`UNCOVERED_INSTRUCTION`). Seule « réessayer » est couverte, par les
  intentions d'échec, de solde insuffisant et d'erreur.
- Un texte court refusé pour une raison de sécurité reçoit désormais toujours
  un avis, au niveau « avertissement ». Exemple : « Solde insuffisant ?!
  Rechargez. ». En v0.5.0, il restait sans avis.

### 2. Les 63 messages branchés au rendu (P0)
- Nouveau `core/language-pack.js` : un schéma unique de 81 gabarits (61 messages
  exacts, 2 messages dynamiques avec `{name}` et `{account}`, 16 intentions,
  2 messages de repli). Un pack est vérifié en entier avant tout affichage.
- `renderCatalogMessage` affiche un message du catalogue depuis le pack et
  vérifie que chaque valeur d'emplacement (le nom, le numéro de compte) est
  présente telle quelle. Les emplacements peuvent être placés librement dans la
  phrase.
- `display-renderer.js` utilise désormais le pack pour les messages, en mode
  TEST comme en démonstration.

### 3. Séparation TEST / démonstration (P0)
- `locales/test.json` : pack `[TEST]` complet (81 entrées), jamais une langue.
- `locales/template.json` devient le **modèle éwondo** (`ewo`, statut `draft`,
  81 traductions vides, aucun validateur).
- `core/locale-ewo-pack.js` : le pack éwondo chargé par l'extension. C'est
  aujourd'hui le modèle vide, il est donc refusé.
- `npm run pack:ewo -- ewo.json` installe un pack seulement s'il passe toutes
  les règles du mode démonstration.
- Le mode démonstration refuse un pack si : le statut n'est pas `validated`, une
  traduction est absente ou vide, `[TEST]` apparaît, il y a moins de deux
  validateurs nommés, les deux validateurs sont la même personne (comparaison
  sans casse ni espaces), la date est absente, invalide ou future, un
  emplacement protégé manque ou est en double, un emplacement inconnu est
  ajouté, une explication contient un chiffre, ou le sens d'une intention est
  inversé. Tous les motifs sont rapportés en même temps.

### 4. Panneau visible (P0)
- `core/nolia-panel.js` affiche le nom et la version, le mode (Observation,
  Mode TEST, Mode éwondo), les messages reconnus, les textes protégés, les
  messages inconnus, et trois boutons : Activer le mode TEST, Restaurer le
  français, Activer l'éwondo. Ce dernier est désactivé avec la raison
  affichée.
- Shadow DOM **fermé**, hôte marqué `data-nolia-ignore` (non analysé), styles
  confinés (`:host { all: initial }`), texte posé par `textContent` uniquement.
- Le panneau est réductible en pastille, réduit par défaut sous 600 px, et se
  place en bas à gauche avec une largeur maximale de 280 px.
- Accessibilité : région nommée, état annoncé (`aria-live`), `aria-pressed`,
  contour de focus visible.
- Les compteurs décrivent ce qui est **à l'écran** (les nœuds détachés sortent
  du décompte), et non le cumul des observations comme en v0.5.0.

### 5. Valeurs protégées (P0)
- Nouveau contrôle `ORDER_CHANGED` : deux montants permutés dans l'affichage
  sont refusés même si l'ensemble des valeurs est identique.
- Ajout de tests adversariaux : montant modifié, envoyer devenu recevoir, frais
  disparus, montants permutés, bénéficiaire remplacé, envoyer et recevoir dans
  le même texte, devise autre que XAF, texte modifié par le site.

### 6. Architecture
- Nouveau `core/nolia-controller.js` : toute la logique du script de contenu y
  est déplacée et testée hors de Chrome. `extension/content-script.js` n'est
  plus qu'une coque.

## Fichiers

Créés :
- Noyau : `core/language-pack.js`, `core/nolia-controller.js`, `core/nolia-panel.js`, `core/locale-ewo-pack.js`
- Scripts : `scripts/build-packs.js`, `scripts/install-ewo-pack.js`
- Tests : `tests/sentence-segmentation.test.js`, `tests/language-pack.test.js`, `tests/nolia-controller.test.js`, `tests/nolia-panel.test.js`, `tests/value-protection.test.js`, `tests/manifest-v051.test.js`
- Aides de test : `tests/helpers/fake-dom.js`, `tests/helpers/synthetic-pack.js`
- Outil Chrome : `tools/chrome-smoke/*` (outil de développement, non chargé par l'extension)
- Documentation : `CHANGELOG-v0.5.1.md`, `AUDIT-v0.5.1.md`

Modifiés :
- Noyau : `core/intent-matcher.js`, `core/intent-registry.js`, `core/intent-contract.js`, `core/text-analyzer.js`, `core/display-renderer.js`, `core/locale-test-pack.js`
- Extension et packs : `extension/content-script.js`, `locales/test.json`, `locales/template.json`, `manifest.json` (version), `package.json` (version, scripts)
- Tests et documentation : `tests/fixtures/unseen-phrases.js` (9 phrases adversariales ajoutées, aucune modifiée), `README.md`
