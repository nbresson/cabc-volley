# Une page par équipe — design

Date : 2026-08-12
Statut : validé, prêt pour le plan d'implémentation

## Contexte

Aujourd'hui `site/equipes.html` affiche les 5 équipes du club sur une seule page,
avec l'intégralité des effectifs les uns sous les autres. La page a deux défauts :
elle ne laisse aucune place au calendrier de chaque équipe, et elle charge tous
les portraits de toutes les équipes en une fois.

Le site est composé de pages HTML statiques servies par Cloudflare Workers, sans
étape de build. Le contenu vit dans `site/content/*.json`, édité par le bureau du
club via Decap CMS. Ajouter un fichier HTML est une tâche de développeur ; ajouter
une entrée dans un JSON est une tâche que le club fait seul.

Ce dernier point commande toute la conception : **la structure du site ne doit
jamais dépendre du nombre d'équipes.**

## Décision

Chaque équipe a sa page dédiée, et `equipes.html` devient un index qui les
résume. Les pages équipe ne sont pas des fichiers HTML séparés : elles sont
rendues par un gabarit unique `equipe.html?e=<slug>`, sur le modèle de
`article.html?slug=<slug>` qui sert déjà les actualités.

Conséquence : créer une 6e équipe dans Decap crée sa page automatiquement.
Aucune intervention de développement.

## Objectifs

- Une page par équipe, avec identité, calendrier et effectif.
- Un index qui donne une vue d'ensemble et mène aux pages.
- Zéro travail de développement quand le club ajoute ou retire une équipe.
- Aucune page vide : les blocs sans données disparaissent.
- Aucune régression sur `calendrier.html`.

## Non-objectifs

Explicitement hors périmètre, sans que rien ne les empêche plus tard :

- URLs propres (`/equipes/n3-masculin`) — voir « URLs » ci-dessous.
- Galerie photo par équipe.
- Palmarès et historique par équipe.
- Éclatement de « Jeunes » en M18 / M15 / M13.
- Classement calculé automatiquement (on renvoie vers la FFVB).

## Architecture

| Fichier | Rôle |
| --- | --- |
| `site/equipes.html` (refonte) | Index : une carte par équipe, groupées par `groupe` |
| `site/equipe.html` (nouveau) | Gabarit unique d'une page équipe |
| `site/assets/site.js` (ajout) | `teamUrl(slug)` — construction des liens d'équipe |

La navigation principale (`NAV` dans `site.js`) ne change pas : « Équipes »
reste une entrée unique, les pages équipe sont ses enfants.

Fil d'ariane de la page équipe : `Accueil / Équipes / <nom>`, la partie
« Équipes » étant un lien vers l'index.

### URLs

On part sur la chaîne de requête : `equipe.html?e=n3-masculin`.

Toutes les URLs d'équipe sont construites par `teamUrl(slug)` dans `site.js`.
Aucun autre fichier ne concatène cette URL à la main. Passer plus tard à des
URLs propres via `_redirects` devient une modification d'une seule fonction,
sans avoir à retrouver les liens dispersés dans les pages.

## Modèle de données

### `site/content/teams.json`

Champs ajoutés à chaque entrée de `items` :

| Champ | Obligatoire | Rôle |
| --- | --- | --- |
| `slug` | oui | Identifiant d'URL, sans espaces ni accents |
| `groupe` | recommandé | `Séniors` / `Jeunes` / `Formation` — groupement de l'index ; à défaut, groupe « Autres » |
| `photo` | non | Photo d'équipe, format 16/9 |
| `classement` | non | Lien FFVB propre à l'équipe |
| `infos` | non | Bloc « infos pratiques » (objet, voir ci-dessous) |

`nom`, `categorie`, `creneau` et `effectif` sont inchangés.

L'objet `infos` porte le contenu des équipes de formation, qui n'ont ni effectif
numéroté ni calendrier :

```json
"infos": {
  "titre": "Rejoindre l'école de volley",
  "texte": "Ouverte aux enfants de 6 à 11 ans, le samedi matin…",
  "bouton": "S'inscrire",
  "lien": "adhesion.html"
}
```

