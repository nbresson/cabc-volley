# Site CABC Volley — Github + Cloudflare Pages + Decap CMS

Site statique du C.A. Brive Corrèze Volley, design system « Héritage ».
Aucune étape de build : ce sont des fichiers HTML/CSS/JS, le contenu vit dans `site/content/*.json` et s'édite via Decap CMS.

## Structure
```
site/
  index.html club.html equipes.html equipe.html calendrier.html
  actualites.html article.html adhesion.html boutique.html contact.html 404.html
  horaires.html tarifs.html infos.html acces.html faq.html  ← les cinq pages du menu Infos
  design-system.html  ← galerie du design system, non liée depuis aucun menu,
                         s'atteint en saisissant son adresse
  assets/      style.css · site.js · logo.png · uploads/ (images du CMS) · documents/ (fichiers du CMS)
  content/     settings/news/matches/classement/teams/products/gymnases/club/legal/infos
               /tarifs/faq/partenaires .json                ← contenu éditable
  admin/       index.html · config.yml                     ← interface Decap CMS
```
`equipe.html` est le gabarit de la page d'une équipe (accessible via l'identifiant
URL de l'équipe, construit par `teamUrl()` dans `assets/site.js`) : infos pratiques,
prochains matchs, derniers résultats, classement et effectif.

## 1 · Le dépôt GitHub
Le code vit sur <https://github.com/nbresson/cabc-volley>, branche `main`.
Chaque publication depuis Decap y crée un commit.

Après une modification de `site/content/*.json`, `npm run check` vérifie que les
fichiers restent cohérents (identifiants d'équipe uniques et bien formés, matchs
rattachés à une équipe existante). À lancer avant de committer une modification
manuelle de ces fichiers.

`npm run check` vérifie aussi désormais que la galerie `design-system.html`
documente bien toutes les classes de `style.css` : ajouter une classe dans la
feuille de style sans la documenter dans la galerie fait échouer la compilation.
Seul un développeur peut déclencher cet échec — le bureau, qui publie depuis
Decap, ne touche jamais à `style.css` et ne peut pas le provoquer.

Une classe de chrome de page (en-tête, pied de page, gabarit) n'a pas sa place
dans la galerie : elle se déclare plutôt dans la liste `EXCLUES` de
`scripts/check-design-system.mjs`, avec sa raison. Si le contrôle échoue sur
une classe de ce genre, c'est là qu'il faut l'ajouter, pas dans `design-system.html`.

## 2 · Déploiement sur Cloudflare Workers
Le site est servi par un worker `cabc-volley` en « static assets » : le dossier `site/`
est publié tel quel, d'après [`wrangler.jsonc`](../wrangler.jsonc) à la racine du projet.
En ligne sur `https://cabc-volley.nkobrs21.workers.dev`.

- **Automatique** : le worker est relié au dépôt (Settings → Builds). Chaque commit
  déclenche une compilation, qui doit exécuter la commande indiquée juste en dessous.
- **À la main**, si une compilation échoue : `npx wrangler deploy` depuis la racine
  (`npx wrangler login` la première fois).

