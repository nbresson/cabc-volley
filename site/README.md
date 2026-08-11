# Site CABC Volley — Github + Cloudflare Pages + Decap CMS

Site statique du C.A. Brive Corrèze Volley, design system « Héritage ».
Aucune étape de build : ce sont des fichiers HTML/CSS/JS, le contenu vit dans `site/content/*.json` et s'édite via Decap CMS.

## Structure
```
site/
  index.html club.html equipes.html calendrier.html
  actualites.html article.html adhesion.html boutique.html contact.html 404.html
  assets/      style.css · site.js · logo.png · uploads/ (images du CMS)
  content/     settings/news/matches/teams/products .json  ← contenu éditable
  admin/       index.html · config.yml                     ← interface Decap CMS
```

## 1 · Mettre le code sur GitHub
1. Créez un dépôt (ex. `cabc-volley`), branche `main`.
2. Téléversez le contenu de ce projet (glisser-déposer sur github.com fonctionne).
3. Dans `site/admin/config.yml`, remplacez `VOTRE-COMPTE/cabc-volley` par `votre-compte/cabc-volley`.

## 2 · Déployer sur Cloudflare Pages
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → choisissez le dépôt.
2. Réglages de build :
   - **Framework preset** : None
   - **Build command** : (laisser vide)
   - **Build output directory** : `site`
3. Save and Deploy. Le site est en ligne sur `https://cabc-volley.pages.dev`.

## 3 · Brancher le domaine (plus tard)
Sans débrancher l'ancien site tout de suite :
- Testez d'abord sur l'URL `.pages.dev`, ou sur un sous-domaine `nouveau.cabc-volley.fr`.
- Quand tout est prêt : Cloudflare Pages → Custom domains → ajoutez `www.cabc-volley.fr`
  (le domaine doit être géré par Cloudflare, ou créez un CNAME vers le `.pages.dev`).

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
- **Équipes & effectifs** — équipes et joueurs/joueuses (numéro, poste, photo)
- **Boutique** — produits (nom, prix, statut dispo/nouveau/épuisé, photo)
- **Réglages** — email, téléphone, permanence, **lien classement FFVB**

Les classements/calendriers détaillés restent sur la FFVB (bouton présent sur la page Calendrier) ;
seuls les matchs mis en avant sont saisis à la main.

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
