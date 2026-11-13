# Nolia 0.5.6 — audit de livraison

État au 13 novembre 2026. Ce document distingue ce qui a été vérifié de ce qui
ne l'a pas été.

**Traductions automatiques provisoires, non validées par des locuteurs.**

## 1. Vérifié

| Vérification | Résultat réel |
| --- | --- |
| `npm test` | **288 réussis, 0 échec** |
| `npm run coverage:intents` | 53 phrases, **0 faux positif** |
| Pack livré, validé par Nolia en mode provisoire | 84 textes sur 84, aucun motif de refus |
| Pack livré, présenté comme validé (mode démonstration) | **refusé**, comme attendu |
| Chrome réel, page Safinum SIMULÉE, extension livrée | **38 sur 38** |

Scénarios de sécurité (tests automatiques et contrôle Chrome) :

| Scénario | Résultat |
| --- | --- |
| Montant inchangé | réussi (un affichage dont le montant change est refusé : AMOUNT_CHANGED) |
| Devise inchangée | réussi (CURRENCY_CHANGED) |
| Bénéficiaire inchangé | réussi (nom protégé dans le message dynamique et dans les formulations) |
| Numéro et référence inchangés | réussi (téléphones, références et codes d'erreur protégés) |
| Aucune inversion envoyer / recevoir | réussi (DIRECTION_CHANGED ; cas mixtes envoyés en mode dégradé) |
| Texte inconnu conservé en français | réussi |
| Restauration exacte du français | réussi (88 nœuds comparés, 0 différent) |
| Contenu ajouté après le chargement | détecté et traité, puis restauré |
| Aucun envoi de données à une API externe | réussi (aucune requête réseau hors page simulée ; aucun `fetch`, `XMLHttpRequest`, `innerHTML`, `eval` dans le code) |

Trois états du pack, chacun couvert par des tests :
- pack vide : bouton désactivé et raison affichée ;
- pack provisoire : mode `[AUTO]` et mention « à vérifier » ;
- pack validé par deux personnes : mode de démonstration sans `[AUTO]`.

## 2. Non vérifié

- **TEST SUR LA VRAIE PAGE SAFINUM NON EFFECTUÉ.** Le contrôle Chrome utilise
  une page simulée.
- **La justesse de l'éwondo.** Aucune phrase n'a été relue par un locuteur.
  Les six corrections sont des remplacements mot pour mot ; l'accord du reste
  de chaque phrase n'est pas contrôlé.
- Points linguistiques déjà signalés et toujours ouverts : « nkukuma » pour
  « secret » (le lexique donne « ndímba »), « A kom » pour « Modifier »,
  « syebe » / « kyɛbɛ » pour « réussir ».
- L'origine exacte du brouillon des 84 phrases (fichier fourni par l'équipe
  le 12 novembre 2026).

## 3. Pour passer à une version linguistiquement finale

1. Deux locuteurs relisent les 84 phrases dans l'extension ou dans le classeur.
2. Leurs noms et la date sont inscrits ; le pack passe à `validated`.
3. `npm run pack:ewondo -- ewondo.json` installe le pack : le `[AUTO]` disparaît.
