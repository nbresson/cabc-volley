# Référencement moteurs et IA — design

**Date** : 2026-08-13
**État** : validé, prêt pour la planification

## Le problème

Le site est en ligne sur `https://cabc-volley.nkobrs21.workers.dev` et ne remplace pas
encore le site officiel du club. Il ne porte aujourd'hui **aucun élément de
référencement** : ni `robots.txt`, ni `sitemap.xml`, ni `meta description`, ni
`canonical`, ni Open Graph, ni JSON-LD. Seuls les `<title>` existent, et ils sont bons.

Cela crée deux risques de sens opposé.

**Maintenant** — rien n'empêche Google d'indexer le brouillon. Deux sites du club se
disputeraient les résultats, des parents atterriraient sur des créneaux non validés, et
l'URL `.workers.dev` continuerait de ressortir longtemps après la bascule. Les robots
d'IA ingéreraient du contenu provisoire qu'ils resserviraient tel quel.

**Le jour de la bascule** — tout est à construire. Et le piège symétrique : un barrage
posé aujourd'hui et oublié ferait naître le site officiel invisible.

### Ce que les robots lisent réellement

Le contenu est construit en JavaScript depuis `site/content/*.json`. Google exécute le
JS ; les robots d'IA, non. Trois conséquences mesurées sur le dépôt :

- `contact.html` affiche en dur `contact@cabc-volley.fr` et `05 55 00 00 00`, deux
  valeurs bouchons remplacées au chargement par celles de `settings.json`. Un robot sans
  JS ne lit pas *rien* : il lit un **faux email et un faux numéro**.
- `renderChrome()` construit toute la navigation, si bien que le HTML servi contient
  entre 0 et 6 liens internes selon la page. `adhesion.html`, `club.html` et
  `equipe.html` en ont zéro : sans JS, le site est un tas de pages orphelines.
- Les actualités et les fiches d'équipes (`article.html?slug=`, `equipe.html?e=`) sont
  entièrement construites côté client, donc invisibles aux robots d'IA.

## Décisions

| Question | Décision | Raison |
| --- | --- | --- |
| Périmètre | Barrage livré tout de suite, socle écrit maintenant mais sans effet tant qu'on est sur le brouillon | Évite à la fois l'indexation parasite et la précipitation du jour J |
| Mécanisme du barrage | Un worker qui juge sur l'hôte | Le barrage tombe seul quand le vrai domaine arrive : rien à se rappeler |
| Ampleur du socle | Socle statique écrit à la main | Le nom, l'adresse et le contact valent l'essentiel du trafic ; les actus sont périssables |
| Domaine cible | `https://www.cabc-volley.fr` | Ce qu'annonce la section 3 du README |
| Vignette de partage | Une image 1200×630 à composer d'après la charte | Le club poste sur Facebook et Instagram, où la vignette décide du clic |

## Lot 1 — Le barrage

### `worker.js` à la racine

Le projet passe de « static assets » pur à un worker minimal devant les assets.
`wrangler.jsonc` gagne `main`, `assets.binding` et `assets.run_worker_first: true`
— trois clés vérifiées présentes dans le schéma de wrangler 4.120.1.

Le worker ne fait que deux choses :

1. Si le chemin est `/robots.txt`, il sert la version qui convient à l'hôte.
2. Sinon il délègue à `env.ASSETS.fetch()`, et n'ajoute `X-Robots-Tag: noindex, nofollow`
   que si l'hôte se termine par `.workers.dev`.

`not_found_handling: "404-page"` continue de s'appliquer, puisqu'il est porté par
`env.ASSETS.fetch()`.

**Contrepartie assumée** : chaque requête passe désormais par le worker au lieu d'être
servie comme asset statique, et compte donc dans le quota Workers. À 100 000 requêtes
par jour offertes, la question ne se pose pas pour un club de volley — mais elle est
notée ici plutôt que découverte.

