# Anciennes URLs du site officiel — inventaire et redirections

**Date de capture** : 2026-08-13
**État** : inventaire figé, table de correspondance à valider

Complément au [design du référencement](2026-08-13-referencement-design.md), point 4 du
jour de la bascule.

## Pourquoi c'était urgent, et pourquoi ça ne l'est plus

Le travail de correspondance peut attendre. Le **relevé**, non : il se lit sur le site
officiel, et disparaît avec lui. Il est fait, figé dans
[`docs/anciennes-urls-site-officiel.txt`](../../anciennes-urls-site-officiel.txt), et la
suite peut désormais se faire à froid, même après la bascule.

## Ce qu'on a trouvé

`https://www.cabc-volley.fr` est un WordPress équipé du plugin SportsPress. Son
`robots.txt` déclare un `wp-sitemap.xml`, dont l'index renvoie vers quatorze
sous-sitemaps. Total : **171 URLs**.

Elles n'ont pas la même valeur, et c'est le point important :

| Famille | Nombre | Valeur |
| --- | --- | --- |
| Pages éditoriales | 27 | L'essentiel — mais quatre sont des restes de thème |
| `/player/…` | 63 | Fiches individuelles de licenciés |
| `/team/…` | 28 | Surtout des clubs **adverses** créés par SportsPress |
| `/venue/…` | 20 | Archives de gymnases générées automatiquement |
| `/position/`, `/season/`, `/league/`, `/list/`, `/role/` | 26 | Archives de taxonomie, sans contenu propre |
| `/staff/`, `/event/`, `/medias/`, `/author/` | 5 | Idem |
| `/donations/…` | 2 | Contenu de démonstration du thème, **en anglais** |

Quatre pages n'auraient jamais dû être publiques : `/page-d-exemple/` et `/page-1/`
(pages d'exemple de WordPress), `/typography/` (démo du thème) et
`/donations/a-new-prosthesis-for-the-future-champion/`.

L'ancien site porte aussi un doublon de son fait : `/prenational-feminin/` et
`/pre-national-feminine/` coexistent.

## Ce qu'on redirige, et ce qu'on laisse mourir

**On ne redirige pas 171 URLs.** Rediriger en masse vers l'accueil est contre-productif :
Google traite une redirection vers une page sans rapport comme une « soft 404 », ne
transmet rien, et on récolte un signal de qualité dégradé pour l'ensemble du domaine.

Vingt-quatre URLs méritent une 301. Les cent quarante-sept autres méritent un **410
Gone** — qui dit « cette page a existé et n'existera plus », et que Google traite plus
vite qu'un 404.

### Table de correspondance proposée

| Ancienne URL | Nouvelle | Remarque |
| --- | --- | --- |
| `/` | `/` | |
| `/lhistoire-du-club/` | `/club.html` | |
| `/constitution-du-bureau/` | `/club.html` | |
| `/contacts/` | `/contact.html` | |
| `/devenir-benevole/` | `/contact.html` | le formulaire a un sujet « Bénévolat » |
| `/devenir-partenaire/` | `/contact.html` | sujet « Partenariat / sponsoring » |
| `/inscription/` | `/adhesion.html` | |
| `/seances-dessais/` | `/adhesion.html` | sujet « Inscription / essai gratuit » |
| `/guide-des-parents/` | `/infos.html` | |
| `/informations-importantes/` | `/infos.html` | |
| `/proces-verbaux/` | `/infos.html` | |
| `/mentions-legales/` | `/mentions-legales.html` | |
| `/boutique-2/` | `/boutique.html` | |
| `/sur-les-reseaux/` | `/` | le bandeau réseaux vit en pied de page |
| `/senior-masculin-n3/` | `/equipe.html?e=n3-masculin` | |
| `/regional-1-masculin/` | `/equipe.html?e=r1-masculin` | |
| `/regional-1-feminine/` | `/equipe.html?e=r1-feminin` | |
| `/ecole-de-volley/` | `/equipe.html?e=ecole-de-volley` | |
| `/baby-kids-volley/` | `/equipe.html?e=ecole-de-volley` | fusionnées dans la nouvelle fiche |
| `/m21-moins/` | `/equipe.html?e=jeunes` | |
| `/prenational-feminin/` | `/equipes.html` | pas d'équipe correspondante aujourd'hui |
| `/pre-national-feminine/` | `/equipes.html` | doublon de la précédente |
| `/ufolep/` | `/equipes.html` | pas de fiche dédiée |
| `/volley-sante/` | `/equipes.html` | pas de fiche dédiée |

Cinq entrées demandent une décision du bureau plutôt qu'un arbitrage technique : le
pré-national féminin, l'Ufolep et le volley santé existaient comme pages sur l'ancien
site et n'ont pas d'équivalent dans `teams.json`, qui ne déclare que cinq équipes quand
`club.json` en annonce huit. Les envoyer vers `/equipes.html` est un pis-aller ; leur
donner une vraie fiche serait mieux.

## Les soixante-trois fiches de licenciés

L'ancien site publie 63 pages `/player/…` et une archive `/author/…`. Ce sont des
données personnelles, indexées aujourd'hui, et le nouveau site n'a délibérément pas
d'équivalent.

Elles ne doivent être redirigées nulle part : un 410 est la bonne réponse. La bascule
les fait donc disparaître, ce qui va dans le sens de ce que promettent déjà les mentions
légales sur le droit à l'image et les mineurs. Google en gardera trace quelques
semaines ; l'outil de suppression de la Search Console accélère le retrait si le bureau
le souhaite.

## Où vivront les redirections

Dans `worker.js`, qui existe désormais : une table `ancienne → nouvelle`, consultée
avant `env.ASSETS.fetch()`, et un 410 par défaut pour les préfixes SportsPress
(`/player/`, `/team/`, `/venue/`, `/position/`, `/season/`, `/league/`, `/list/`,
`/role/`, `/staff/`, `/event/`, `/donations/`, `/author/`).

Le fichier `_redirects` de Cloudflare ferait le même travail de façon déclarative, mais
son articulation avec `run_worker_first: true` reste à vérifier — et une seule autorité
sur le routage vaut mieux que deux.

## Reste à faire, quand le bureau le voudra

1. Valider la table ci-dessus, en particulier les cinq entrées d'équipes sans équivalent.
2. Demander au bureau s'il a accès à la Search Console de l'ancien site : le rapport
   « Pages » dirait lesquelles de ces 171 URLs reçoivent réellement des visites, et le
   rapport « Liens » quels sites extérieurs pointent vers le club. C'est ce qui
   permettrait de trancher pour de bon plutôt qu'au jugé.
3. Écrire la table dans `worker.js` et vérifier chaque 301 au `curl -I`.
