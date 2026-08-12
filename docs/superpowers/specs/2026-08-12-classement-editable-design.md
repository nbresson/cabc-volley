# Classement de la page Calendrier, éditable — design

Date : 2026-08-12
Statut : validé, prêt pour le plan d'implémentation

## Contexte

La page Calendrier affiche un classement de cinq équipes. Ce tableau est **écrit en
dur** dans `site/calendrier.html`, lignes 25 à 34 : le titre « Classement Prénationale
F », les cinq `<tr>`, et la phrase « Classement saisi à la main — le détail officiel et
à jour est sur le site de la FFVB. »

Le club ne peut donc rien y changer depuis Decap. Deux réglages voisins existent
pourtant déjà et entretiennent la confusion : `ffvb_classement` dans
`site/content/settings.json` et le champ `classement` de chaque équipe dans
`teams.json`. Ce ne sont que des **liens** vers la FFVB ; aucun ne pilote le tableau.

Conséquence concrète : après chaque journée de championnat, le classement affiché est
faux jusqu'à ce que quelqu'un modifie le HTML.

## Décision

Un classement unique, celui de la page Calendrier, sorti dans un fichier
`site/content/classement.json` et exposé par une collection Decap dédiée. Le titre, la
phrase de bas de tableau et toutes les lignes deviennent éditables.

## Objectifs

- Le bureau met le classement à jour seul, après chaque journée, sans toucher au code.
- Aucune classe CSS nouvelle : `table.ds`, `tr.hl` et `.table-wrap` existent et sont
  déjà documentés dans la galerie.
- Une erreur de saisie plausible est attrapée par `npm run check`, pas par un visiteur.

## Non-objectifs

Écartés sciemment, chacun pour une raison :

- **Un classement par équipe.** Le rattacher à `teams.json` et l'afficher sur chaque
  page équipe serait plus riche, mais ferait passer la saisie d'un tableau à cinq, à
  tenir à jour toutes les semaines. Le club en tiendra un ; c'est déjà le cas
  aujourd'hui. Décision prise en connaissance de cause, pas par oubli.
- **Les colonnes de sets (pour / contre).** Présentes sur les classements FFVB
  officiels, mais six chiffres par ligne à recopier, et un tableau serré sur
  téléphone. Les quatre colonnes actuelles — J, V, D, Pts — sont conservées telles
  quelles.
- **Toute récupération automatique depuis la FFVB.** Pas d'API publique, et le site
  n'a aucune étape de build où la lancer. La phrase « classement saisi à la main »
  reste vraie, et reste affichée.
- **La gestion des ex æquo.** Voir « Le rang n'est pas un champ » ci-dessous.

## Architecture

| Fichier | Rôle |
| --- | --- |
| `site/content/classement.json` (nouveau) | Le contenu, édité par Decap |
| `site/admin/config.yml` (modifié) | Collection `classement` |
| `site/calendrier.html` (modifié) | Le `<tbody>` en dur cède la place au rendu JSON |
| `scripts/check-content.mjs` (modifié) | Contrôle des invariants du classement |
| `site/README.md` (modifié) | Inventaire des fichiers et des espaces Decap |

`site/assets/style.css` et `site/design-system.html` ne bougent pas : ce chantier
n'introduit aucune classe.

## Le modèle Decap

Collection `classement`, fichier unique, placée juste après « Matchs & résultats » —
même page, même sujet, et le bureau les met à jour dans la même session.

```
titre            Titre de la section, ex. Classement Prénationale F
note             Phrase sous le tableau (optionnel)
items[]
  equipe         Nom de l'équipe
  joues          J   — nombre entier
  victoires      V   — nombre entier
  defaites       D   — nombre entier
  points         Pts — nombre entier
  notre_club     Met la ligne en avant (booléen)
```

Forme du contenu produit :

```json
{
  "titre": "Classement Prénationale F",
  "note": "Classement saisi à la main — le détail officiel et à jour est sur le site de la FFVB.",
  "items": [
    { "equipe": "Ussel VB", "joues": 6, "victoires": 6, "defaites": 0, "points": 18, "notre_club": false },
    { "equipe": "C.A. Brive Corrèze Volley", "joues": 6, "victoires": 5, "defaites": 1, "points": 15, "notre_club": true }
  ]
}
```

Les quatre chiffres sont en `widget: number` avec `value_type: int` et `min: 0`, et non
en `string` comme la plupart des champs du site. C'est le seul endroit du contenu où
une valeur est **arithmétique** : le widget interdit d'écrire une lettre dans une
colonne de points, et évite les `"6 "` avec espace traînante qui s'affichent mal.

`summary: "{{fields.equipe}} — {{fields.points}} pts"` : replié, chaque élément de la
liste reste identifiable, ce qui est indispensable pour réordonner cinq à douze lignes.

