# Nolia 0.5.7

Nolia est une extension Chrome Manifest V3 qui adapte localement en **éwondo**
(ISO 639-3 `ewo`) les textes de l’environnement de test Safinum Pay.

La version 0.5.7 livre un pack de **84 textes** relus en contexte dans Chrome
par deux locuteurs éwondophones, Mballa et Menounga, le 13 novembre 2026.
L’extension protège les valeurs financières et restaure exactement le français.

## État de la livraison

| Élément | Résultat |
| --- | --- |
| Version | 0.5.7 |
| Langue | Éwondo (`ewo`) |
| Pack | 84/84 entrées au statut `validated` |
| Validation linguistique | Mballa et Menounga, dans Chrome, le 13 novembre 2026 |
| Tests automatisés | 288 réussis, 0 échec |
| Messages inédits | 53 phrases, 0 faux positif |
| Audit Chrome | 38/38 sur une page Safinum simulée |
| Traitement | 100 % local, sans API externe à l’exécution |

La validation dans le navigateur vérifie la langue en contexte. L’audit Chrome
automatisé reste distinct : il vérifie le comportement technique sur une page
simulée reproductible.

## Installation

1. Décompresser l’archive.
2. Ouvrir `chrome://extensions` dans Chrome sur ordinateur.
3. Activer **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée**.
5. Sélectionner le dossier contenant directement `manifest.json`.
6. Ouvrir ou actualiser <https://safinum.cm/hackathon-test>.

Retirer toute ancienne version avant de charger la 0.5.7. Chrome mobile ne
prend pas en charge cette extension.

## Utilisation

Le panneau démarre en mode **Observation** : il classe les textes sans modifier
la page.

- **Activer l’éwondo** affiche les traductions validées.
- **Activer le mode TEST** prouve le branchement avec des libellés `[TEST]` ;
  ce mode n’est pas une traduction.
- **Restaurer le français** remet chaque texte source exactement. Si le site a
  modifié un texte entre-temps, le texte du site reste prioritaire.

Commandes disponibles dans la console, contexte de l’extension :

```js
__noliaTestMode.enable()
__noliaTestMode.disable()
__noliaStatus
```

`__noliaStatus` n’expose que des compteurs et des identifiants.

## Fonctionnement

```text
texte visible → catalogue → valeurs protégées → intention
              → traduction ou mode dégradé → contrôle d’intégrité
```

| Emplacement | Rôle |
| --- | --- |
| `extension/content-script.js` | Démarre le contrôleur et le panneau. |
| `core/dom-*.js` | Extrait, observe et restaure les nœuds texte. |
| `core/message-catalog.js` | Catalogue les messages Safinum connus. |
| `core/intent-*.js` | Reconnaît des formulations inédites de sens connu. |
| `core/value-extractor.js` | Protège montants, noms, comptes, téléphones et références. |
| `core/language-pack.js` | Valide les packs vide, provisoire et validé. |
| `locales/ewondo.json` | Source du pack éwondo validé. |
| `core/locale-target-pack.js` | Pack généré chargé par l’extension. |

## Garde-fous

- Aucun appel réseau, aucune API payante et aucun modèle à l’exécution.
- Aucun stockage persistant et aucun texte financier écrit dans la console.
- Aucun `innerHTML`, `eval` ou `new Function`.
- Refus d’affichage si une valeur protégée ou le sens envoyer/recevoir change.
- Message inconnu conservé en français avec un avertissement contrôlé.
- Pack de démonstration refusé s’il est incomplet ou insuffisamment validé.

Nolia aide à comprendre l’interface. Elle ne confirme, ne bloque et ne sécurise
aucune transaction.

## Vérification

Prérequis : Node.js 20 ou version ultérieure.

```bash
npm test
npm run coverage:intents
```

Résultats de référence : **288 tests réussis, 0 échec** et **53 phrases
inédites, 0 faux positif**. Le test Chrome est documenté dans
`tools/chrome-smoke/README.md`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/VALIDATION_ET_TESTS.md`](docs/VALIDATION_ET_TESTS.md)
- [`docs/GUIDE_DEMONSTRATION.md`](docs/GUIDE_DEMONSTRATION.md)
- [`docs/JOURNAL_11_13_NOVEMBRE_2026.md`](docs/JOURNAL_11_13_NOVEMBRE_2026.md)
- [`AUDIT-v0.5.7.md`](AUDIT-v0.5.7.md)
- [`CHANGELOG-v0.5.7.md`](CHANGELOG-v0.5.7.md)

## Limites connues

- Chrome sur ordinateur uniquement.
- Couverture mesurée de variantes ; pas de traduction universelle.
- Une phrase inconnue ou ambiguë n’est pas traduite librement.
- Les tests ne prouvent pas qu’une phrase éwondo est idiomatique.
- Points lexicaux à surveiller : `nkukuma` (« secret »), `A kom`
  (« modifier ») et `syebe` (« réussi »).
