# Anciennes URLs du site officiel — inventaire et redirections

**Date de capture** : 2026-08-13
**État** : inventaire figé, table arbitrée le 2026-08-13 ; trois cibles restent à créer

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
| Pages éditoriales | 27 | L'essentiel — trois seulement sont des résidus, voir la correction plus bas |
| `/player/…` | 63 | Fiches individuelles de licenciés |
| `/team/…` | 28 | Surtout des clubs **adverses** créés par SportsPress |
| `/venue/…` | 20 | Archives de gymnases générées automatiquement |
| `/position/`, `/season/`, `/league/`, `/list/`, `/role/` | 26 | Archives de taxonomie, sans contenu propre |
| `/staff/`, `/event/`, `/medias/`, `/author/` | 5 | Idem |
| `/donations/…` | 2 | Contenu de démonstration du thème, **en anglais** |

### Correction du 2026-08-13 : deux URLs laides ne sont pas des pages mortes

Une première lecture avait rangé `/page-d-exemple/` et `/typography/` parmi les restes de
WordPress. **C'était faux.** L'URL est un résidu, la page ne l'est pas : toutes deux sont
liées depuis l'accueil de l'ancien site et portent du contenu réel.

| URL | Titre réel | Contenu |
| --- | --- | --- |
| `/page-d-exemple/` | **Nos partenaires** | 19 logos de partenaires |
| `/typography/` | **Le Gymnase** | Description du Rollinat : mis en service en 1982, 4 vestiaires, aire de 40 × 20 m, disciplines accueillies |

Ne restent donc réellement sans valeur que `/page-1/` et les deux `/donations/…`, du
contenu de démonstration en anglais.

La leçon vaut pour la suite : sur un WordPress, **le nom de l'URL ne dit rien du contenu
de la page**. Ce qui les départage est de savoir si le site les lie encore.

### Ce que la navigation de l'ancien site révèle

Interroger les liens de son accueil sépare le vivant du mort mieux que n'importe quelle
heuristique. Quatre pages **ne sont plus liées par l'ancien site lui-même** :
`/ufolep/`, `/prenational-feminin/`, `/pre-national-feminine/` et `/m21-moins/`. Aucune ne
porte de paragraphe de contenu. Le club les avait déjà abandonnées.

Deux le sont, au contraire, et sans équivalent sur le nouveau site au moment de
l'inventaire : `/volley-sante/` et `/page-d-exemple/` (« Nos partenaires »).

L'ancien site porte aussi un doublon de son fait : `/prenational-feminin/` et
`/pre-national-feminine/` coexistent, aucune des deux n'étant plus liée.

## Ce qu'on redirige, et ce qu'on laisse mourir

**On ne redirige pas 171 URLs.** Rediriger en masse vers l'accueil est contre-productif :
Google traite une redirection vers une page sans rapport comme une « soft 404 », ne
transmet rien, et on récolte un signal de qualité dégradé pour l'ensemble du domaine.

Vingt-sept URLs méritent une 301. Les cent quarante-quatre autres méritent un **410
Gone** — qui dit « cette page a existé et n'existera plus », et que Google traite plus
vite qu'un 404.

### Les cibles s'écrivent sans extension

Vérifié en production : `/contact.html` répond **307** vers `/contact`, et
`/equipe.html?e=volley-sante` vers `/equipe?e=volley-sante`, qui répond 200. Cloudflare
sert les pages sans extension.

Une 301 qui viserait la forme `.html` produirait donc une chaîne **301 → 307 → 200** :
un saut de plus à chaque visite, et un signal dilué pour les moteurs. Toutes les cibles
ci-dessous sont écrites dans leur forme canonique, sans extension.

### Table de correspondance

Arbitrages du bureau rendus le 2026-08-13.

