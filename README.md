# Nolia 0.5.5

Nolia est une extension Chrome locale qui aide à comprendre l'interface de
l'environnement de test Safinum (https://safinum.cm/hackathon-test). La langue
cible est l'**éwondo** (code ISO 639-3 `ewo`), de nouveau retenue le
11 novembre 2026 après un essai avec le bulu. **Aucune traduction éwondo n'est
encore validée par des humains.** Cette version contient un pack artificiel
`[TEST]`, qui n'est pas une langue, un modèle vide destiné aux validateurs et
un pack de **traduction automatique provisoire** couvrant 84/84 textes. Ce
dernier est toujours affiché avec le préfixe `[AUTO]` (voir l'étape 8 bis).

La langue cible est définie à un seul endroit : `core/target-language.js`.

Nolia aide à comprendre le texte. Elle **ne bloque, ne protège et ne modifie
aucune transaction** : elle ne touche ni aux boutons, ni aux formulaires, ni aux
montants, bénéficiaires, références, frais ou événements du site.

## Installer et utiliser

### 1. Décompresser l'archive

Clic droit sur `Nolia_Extension_Chrome_v0.5.5.zip`, puis **Extraire tout…**, puis
**Extraire**. Chrome ne peut pas lire une archive .zip non extraite.

### 2. Quel dossier sélectionner

L'extraction crée un dossier `Nolia_Extension_Chrome_v0.5.5`. **C'est ce dossier
qu'il faut sélectionner** : il contient directement `manifest.json`, ainsi que
les dossiers `core`, `extension` et `locales`. Il n'y a pas de dossier intérieur.

### 3. Activer le mode développeur

Ouvrez `chrome://extensions` dans Chrome sur ordinateur, puis activez
l'interrupteur **Mode développeur**, en haut à droite.

### 4. Charger l'extension non empaquetée

Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier de
l'étape 2. Si une ancienne version de Nolia est installée, supprimez-la avant,
sinon les deux tourneront sur la page.

Si Chrome affiche « Manifest file is missing or unreadable », vous avez
sélectionné un dossier qui ne contient pas directement `manifest.json`.

### 5. Ouvrir Safinum

Ouvrez ou actualisez https://safinum.cm/hackathon-test. Un petit panneau
**Nolia 0.5.5** apparaît en bas à gauche, en mode **Observation** : il compte
les messages reconnus, les textes protégés et les messages inconnus, sans rien
changer. Le bouton **Réduire** le transforme en pastille « Nolia » ; cliquez
sur la pastille pour le rouvrir. Sur un écran étroit, il démarre réduit.

### 6. Activer le mode TEST

Cliquez sur **Activer le mode TEST** dans le panneau. Ce que vous verrez :

- les 66 messages connus de Safinum s'affichent précédés de `[TEST]` ;
- une phrase reconnue par son sens garde le français, suivi de
  `— [TEST] INTENTION …` et des valeurs exactes entre parenthèses ;
- un message inconnu garde le français, suivi de
  `— [TEST] MESSAGE NON RECONNU…` ou, s'il paraît sensible,
  `— [TEST] ATTENTION, MESSAGE NON RECONNU : VÉRIFIEZ AVANT DE CONTINUER` ;
- les montants, comptes, téléphones, références, codes et noms ne changent pas.

Le mode TEST prouve le branchement technique. **Ce n'est pas une traduction.**

### 7. Restaurer le français

Cliquez sur **Restaurer le français**. Chaque texte d'origine est remis
exactement, sans recharger la page. Si le site a modifié un texte entre-temps,
c'est le texte du site qui est gardé.

Ces commandes restent disponibles dans la console, contexte « Nolia » :
`__noliaTestMode.enable()`, `__noliaTestMode.disable()` et `__noliaStatus`.
Ce dernier ne contient que des compteurs et des identifiants.

### 8. Ajouter plus tard le pack éwondo validé

1. Les deux validateurs remplissent le classeur
   `Nolia_Traduction_Ewondo_Validateurs_v0.5.5.xlsx`, fourni à part. Ses
   84 lignes correspondent exactement au schéma du pack. Les fiches
   `docs/fiche-traduction-ewondo.csv` (66 messages) et
   `docs/fiche-intentions-ewondo.csv` (16 intentions et 2 messages de repli)
   en sont la version texte.
2. Les textes validés sont reportés dans une copie de `locales/template.json`
   (le modèle éwondo, 84 entrées vides). Chaque emplacement protégé (`{name}`,
   `{account}`) est conservé, et chaque `status` passe à `validated`.
3. Dans `meta` : `"languageCode": "ewo"`, `"status": "validated"`, les **noms
   des deux validateurs** (deux personnes distinctes) dans `validatedBy`, et la
   date dans `validatedAt` (AAAA-MM-JJ, pas dans le futur).
4. Exécutez `npm run pack:ewondo -- ewondo.json`. S'il manque quoi que ce soit,
   rien n'est installé et chaque motif est listé.
5. Rechargez l'extension. Le bouton **Activer l'éwondo** devient utilisable.

### 8 bis. Traduction automatique provisoire (avant la validation humaine)

La livraison contient déjà `locales/ewo-provisional.json`. Il est installé
dans `core/locale-target-pack.js` et rend immédiatement disponible le bouton
**Activer l'éwondo (automatique)**. Chaque texte traduit est précédé de
**[AUTO]**, et le panneau indique « Mode éwondo — traduction automatique, à
vérifier ». Le pack n'est jamais accepté par le mode validé.

Pour régénérer ultérieurement ce pack :

1. Ouvrez `Nolia_Ewondo_Provisoire_Colab.ipynb` dans Google Colab, s'il vous a
   été fourni séparément, puis
   lancez **Exécution → Tout exécuter**. Il traduit les 84 textes avec le
   modèle Flagship / Lingo français→éwondo (CTranslate2 int8), les retraduit
   en français, et **rejette** toute traduction qui perd un emplacement, reste
   identique au français, ajoute un chiffre, perd une négation, inverse
   envoyer / recevoir ou confirmer / annuler, ou dont le retour français est
   trop différent.
2. Il produit `ewondo_provisoire.json`, au statut `provisional` et **sans
   aucun validateur**, ainsi que `rapport_retrotraduction.csv`.
3. Exécutez `npm run pack:provisoire -- ewondo_provisoire.json`, puis
   rechargez l'extension.
4. Le bouton reste **Activer l'éwondo (automatique)**. Chaque texte est alors
   affiché précédé de **[AUTO]**, et le panneau indique « Mode éwondo —
   traduction automatique, à vérifier », avec la source et le nombre de textes.
   Les textes rejetés restent en français.

Formulation à utiliser devant le jury : « Traductions provisoires générées
localement par le modèle Flagship/Lingo, contrôlées automatiquement par
rétrotraduction et protection des valeurs. Validation humaine non effectuée à
ce stade. » Déclarez Flagship/Lingo dans la note technique et vérifiez la
licence affichée sur la page du modèle (non commerciale selon la vérification
de l'équipe).

### 9. Limites connues

- Testé dans Chrome uniquement sur une **page simulée** : le parcours réel
  Safinum reste à vérifier (voir `AUDIT-v0.5.1.md`).
- Chrome sur ordinateur seulement ; Chrome mobile n'accepte pas ces extensions.
- Aucune phrase éwondo n'est validée par des humains. Le pack livré active
  uniquement le mode automatique clairement signalé `[AUTO]`.
- Un pack provisoire est une traduction automatique : les contrôles réduisent
  les contresens sans les éliminer. Il est toujours affiché avec [AUTO].
- Les intentions reconnaissent une liste mesurée de formulations françaises ;
  tout le reste passe en mode dégradé, sans traduction libre.
- Un message de plusieurs phrases, ou avec « mais », « puis », « ensuite », etc.,
  passe toujours en mode dégradé, même si chaque partie est connue.
- Les modules `core/*.js` sont accessibles à la page safinum.cm (nécessaire à
  l'import par le script de contenu).

## Fonctionnement

```
texte visible → catalogue exact (66) → valeur protégée → intention (16)
             → mode dégradé (phrase non reconnue) → fragment laissé intact
```

| Fichier | Rôle |
| --- | --- |
| `extension/content-script.js` | Coque mince : charge le contrôleur, les packs et le panneau. |
| `core/target-language.js` | Langue cible (éwondo, `ewo`) : seul endroit à modifier pour changer de langue. |
| `core/nolia-controller.js` | Observation, modes Observation / TEST / langue cible validée / provisoire [AUTO], restauration. |
| `core/nolia-panel.js` | Panneau en Shadow DOM fermé, marqué `data-nolia-ignore`. |
| `core/language-pack.js` | Schéma (66 + 16 + 2), validation TEST / démonstration, rendu des messages. |
| `core/locale-test-pack.js`, `core/locale-target-pack.js` | Packs chargés par l'extension (générés). |
| `core/text-analyzer.js`, `core/intent-*.js`, `core/value-extractor.js` | Analyse, intentions, valeurs protégées, contrôle d'intégrité. |
| `core/message-catalog.js`, `core/message-classifier.js` | Catalogue des 66 messages (63 depuis 0.4.0, 3 ajoutés en 0.5.3). |
| `core/dom-*.js` | Lecture du DOM, observation, écriture `textContent` réversible. |

## Principes de sécurité

- Traitement local ; aucun réseau, aucun modèle d'IA, aucune API.
- Aucun stockage persistant ; la console ne reçoit que des codes fixes
  (`NOLIA_START_FAILED`, `NOLIA_DISPLAY_REFUSED`), jamais de texte de page ni
  de message d'erreur.
- Écriture uniquement par `nodeValue` de nœuds texte ; pas d'`innerHTML`,
  d'`eval` ni de `new Function`.
- Avant tout affichage, les valeurs (montants, devise, frais, bénéficiaire,
  téléphone, compte, référence, code, date, sens) sont relues et comparées à
  la source ; toute différence est refusée.
- Le mode démonstration refuse tout pack qui n'est pas validé par deux
  personnes distinctes, à une date passée, sans traduction vide ni `[TEST]`.

## Commandes pour l'équipe

Prérequis : Node.js 20 ou plus récent. Aucune dépendance npm pour l'extension.

```bash
npm test                     # tous les tests
npm run coverage:intents     # corpus indépendant : couverture et faux positifs
npm run packs:build          # régénère locales/test.json, locales/template.json et les modules
npm run sheet:langue          # régénère les fiches CSV depuis le code
npm run pack:ewondo -- ewondo.json            # installe un pack éwondo validé (refuse sinon)
npm run pack:provisoire -- ewondo_provisoire.json # installe un pack automatique, affiché avec [AUTO]
npm run pack:provisoire -- locales/ewo-provisional.json # réinstalle le pack provisoire livré
```

Vérification Chrome sur page simulée : `tools/chrome-smoke/README.md`.
Détails : `CHANGELOG-v0.5.5.md`, `AUDIT-v0.5.5.md`, `CHANGELOG-v0.5.4.md`, `AUDIT-v0.5.4.md`, `CHANGELOG-v0.5.3.md`, `AUDIT-v0.5.3.md`, `CHANGELOG-v0.5.2.md`, `CHANGELOG-v0.5.1.md`, `AUDIT-v0.5.1.md` (mis à jour en 0.5.2), `docs/NOTES-v0.5.0.md`.
