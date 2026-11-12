# Nolia

Nolia est un prototype d'assistance linguistique locale pour l'environnement
de test Safinum. Le projet sépare le noyau de sécurité de l'extension Chrome et
des données linguistiques.

## État actuel

Étapes terminées :

1. contrat de sens indépendant et tests d'intégrité ;
2. moteur de gabarits avec validation des packs linguistiques ;
3. rendu d'un transfert à partir du contrat, avec relecture et vérification du texte produit ;
4. extracteur DOM en lecture seule ;
5. coque Chrome Manifest V3 et observation dynamique.

Le noyau protège :

- le sens de l'opération (`send`, `receive`, `neutral`) ;
- le montant ;
- les frais ;
- la devise ;
- le bénéficiaire.

Ces valeurs ne proviennent que du contrat. Le rendu utilise `renderTransfer`,
qui relit le texte produit avec le gabarit et compare les valeurs relues au
contrat. Une altération produit l'erreur `INTEGRITY_FAILED` avec le code du
champ modifié.

### Limites connues

- La vérification prouve que le texte correspond au gabarit validé avec les
  valeurs du contrat. Elle ne prouve pas que la formulation du gabarit est
  correcte : cela reste une validation linguistique humaine.
- Si une valeur contient le texte littéral qui suit un slot dans le gabarit,
  la relecture peut échouer. L'échec est refusé (`INTEGRITY_PARSE_FAILED`), il
  n'est jamais accepté à tort.
- Deux slots adjacents sans séparateur sont refusés dans un gabarit.
- `renderMessage` reste une API générique de bas niveau. Une démo doit passer
  par `renderTransfer`.
- Les nombres JavaScript au-delà de `Number.MAX_SAFE_INTEGER` sont refusés :
  passer une chaîne ou un `bigint`.

Les fichiers `locales/template.json` et `locales/test.json` ne représentent
aucune langue camerounaise réelle. Les libellés de sens du gabarit sont vides,
donc aucune démo n'est possible tant qu'une langue n'a pas été validée.

Le moteur impose en mode démo :

- un pack au statut `validated` ;
- un gabarit au statut `validated` ;
- des libellés de sens non vides, distincts, sans marqueur `[TEST]` ;
- deux validateurs distincts (comparés sans casse ni espaces), sans `[TEST]` ;
- une date de validation au format `YYYY-MM-DD`, réelle et passée ;
- la présence de tous les slots protégés ;
- l'absence de toute donnée marquée `[TEST]`.

Le mode `test` doit être demandé explicitement. Il accepte uniquement le pack
`TEST`, dont chaque phrase commence visiblement par `[TEST]`.

L'extracteur DOM :

- lit uniquement les nœuds de texte visibles ;
- ignore les scripts, modèles, champs de formulaire et contenus cachés ;
- marque les textes appartenant à un bouton ou à un lien comme interactifs ;
- repère les montants `FCFA` et `XAF` sans conversion flottante, avec une
  recherche bornée pour rester linéaire sur de longs textes numériques ;
- conserve une référence vers le nœud sans ajouter d'attribut à la page ;
- ne déclenche aucun clic et ne modifie aucun texte.

L'extension :

- s'exécute uniquement sur `https://safinum.cm/hackathon-test` et ses sous-pages `https://safinum.cm/hackathon-test/*` ;
- ne demande aucune permission générale et aucun accès à d'autres sites ;
- démarre après le chargement du document ;
- détecte les textes ajoutés ou modifiés après le chargement ;
- ne journalise ni ne transmet les textes financiers ;
- conserve uniquement des compteurs agrégés pour le diagnostic.

`web_accessible_resources` expose `core/*.js` à la page autorisée. C'est
nécessaire pour l'import dynamique depuis le content script ; cela signifie
que la page hôte peut importer ces modules.

## Charger l'extension en développement

1. Ouvrir `chrome://extensions` sur Chrome desktop.
2. Activer le **Mode développeur**.
3. Cliquer sur **Charger l'extension non empaquetée**.
4. Sélectionner le dossier extrait de l'archive, celui qui contient `manifest.json`.
5. Ouvrir ou actualiser l'environnement de test Safinum.

À ce stade, l'extension observe seulement la page. Elle ne traduit et ne
modifie encore aucun élément.

## Exécuter les tests

Prérequis : Node.js 20 ou une version plus récente.

```bash
npm test
```

## Principes de sécurité

- traitement local ;
- aucune API externe ;
- aucun nombre financier traité en virgule flottante ;
- les valeurs protégées viennent du contrat, jamais d'un slot libre ;
- relecture et comparaison du texte produit avant tout affichage ;
- séparation entre tests techniques et validation linguistique humaine.

## Prochaines étapes

1. inventaire contrôlé des messages Safinum ;
2. association des textes connus aux contrats de sens ;
3. stratégie d'affichage sans altération de l'opération ;
4. intégration d'une langue après validation humaine.
