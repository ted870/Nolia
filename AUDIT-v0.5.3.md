# Nolia 0.5.3 — audit de livraison

État au 11 novembre 2026. Les audits précédents restent dans
`AUDIT-v0.5.1.md`, qui inclut la section du correctif v0.5.2.

## 1. Ce qui a été vérifié

| Vérification | Résultat |
| --- | --- |
| Base : archive v0.5.2 extraite, comparée fichier par fichier à la branche de travail | Identique |
| `npm test` sur la v0.5.2, avant modification | 252 réussis, 0 échec |
| Les 252 tests de la v0.5.2, **fichiers inchangés**, contre le code v0.5.3 | 248 réussis, **4 échecs attendus** (voir ci-dessous) |
| `npm test` v0.5.3, avec les 4 tests mis à jour et 8 nouveaux | **260 réussis, 0 échec**, 0 annulé, 0 ignoré |
| `npm run coverage:intents` | 53 phrases, 53 conformes, **0 faux positif** |
| Chrome, page simulée, sur le contenu extrait de l'archive | **32 vérifications sur 32**, dont 2 nouvelles pour la v0.5.3 |

Les 4 échecs attendus sont exactement les assertions que la demande prévoyait
de mettre à jour :

| Test | Avant | Après |
| --- | --- | --- |
| `the registry is distinct from the exact-text catalog` (fichier `tests/intent-registry.test.js`) | 63 messages | 66 |
| `the pack schema contains the 63 catalog ids…` (fichier `tests/language-pack.test.js`) | 63 identifiants, 81 gabarits | 66 et 84 |
| `the ewondo sheet has exactly 63 rows…` (fichier `tests/translation-sheet.test.js`) | 63 lignes | 66 |
| `the manifest is a valid Manifest V3…` (fichier `tests/manifest-v051.test.js`) | 0.5.1 ou 0.5.2 | 0.5.1, 0.5.2 ou 0.5.3 |

Aucune autre assertion n'a été modifiée, et aucun test n'a été supprimé.

Les nouveaux tests (`tests/catalog-v053.test.js`, 8 tests) vérifient que :
- les trois textes sont reconnus exactement, avec la sévérité warning, et
  qu'une variante proche n'est pas confondue avec eux ;
- le catalogue compte 66 messages et le registre toujours 16 intentions ;
- seul `security.verifyBeneficiaryBeforeContinue` est associé à une intention ;
- `SECURITY_001` et `CONFIRM_001` sont protégés et absents des packs ;
- le modèle éwondo a ces trois entrées vides au statut draft, et le pack TEST
  les marque `[TEST]` ;
- la fiche de traduction porte les codes protégés et aucune traduction ;
- en mode TEST, chaque texte reçoit sa formulation `[TEST]`, y compris quand
  il est ajouté après le chargement ; les codes restent intacts ; la
  restauration remet exactement le français.

Dans Chrome (page simulée), deux contrôles ont été ajoutés : les trois textes
s'affichent en `[TEST]`, et `SECURITY_001` et `CONFIRM_001` restent intacts. La
restauration a été vérifiée sur 88 nœuds texte, sans aucune différence.

## 2. Ce qui n'a pas été vérifié

- **L'extension n'a pas été exécutée sur la vraie page Safinum.** Les trois
  textes viennent d'un parcours réel observé sans l'extension, dont
  l'installation était bloquée par une politique administrateur dans
  l'environnement de vérification. De mon côté, safinum.cm reste inaccessible.
  La vérification Chrome a porté sur une page **simulée** qui reproduit ces
  textes : leur structure DOM réelle n'est pas connue.
- La disposition exacte des codes `SECURITY_001` et `CONFIRM_001` sur la vraie
  page. Hypothèse : chaque code est dans son propre nœud texte, à côté du
  message. S'il était dans le même nœud que la phrase (par exemple « Alerte de
  sécurité SECURITY_001 »), le texte ne correspondrait plus exactement au
  catalogue. Il passerait alors par l'analyse des intentions ou le mode
  dégradé, et le code resterait protégé, mais la formulation `[TEST]` ou
  éwondo du message ne s'appliquerait pas.
- L'écran exact de chaque texte : la fiche indique « Parcours réel – écran à
  confirmer ».

## 3. Confidentialité (inchangée depuis la v0.5.2)

`core/nolia-controller.js`, `extension/content-script.js`,
`core/dom-text-adapter.js` et `core/dom-observer.js` sont identiques à la v0.5.2
(vérifié par `git diff`). Les 5 tests de confidentialité de la v0.5.2 passent.

## 4. Limites restantes

Celles de `AUDIT-v0.5.1.md`, sections 4 et 5, auxquelles s'ajoute l'hypothèse
de mise en page décrite ci-dessus. Aucune traduction éwondo n'existe encore.
