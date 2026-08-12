# Page galerie du design system — design

Date : 2026-08-12
Statut : validé, prêt pour le plan d'implémentation

## Contexte

Le site n'a pas de composants au sens habituel. Il a **un vocabulaire de classes CSS
plus des styles inline**, et chaque page pioche dans ce vocabulaire : `.card`,
`.cols-4`, `.match-row`, `.badge`. `site/assets/style.css` fait 209 lignes et définit
58 classes.

Ce vocabulaire n'est documenté nulle part. Deux conséquences observées pendant le
chantier des pages équipe :

- la rédaction du plan a exigé de dépouiller `style.css` pour écrire la contrainte
  « voici les classes qui existent, n'en invente aucune », puis une relecture les a
  vérifiées une par une ;
- les assemblages récurrents qui ne sont pas des classes — carte joueur, cadre hachuré
  de remplacement, ligne de match — ont été recopiés à la main d'un fichier à l'autre,
  faute de référence à consulter.

Le risque structurel du site est là : des styles inline qui divergent parce que
personne ne sait ce qui existe déjà.

## Décision

Une page galerie, `site/design-system.html`, présentant le design system dans son
état réel : les fondations, les 58 classes de `style.css`, et les cinq assemblages
qui ne vivent qu'en styles inline.

C'est un **outil de travail**, pas une page du site : catalogue dense, chaque
composant rendu à côté de son code copiable, peu de prose.

Un contrôle automatisé interdit à la galerie de mentir sur la partie qu'il peut
vérifier.

## Objectifs

- Savoir en un coup d'œil quelles classes existent, et à quoi elles ressemblent.
- Pouvoir copier le markup exact d'un composant sans aller le chercher dans une page.
- Vérifier le comportement responsive de tout le design system sur **une seule page**
  au lieu de huit.
- Rendre impossible l'ajout d'une classe CSS non documentée.

## Non-objectifs

- Les gabarits à l'échelle de la page (héros, en-tête de site, pied de page) : ils se
  jugent en contexte réel, pas dans un catalogue.
- Le thème sombre, l'export de jetons, la génération automatique des exemples.
- L'extraction des assemblages inline en fonctions partagées de `site.js`. Voir
  « Ce que cette page prépare » en fin de document.

## Architecture

| Fichier | Rôle |
| --- | --- |
| `site/design-system.html` (nouveau) | La galerie : contenu, charpente et script, en un seul fichier |
| `scripts/check-design-system.mjs` (nouveau) | Contrôle de dérive entre `style.css` et la galerie |
| `package.json` (modifié) | `npm run check` enchaîne les deux contrôles |

`site/assets/style.css` **n'est pas modifié**. `site/assets/site.js` non plus.

### Accès

La page est absente de `NAV` dans `site/assets/site.js`, comme le sont déjà
`equipe.html`, `adhesion.html`, `contact.html` et `mentions-legales.html`. On y accède
en saisissant son URL.

Elle porte `<meta name="robots" content="noindex">`.

**« Non liée » ne veut pas dire privée** : la page est servie publiquement et
quiconque connaît l'URL la voit. Le `noindex` évite seulement qu'elle remonte dans
les moteurs de recherche si un lien apparaît quelque part. Rien de confidentiel ne
doit y figurer — ce n'est de toute façon pas le cas, une charte graphique n'a rien
d'un secret.

### Chrome de la page

La galerie **n'utilise pas l'en-tête ni le pied partagés** rendus par `site.js`.
C'est un outil : l'en-tête collant du site mangerait la hauteur utile d'un catalogue
qu'on parcourt en continu, et il fait partie de ce qui est explicitement hors
périmètre.

Elle charge en revanche **la vraie feuille de style et les vraies polices** —
`assets/style.css` et le lien Google Fonts identiques à ceux des autres pages. C'est
la condition pour que la galerie montre le design system réel et non une copie : ce
qu'on y voit est ce que le site produit.

À la place du chrome partagé, la page porte son propre en-tête minimal (titre, une
phrase rappelant qu'elle n'est pas liée depuis le site et qu'un contrôle automatisé
en garantit la complétude) et un **sommaire latéral collant** qui saute d'une famille
à l'autre.

Conséquence assumée : la galerie a besoin de sa propre mise en page — la grille
rendu/code, les blocs de code, le sommaire. Elle embarque donc un `<style>` qui lui
est propre, dans le fichier. **Toutes ses règles sont préfixées `gal-`.**

Le préfixe `ds-` est proscrit : `ds-list` existe déjà dans `style.css` et `ds` est la
classe des tableaux et des citations. Un préfixe partagé produirait exactement la
collision que la page est censée aider à éviter.

## Le bloc élémentaire

C'est l'unité qui se répète une cinquantaine de fois ; elle décide de la qualité de
l'ensemble.