`notre_club` reprend le vocabulaire du « Mettre en avant ? » déjà employé pour les
dates clés de la page Club — même geste, même formulation.

## Le rang n'est pas un champ

La colonne `#` vaut la position dans la liste, plus un. Rien à saisir : le bureau
réordonne par glisser-déposer dans Decap, et l'affichage suit.

Un champ « Rang » saisi à la main permettrait les ex æquo, mais autoriserait aussi
deux 3e places, un trou entre le 4e et le 6e, et un ordre d'affichage en contradiction
avec les numéros — trois incohérences que rien ne rattraperait. Le rang implicite les
rend structurellement impossibles.

Contrepartie assumée : **deux équipes à égalité de points recevront deux rangs
distincts**, dans l'ordre où le bureau les place. La FFVB départage de toute façon les
égalités au ratio de sets, que ce tableau n'affiche pas ; l'ordre saisi reflétera le
classement officiel.

## Le rendu

Dans `site/calendrier.html`, le `<h2>`, les cinq `<tr>` et le paragraphe de note
disparaissent du HTML. `__pageInit` charge déjà `matches.json` et `settings.json` dans
un `Promise.all` : `classement.json` l'y rejoint, sans requête supplémentaire en série.

Le `<thead>` **reste en dur**. Les six en-têtes sont de la structure, pas du contenu :
les rendre éditables permettrait de renommer « Pts » sans que les valeurs changent de
sens, pour un bénéfice nul.

L'interpolation suit celle du reste du site — gabarits littéraux, sans échappement.
Le contenu vient d'un CMS dont l'accès est authentifié ; introduire un échappeur ici
seulement créerait une exception inexpliquée dans un code par ailleurs homogène.

## Cas limites

| Situation | Comportement |
| --- | --- |
| `classement.json` absent ou illisible | `getJSON()` rend `null` ; titre de repli, message d'état vide, le lien FFVB reste |
| `items` vide ou absent | Le tableau cède la place à `<p class="vide muted">Classement à venir.</p>` |
| `titre` vide | Repli sur « Classement » — la section garde un titre |
| `note` vide | Le paragraphe n'est pas rendu du tout, pas de ligne fantôme |
| Un chiffre absent | Affiché `0`, la ligne reste lisible plutôt que trouée |
| Aucune ligne `notre_club` | Aucun surlignage ; c'est un état valide, pas une erreur |

La tournure « Classement à venir. » et la classe `.vide` suivent la convention des
états vides retenue au chantier de consolidation de la charte — la même que
« Aucun match programmé pour le moment. », affiché quelques centaines de pixels plus
haut sur cette page.

## Garde-fous

`scripts/check-content.mjs` gagne un bloc classement, dans l'esprit des contrôles
existants sur les slugs d'équipes :

- nom d'équipe non vide sur chaque ligne ;
- `joues`, `victoires`, `defaites`, `points` : entiers positifs ou nuls ;
- **au plus une** ligne `notre_club` — l'erreur la plus probable à la saisie, deux
  lignes surlignées, et la seule que la relecture visuelle rate facilement.

Le nombre de lignes rejoint la ligne « OK — … » finale.

Volontairement **non** contrôlé : la cohérence de `joues` avec `victoires + defaites`.
Un match à rejouer ou un forfait la rendrait fausse à raison, et le contrôle bloquerait
une saisie correcte.

## Vérifications

Le dépôt n'a pas de suite de tests automatisés et ce design n'en introduit pas.

- `npm run check` passe, **avec les mêmes comptes de classes** : 67 dans `style.css`,
  56 documentées, 11 exclues. Le chantier n'ajoute aucune classe.
- Le contrôle échoue bien, et avec un message lisible, sur deux `notre_club` cochés.
- La page rend le même tableau qu'avant à partir du JSON : cinq lignes, la deuxième
  surlignée avec son liseré, les colonnes alignées comme aujourd'hui.
- `git diff` sur `site/assets/style.css` est vide.
- Passe visuelle à 360 px — le tableau défile dans `.table-wrap` — et en pleine largeur.
- États vides éprouvés : fichier absent, `items` vide.
- Dans l'admin : la collection apparaît, une ligne s'ajoute, se réordonne, se supprime.

## Risques

| Risque | Parade |
| --- | --- |
| Le `widget: number` rend `""` plutôt que `0` quand le champ est vidé | Repli sur `0` au rendu, contrôle d'entier dans `check-content.mjs` |
| Le bureau coche `notre_club` sur deux lignes | Attrapé par `npm run check` avant la mise en ligne |
| Le bureau cherche le classement dans « Réglages du club », où vit le lien FFVB | Collection nommée « Classement », placée près de « Matchs & résultats » ; hint du champ `ffvb_classement` à relire |
| Confusion entre ce tableau et le lien FFVB par équipe de `teams.json` | La phrase de note, éditable, dit explicitement que le détail officiel est sur la FFVB |
