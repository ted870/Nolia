# Nolia 0.5.4

Nolia est une extension Chrome locale qui aide à comprendre l'interface de
l'environnement de test Safinum (https://safinum.cm/hackathon-test). La langue
finale prévue est l'**éwondo**. Cette version contient un pack ewondo généré
localement avec le modèle Flagship/Lingo `cameroon-int8`. Il est utilisable pour
tester le parcours complet, mais reste affiché comme **traduction automatique
provisoire** : aucune traduction ewondo n'est encore validée par des locuteurs.

Nolia aide à comprendre le texte. Elle **ne bloque, ne protège et ne modifie
aucune transaction** : elle ne touche ni aux boutons, ni aux formulaires, ni aux
montants, bénéficiaires, références, frais ou événements du site.

## Installer et utiliser

### 1. Décompresser l'archive

Clic droit sur `Nolia_Extension_Chrome_v0.5.4.zip`, puis **Extraire tout…**, puis
**Extraire**. Chrome ne peut pas lire une archive .zip non extraite.

### 2. Quel dossier sélectionner

L'extraction crée un dossier `Nolia_Extension_Chrome_v0.5.4`. **C'est ce dossier
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
**Nolia 0.5.4** apparaît en bas à gauche, en mode **Observation** : il compte
les messages reconnus, les textes protégés et les messages inconnus, sans rien
changer. Le bouton **Réduire** le transforme en pastille « Nolia » ; cliquez
sur la pastille pour le rouvrir. Sur un écran étroit, il démarre réduit.

### 6. Activer l'ewondo provisoire

Cliquez sur **Activer l'éwondo provisoire**. Les 84 textes requis sont alors
affichés en ewondo automatique. Le panneau garde volontairement un avertissement
jaune : cette sortie sert à vérifier l'intégration, l'affichage et les parcours,
pas à revendiquer une qualité linguistique humaine.

Les noms, comptes et autres valeurs dynamiques sont insérés par Nolia après la
traduction et restent inchangés. Pour les formulations reconnues ou inconnues,
le texte français reste visible avant l'explication ewondo et les valeurs
certaines sont ajoutées par le code.

### 7. Activer le mode TEST

Cliquez sur **Activer le mode TEST** dans le panneau. Ce que vous verrez :

- les 66 messages connus de Safinum s'affichent précédés de `[TEST]` ;
- une phrase reconnue par son sens garde le français, suivi de
  `— [TEST] INTENTION …` et des valeurs exactes entre parenthèses ;
- un message inconnu garde le français, suivi de
  `— [TEST] MESSAGE NON RECONNU…` ou, s'il paraît sensible,
  `— [TEST] ATTENTION, MESSAGE NON RECONNU : VÉRIFIEZ AVANT DE CONTINUER` ;
- les montants, comptes, téléphones, références, codes et noms ne changent pas.

Le mode TEST prouve le branchement technique. **Ce n'est pas une traduction.**

### 8. Restaurer le français

Cliquez sur **Restaurer le français**. Chaque texte d'origine est remis
exactement, sans recharger la page. Si le site a modifié un texte entre-temps,
c'est le texte du site qui est gardé.

Ces commandes restent disponibles dans la console, contexte « Nolia » :
`__noliaTestMode.enable()`, `__noliaTestMode.disable()` et `__noliaStatus`.
Ce dernier ne contient que des compteurs et des identifiants.

### 9. Remplacer plus tard le pack provisoire par le pack validé

1. Copiez `locales/template.json` (le modèle éwondo, 84 entrées vides) vers
   `ewo.json`.
2. Les locuteurs remplissent chaque `text` en conservant les emplacements
   protégés (`{name}`, `{account}`, …) à la place qui convient en éwondo, et
   passent chaque `status` à `validated`. Les explications d'intention et de
   repli ne contiennent aucun chiffre : Nolia ajoute elle-même les valeurs.
3. Dans `meta`, mettez `"status": "validated"`, les **noms des deux
   validateurs** (deux personnes distinctes) dans `validatedBy` et la date dans
   `validatedAt` (format `AAAA-MM-JJ`, pas dans le futur).
