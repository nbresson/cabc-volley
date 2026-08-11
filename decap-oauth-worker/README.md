# Connecteur OAuth GitHub pour Decap CMS

Ce petit worker Cloudflare (gratuit) permet aux membres du bureau de se connecter
à l'interface d'administration (`/admin/`) avec leur compte GitHub.
Il remplace le service d'authentification de Netlify, en cours de fermeture.

À faire **une seule fois**, après la mise en ligne du site (étapes 1 et 2 du
`site/README.md`). Comptez 10 minutes.

## Étape A — Créer le worker sur Cloudflare

1. Tableau de bord Cloudflare → **Workers & Pages** → **Create** → **Create Worker**.
2. Nommez-le `cabc-decap-oauth` → **Deploy** (le code d'exemple sera remplacé juste après).
3. Cliquez **Edit code**, effacez tout, collez le contenu de [`worker.js`](worker.js) → **Deploy**.
4. Notez l'URL du worker, du type :
   `https://cabc-decap-oauth.VOTRE-COMPTE.workers.dev`

## Étape B — Créer l'application OAuth sur GitHub

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Remplissez :
   - **Application name** : `CABC Volley — admin du site`
   - **Homepage URL** : `https://www.cabc-volley.fr` (ou l'URL `.pages.dev` en attendant)
   - **Authorization callback URL** : l'URL du worker suivie de `/callback`, ex.
     `https://cabc-decap-oauth.VOTRE-COMPTE.workers.dev/callback`
3. **Register application**, puis notez le **Client ID** et générez un
   **Client Secret** (bouton *Generate a new client secret* — copiez-le tout de
   suite, il ne sera plus affiché).

## Étape C — Renseigner les identifiants dans le worker

1. Retour sur le worker Cloudflare → **Settings** → **Variables and Secrets**.
2. Ajoutez deux variables :
   - `GITHUB_CLIENT_ID` — type **Text** — le Client ID de l'étape B.
   - `GITHUB_CLIENT_SECRET` — type **Secret** — le Client Secret de l'étape B.
3. **Deploy** / enregistrez.

## Étape D — Brancher le site

Dans `site/admin/config.yml`, remplacez le `base_url` d'exemple par l'URL réelle
du worker :

```yaml
backend:
  name: github
  repo: votre-compte/cabc-volley
  branch: main
  base_url: https://cabc-decap-oauth.VOTRE-COMPTE.workers.dev
  auth_endpoint: /auth
```

Poussez la modification sur GitHub : le site se redéploie, et la page
`https://VOTRE-SITE/admin/` propose alors « Login with GitHub ».

## Vérifier que tout marche

1. Ouvrez `/admin/` → **Login with GitHub** → une popup GitHub s'ouvre.
2. Autorisez l'application : la popup se ferme et le CMS s'affiche.
3. En cas d'erreur, vérifiez dans l'ordre : l'URL de callback GitHub (étape B),
   les deux variables (étape C), le `base_url` (étape D).

Rappel : chaque éditeur doit être **collaborateur** du dépôt GitHub
(Settings → Collaborators du dépôt) pour que la connexion aboutisse.

## Alternative en ligne de commande

Si vous avez Node.js : `npx wrangler deploy` depuis ce dossier déploie le worker
(`wrangler.toml` est fourni), puis `npx wrangler secret put GITHUB_CLIENT_SECRET`.