| Ancienne URL | Nouvelle | Remarque |
| --- | --- | --- |
| `/` | `/` | |
| `/lhistoire-du-club/` | `/club` | |
| `/constitution-du-bureau/` | `/club` | |
| `/contacts/` | `/contact` | |
| `/devenir-benevole/` | `/contact` | le formulaire a un sujet « Bénévolat » |
| `/inscription/` | `/adhesion` | |
| `/seances-dessais/` | `/adhesion` | sujet « Inscription / essai gratuit » |
| `/guide-des-parents/` | `/infos` | |
| `/informations-importantes/` | `/infos` | |
| `/proces-verbaux/` | `/infos` | |
| `/mentions-legales/` | `/mentions-legales` | |
| `/boutique-2/` | `/boutique` | |
| `/sur-les-reseaux/` | `/` | le bandeau réseaux vit en pied de page |
| `/senior-masculin-n3/` | `/equipe?e=n3-masculin` | |
| `/regional-1-masculin/` | `/equipe?e=r1-masculin` | |
| `/regional-1-feminine/` | `/equipe?e=r1-feminin` | |
| `/ecole-de-volley/` | `/equipe?e=ecole-de-volley` | |
| `/baby-kids-volley/` | `/equipe?e=ecole-de-volley` | fusionnées dans la nouvelle fiche |
| `/volley-sante/` | `/equipe?e=volley-sante` | **fiche créée le 2026-08-13** |
| `/ufolep/` | `/equipe?e=ufolep` | fiche à créer par le bureau ; la 301 n'est écrite qu'une fois le slug confirmé |
| `/prenational-feminin/` | `/equipes` | abandonnée par l'ancien site lui-même, aucune fiche prévue |
| `/pre-national-feminine/` | `/equipes` | doublon de la précédente |
| `/m21-moins/` | `/equipes` | abandonnée ; « Jeunes » s'arrête à M18, la fiche ne couvrirait pas M21 |
| `/page-d-exemple/` | page Partenaires | **à créer** — voir la conception en cours |
| `/devenir-partenaire/` | page Partenaires | idem ; la page portera l'appel à devenir partenaire |
| `/typography/` | fiche du gymnase Rollinat | **à créer** — une page par site, sur le modèle des équipes |

Vingt-sept URLs, dont trois attendent que les pages cibles existent.

### Ce que ces arbitrages ont révélé

Le travail de redirection ne servait pas qu'à préserver l'ancienneté : il a montré ce que
le nouveau site n'avait pas encore. Trois manques, dont deux invisibles jusque-là parce
qu'aucune page n'en parlait.

1. **Volley Santé** existait sur l'ancien site avec son créneau, son tarif et son
   référent, et n'apparaissait sur le nouveau que comme nom d'un PDF de certificat
   médical. Fiche créée depuis.
2. **Les partenaires** n'avaient qu'une option dans le menu déroulant du formulaire de
   contact. Une page dédiée est à concevoir, avec sa collection Decap.
3. **Les gymnases** n'avaient qu'une carte dans `gymnases.json`, là où l'ancien site
   décrivait le Rollinat en détail. Chaque site aura sa propre page, sur le modèle des
   fiches d'équipes, avec description et blocs libres de photos.

L'écart entre les cinq équipes de `teams.json` et les huit annoncées par `club.json`
était le symptôme visible de ce décalage. Le bureau complète les fiches manquantes au
fur et à mesure ; l'Ufolep est la prochaine.

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

La table est arbitrée. Trois dépendances subsistent avant de l'écrire dans `worker.js` :

1. **La fiche Ufolep**, que le bureau crée. La 301 de `/ufolep/` n'est posée qu'une fois
   son slug connu — écrire `?e=ufolep` au jugé donnerait une redirection vers une fiche
   introuvable, pire que pas de redirection du tout.
2. **La page Partenaires**, cible de `/page-d-exemple/` et `/devenir-partenaire/`.
3. **La fiche du gymnase Rollinat**, cible de `/typography/`.

Puis, indépendamment :

1. Demander au bureau s'il a accès à la Search Console de l'ancien site : le rapport
   « Pages » dirait lesquelles de ces 171 URLs reçoivent réellement des visites, et le
   rapport « Liens » quels sites extérieurs pointent vers le club. Utile pour vérifier
   qu'aucune URL à fort trafic ne tombe dans les 410.
2. Écrire la table dans `worker.js` et vérifier chaque 301 au `curl -I`, en confirmant
   qu'aucune ne produit de chaîne de redirections.
