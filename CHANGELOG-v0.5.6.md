# Nolia v0.5.6 — pack éwondo provisoire livré, six corrections de vocabulaire

Date : 13 novembre 2026. Branche : `feature/v0.5.6-ewondo-auto` (depuis la v0.5.5).

**Traductions automatiques provisoires, non validées par des locuteurs.**

## 1. Corrections du vocabulaire (demandées par l'équipe, source : Bibala)

| Ancienne forme | Forme corrigée |
| --- | --- |
| Mbolo | Masug |
| lom | álōm |
| Edimi | evus |
| dzoe | dzwé |
| ntilen | fóé |
| Kom ese (« toujours ») | abǒg áse |

Phrases modifiées (14 sur 84) :

| Identifiant | Avant | Après |
| --- | --- | --- |
| `beneficiary.verify_before_confirm` | Fombo numero ya mot a yi nong moni osu ya lom moni. | Fombo numero ya mot a yi nong moni osu ya álōm moni. |
| `error.generic` | Edimi ya teknik e nga kui. | Evus ya teknik e nga kui. |
| `fallback.unrecognized` | Nolia a nji yem ntilen nyi. Ntilen ya falansi a ligi. | Nolia a nji yem fóé nyi. Fóé ya falansi a ligi. |
| `fallback.unrecognized_warning` | Mbaale: Nolia a nji yem ntilen nyi. Fombo mam osu ya ke osu. | Mbaale: Nolia a nji yem fóé nyi. Fombo mam osu ya ke osu. |
| `balance.startTransfer` | A lom moni | Álōm moni |
| `security.verifyBeneficiary` | Kom ese, wo yeane fombo dzoe ai numero ya mot a yi nong moni osu ya yili nloman moni. | Abǒg áse, wo yeane fombo dzwé ai numero ya mot a yi nong moni osu ya yili nloman moni. |
| `fees.amountToSend` | ABIM MONI YA LOM | ABIM MONI YA ÁLŌM |
| `beneficiary.intro` | Til mam ya mot a yi nong moni. Kom ese, fombo numero osu ya yili. | Til mam ya mot a yi nong moni. Abǒg áse, fombo numero osu ya yili. |
| `beneficiary.reason` | AMU DZE WO A LOM MONI | AMU DZE WO ÁLŌM MONI |
| `beneficiary.note` | NTILEN MFE (NGE O YI) | FÓÉ MFE (NGE O YI) |
| `beneficiary.checked` | Ma nga fombo dzoe ai numero ya mot a yi nong moni. | Ma nga fombo dzwé ai numero ya mot a yi nong moni. |
| `error.title` | Edimi e nga kui | Evus e nga kui |
| `balance.greeting` | Mbolo, {name} | Masug, {name} |
| `confirmation.requiredBeforeSubmit` | Wo yeane dzo na mam mə ne bebela osu ya lom moni. | Wo yeane dzo na mam mə ne bebela osu ya álōm moni. |

Précisions :
- `álōm` est la forme de base du verbe (avec sa marque d'infinitif). « A lom »
  est donc devenu « Álōm », et non « A álōm ». Le mot `nloman` (un envoi) n'est
  pas touché.
- En début de phrase, `evus`, `fóé` et `abǒg áse` prennent une majuscule ; dans
  les libellés en capitales du site, les formes sont en capitales.
- Correction antérieure conservée : « Fermer » = `Áfɛd` (au lieu de « A dib »).
- Ces remplacements sont faits mot pour mot. L'accord du reste de la phrase
  n'a pas été revu : c'est le rôle des deux locuteurs.

## 2. Statut linguistique

- `locales/ewondo_provisoire.json` et `core/locale-target-pack.js` :
  `status: "provisional"`, `validatedBy: []`, `validatedAt: null`.
- Bouton « Activer l'éwondo (automatique) » ; chaque traduction précédée de
  `[AUTO]` ; aucune mention « traduction validée ».

## 3. Contenu

84 entrées : 64 messages exacts, 2 messages dynamiques (`{name}`,
`{account}`), 16 explications d'intentions, 2 messages de mode dégradé.
Les montants, la devise, le bénéficiaire, les frais, le téléphone et la
référence ne sont pas des emplacements du pack : Nolia les relit sur la page
et les recopie tels quels (aucun gabarit ne peut contenir un chiffre).

## 4. Tests

- Sept tests supposaient que le module livré était le modèle vide. Six sont
  adaptés pour distinguer les trois états (pack vide, provisoire, validé) et le
  septième accepte le numéro de version 0.5.6. Aucun test n'est supprimé.
- Nouveau fichier d'aide : `tests/helpers/empty-pack.js` (modèle vide).
- Résultat : **288 réussis, 0 échec**.

## 5. Numérotation

Deux essais hors de cette branche ont porté les numéros 0.5.6 (pidgin) et
0.5.7 (eton). Ils ne font pas partie de cette version : la 0.5.6 de référence
est celle-ci, en éwondo.
