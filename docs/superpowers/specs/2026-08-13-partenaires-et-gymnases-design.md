# Page Partenaires et fiches de gymnase — design

**Date** : 2026-08-13
**État** : validé

## D'où vient ce besoin

Le travail sur les redirections a montré ce que le nouveau site n'avait pas encore. Deux
pages de l'ancien site, liées depuis son accueil, n'avaient aucune cible :

- **« Nos partenaires »** (`/page-d-exemple/`) et **« Devenir Partenaire »**
  (`/devenir-partenaire/`). Le nouveau site n'en parle que par une option du menu
  déroulant du formulaire de contact.
- **« Le Gymnase »** (`/typography/`), qui décrit le Rollinat avec un détail que
  `gymnases.json` n'a pas.

Voir [l'inventaire des anciennes URLs](2026-08-13-anciennes-urls-inventaire.md).

## Le motif, déjà présent dans le dépôt

Les équipes ont un motif que ces deux sujets reprennent ou écartent en connaissance de
cause : une liste dans un JSON édité depuis Decap, une carte cliquable, une fiche
`?e=slug`, et `teamUrl()` comme **unique** fabricant d'URL.

Les gymnases le reprennent tel quel. Les partenaires ne l'utilisent pas : un partenaire
n'a pas de fiche sur notre site, son lien va vers le sien.

---

## Partenaires

### La collection

`site/content/partenaires.json`, collection Decap de type `files` comme toutes les
autres. Deux clés de premier niveau :

- `devenir` — objet : `titre`, `texte`, `bouton`, `lien`. Le texte de recrutement.
  Même forme que le bloc `infos` des équipes, pour que le bureau retrouve ses repères.
- `items` — liste. Par partenaire : `nom`, `logo`, `lien` (site du partenaire, facultatif),
  `groupe` (select : Institutions / Entreprises), `mot` (une phrase, facultative).

### La page

`site/partenaires.html`. Titre, chapeau, puis les partenaires groupés — Institutions
d'abord, Entreprises ensuite — chacun avec son logo, son nom, son mot et un lien vers son
site quand il est renseigné. Puis le bloc « Devenir partenaire » et son bouton.

Elle **n'ajoute pas** de neuvième entrée à l'en-tête. Elle se déclare enfant du Club dans
la table `PARENT` de `site.js`, mécanisme qui existe déjà pour `equipe.html` et
`article.html`, et gagne un lien depuis la page Club.

### Le mur de logos

Un bandeau de logos posé sur **toutes** les pages, entre le contenu et le bandeau
réseaux, chaque logo menant à `/partenaires`. Il est construit par `renderChrome()`, au
même endroit et de la même façon que le bandeau réseaux.

**Fond clair, et ce n'est pas un choix esthétique.** Le bandeau réseaux ne porte son
filet crème que lorsqu'une section sombre le précède — règle
`main:has(>.dark:last-child)+.socialbar`, déjà cassée une fois en enveloppant le contenu
dans un `<main>`. Un mur à fond clair s'intercale sans rien casser : sombre → clair →
sombre, la transition se voit sans filet.

**La règle du filet reste malgré tout.** Un club sans partenaire saisi n'affiche pas de
mur, et le bandeau réseaux se retrouve alors de nouveau collé à une section sombre.

Les logos du mur sont en `loading="lazy"` : ils sont sous le pli sur toutes les pages.

---

## Gymnases

### Les champs ajoutés

`gymnases.json` garde ses champs actuels et en gagne trois :

- `slug` — identifiant d'URL, mêmes règles que celui des équipes. **Facultatif** : une
  salle sans slug reste affichée mais n'est pas cliquable.
- `description` — texte libre, rendu par `mdToHtml()` qui existe déjà.
- `blocs` — liste de `{titre, texte, photo}`, rendus en alternance image à gauche puis à
  droite, comme la page Club le fait pour son histoire.

### La fiche

`site/gymnase.html`, lue par `?g=slug`. En-tête avec fil d'Ariane, nom, étiquette,
adresse, grande photo et bouton d'itinéraire ; puis la description ; puis les blocs.

`gymnaseUrl(slug)` est ajoutée à `site.js` juste à côté de `teamUrl()`, et pour la même
raison : un seul endroit fabrique l'URL, de sorte qu'un passage ultérieur à des URLs
propres ne touche qu'une ligne.

### Les cartes deviennent cliquables

`salleCard()` enveloppe sa carte dans un lien **quand le slug existe**, exactement comme
la carte d'équipe. Les deux pages qui l'appellent — `club.html` pour « Nos
infrastructures », `contact.html` pour « Nos gymnases » — en profitent sans être
modifiées.

---

## Ce qui est écarté, et pourquoi

**Le croisement automatique équipes ↔ gymnase.** Le croquis validé le montrait ; il est
retiré. Il reposerait sur la lecture du champ `creneau`, texte libre qui a déjà dérivé :
les salles s'appellent « Gymnase Saint-Germain » quand les créneaux disent tantôt
« Saint-Germain », tantôt « Saint Germain ». La correction du gymnase Lavoisier, le même
jour, montre que cette donnée n'est pas assez sûre pour fabriquer des liens. Le rétablir
proprement demanderait un champ explicite sur chaque équipe — une saisie de plus pour le
bureau, à proposer séparément.

**Une page liste des gymnases.** `club.html` et `contact.html` les présentent déjà. Une
troisième liste n'apporterait rien.

**Des niveaux de partenariat** (or, argent, bronze). L'ancien site n'en avait pas, et
hiérarchiser publiquement des sponsors est une décision de bureau, pas de développeur.

---

## Migration du contenu existant

L'ancien site est la source : ce qu'il affiche aujourd'hui est ce que le club affiche
aujourd'hui.

**Dix-sept logos de partenaires** sont repris de `/page-d-exemple/`. Deux des dix-neuf
images de cette page sont écartées : `LOGO_VOLLEY_jaune.png` et `logovolley-2016…png`
figurent aussi sur la page « Le Gymnase », ce sont les logos du club, pas des
partenaires.

Quinze partenaires sont nommés avec certitude d'après leurs fichiers. **Deux ne le sont
pas** — `Capture-1.png` et `logo-3-e1537793720537-1-300x300.png` — et sont laissés au
bureau plutôt que nommés au jugé : afficher un mauvais nom de sponsor est pire que de
l'omettre.

Le bureau doit de toute façon **vérifier la liste** : un partenaire qui ne l'est plus
n'a rien à faire sur la nouvelle page.

**La description du Rollinat** est reprise de `/typography/`, mais réécrite. L'originale
annonce « une surface totale de 33365m² » puis « une aire d'évolution de 40.00m sur
20.00m (33365m²) » — le même nombre pour deux mesures différentes, ce qui est
impossible — et se termine par une virgule orpheline. Seuls les faits vérifiables sont
conservés : mise en service en 1982, quatre vestiaires, aire de 40 × 20 mètres,
disciplines accueillies.

---

## Ce que cela change ailleurs

- **Trois redirections trouvent leur cible** : `/page-d-exemple/` et
  `/devenir-partenaire/` vers `/partenaires`, `/typography/` vers `/gymnase?g=rollinat`.
- **Le contrôle d'existence des images** ajouté à `check-content.mjs` couvre
  automatiquement les logos et les photos de blocs : il parcourt tout `content/*.json`
  sans énumérer les champs. Rien à y ajouter.
- **Le design system** doit documenter la ou les classes du mur de logos, sinon
  `npm run check` fait échouer la compilation.
- **Decap** gagne une collection « Partenaires » et trois champs dans « Gymnases ».

## Comment on saura que c'est bon

- `npm run check` passe, y compris la vérification de la galerie du design system.
- `/partenaires` liste les partenaires par groupe et affiche le bloc « Devenir
  partenaire ».
- Le mur de logos apparaît sur toutes les pages, chaque logo mène à `/partenaires`.
- Sur `index`, `404` et `mentions-legales` — les trois pages qui finissent par une
  section sombre — la jonction reste correcte, vérifiée au style calculé avec un profil
  de navigateur **neuf** de chaque côté.
- Les cartes de gymnase sont cliquables sur `club` et `contact`, et une salle sans slug
  ne l'est pas.
- `/gymnase?g=rollinat` affiche la description et les blocs.
- Aucune classe CSS non documentée.