> La commande de compilation du worker (Settings → Builds → Build command) doit être
> `npm run check && npx wrangler deploy`, et pas seulement `npx wrangler deploy`. Toute
> publication depuis Decap crée un commit, donc c'est le seul moment où `npm run check`
> peut réellement protéger le site : si un fichier de contenu est invalide (identifiant
> d'équipe en double, par exemple), la compilation s'arrête avant de publier quoi que ce
> soit, et l'ancienne version reste en ligne à la place d'une page cassée.

<!-- -->

> La version de wrangler est **figée dans `package.json`** (et `package-lock.json`).
> Ce n'est pas une précaution théorique : la version 4.121.0 est sortie avec une
> dépendance introuvable, ce qui a fait échouer les compilations jusqu'à ce que la
> version soit épinglée. Ne relâchez cette contrainte qu'après avoir testé une
> nouvelle version en local.

Si la page en ligne ne reflète pas une modification faite dans Decap, le réflexe est
d'ouvrir l'onglet **Builds** du worker : le commit y figure-t-il, et la compilation
est-elle en vert ?

## 3 · Brancher le domaine (plus tard)
Sans débrancher l'ancien site tout de suite :
- Testez d'abord sur l'URL `.workers.dev`, ou sur un sous-domaine `nouveau.cabc-volley.fr`.
- Quand tout est prêt : page du worker → **Domains & Routes** → ajoutez `www.cabc-volley.fr`
  (le domaine doit être géré par Cloudflare, ou créez un CNAME vers le `.workers.dev`).

**Le jour de la bascule, deux choses ne se corrigent pas toutes seules.**

1. Les balises `og:image` de toutes les pages désignent
   `https://cabc-volley.nkobrs21.workers.dev/assets/partage.png`. Une adresse absolue est
   obligatoire — les réseaux sociaux ne savent pas résoudre un chemin relatif — mais elle
   devra pointer sur le domaine définitif, sans quoi la vignette de partage cessera de
   s'afficher. Un `grep -rl workers.dev site/` les trouve toutes.
2. Les redirections depuis l'ancien site, décrites dans
   [`docs/superpowers/specs/2026-08-13-anciennes-urls-inventaire.md`](../docs/superpowers/specs/2026-08-13-anciennes-urls-inventaire.md),
   sont déjà écrites dans `worker.js` : rien à faire, mais tout à vérifier au `curl -I`.

**Le sitemap et le robots.txt, eux, n'attendent rien.** `site/sitemap.xml` porte déjà
les onze adresses publiques en `www.cabc-volley.fr`, et `worker.js` sert un
`robots.txt` différent selon l'hôte — barrage tant qu'on est sur `.workers.dev`, vrai
fichier ensuite, avec l'adresse du sitemap. Les deux deviennent exacts le jour de la
bascule sans qu'on y touche. C'est aussi pourquoi il ne faut **pas** créer de
`site/robots.txt` : le worker intercepte cette adresse avant les fichiers statiques, un
fichier ne serait jamais servi.

Le barrage d'indexation, lui, tombe seul : il se juge sur l'hôte.

## 4 · Activer Decap CMS (édition par le bureau)
L'admin est sur `https://VOTRE-SITE/admin/`. Authentification GitHub — au choix :

**Option A — Cloudflare (recommandée, 2-3 éditeurs)**
Le service d'auth de Netlify ferme : le connecteur OAuth est **fourni dans ce projet**,
dossier `decap-oauth-worker/` (worker + guide pas à pas dans son README).
En résumé : créer le worker sur Cloudflare (copier-coller de `worker.js`), créer
l'OAuth App GitHub, renseigner Client ID/Secret dans le worker, puis remplacer le
`base_url` d'exemple dans `config.yml` par l'URL réelle du worker.

**Option B — tester en local avant tout**
Dans `config.yml`, décommentez `local_backend: true`, puis en local :
`npx decap-server` dans un terminal + ouvrez `admin/` via un petit serveur (`npx serve site`).

### Donner l'accès aux éditeurs
Ajoutez les 2-3 personnes comme **collaborateurs** du dépôt GitHub (Settings → Collaborators).
Chacune se connecte sur `/admin/` avec son compte GitHub. Toute modification = un commit → redéploiement automatique en ~30 s.

## 5 · Ce que le bureau peut modifier (menus Decap)
- **Actualités** — articles (titre, date, catégorie, chapô, contenu Markdown, image, « à la une »)
- **Matchs & résultats** — matchs à venir et scores ; « match à la une » = celui du compte à rebours d'accueil. Le **numéro de match** est facultatif et n'apparaît pas sur le site : c'est le code de la rencontre chez la fédération, qui servira à rapprocher les résultats officiels. Deux matchs ne peuvent pas porter le même, la vérification est bloquante
- **Classement** — un tableau par poule, chacun rattaché à une équipe du club : titre, « à la une » (le tableau repris sur l'accueil, un seul), phrase sous le tableau, puis les lignes (club, J, V, D, points) ; le rang n'est pas saisi, c'est l'ordre des lignes
- **Équipes & effectifs** — équipes et joueurs/joueuses (numéro, poste, photo) ; chaque équipe a aussi son identifiant URL, son groupe, sa photo d'équipe, son lien de classement FFVB, son nom chez la FFVB si deux équipes du club jouent la même poule et son bloc infos pratiques (pour les équipes sans calendrier de matchs)
- **Boutique** — produits (nom, prix, statut dispo/nouveau/épuisé, photo)
- **Réglages** — email, téléphone, permanence, **lien classement FFVB**, adresses Instagram et Facebook (laissées vides, celles inscrites dans le code sont conservées)
- **Gymnases** — secteur affiché et salles (nom, étiquette, adresse, ce qui s'y passe, accès, lien itinéraire, photo)
- **Page Club** — bandeau d'accueil et chiffres clés, notre histoire (dates clés), le bureau (membres, encart appel aux bénévoles), la vie du club (photos)
- **Mentions légales** — date de mise à jour, éditeur du site, hébergeur, articles
- **Documents** — blocs de texte libre, chacun avec ses documents téléversés (PDF de préférence) ou ses liens externes. Le fichier reste `infos.json` et la page reste `/infos` : trois redirections de l'ancien site y mènent
- **Partenaires** — chapô de la page, partenaires (nom, logo, groupe, mot, adresse) et bloc « Devenir partenaire ». Le chapô sert deux fois : en haut de la page, et sous le titre du bandeau de logos posé sur toutes les pages
- **Page Adhésion** — bandeau d'accueil, les trois étapes et l'en-tête du formulaire. Le numéro des étapes vient de leur rang. Le surtitre du bandeau (« — Saison 2026–2027 ») est le **seul endroit où la saison se saisit** : la page Tarifs le relit
- **Tarifs & licences** — les montants (montant + ce qu'il couvre), puis trois blocs facultatifs : ce que la licence comprend, le Pass'Sport, le paiement en plusieurs fois. Laissés vides, ils n'apparaissent pas sur la page
- **FAQ** — titre de la section et questions/réponses de la page Questions fréquentes

Le classement affiché sur la page Calendrier est saisi à la main, dans l'espace « Classement » ;
les calendriers et classements détaillés restent sur la FFVB (bouton présent sur la page Calendrier).

### Formats d'images recommandés
Chaque emplacement a un cadre de proportions fixes : l'image est recadrée **au centre**
pour le remplir. En respectant ces tailles, aucun recadrage ne surprend.

| Emplacement            | Proportions | Taille conseillée |
|------------------------|-------------|-------------------|
| Actualités (photo)     | 16/9        | 1600 × 900 px     |
| Boutique               | 1/1         | 1200 × 1200 px    |
| Portraits joueur·ses   | 3/4         | 900 × 1200 px     |
| Gymnases               | 16/10       | 1600 × 1000 px    |
| Photo d'équipe         | 16/9        | 1600 × 900 px     |

Dans tous les cas : **JPEG** (ou WebP) et **moins de 400 Ko**. Le PNG est réservé aux
logos et aux images à fond transparent — sur une photo il pèse cinq à dix fois plus
lourd sans rien apporter. Chaque image reste définitivement dans l'historique GitHub.

**Affiches carrées ou verticales** (annonce de match, visuel Instagram, flyer) : ne les
redimensionnez pas. Dans le menu Actualités, réglez « Affichage de l'image » sur
**Affiche** — l'image est alors montrée en entier, sans jamais être coupée, centrée sur
le fond hachuré. Réservez « Photo » aux vraies photographies en paysage.

### Deux images ne viennent pas de Decap
`assets/partage.png` (la vignette qui s'affiche quand on partage un lien du site) et
`assets/carte-gymnases.webp` (la carte de la page Accès) sont **fabriquées**, pas
photographiées. Leurs sources sont dans [`scripts/images/`](../scripts/images/) :
lancez un serveur local **à la racine du dépôt** — elles chargent les polices du site
par un chemin relatif — ouvrez la page, et capturez la fenêtre à la taille exacte,
1200 × 630 pour la vignette, 1200 × 515 pour la carte.

Les positions des gymnases dans `carte.html` se relèvent sur le champ `!3d!4d` de
l'URL Google Maps dépliée, **jamais sur le `@` qui la précède** : ce dernier donne le
centre de la carte, que le panneau latéral décale d'environ 200 m vers l'ouest.

## 6 · Formulaires (adhésion & contact)
Ils sont branchés sur **Web3Forms** (gratuit, 250 envois/mois, sans compte). La clé
d'accès du club est **déjà en place** dans `adhesion.html` et `contact.html` (champ
caché `access_key`, une fois par fichier). Pour la changer :
<https://web3forms.com> → « Create your Access Key » → entrez l'email qui recevra les
messages.
Cette clé n'est pas un secret : elle peut rester visible dans le code. Un anti-spam
(champ piège `botcheck`) est déjà en place ; en cas d'échec d'envoi, un message
d'erreur s'affiche sous le bouton.

## Notes design
Palette verrouillée (encre/crème/sable/taupe/lin + brique erreurs), pas d'arrondis, pas de dégradés,
bordures 2 px, ombres dures. Polices : Barlow Condensed / Archivo / DM Mono, auto-hébergées en WOFF2 dans
`assets/fonts/` — aucune requête vers Google Fonts, donc rien à déclarer de ce côté.