### Les deux `robots.txt`

Le fichier du brouillon **autorise l'exploration**. C'est contre-intuitif et c'est le
cœur du dispositif : un `Disallow: /` empêcherait Google de lire le `noindex`, et l'URL
pourrait alors être listée sans avoir jamais été explorée. Le `Disallow` est réservé aux
robots d'IA, qui ignorent l'en-tête mais respectent le fichier :

    GPTBot · ClaudeBot · Claude-Web · PerplexityBot · CCBot · Google-Extended ·
    Applebot-Extended · Bytespider · meta-externalagent · Amazonbot

Le fichier du vrai site les accueille au contraire tous, et ne garde que deux exclusions
permanentes : `/admin/` (Decap) et `/design-system.html`. Il déclare le sitemap.

`design-system.html` reçoit en plus un `<meta name="robots" content="noindex">`, pour
que son exclusion ne dépende pas d'un seul fichier.

## Lot 2 — Le socle

Rien à « activer » : c'est du HTML statique, simplement masqué par le `noindex` tant
qu'on est sur le brouillon. Le jour où le vrai domaine pointe sur le worker, il se met à
compter de lui-même.

### Par page — description, canonical, Open Graph

Douze pages reçoivent dans leur `<head>` une `meta description` rédigée une par une, un
`canonical` absolu sur `www.cabc-volley.fr`, un jeu Open Graph complet (`og:title`,
`og:description`, `og:image`, `og:url`, `og:type`, `og:locale`) et `twitter:card` :
`index`, `club`, `equipes`, `equipe`, `calendrier`, `actualites`, `article`, `infos`,
`adhesion`, `boutique`, `contact`, `mentions-legales`.

Deux pages restent dehors. `design-system.html` n'a rien à faire dans un index, et
`404.html` n'a pas de contenu propre à décrire.

Parmi les douze, deux exceptions : `article.html` et `equipe.html` ne portent **pas** de
`canonical`. Ces pages se distinguent par un paramètre d'URL ; un canonical statique
ferait pointer tous les articles vers la même adresse et les effacerait les uns les
autres. Dix pages portent donc un `canonical`.

Le `canonical` désigne `www.cabc-volley.fr` alors même que le site est servi depuis
`workers.dev`. C'est volontaire : il dit « la référence est là-bas, pas ici ».

### Un seul bloc JSON-LD

Dans `index.html` uniquement, un `SportsOrganization` : nom, `alternateName`, sport,
`foundingDate` 1946, URL, logo, email et téléphone réels, adresse postale du gymnase
Rollinat reprise de `legal.json`, et `sameAs` vers Facebook et Instagram. C'est ce bloc
que lisent Google et les IA pour répondre à « club de volley à Brive ».

Il n'énumère pas les équipes : cette liste vit dans `teams.json` et dériverait.

### Le HTML dit vrai sans JavaScript

Deux retouches chirurgicales, sans aucun effet visuel :

- `contact.html` porte les vraies coordonnées à la place des bouchons. Le JS les réécrit
  à l'identique depuis `settings.json`.
- Le `<div id="header">` de chaque page contient une liste de liens en dur vers les
  pages du site. `renderChrome()` écrase ce contenu au chargement, donc l'humain ne voit
  rien changer — mais le graphe de liens existe enfin pour qui ne rend pas le JS.

Ce n'est pas du cloaking : ce sont les mêmes liens que ceux que le JS construit, servis
en repli.

### `site/sitemap.xml`

Statique, dix URLs absolues, sans `lastmod` — qui dériverait au premier oubli. Il exclut
`admin/`, `design-system.html`, `404.html`, ainsi que `article.html` et `equipe.html`,
qui ne veulent rien dire sans leur paramètre.

### La vignette de partage

Une image 1200×630 composée d'après la charte du site (fond encre, logo, typographie
Barlow Condensed), placée dans `site/assets/`. Elle sert d'`og:image` à toutes les pages.