4. Exécutez `npm run pack:ewo -- ewo.json`. Le script applique exactement les
   règles du mode démonstration ; s'il manque quoi que ce soit, il **n'installe
   rien** et liste chaque motif.
5. Rechargez l'extension dans `chrome://extensions`. Le bouton devient
   **Activer l'éwondo validé** et ce pack a priorité sur le pack provisoire.

La fiche de traduction à remplir par les locuteurs est
`docs/fiche-traduction-ewondo.csv` (66 messages), complétée par
`docs/fiche-intentions-ewondo.csv` (16 intentions et 2 messages de repli).

### 10. Limites connues

- Le pack actuel est une sortie automatique d'un modèle à faibles ressources,
  entraîné sur un domaine différent du vocabulaire bancaire. Il peut contenir
  des erreurs de sens, de registre ou d'orthographe et doit être corrigé par des
  locuteurs avant toute affirmation de qualité linguistique.
- La v0.5.4 n'a pas encore été testée sur le vrai parcours Safinum. Le script
  de vérification Chrome simulé a été mis à jour, mais doit être lancé sur un
  ordinateur autorisant Chromium (voir `AUDIT-v0.5.4.md`).
- Chrome sur ordinateur seulement ; Chrome mobile n'accepte pas ces extensions.
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
| `core/nolia-controller.js` | Observation, modes TEST / ewondo provisoire / ewondo validé, restauration. |
| `core/nolia-panel.js` | Panneau en Shadow DOM fermé, marqué `data-nolia-ignore`. |
| `core/language-pack.js` | Schéma (66 + 16 + 2), séparation TEST / provisoire / validé, rendu des messages. |
| `core/locale-test-pack.js`, `core/locale-ewo-provisional-pack.js`, `core/locale-ewo-pack.js` | Packs chargés par l'extension. |
| `core/text-analyzer.js`, `core/intent-*.js`, `core/value-extractor.js` | Analyse, intentions, valeurs protégées, contrôle d'intégrité. |
| `core/message-catalog.js`, `core/message-classifier.js` | Catalogue des 66 messages (63 depuis 0.4.0, 3 ajoutés en 0.5.3). |
| `core/dom-*.js` | Lecture du DOM, observation, écriture `textContent` réversible. |

## Principes de sécurité

- Traitement d'exécution local : aucun réseau, aucune API et aucun modèle d'IA
  chargé dans Chrome. Le modèle est utilisé seulement en amont pour générer le
  fichier statique `locales/ewo-provisional.json`.
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
- Le pack automatique ne peut fonctionner que dans le mode `provisional` et ne
  peut pas être accepté par la barrière du mode validé.

## Commandes pour l'équipe

Prérequis : Node.js 20 ou plus récent. Aucune dépendance npm pour l'extension.

```bash
npm test                     # tous les tests
npm run coverage:intents     # corpus indépendant : couverture et faux positifs
npm run packs:build          # régénère locales/test.json, locales/template.json et les modules
npm run sheet:ewondo         # régénère les fiches CSV depuis le code
npm run pack:ewo -- ewo.json # installe un pack éwondo validé (refuse sinon)
```

Pour régénérer le pack automatique, installez
`requirements-translation.txt`, téléchargez les deux dossiers Flagship/Lingo
`francais-ewondo` et `ewondo-francais`, puis exécutez :

```bash
python scripts/generate-provisional-ewondo.py \
  --forward-model chemin/francais-ewondo \
  --reverse-model chemin/ewondo-francais
```

Le script produit aussi
`docs/rapport-traduction-automatique-ewondo.csv`, avec le français, l'ewondo
provisoire, la rétrotraduction et les contrôles automatiques.

Vérification Chrome sur page simulée : `tools/chrome-smoke/README.md`.
Détails : `CHANGELOG-v0.5.4.md`, `AUDIT-v0.5.4.md`, `CHANGELOG-v0.5.3.md`,
`AUDIT-v0.5.3.md` et les historiques antérieurs.