Chaque composant est écrit **une seule fois**, dans un `<template>`. Au chargement,
le script de la page en injecte le contenu à deux endroits : la zone de rendu, et —
échappé — le bloc de code.

```html
<article class="gal-item" data-classes="btn btn-primary">
  <h3>.btn.btn-primary</h3>
  <p>Action principale. Une seule par écran.</p>
  <template><a class="btn btn-primary">Adhérer</a></template>
  <div class="gal-demo"></div>
  <pre class="gal-code"></pre>
  <button class="gal-copy">Copier</button>
</article>
```

Écrire le markup deux fois — une fois pour l'afficher, une fois pour le montrer —
serait la première source de mensonge de la page. Ici le code affiché **est** le code
rendu, par construction.

Le bouton « Copier » utilise `navigator.clipboard.writeText`. S'il est indisponible
(contexte non sécurisé), le bouton n'est pas affiché ; le code reste sélectionnable
à la main.

## Contenu

### Fondations

- **Couleurs** : les 6 jetons de `:root` (`--encre`, `--creme`, `--sable`, `--taupe`,
  `--lin`, `--erreur`) avec pastille, nom du jeton, valeur hexadécimale et usage en
  une ligne. Plus le motif `--hachures`, montré en aplat.
- **Typographies** : les 3 familles (Barlow Condensed 900/700, Archivo, DM Mono) avec
  un échantillon réel et leur rôle. Les tailles fluides sont montrées telles quelles :
  la valeur `clamp()` est affichée à côté de l'échantillon.
- **Paliers responsive** : 1100 px et 880 px, énoncés une fois avec ce qui change à
  chacun. Ce sont les valeurs réelles de `style.css` — pas 720 px, valeur erronée qui
  a circulé dans un plan précédent.

### Classes

Les 58 classes de `style.css` se répartissent en deux ensembles.

**47 classes documentées**, regroupées par famille :

| Famille | Classes |
| --- | --- |
| Typographie utilitaire | `mono`, `eyebrow`, `muted` |
| Structure | `section`, `section-head`, `pad`, `crumb` |
| Fonds | `dark`, `on-sable` |
| Boutons | `btn`, `btn-primary`, `btn-secondary`, `btn-inverse`, `btn-outline-light` |
| Badges | `badge`, `badge-outline`, `badge-muted` |
| Cartes | `card`, `link`, `shadow`, `ph`, `body` |
| Grilles | `cols-2`, `cols-3`, `cols-4`, `duo`, `split`, `band`, `row`, `stats` |
| Matchs | `match-row`, `match-list`, `match-band`, `score` |
| Compte à rebours | `countdown` |
| Tableaux | `ds`, `hl`, `table-wrap` |
| Formulaires | `field` |
| Accordéon | `acc`, `acc-body` |
| Listes | `ds-list` |
| Réseaux sociaux | `social`, `frame`, `lbl` |
| Frise | `timeline` |
| Séparateur | `sep` |

Les sous-parties (`body`, `acc-body`, `frame`, `lbl`, `ph`, `link`, `shadow`, `hl`)
n'ont pas d'entrée à elles : elles sont déclarées dans le `data-classes` de leur
composant parent, où elles sont visibles à l'œuvre.

`ds` porte deux composants distincts, `table.ds` et `blockquote.ds`. Les deux entrées
la déclarent ; c'est correct et le contrôle l'accepte.

**11 classes exclues**, chacune pour une raison inscrite dans la liste d'exclusions
du script :

| Classe | Raison |
| --- | --- |
| `site-header`, `site-footer`, `topbar`, `burger`, `logo` | Chrome de page, hors périmètre |
| `hero`, `lines` | Gabarit de page, hors périmètre |
| `active`, `open` | États de la navigation, indissociables du chrome de page |
| `wrap` | Conteneur de largeur, sans rendu propre |
| `grid` | Utilitaire nu (`display:grid;gap:0`), jamais employé sans styles inline |

47 + 11 = 58. Le compte doit tomber juste ; c'est ce que le contrôle vérifie.

### Motifs composites

Cinq assemblages qui n'existent qu'en styles inline dans les pages. Ils sont montrés
et copiables au même titre que les classes, avec la mention du fichier dont ils sont
tirés :

| Motif | Source |
| --- | --- |
| Carte joueur — portrait 3/4, numéro en surimpression, nom, poste | `site/equipe.html` |
| Cadre hachuré de remplacement — `[ photo à venir ]`, en 16/9 et en 3/4 | `site/equipe.html`, `site/equipes.html` |
| Ligne de match à venir — date, rencontre, badge domicile/extérieur | `matchRow()` dans `site/assets/site.js` |
| Ligne de résultat — date, rencontre, score et badge groupés en une cellule | `site/equipe.html` |
| Carte d'index cliquable — photo, nom, catégorie, créneau, prochain match | `site/equipes.html` |

