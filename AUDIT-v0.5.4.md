# Audit Nolia v0.5.4

Date : 11 novembre 2026

## Verdict

La v0.5.4 est prête pour les tests fonctionnels avec un pack ewondo automatique
provisoire. Elle ne doit pas être présentée comme linguistiquement validée.

## Contrôles réussis

- 266 tests unitaires et d'intégration : 266 réussis ;
- 84 exigences de pack présentes et non vides ;
- pack automatique accepté en mode `provisional` uniquement ;
- même pack refusé en mode `demo` ;
- aucune identité de validateur inventée ;
- noms et comptes dynamiques conservés par emplacements protégés ;
- chiffres interdits dans les explications d'intention ;
- aucune requête réseau ni API dans l'extension ;
- 53 formulations indépendantes testées, sans faux positif ;
- restauration exacte du français couverte par les tests.

## Traduction automatique

Source : Flagship/Lingo `cameroon-int8`, paires `francais-ewondo` et
`ewondo-francais`. La licence retenue prudemment pour la documentation est
CC BY-NC 4.0, celle du dépôt parent. Les modèles servent à la génération en
amont et ne sont pas inclus dans l'archive Chrome.

La rétrotraduction et les contrôles structurels servent uniquement au tri des
anomalies évidentes. Ils ne démontrent ni la grammaire, ni le sens exact, ni
l'acceptabilité pour un locuteur.

## Limitation du test Chrome

Le script Chrome simulé a été étendu pour le nouveau bouton, l'avertissement,
la conservation des valeurs et la restauration. Dans l'environnement de
construction utilisé ici, Chromium n'a pas pu démarrer : la création de son
socket `ProcessSingleton` est interdite par l'isolation du système. Ce blocage
ne vient pas du manifeste Nolia, mais le résultat Chrome v0.5.4 ne doit donc pas
être compté comme réussi avant exécution sur l'ordinateur de l'équipe.

## Test manuel prioritaire

1. Charger le dossier décompressé dans `chrome://extensions`.
2. Ouvrir `https://safinum.cm/hackathon-test`.
3. Vérifier l'avertissement jaune et activer l'ewondo provisoire.
4. Parcourir solde, frais, bénéficiaire, récapitulatif, confirmation et erreur.
5. Vérifier visuellement les noms, montants, devises, comptes et références.
6. Ajouter un message dynamique, puis restaurer le français.
7. Noter séparément les défauts techniques et les défauts linguistiques.

## Condition avant affirmation linguistique

Faire relire le rapport CSV et le pack par des locuteurs ewondo, corriger les
textes, puis installer un pack `validated` avec deux validateurs distincts et
une date réelle. Aucun test automatique ne remplace cette étape.
