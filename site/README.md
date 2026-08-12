# Site CABC Volley — Github + Cloudflare Pages + Decap CMS

Site statique du C.A. Brive Corrèze Volley, design system « Héritage ».
Aucune étape de build : ce sont des fichiers HTML/CSS/JS, le contenu vit dans `site/content/*.json` et s'édite via Decap CMS.

## Structure
```
site/
  index.html club.html equipes.html equipe.html calendrier.html
  actualites.html article.html adhesion.html boutique.html contact.html 404.html
  assets/      style.css · site.js · logo.png · uploads/ (images du CMS)
  content/     settings/news/matches/teams/products .json  ← contenu éditable
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
- **Matchs & résultats** — matchs à venir et scores ; « match à la une » = celui du compte à rebours d'accueil
- **Équipes & effectifs** — équipes et joueurs/joueuses (numéro, poste, photo) ; chaque équipe a aussi son identifiant URL, son groupe, sa photo d'équipe, son lien de classement FFVB et son bloc infos pratiques (pour les équipes sans calendrier de matchs)
- **Boutique** — produits (nom, prix, statut dispo/nouveau/épuisé, photo)
- **Réglages** — email, téléphone, permanence, **lien classement FFVB**

Les classements/calendriers détaillés restent sur la FFVB (bouton présent sur la page Calendrier) ;
seuls les matchs mis en avant sont saisis à la main.

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

## 6 · Formulaires (adhésion & contact)
Ils sont branchés sur **Web3Forms** (gratuit, 250 envois/mois, sans compte). Il ne
manque que la clé d'accès :
1. Allez sur <https://web3forms.com> → « Create your Access Key » → entrez l'email
   du club (celui qui recevra les messages) → la clé arrive par email.
2. Dans `adhesion.html` et `contact.html`, remplacez `VOTRE-CLE-WEB3FORMS` par cette
   clé (champ caché `access_key`, présent une fois dans chaque fichier).
Cette clé n'est pas un secret : elle peut rester visible dans le code. Un anti-spam
(champ piège `botcheck`) est déjà en place ; en cas d'échec d'envoi, un message
d'erreur s'affiche sous le bouton.

## Notes design
Palette verrouillée (encre/crème/sable/taupe/lin + brique erreurs), pas d'arrondis, pas de dégradés,
bordures 2 px, ombres dures. Polices : Barlow Condensed / Archivo / DM Mono (chargées via Google Fonts ;
pour le RGPD strict, auto-hébergez-les dans `assets/`).