Le bloc n'est rendu que si `infos.titre` est renseigné. Le bouton n'est rendu
que si `bouton` et `lien` le sont tous les deux.

Slugs des équipes existantes :

| Équipe | `slug` | `groupe` |
| --- | --- | --- |
| National 3 masculin | `n3-masculin` | Séniors |
| Régional 1 féminin | `r1-feminin` | Séniors |
| Régional 1 masculin | `r1-masculin` | Séniors |
| Jeunes | `jeunes` | Jeunes |
| École de volley | `ecole-de-volley` | Formation |

### `site/content/matches.json`

Un champ `equipe` est ajouté à chaque match, contenant le `slug` d'une équipe.

Les 6 matchs actuellement présents relèvent tous de la N3 masculine : ils
reçoivent `"equipe": "n3-masculin"`.

**Règle de non-régression :** un match sans `equipe` n'apparaît sur aucune page
équipe, mais reste affiché normalement sur `calendrier.html`. Un oubli de
saisie coûte un affichage secondaire, jamais le calendrier principal.

## Le gabarit `equipe.html`

### Séquence de rendu

1. Lire `e` dans la chaîne de requête.
2. Charger `teams.json`, `matches.json` et `settings.json`.
3. Trouver l'équipe dont `slug` vaut `e`.
4. Si aucune équipe ne correspond, ou si `e` est absent : afficher
   « Équipe introuvable » et un lien vers `equipes.html`, puis s'arrêter.
   C'est le comportement déjà en place dans `article.html`.
5. Mettre à jour `document.title` avec le nom de l'équipe.
6. Rendre les blocs ci-dessous, dans l'ordre.

### Blocs, et condition d'affichage de chacun

| # | Bloc | Affiché si |
| --- | --- | --- |
| 1 | En-tête : photo, nom, catégorie, créneau | toujours |
| 2 | Infos pratiques | `infos.titre` renseigné |
| 3 | Prochains matchs (3 max, `statut = a_venir`, par date croissante) | au moins 1 match à venir de l'équipe |
| 4 | Derniers résultats (3 max, `statut = termine`, par date décroissante) | au moins 1 match terminé de l'équipe |
| 5 | Lien classement FFVB | `classement` renseigné ; à défaut, seulement si l'équipe a au moins un match tagué, et on utilise alors `settings.ffvb_classement` |
| 6 | Effectif | `effectif` contient au moins une personne |
| 7 | Pied : « ← Toutes les équipes » et « Calendrier complet » | toujours |

Si l'équipe n'a pas de `photo`, l'en-tête utilise le fond hachuré `.ph` déjà
utilisé ailleurs sur le site, comme `article.html` le fait pour les articles
sans image.

C'est ce tableau qui rend le gabarit adaptatif : la N3 masculine affiche les
blocs 1, 3, 5, 6, 7 ; l'école de volley affiche 1, 2, 7. Un seul fichier, deux
pages qui ne se ressemblent pas.

### État initial des données

Au moment de la mise en ligne, seule la N3 masculine a un effectif et des
matchs. Les 4 autres équipes n'afficheront que leur en-tête et leur pied tant
que le bureau n'aura pas complété Decap. C'est assumé : les pages sont courtes
mais jamais cassées, et chaque champ rempli fait apparaître son bloc sans
intervention de développement.

Pour que les pages « Jeunes » et « École de volley » tiennent debout dès le
premier jour, le bureau doit remplir leur bloc `infos` — deux paragraphes.

## L'index `equipes.html`

