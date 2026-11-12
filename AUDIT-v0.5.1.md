# Nolia 0.5.1 — audit de livraison

État au 11 novembre 2026. Ce document distingue ce qui a été **vérifié** de ce
qui **ne l'a pas été**.

## 1. Résultats des tests automatisés

| Commande | Résultat |
| --- | --- |
| `npm test` (v0.5.0, avant modification) | 157 réussis, 0 échec |
| `npm test` (v0.5.1) | **247 réussis, 0 échec**, 0 annulé, 0 ignoré |
| Les 157 tests v0.5.0, fichiers d'origine inchangés, contre le code v0.5.1 | 157 réussis, 0 échec |
| `npm run coverage:intents` | 53 phrases, 53 conformes, **0 faux positif** |
| `npm test` relancé depuis l'archive extraite | 247 réussis, 0 échec |

Les 90 nouveaux tests se répartissent ainsi :
- segmentation : 16 ;
- schéma et validation des packs : 28 ;
- contrôleur (activation, restauration, contenu dynamique, panneau exclu) : 13 ;
- panneau : 7 ;
- valeurs protégées (cas adversariaux) : 12 ;
- manifeste : 5 ;
- 9 phrases adversariales ajoutées au corpus indépendant.

Aucun test existant n'a été modifié ni supprimé. Le seul fichier de test touché
est le corpus `tests/fixtures/unseen-phrases.js`, et uniquement par ajout.

## 2. Vérification dans Chrome

**TEST CHROME SUR LE VRAI SAFINUM NON EFFECTUÉ.** `safinum.cm` est
inaccessible depuis l'environnement de développement (proxy, réponse 403).

Ce qui a été fait : Chrome for Testing 153 (sans interface) a chargé
l'extension **non modifiée**, sur une **page simulée** servie en HTTPS local.
Le nom `safinum.cm` y était redirigé vers ce serveur, pour que le manifeste
s'applique tel quel. La page simulée reprend des textes du catalogue ; ce n'est
pas le code HTML de Safinum. Outil : `tools/chrome-smoke/`.

Résultat : **29 vérifications sur 29 réussies**, sur le contenu extrait de
l'archive finale :

- extension chargée, panneau présent, Shadow DOM fermé, contenu invisible pour la page ;
- nom et version, mode Observation, compteurs, bouton éwondo désactivé avec sa raison ;
- mode TEST : messages exacts `[TEST]`, nom protégé dans « Bonjour, … » ;
- montants, compte, téléphone et référence inchangés ;
- formulation reconnue : texte français conservé, valeurs exactes ajoutées ;
- message inconnu : texte français conservé, avertissement ajouté ;
- « Effectuer un transfert » n'est pas lu comme un transfert effectué ;
- champ de saisie intact ; bouton du site toujours fonctionnel ;
- notification injectée après le chargement : traitée, code AMOUNT_002 intact,
  deux phrases (la seconde en minuscule) passées en mode dégradé ;
- restauration : **76 nœuds texte comparés, 0 différent**, notification
  dynamique restaurée elle aussi ;
- réactivation du mode TEST possible ;
- écran de 390 px : panneau replié en pastille ;
- aucune requête réseau hors de la page ; aucune erreur dans la console.

## 3. Scénarios manuels à refaire sur le vrai Safinum (non effectués)

1. Charger le dossier extrait dans Chrome sur Windows, puis ouvrir Safinum.
2. Parcourir Solde, Frais, Bénéficiaire, Récapitulatif, Confirmation et le
   scénario d'erreur AMOUNT_002 en mode Observation : relever les compteurs.
3. Activer le mode TEST sur chaque écran. Vérifier que chaque texte inconnu
   ou en mode dégradé est légitime, et en faire une liste.
4. Faire apparaître la notification d'erreur, puis restaurer le français.
5. Contrôler que le panneau ne masque aucun bouton Safinum, à 100 % et 200 %
   de zoom, et en navigation au clavier (Tab).

## 4. Ce qui n'a pas pu être testé

- Le site réel `https://safinum.cm/hackathon-test` : sa structure DOM, ses
  textes exacts et ses notifications réelles.
- Chrome sur Windows ou macOS avec interface : seul Chrome sans interface sur
  Linux a été utilisé.
- Les lecteurs d'écran (NVDA, VoiceOver) et le contraste mesuré à l'outil.
- Un pack éwondo réellement validé : aucun n'existe. Le mode éwondo n'est testé
  qu'avec un pack synthétique de contrôle (textes français « CONTROLE … »,
  validateurs fictifs « Validateur A / B ») qui n'est pas livré.
- La performance sur une très grande page, et une session d'observation
  longue.

## 5. Limites restantes

- Couverture linguistique : 16 intentions, mesurées sur un corpus écrit par
  l'équipe technique. Un corpus rédigé par une personne extérieure reste
  nécessaire.
- Une phrase avec une virgule et « veuillez réessayer » reste reconnue comme
  échec. C'est un choix : la consigne « réessayer » est couverte par
  l'intention, et le français reste affiché. Toute autre consigne déclenche le
  mode dégradé.
- Un message de plusieurs phrases passe toujours en mode dégradé, même quand
  chaque phrase est connue.
- Les explications d'intention et de repli s'ajoutent après le français. Seuls
  les 63 messages exacts sont remplacés.
- `core/*.js` reste exposé à la page safinum.cm (contrainte de Manifest V3 pour
  l'import dynamique).
- Les compteurs du panneau portent sur ce qui est présent à l'écran. Ils
  comptent aussi les textes de la page cachés ensuite par le site, tant qu'ils
  restent dans le DOM.
- Nolia n'empêche aucune action sur le site et ne le prétend pas.

## 6. Hypothèses prudentes retenues (sans question à l'équipe)

| Point | Choix retenu |
| --- | --- |
| Point-virgule | Il sépare deux phrases. |
| Texte court refusé pour sécurité | Il reçoit un avis « avertissement ». |
| Consigne « réessayer » | Couverte par les intentions d'échec, de solde insuffisant et d'erreur ; toute autre consigne déclenche le mode dégradé. |
| Validateurs | Comparés sans casse ni espaces : « Jean  Ondoa » et « jean ondoa » comptent comme une seule personne. |
| Modèle éwondo | `locales/template.json` (code `ewo`, statut draft). Le pack livré à l'extension est un module généré, `core/locale-ewo-pack.js`. Le manifeste n'expose que `core/*.js`, et il n'a pas été élargi. |
| Archive | Fichiers à la racine du .zip. « Extraire tout » sous Windows crée un seul dossier qui contient directement `manifest.json`. |

## 7. Contrôles de sécurité effectués

| Contrôle | Résultat |
| --- | --- |
| `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function` dans `core/` et `extension/` | Aucun (vérifié par test). |
| `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `chrome.storage`, `localStorage`, `indexedDB` dans `core/` | Aucun (vérifié par test). |
| Import d'un module distant ou d'un paquet npm dans `core/` | Aucun (vérifié par test). |
| Manifeste | Aucune permission, aucun `host_permissions`, aucun `background`. Le script de contenu ne tourne que sur `hackathon-test`. |
| Journaux | Messages fixes seulement : un code d'erreur, jamais de texte de page (vérifié par test). |
| `__noliaStatus` | Compteurs et identifiants seulement (vérifié par test et dans Chrome). |
| Écritures dans la page | `nodeValue` de nœuds texte, réversible. Aucun attribut, champ ou événement de la page n'est modifié. Le panneau ajoute un seul élément hôte, ignoré par l'analyse. |
| Requêtes réseau dans Chrome | Aucune hors de la page (vérifié). |
