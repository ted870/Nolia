# Nolia 0.5.5 — audit de livraison finale

État au 11 novembre 2026. Ce document distingue les résultats reproduits sur
la livraison finale des affirmations provenant des archives antérieures.

## 1. Verdict

La v0.5.5 finale est techniquement prête pour un test manuel sur Safinum avec
un pack éwondo **automatique et provisoire**. Elle n'est pas linguistiquement
validée et ne doit jamais être présentée comme telle.

## 2. Vérifications reproduites

| Vérification | Résultat |
| --- | --- |
| `npm test` | **288 réussis, 0 échec**, 0 annulé, 0 ignoré |
| `npm run coverage:intents` | 53 phrases, **0 faux positif** |
| Pack livré | 84/84 textes, langue `ewo`, statut `provisional`, aucun validateur déclaré |
| Module chargé par Chrome | Identique à `locales/ewo-provisional.json` |
| Mode provisoire | Accepté uniquement en mode `provisional`; chaque rendu reçoit `[AUTO]` |
| Mode validé | Refuse le pack provisoire |
| Valeurs protégées | Montants, comptes, téléphones, références, codes, dates, bénéficiaires et sens couverts par les tests d'intégrité |
| Restauration | Retour exact au français couvert par les tests |
| Messages inédits | Mode dégradé conservé; aucune traduction libre forcée |

Le pack v0.5.4 a été accepté par l'installateur v0.5.5 sans contournement :
`Pack éwondo PROVISOIRE installé (84/84 textes, affichés avec [AUTO])`.

## 3. Vérifications non réalisées

- **Chrome sur la page simulée** : Chromium ne démarre pas dans cet
  environnement (`ProcessSingleton`, création de socket interdite). Le script
  a été adapté au vrai pack livré, mais son exécution doit être faite sur
  l'ordinateur de l'équipe.
- **La vraie page Safinum** : aucun parcours manuel complet n'a encore été
  observé avec cette archive finale.
- **Le notebook Colab** : il est annoncé comme fourni séparément, mais il
  n'était pas présent dans l'archive v0.5.5 reçue.
- **La génération du pack** : le pack et son rapport ont été repris de la
  v0.5.4 connue; le modèle Flagship/Lingo n'a pas été réexécuté pendant cet
  audit.
- **La qualité linguistique** : aucune relecture par des locuteurs
  ewondophones n'a été fournie.
- **La licence exacte du modèle** : les documents disponibles mentionnent
  prudemment CC BY-NC 4.0, mais cette information doit être confirmée sur la
  source officielle avant la soumission.

## 4. Limites du mode provisoire

- Une rétrotraduction peut laisser passer une erreur cohérente dans les deux
  directions.
- Les contrôles de sens portent surtout sur le retour français; ils ne prouvent
  pas la grammaire ni l'acceptabilité de l'éwondo.
- Un message absent ou refusé reste en français.
- Nolia assiste la compréhension; elle ne bloque ni ne sécurise une
  transaction financière.

## 5. Formulation exacte pour le jury

« Nolia affiche un pack éwondo généré automatiquement et clairement marqué
`[AUTO]`. Les montants, bénéficiaires, frais, références et sens de l'opération
sont contrôlés par le moteur local. La validation linguistique humaine n'est
pas encore effectuée. »
