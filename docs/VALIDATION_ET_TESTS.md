# Validation linguistique et tests

## Validation linguistique

Le 13 novembre 2026, Mballa et Menounga, deux locuteurs éwondophones, ont lu et
validé les traductions directement dans Chrome, dans le contexte de l’interface
Safinum. Le pack rapporte cette validation dans `locales/ewondo.json`.

Cette procédure vérifie la compréhension linguistique en contexte. Elle ne doit
pas être confondue avec un test automatisé. L’équipe doit conserver une trace
datée de la séance et les noms complets des validateurs.

## Résultats techniques

- 288 tests unitaires et d’intégration sur 288 ;
- 53 phrases indépendantes, avec 0 faux positif ;
- 38 contrôles Chrome sur 38 sur une page Safinum simulée.

Sont notamment couverts : inversion envoyer/recevoir, valeurs modifiées,
négation, textes inconnus ou ambigus, contenu dynamique, restauration exacte,
séparation des packs vide/provisoire/validé et absence de fuite réseau.

## Limite des preuves

Les tests vérifient la structure, les valeurs et les contrats de sens. Ils ne
peuvent pas déterminer si une phrase éwondo est naturelle. Cette responsabilité
reste humaine.

Points consignés pour une éventuelle révision : `nkukuma` pour « secret »,
`A kom` pour « modifier » et `syebe` pour « réussi ».