## Le garde-fou

`scripts/check-content.mjs` gagne une vérification : l'email et le téléphone écrits en
dur dans `contact.html` et dans le JSON-LD de `index.html` doivent être identiques à
ceux de `settings.json`.

C'est la seule dérive qui rend le site **faux** plutôt que muet — un visiteur sans JS, ou
une IA, publierait une adresse qui n'existe pas. Les autres écarts possibles (une équipe
ajoutée, une actualité) ne dégradent que la couverture, et ne méritent pas un test.

Aucune classe CSS n'est ajoutée : `check-design-system.mjs` n'est pas concerné.

## Écarté

- **`llms.txt`** — aucun crawler majeur ne l'honore aujourd'hui, et il redirait ce que
  le JSON-LD dit déjà mieux.
- **Mesure d'audience** — `legal.json` promet noir sur blanc qu'il n'y en a aucune.
- **Prérendu ou génération depuis les JSON** — décision explicite : les actualités et
  les fiches d'équipes restent invisibles aux IA. C'est le contenu le moins recherché et
  le plus périssable, pour un coût architectural qui aurait fait sortir le projet de sa
  règle « aucune étape de build ».
- **Un `_headers` en plus du worker** — deux endroits qui décident de la même chose, et
  celui qu'on oublie est celui qui mord.

## Le jour de la bascule

Le barrage tombe seul, mais quatre gestes restent hors du dépôt. Ils sont ajoutés à la
section 3 du README, « Brancher le domaine » :

1. Brancher `www.cabc-volley.fr` sur le worker (Domains & Routes).
2. Vérifier au `curl -I` que le `X-Robots-Tag` a disparu, et que `/robots.txt` sert bien
   la version définitive.
3. Déclarer le site à Google Search Console et à Bing Webmaster Tools, y soumettre le
   sitemap.
4. **Poser les redirections 301 depuis les anciennes URLs du site officiel.** Sans
   elles, le club repart de zéro et perd l'ancienneté accumulée par l'ancien site.

## Fichiers touchés

| Fichier | Nature |
| --- | --- |
| `worker.js` | nouveau |
| `wrangler.jsonc` | `main`, `assets.binding`, `assets.run_worker_first` — reste en LF |
| `site/*.html` (14 pages) | liens de repli dans `#header` ; `<head>` enrichi sur douze d'entre elles |
| `site/index.html` | en plus : bloc JSON-LD |
| `site/contact.html` | en plus : coordonnées réelles au lieu des bouchons |
| `site/design-system.html` | en plus : `meta robots noindex` |
| `site/sitemap.xml` | nouveau |
| `site/assets/og.jpg` | nouveau, 1200×630 |
| `scripts/check-content.mjs` | vérification des coordonnées |
| `site/README.md` | section 3 enrichie, section référencement ajoutée |

Tous les fichiers suivis sont en CRLF, à l'exception de `wrangler.jsonc`.

## Comment on saura que c'est bon

- `npm run check` passe.
- `curl -sI https://cabc-volley.nkobrs21.workers.dev/` renvoie
  `X-Robots-Tag: noindex, nofollow`.
- `curl -s https://cabc-volley.nkobrs21.workers.dev/robots.txt` sert la version brouillon,
  avec les robots d'IA en `Disallow` et les moteurs autorisés.
- En local sous `wrangler dev`, une requête portant un en-tête `Host` non-`workers.dev`
  ne reçoit **aucun** `X-Robots-Tag` — c'est la preuve que le barrage se lèvera seul.
- Le HTML servi de `contact.html`, lu sans exécuter le JS, contient
  `cabc-volley@wanadoo.fr` et `05 55 74 38 80`.
- Le HTML servi de `adhesion.html`, lu sans exécuter le JS, contient des liens vers les
  autres pages.
- Le JSON-LD de l'accueil passe le validateur schema.org.
