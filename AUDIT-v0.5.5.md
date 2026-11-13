# Nolia 0.5.5 — audit de livraison

État au 11 novembre 2026. Ce document distingue ce qui a été vérifié de ce qui
ne l'a pas été.

## 1. Vérifié

| Vérification | Résultat |
| --- | --- |
| `npm test` | **288 réussis, 0 échec**, 0 annulé, 0 ignoré |
| `npm run coverage:intents` | 53 phrases, **0 faux positif** |
| Chrome, page simulée, extension livrée (modèle éwondo vide) | **32 sur 32**. Bouton « Activer l'éwondo » désactivé, raison affichée |
| Chrome, page simulée, copie de l'extension avec un pack provisoire **synthétique** (phrases « AUTOMATIQUE … », non livré) | **38 sur 38**. Chaque texte est préfixé `[AUTO]` ; les montants, références et codes sont intacts ; la formulation reconnue est affichée avec `[AUTO]` et ses valeurs ; le panneau affiche « traduction automatique, à vérifier » ; la restauration est exacte nœud par nœud |
| Notebook Colab, exécuté ici avec de **faux modèles** qui injectent des fautes | 5 fautes sur 5 rejetées avec le bon motif (chiffre ajouté, négation perdue, envoyer / recevoir inversé, confirmer / annuler inversé, retour trop différent). La règle « identique au français » est vérifiée à part. Le pack produit (79/84) est **validé par Nolia elle-même** et s'installe avec `--provisional` |
| Le module livré `core/locale-target-pack.js` | C'est le modèle éwondo vide (draft). Aucun test ne peut plus l'écrire |
| Classeur éwondo des validateurs v0.5.5 | 97 formules sans erreur ; les 8 scénarios de contrôle réussissent ; aucune mention du bulu |

## 2. Non vérifié

- **Le vrai modèle Flagship / Lingo n'a pas été exécuté** : Hugging Face est
  inaccessible depuis l'environnement de développement. Les points suivants
  sont des hypothèses que le notebook signale à l'exécution :
  - les noms exacts des dossiers français→éwondo et éwondo→français du dépôt
    `flagship-ai/cameroon-int8` (le notebook les détecte et les affiche) ;
  - la présence d'un tokenizer Marian utilisable dans ces dossiers ;
  - la qualité réelle des traductions.
- **La licence du modèle** n'a pas été vérifiée par moi. Elle est non
  commerciale (CC BY-NC 4.0) selon la vérification de l'équipe, alors qu'une
  autre page Flagship indique CC-BY-4.0. À contrôler sur la page du modèle et
  à déclarer.
- **La pertinence du seuil chrF de 30.** C'est un choix initial. Le rapport
  CSV donne chaque score pour l'ajuster.
- **L'extension sur la vraie page Safinum** : toujours non exécutée.

## 3. Limites du mode provisoire

- La rétrotraduction utilise le même éditeur de modèle dans les deux sens : une
  erreur cohérente dans les deux directions peut passer les contrôles.
- Les règles de négation et de sens (envoyer / recevoir, confirmer / annuler)
  s'appliquent au retour en français. Elles ne lisent pas l'éwondo.
- Un pack provisoire **ne remplace pas** la validation humaine. Le classeur
  des validateurs reste l'étape requise pour le statut `validated`.

## 4. Engagements tenus

- Aucun nom de validateur inventé. Un pack provisoire qui en contient est
  refusé.
- Aucun texte éwondo écrit à la main ni généré dans cette livraison.
- Le mode validé refuse toujours un pack provisoire, et `[AUTO]` ne peut être
  ni retiré ni ajouté par le pack.
- Les protections de valeurs et de confidentialité des versions précédentes
  sont inchangées.
