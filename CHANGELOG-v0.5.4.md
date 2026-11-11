# Nolia v0.5.4 — pack ewondo automatique provisoire

## Objectif

Permettre immédiatement les tests fonctionnels de l'extension sans inventer
une validation humaine. La validation linguistique reste une étape ultérieure
et indépendante.

## Ajouts

- pack statique `locales/ewo-provisional.json` couvrant les 84 identifiants
  obligatoires, plus le gabarit interne de récapitulatif structuré ;
- génération locale par Flagship/Lingo `cameroon-int8`, français→ewondo ;
- rétrotraduction ewondo→français et rapport CSV de contrôle ;
- nouveau mode d'exécution `ewondo-provisional` ;
- avertissement visible permanent dans le panneau ;
- priorité automatique au futur pack humain validé lorsqu'il sera installé ;
- conservation stricte de `{name}`, `{account}` et des valeurs financières ;
- script reproductible `scripts/generate-provisional-ewondo.py` ;
- tests dédiés empêchant le pack provisoire de passer pour un pack validé.

## Séparation des statuts

| Statut | Usage | Preuve revendiquée |
| --- | --- | --- |
| `test` | branchement technique artificiel | aucune traduction |
| `provisional` | parcours fonctionnel en ewondo automatique | génération automatique seulement |
| `validated` | démonstration linguistique finale | deux validateurs humains nommés et datés |

Le pack provisoire déclare explicitement `humanValidated: false`, sans nom ni
date de validation. Le mode `demo` continue donc de le refuser.

## Résultats

- `npm test` : **266 réussis, 0 échec** ;
- `npm run coverage:intents` : **53 phrases**, résultat attendu pour chacune,
  **0 faux positif** ;
- validation JSON et syntaxe JavaScript : réussies ;
- rapport de génération : 85 textes produits, aucun défaut structurel restant.

Ces résultats prouvent le fonctionnement et l'intégrité des valeurs. Ils ne
prouvent pas l'exactitude linguistique de l'ewondo.
