# Repères pour Claude

Le vrai manuel du projet est [`site/README.md`](site/README.md) : structure, déploiement
Cloudflare, Decap, formats d'images, notes de charte. **À lire avant toute modification
de fond.** Ce fichier-ci ne le répète pas ; il note ce qui ne s'y trouve pas et ce qui se
paie cher quand on l'ignore.

Ce qui reste a faire vit dans [`docs/backlog.md`](docs/backlog.md), classe par valeur
et date. Le tenir a jour fait partie du travail : on y retire plus qu on y ajoute.

## Le projet en trois phrases

Site statique du C.A. Brive Corrèze Volley. Aucune étape de build : des fichiers
HTML/CSS/JS servis tels quels par un worker Cloudflare. Le contenu vit dans
`site/content/*.json` et s'édite depuis Decap, jamais à la main sauf raison précise.

## Conventions d'écriture

- **Fins de ligne CRLF** dans tous les fichiers suivis, à l'exception de `wrangler.jsonc`.
  Un script de correction qui écrit du LF produit un diff qui touche chaque ligne du
  fichier. Normaliser en `\n` pour travailler, puis réécrire en `\r\n`.
- **Commentaires de code en français, sans accents** (`entree`, `equipe`, `perimetre`).
  Le contenu HTML, les libellés et les chaînes affichées gardent leurs accents.
- Les commentaires disent **pourquoi**, pas quoi. Ceux du dépôt expliquent une contrainte
  ou un piège ; ne pas en ajouter qui paraphrasent la ligne suivante.
- **Messages de commit** : `Domaine : sujet en français sans accents`, puis un corps qui
  expose le raisonnement et les impasses écartées.

## Le seul garde-fou

`npm run check` — il n'y a ni framework de test, ni compilation. Cette vérification est intégrée
à la commande de build du worker Cloudflare, donc bloquante en production.

Elle vérifie la cohérence de `site/content/*.json`, **et** que chaque classe de
`site/assets/style.css` est documentée dans la galerie `site/design-system.html`. Ajouter
une classe sans l'y documenter fait échouer la compilation. Une classe de chrome de page
se déclare plutôt dans la liste `EXCLUES` de `scripts/check-design-system.mjs`, avec sa
raison — une classe réutilisable dans une page mérite, elle, une vraie entrée de galerie.

## Architecture

- `site/assets/site.js` porte tout le chrome partagé : `renderChrome()` construit l'en-tête,
  le bandeau réseaux et le pied de page, injectés dans les `<div id="header">` /
  `<div id="footer">` que chaque page déclare.
- Les pages sont du HTML statique. Celles qui ont besoin de contenu définissent
  `window.__pageInit`, appelé après `renderChrome()`.
- `teamUrl()` est le seul endroit qui fabrique l'URL d'une page équipe.
- Les adresses réglables (lien classement FFVB) portent `data-reglage="<cle>"` et sont
  ajustées depuis `settings.json` après chargement ; l'URL écrite dans le code n'est
  qu'un secours.

## Decap

**Toute publication depuis Decap commite sur `main`**, y compris lorsqu'on saisit depuis
une préversion. C'est l'explication habituelle de « j'ai saisi et rien ne change » :
regarder l'onglet Builds du worker avant de chercher un bug.

## Vérifier de ses yeux

Pas d'affirmation visuelle sans capture. Le site s'observe en local :

```bash
cd site && python -m http.server 8791 &
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
TMP="C:/Users/.../Temp"   # chemin Windows : Edge ne resout pas le /tmp de Git Bash
"$EDGE" --headless=new --disable-gpu --no-first-run --user-data-dir="$TMP/edge" \
  --virtual-time-budget=5000 --window-size=1200,560 \
  --screenshot="$TMP/vue.png" "http://127.0.0.1:8791/index.html"
```

- `--force-device-scale-factor=8` avec une petite fenêtre pour juger un détail de 2 px.
  C'est ainsi qu'on a vu qu'un filet crème permanent ouvrait une fente sous le
  `border-bottom` encre que porte chaque `.section`.
- `--dump-dom` pour vérifier une structure plutôt que la deviner : ordre des nœuds,
  attribut appliqué, doublon éventuel.
- Le pied de page est loin en bas des pages longues : monter une page d'aperçu jetable
  qui isole la jonction à examiner, puis la supprimer.
- Avant de conclure à une régression, capturer aussi l'état d'avant (`git stash`).
- Arrêter le serveur ensuite : `pkill` n'existe pas dans ce Git Bash, passer par
  PowerShell (`Get-CimInstance Win32_Process` filtré sur le port, puis `Stop-Process`).

## Flux git

Une branche par sujet, jamais de commit direct sur `main`. Ensuite `gh pr create`, puis
`gh pr merge --merge --delete-branch` : l'historique garde des commits de fusion, pas de
squash. Le merge sur `main` déclenche le déploiement en production — demander avant.