Chaque motif porte un avertissement d'une ligne quand il y a un piège à connaître.
Pour les deux lignes de match : `.match-row` est une grille à 3 colonnes, un
quatrième enfant direct fait déborder la ligne sur petit écran.

Ces motifs ne sont **pas** couverts par le contrôle automatisé. Leur présence repose
sur la discipline, et le document le dit franchement plutôt que de laisser croire à
une garantie.

## Le garde-fou

`scripts/check-design-system.mjs`, sur le modèle de `scripts/check-content.mjs` :
Node seul, aucune dépendance, messages en français, sortie non nulle en cas d'échec.

**Ce qu'il fait :**

1. Lit `site/assets/style.css`, retire les commentaires, isole la partie sélecteur de
   chaque règle (le texte avant `{`), en extrait les noms de classe. Les règles `@`
   (media queries) sont traversées, pas traitées comme des sélecteurs.
2. Lit `site/design-system.html` et collecte tous les attributs `data-classes`. Leur
   valeur est une liste de noms de classe **sans point**, séparés par des espaces —
   même forme que ce que produit l'extracteur, pour qu'aucune normalisation ne soit
   nécessaire.
3. Signale les deux dérives :
   - une classe définie dans `style.css`, ni documentée ni exclue → *« classe non
     documentée »* ;
   - une classe déclarée dans la galerie mais absente de `style.css` → *« entrée
     obsolète »*.
4. Signale aussi une exclusion devenue inutile : une classe de la liste d'exclusions
   qui n'existe plus dans `style.css`. Sans quoi la liste se fossilise.

**Ce qu'il ne fait pas :** vérifier que l'exemple rendu est juste, ni couvrir les
motifs composites. Il garantit la complétude de l'inventaire, rien de plus. C'est
déjà ce qui manque aujourd'hui.

### Branchement

`package.json` :

```json
"check": "node scripts/check-content.mjs && node scripts/check-design-system.mjs"
```

La commande `npm run check` reste le point d'entrée unique, donc **la commande de
compilation Cloudflare (`npm run check && npx wrangler deploy`) n'a pas à changer.**

Un déploiement est donc bloqué par une classe non documentée. C'est délibéré et sans
risque pour le club : **seul un développeur peut ajouter une classe CSS.** Le bureau
ne peut pas déclencher cet échec depuis Decap. Ce qui bloque, c'est un oubli de
documentation — précisément ce qu'on veut rendre impossible.

## Cas limites

- **Classe utilisée dans une page mais absente de `style.css`** — hors périmètre de ce
  contrôle, qui compare le CSS à la galerie, pas les pages au CSS.
- **`data-classes` vide ou absent sur une entrée** — l'entrée est ignorée par le
  contrôle. Elle reste affichée : c'est le cas normal des motifs composites, qui n'ont
  pas de classe propre.
- **Deux entrées déclarant la même classe** — accepté, c'est le cas de `ds`.
- **`navigator.clipboard` indisponible** — le bouton « Copier » n'est pas affiché.

## Vérifications

Le dépôt n'a pas de suite de tests automatisés et ce design n'en introduit pas. Les
vérifications sont :

- `npm run check` passe, et signale bien une classe retirée de la galerie si on en
  retire une pour essayer ;
- la page se charge sans erreur console, et chaque entrée affiche à la fois un rendu
  et un bloc de code non vide ;
- le nombre d'entrées documentées plus le nombre d'exclusions égale le nombre de
  classes de `style.css` ;
- rendu correct à 360 px, 880 px et 1100 px — c'est aussi le premier usage réel de la
  page ;
- `site/assets/style.css` et `site/assets/site.js` sont inchangés ;
- aucune règle du `<style>` de la page ne porte un nom sans le préfixe `gal-`, et
  aucune ne redéfinit une classe du design system.

## Risques

| Risque | Parade |
| --- | --- |
| La galerie diverge du CSS | Le contrôle bloque la compilation |
| La liste d'exclusions grossit jusqu'à vider le contrôle de son sens | Chaque exclusion porte sa raison ; une exclusion obsolète est signalée |
| Les motifs composites ne sont pas mis à jour | Aucune parade automatique ; le document l'annonce clairement |
| La page devient trop longue à parcourir | Sommaire latéral collant, familles regroupées |

## Ce que cette page prépare

Documenter la carte joueur comme un motif à copier-coller, c'est **acter une
duplication plutôt que la supprimer**. La revue du chantier précédent a relevé que
`site/index.html` conserve une troisième copie de la ligne de match, alors que
`matchRow()` existe dans `site.js`.

Le remède serait d'extraire ces assemblages en fonctions partagées, comme cela a été
fait pour `matchRow()`. C'est un chantier distinct, plus intrusif, et la galerie est
justement l'inventaire qui permettra de décider lesquels le méritent. Il n'est pas
traité ici.
