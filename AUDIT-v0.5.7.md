# Nolia 0.5.7 — audit de livraison

État au 13 novembre 2026.

## 1. Vérifié

| Vérification | Résultat réel |
| --- | --- |
| `npm test` | **288 réussis, 0 échec** |
| `npm run coverage:intents` | 53 phrases, **0 faux positif** |
| Pack livré en mode démonstration (validé) | accepté, 84 textes sur 84, aucun motif de refus |
| Pack livré présenté comme provisoire | refusé, comme attendu |
| Chrome réel, page Safinum **simulée**, extension livrée, option `--validated` | **38 sur 38** |
| Parcours manuel sur l'environnement Safinum réel | **5 écrans sur 5, rendu conforme selon l'équipe** |

Scénarios de sécurité, tous réussis : montant inchangé, devise inchangée,
bénéficiaire inchangé, numéro et référence inchangés, aucune inversion
envoyer / recevoir, texte inconnu conservé en français, restauration exacte
(88 nœuds comparés, 0 différent), contenu ajouté après le chargement détecté
puis restauré, aucune requête réseau hors de la page simulée.

## 2. Origine de la validation

Le 13 novembre 2026, **Mballa** et **Menounga**, deux locuteurs éwondophones,
ont lu et validé les traductions directement dans Chrome, dans le contexte de
l'interface Safinum. Le pack rapporte cette validation humaine en contexte.

Cette relecture linguistique n'est pas un test automatisé. Il est recommandé de
conserver une trace datée de la séance et les noms complets des validateurs.

## 3. Non vérifié

- La validation linguistique a été effectuée dans le navigateur. Le contrôle
  Chrome automatisé et reproductible utilise toutefois une page simulée.
- Les cinq écrans réels ont été parcourus manuellement le 13 novembre 2026 ;
  aucun défaut de rendu n'a été signalé par l'équipe.
- **La justesse de l'éwondo**, que je ne peux pas évaluer. Les six corrections
  de vocabulaire de la v0.5.6 étaient des remplacements mot pour mot ; ce sont
  les deux locuteurs qui en répondent.
- Trois points signalés et conservés tels quels : « nkukuma » pour « secret »,
  « A kom » pour « Modifier », « syebe » pour « réussi ».