La page conserve son en-tête actuel (fil d'ariane, titre, mention de saison) et
remplace le déversement des effectifs par une grille de cartes, groupées par
`groupe` avec un sous-titre par groupe.

Les groupes sont affichés dans l'ordre Séniors, Jeunes, Formation. Une équipe
dont le `groupe` est vide ou inconnu est rattachée à un groupe « Autres » placé
en dernier : une saisie incomplète dans Decap ne doit jamais faire disparaître
une équipe de l'index. Un groupe sans équipe n'est pas affiché.

Chaque carte contient :

- la photo d'équipe, ou le fond hachuré `.ph` à défaut ;
- le nom et la catégorie ;
- le créneau ;
- le prochain match de l'équipe, s'il en existe un — c'est ce qui donne envie
  de cliquer ;
- la carte entière est un lien vers `teamUrl(slug)`. Une équipe sans `slug`
  reste affichée, mais sa carte n'est pas cliquable : une saisie incomplète
  dégrade la carte, elle ne produit pas de lien mort.

Les effectifs disparaissent de cette page : ils vivent désormais sur les pages
équipe.

## Decap CMS

Dans `site/admin/config.yml`, collection `teams` : ajout de `slug`, `groupe`,
`photo`, `classement` et de l'objet `infos`.

Le champ `slug` porte un avertissement explicite : une fois la page publiée et
partagée, le modifier casse les liens existants.

Le champ `classement` est propre à chaque équipe : chacune a sa poule et donc
son URL de classement sur le site de la FFVB. Son hint invite à ouvrir le
classement de la poule concernée et à en coller l'adresse. Le lien global des
« Réglages du club » ne sert que de repli tant que ce champ est vide.

Collection `matches` : ajout du champ `equipe`, en liste déroulante alimentée
depuis `teams.json` via le widget `relation`, pour que le club n'ait pas à
retenir les slugs et pour qu'une nouvelle équipe apparaisse d'elle-même dans la
liste.

**Repli si le widget `relation` ne sait pas cibler une liste imbriquée dans une
collection de type `files` :** un champ texte contenant le slug. Le rendu du
site est identique, seule la saisie est moins confortable. À trancher au
premier test dans l'admin, pas avant.

## Migration

1. Ajouter `slug` et `groupe` aux 5 équipes de `teams.json`.
2. Ajouter `"equipe": "n3-masculin"` aux 6 matchs de `matches.json`.
3. Rédiger le bloc `infos` de « Jeunes » et « École de volley ».

Aucune donnée n'est supprimée. Les JSON restent lisibles par les pages
existantes pendant toute la migration : les nouveaux champs sont ignorés par le
code actuel.

## Vérifications

Le site n'a pas de suite de tests automatisés. Les vérifications sont manuelles,
via `wrangler dev` :

- `equipes.html` affiche 5 cartes, groupées, chacune cliquable.
- `equipe.html?e=n3-masculin` affiche en-tête, prochains matchs, classement,
  effectif de 5 personnes.
- `equipe.html?e=ecole-de-volley` affiche en-tête et infos pratiques, sans
  section matchs ni effectif vide.
- `equipe.html?e=nimportequoi` et `equipe.html` sans paramètre affichent le
  message d'équipe introuvable avec le lien de retour.
- `calendrier.html` affiche toujours les 6 matchs.
- Rendu correct à 360 px de large, la largeur de référence retenue lors des
  lots A à C.
- Les portraits de l'effectif portent `loading="lazy"`.

## Risques

| Risque | Parade |
| --- | --- |
| Le bureau modifie un `slug` après publication et casse les liens | Avertissement dans le hint Decap |
| Le bureau oublie de taguer un match | Le match reste sur `calendrier.html` ; seule la page équipe le manque |
| Le widget `relation` ne cible pas les listes imbriquées | Repli sur un champ texte, décidé au premier test |
| Les 4 équipes restent vides faute de contenu | Blocs masqués, pages courtes mais correctes ; `infos` à rédiger pour Jeunes et École |

## Effets de bord positifs

L'index ne charge plus que 5 vignettes au lieu de tous les portraits de toutes
les équipes. Les portraits passent en `loading="lazy"` sur les pages équipe.

Aucune règle CSS nouvelle : `.card`, `.cols-4`, `.section-head`, `.ph`, `.badge`
et `.crumb` couvrent l'ensemble des besoins.
