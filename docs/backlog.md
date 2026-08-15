# Backlog

Ce qui reste à faire sur le site, par ordre de valeur — pas par ordre d'arrivée.
Y figurer n'engage à rien : une ligne peut rester en bas indéfiniment, ou être
supprimée. On y retire plus qu'on y ajoute.

Dernière revue : **15 août 2026**. Section 2 vidée le même jour.

---

## 1 · Ce qui bloque la bascule vers `www.cabc-volley.fr`

### Socle SEO — canonical et JSON-LD
Dernier lot technique. Les descriptions, l'Open Graph, la vignette de partage, le
sitemap et le robots.txt sont faits. Restent :

- une balise `<link rel="canonical">` par page,
- un bloc JSON-LD `SportsOrganization` sur l'accueil, `SportsEvent` sur les matchs.

### Le jour J, deux gestes
Les `og:image` des seize pages pointent sur `.workers.dev` (`grep -rl workers.dev
site/`). Le sitemap et le robots.txt, eux, n'attendent rien — voir
[`site/README.md`](../site/README.md).

---

## 2 · Finitions

### Navigation entre fiches d'équipe
En pied de fiche, à côté de « Toutes les équipes » : ← équipe précédente / suivante →.
L'ordre est celui de `teams.json`, déjà l'ordre éditorial du bureau. Les équipes sans
slug sont sautées.

### Timeline du Club — la période dite deux fois
La colonne affiche « 1960 » quand le texte commence par « Années 1960–1983 — ».

**Attention au format :** sur huit entrées, six portent un préfixe de période, mais
sous **trois formes différentes** — `Après-guerre 39/45 —`, `Années 1960–1983 —`, et
`1987–1997 —`. La huitième (2026) n'en a aucun. Une règle qui ne reconnaîtrait que
`AAAA–AAAA —` n'en attraperait que cinq sur six.

Rien à changer côté Decap : le bureau continue d'écrire comme aujourd'hui, c'est
l'affichage qui remonte la période dans la grande colonne.

### L'entraîneur n'est pas un numéro de maillot
Jean-Pierre Delost porte `num: "E"`, affiché en grand sur sa photo comme un numéro.
Proposition : quand `num` n'est pas numérique, remplacer le grand chiffre par un badge
« Staff » en DM Mono sous le nom, et classer ces cartes en fin de grille. Aucun
changement de données — c'est le seul cas aujourd'hui.

---

## 3 · Pas du code — une chasse aux photos

Le design attend déjà ces images ; il n'y a rien à développer.

| Ce qui manque | État au 15 août |
| --- | --- |
| Portraits du bureau | **3 sur 3** affichent `[ portrait ]` |
| Photo d'archive de l'histoire | champ vide, le placeholder est en ligne |
| Effectif National 3 masculin | 5 inscrits, **4 sans photo** |
| Effectifs des six autres équipes | **aucun inscrit** — R1 féminin, R1 masculin, Jeunes, École de volley, Volley Santé, UFOLEP |
| Galeries des quatre gymnases | vides |
| Description du gymnase d'Arsonval | absente |
| « Mot » des partenaires | aucun des 17 n'en a |
| Accroche de la carte « Devenir partenaire » | absente |

---

## 4 · Décisions en attente

**Description du gymnase Rollinat** — trois reformulations proposées le 13 août, aucune
retenue. Le texte officiel actuel manque de charme.

---

## Fait, pour mémoire

Barrage d'indexation · redirections des anciennes URL · images en WebP · polices
auto-hébergées · page Partenaires et fiches de gymnase · formulaires Web3Forms ·
carte des gymnases et vignette de partage · page Adhésion entièrement sous Decap ·
mini-classement · favicon et sitemap.

**15 août** — les trois défauts de la section 2 : `og:title` doublé sur trois pages
(et `titrePage()` qui le fait désormais suivre `document.title`), cadres à logo de
hauteurs inégales, six libellés YAML sans guillemets.
