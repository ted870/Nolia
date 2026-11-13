# Architecture de Nolia

Nolia sépare le moteur de compréhension de la coque Chrome. Le noyau traite le
texte et les contrats de sens ; l’extension se limite à observer et afficher.

## Chaîne de traitement

1. `dom-extractor` collecte les nœuds texte visibles et autorisés.
2. `message-classifier` cherche une correspondance exacte.
3. `value-extractor` isole les données qui ne doivent jamais changer.
4. `intent-matcher` tente une intention connue si le texte exact est inédit.
5. `language-pack` vérifie le statut et la complétude du pack.
6. Le moteur prépare la traduction ou le message de repli.
7. `semantic-contract` refuse toute altération de sens ou de valeur.
8. `dom-text-adapter` affiche le résultat et conserve la source.

## États linguistiques

| État | Comportement |
| --- | --- |
| `draft` | bouton de langue désactivé |
| `provisional` | préfixe `[AUTO]` et avertissement visible |
| `validated` | mode de démonstration sans préfixe |

Le statut validé exige deux validateurs distincts, une date valide, toutes les
entrées et la conservation des emplacements protégés.

## Sécurité et confidentialité

Montants, devises, frais, noms, comptes, téléphones, références, codes et dates
sont relus avant affichage. Nolia bloque la traduction au moindre changement.
Tout s’exécute dans le navigateur, sans transmission ni stockage du texte lu.

`dom-observer` détecte aussi les messages ajoutés après le chargement sans
réanalyser les écritures produites par Nolia elle-même.
