# Barrage d'indexation, allègement des images et polices auto-hébergées

> **Pour les agents :** COMPÉTENCE REQUISE — utiliser superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans pour dérouler ce plan tâche par tâche.
> Les étapes sont des cases à cocher (`- [ ]`).

**But :** rendre le brouillon invisible des moteurs et des IA tant qu'il ne remplace pas
le site officiel, puis alléger le site de 12 Mo d'images hors norme et supprimer le seul
transfert de données imposé au visiteur.

**Architecture :** le projet passe de « static assets » pur à un worker minimal placé
devant les assets, qui juge sur l'hôte. Aucune étape de build n'est introduite : les
images sont converties une fois pour toutes par ffmpeg, les polices sont téléchargées
une fois et versionnées.

**Outils :** Cloudflare Workers (wrangler 4.120.1, épinglé), ffmpeg avec libwebp,
Node pour `npm run check`. Aucune dépendance nouvelle.

Ce plan met en œuvre le lot 1 de
[`2026-08-13-referencement-design.md`](../specs/2026-08-13-referencement-design.md),
puis les points 2, 3, 4 et 5 de l'audit d'améliorations. Le lot 2 du design — le socle
SEO complet — fera l'objet d'un plan distinct.

## Contraintes globales

- **CRLF** dans tous les fichiers suivis, **sauf `wrangler.jsonc`** qui reste en LF.
  Écrire d'abord, puis normaliser ; ne jamais laisser un outil réécrire tout le fichier
  en LF.
- **Commentaires de code en français sans accents ni apostrophes** (`c est`, `l hote`,
  `entree`). Le contenu servi — HTML, libellés, texte du `robots.txt` — garde ses accents.
- **Aucune classe CSS nouvelle** sans entrée dans `site/design-system.html`, sinon
  `npm run check` échoue et bloque la compilation en production.
- **`npm run check` doit passer** à la fin de chaque tâche. C'est le seul garde-fou, et
  il est intégré à la commande de build du worker.
- **Messages de commit** : `Domaine : sujet en francais sans accents`, puis un corps qui
  expose le raisonnement et les impasses écartées.
- **Une branche par tâche ou par groupe cohérent**, jamais de commit direct sur `main`.
  Le merge sur `main` déclenche la production — demander avant.
- Les fichiers de `site/content/` sont normalement édités depuis Decap. Ce plan y touche
  à la main pour deux raisons précises et nommées : un renommage de fichiers images, et
  une phrase des mentions légales qui deviendrait fausse. Faire `git pull --rebase`
  avant de pousser, le bureau publiant en parallèle.

---

## Tâche 1 — Le barrage d'indexation

**Fichiers :**
- Créer : `worker.js`
- Modifier : `wrangler.jsonc`

**Interfaces :**
- Produit : `estBrouillon(hote)` et la table `ROBOTS_IA`, que la tâche des redirections
  (plan ultérieur) réutilisera dans le même fichier.

- [ ] **Étape 1 : constater l'état actuel (le rouge)**

Démarrer le serveur de développement dans un terminal séparé :

```bash
npx wrangler dev --port 8787
```

Puis, dans un autre terminal :

```bash
curl -sI -H "Host: cabc-volley.nkobrs21.workers.dev" http://127.0.0.1:8787/ | grep -i "x-robots-tag"
curl -s  -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/robots.txt
```

Attendu : la première commande ne renvoie **rien** (aucun en-tête), la seconde renvoie
**404**. C'est exactement le problème.

- [ ] **Étape 2 : écrire `worker.js`**

```js
// Tant que ce site n est qu un projet, il ne doit exister pour aucun moteur.
// Le barrage se juge sur l hote plutot que dans un fichier _headers : il tombe
// ainsi de lui-meme le jour ou un vrai domaine pointe sur ce worker, au lieu
// de laisser une consigne a se rappeler dans un README. Un barrage oublie
// ferait naitre le site officiel invisible.

// Ces robots ignorent l en-tete X-Robots-Tag mais respectent robots.txt.
// C est donc la, et seulement la, qu on peut les tenir a distance.
const ROBOTS_IA = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
  "Amazonbot"
];

// Contre-intuitif et volontaire : les moteurs sont autorises a explorer. C est
// ainsi qu ils lisent le noindex servi avec chaque reponse. Un Disallow les en
// empecherait, et l URL pourrait alors etre listee sans avoir jamais ete lue.
const ROBOTS_BROUILLON = `# Ce site est un projet. Il ne remplace pas encore le site officiel du club,
# qui reste https://www.cabc-volley.fr
#
# L'exploration est volontairement autorisée aux moteurs : c'est ainsi qu'ils
# lisent l'en-tête « X-Robots-Tag: noindex » servi avec chaque réponse.

User-agent: *
Disallow: /admin/

${ROBOTS_IA.map((a) => "User-agent: " + a).join("\n")}
Disallow: /
`;

const ROBOTS_SITE = `User-agent: *
Disallow: /admin/
Disallow: /design-system.html

Sitemap: https://www.cabc-volley.fr/sitemap.xml
`;

// Tout ce qui n est pas un sous-domaine workers.dev est traite comme le site
// officiel, y compris l apercu local : c est le sens de la bascule.
function estBrouillon(hote) {
  return hote.endsWith(".workers.dev");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const brouillon = estBrouillon(url.hostname);

    if (url.pathname === "/robots.txt") {
      return new Response(brouillon ? ROBOTS_BROUILLON : ROBOTS_SITE, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }

    const reponse = await env.ASSETS.fetch(request);
    if (!brouillon) return reponse;

    const entetes = new Headers(reponse.headers);
    entetes.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(reponse.body, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: entetes
    });
  }
};
```

- [ ] **Étape 3 : modifier `wrangler.jsonc`**

Remplacer le bloc `assets` et ajouter `main` juste au-dessus. Le fichier **reste en LF** :

```jsonc
  "name": "cabc-volley",
  "main": "worker.js",
  "compatibility_date": "2026-08-11",
  "assets": {
    "directory": "./site",
    "not_found_handling": "404-page",
    "binding": "ASSETS",
    "run_worker_first": true
  },
```

`binding` expose les assets au worker, `run_worker_first` fait passer chaque requête par
lui — c'est nécessaire pour poser l'en-tête sur les pages, et c'est la contrepartie
assumée dans le design : les requêtes comptent désormais dans le quota Workers.

- [ ] **Étape 4 : vérifier le vert**

Redémarrer `npx wrangler dev --port 8787`, puis :

```bash
# Hote brouillon : le noindex doit apparaitre
curl -sI -H "Host: cabc-volley.nkobrs21.workers.dev" http://127.0.0.1:8787/ | grep -i "x-robots-tag"
```
Attendu : `x-robots-tag: noindex, nofollow`

```bash
# Hote officiel : aucun en-tete, le barrage se leve seul
curl -sI -H "Host: www.cabc-volley.fr" http://127.0.0.1:8787/ | grep -ci "x-robots-tag"
```
Attendu : `0`

```bash
# Les deux robots.txt
curl -s -H "Host: cabc-volley.nkobrs21.workers.dev" http://127.0.0.1:8787/robots.txt | grep -c "GPTBot"
curl -s -H "Host: www.cabc-volley.fr" http://127.0.0.1:8787/robots.txt | grep -c "Sitemap"
```
Attendu : `1` et `1`

Si wrangler ne tient pas compte de l'en-tête `Host` envoyé, ajouter temporairement
`console.log(url.hostname)` en tête du `fetch` pour voir ce qu'il reçoit réellement, et
adapter la commande — ne pas conclure sans avoir lu la valeur.

- [ ] **Étape 5 : vérifier que rien d'autre n'a bougé**

```bash
# La page 404 doit toujours etre servie par not_found_handling
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/page-qui-nexiste-pas
# L accueil doit toujours repondre sur la racine
curl -s http://127.0.0.1:8787/ | grep -c "La fierté"
```
Attendu : `404` puis `1`.

- [ ] **Étape 6 : `npm run check`**

Attendu : les deux lignes `OK —`.

- [ ] **Étape 7 : commit**

```bash
git checkout -b feat/barrage-indexation
git add worker.js wrangler.jsonc
git commit
```

Corps du message : expliquer que le barrage se juge sur l'hôte pour tomber seul, que
`_headers` a été écarté parce qu'il se serait appliqué à tous les hôtes, et que le
`robots.txt` du brouillon autorise volontairement l'exploration pour que le `noindex`
soit lisible.

---

## Tâche 2 — Conversion des images hors norme

Onze fichiers sur vingt-trois dépassent les 400 Ko fixés par le README, pour 12,2 Mo
sur 14,1. Dix sont des PNG de photos. La conversion mesurée sur le pire cas
(`gymnase_darsonval.png`, 2 532 Ko) donne 249 Ko, soit 90 % de gain.

**Fichiers :**
- Créer : onze `.webp` dans `site/assets/uploads/`
- Supprimer : les onze originaux
- Modifier : `site/content/club.json`, `site/content/gymnases.json`,
  `site/content/teams.json`

Aucune référence n'existe dans le HTML : les onze chemins vivent uniquement dans ces
trois fichiers de contenu.

- [ ] **Étape 1 : mesurer l'état de départ**

```bash
du -sh site/assets/uploads
```
Attendu : environ `14M`.

- [ ] **Étape 2 : convertir**

Depuis PowerShell, à la racine du dépôt. `n3-1024x627.png` perd au passage son nom de
redimensionnement WordPress :

```powershell
$ff = (Get-Command ffmpeg).Source
$map = @{
  "gymnase_darsonval.png"   = "gymnase_darsonval.webp"
  "equipe_m18f.png"         = "equipe_m18f.webp"
  "equipe_r1f.png"          = "equipe_r1f.webp"
  "a_chacun_son_volley.png" = "a_chacun_son_volley.webp"
  "volley_fluo.png"         = "volley_fluo.webp"
  "n3-1024x627.png"         = "equipe_n3m.webp"
  "r1f_v2.png"              = "equipe_r1f_seniors.webp"
  "r1m.png"                 = "equipe_r1m.webp"
  "resultats.png"           = "resultats.webp"
  "beach_park.png"          = "beach_park.webp"
  "preparation_beach.jpg"   = "preparation_beach.webp"
}
foreach ($k in $map.Keys) {
  $src = "site/assets/uploads/$k"
  $dst = "site/assets/uploads/$($map[$k])"
  & $ff -hide_banner -loglevel error -y -i $src -vf "scale='min(1600,iw)':-2" -c:v libwebp -quality 82 -compression_level 6 $dst
  "{0,7:N0} Ko -> {1,6:N0} Ko  {2}" -f ((Get-Item $src).Length/1KB), ((Get-Item $dst).Length/1KB), $map[$k]
}
```

Attendu : onze lignes, chacune sous 400 Ko à l'arrivée. Si l'une dépasse encore,
relancer ce fichier avec `-quality 75`.

- [ ] **Étape 3 : mettre à jour les trois fichiers de contenu**

Remplacer les onze chemins. Ce sont des fichiers Decap, touchés à la main **parce qu'un
renommage de fichier ne peut pas se faire autrement** :

| Fichier | Ligne | Ancien | Nouveau |
| --- | --- | --- | --- |
| `club.json` | 104 | `preparation_beach.jpg` | `preparation_beach.webp` |
| `club.json` | 105 | `volley_fluo.png` | `volley_fluo.webp` |
| `club.json` | 106 | `equipe_m18f.png` | `equipe_m18f.webp` |
| `club.json` | 107 | `equipe_r1f.png` | `equipe_r1f.webp` |
| `club.json` | 108 | `resultats.png` | `resultats.webp` |
| `club.json` | 109 | `a_chacun_son_volley.png` | `a_chacun_son_volley.webp` |
| `gymnases.json` | 20 | `beach_park.png` | `beach_park.webp` |
| `gymnases.json` | 37 | `gymnase_darsonval.png` | `gymnase_darsonval.webp` |
| `teams.json` | 37 | `n3-1024x627.png` | `equipe_n3m.webp` |
| `teams.json` | 46 | `r1f_v2.png` | `equipe_r1f_seniors.webp` |
| `teams.json` | 56 | `r1m.png` | `equipe_r1m.webp` |

- [ ] **Étape 4 : supprimer les originaux et vérifier qu'il ne reste aucune référence morte**

```bash
git rm site/assets/uploads/gymnase_darsonval.png site/assets/uploads/equipe_m18f.png \
       site/assets/uploads/equipe_r1f.png site/assets/uploads/a_chacun_son_volley.png \
       site/assets/uploads/volley_fluo.png site/assets/uploads/n3-1024x627.png \
       site/assets/uploads/r1f_v2.png site/assets/uploads/r1m.png \
       site/assets/uploads/resultats.png site/assets/uploads/beach_park.png \
       site/assets/uploads/preparation_beach.jpg

# Aucune reference ne doit subsister
grep -rn "n3-1024x627\|r1f_v2\|\.png\"" site/content/ | grep -v logo
du -sh site/assets/uploads
```
Attendu : aucune ligne de `grep` pour les fichiers convertis, et un dossier autour de
`2M`.

- [ ] **Étape 5 : apprendre à `check-content.mjs` à vérifier que les images existent**

`check-content.mjs` ne contrôle aujourd'hui **que** les slugs, les matchs et le
classement : il ne regarde aucun chemin d'image. Un chemin mal recopié à l'étape 3
passerait donc la compilation sans un mot, et la page afficherait « [ photo à venir ] »
en production. Ce renommage est exactement l'occasion de combler le trou.

Ajouter `existsSync` à l'import `node:fs` existant (le fichier n'importe que
`readFileSync`), puis :

```js
// Un chemin d image casse ne se voit pas : la page affiche « photo a venir »
// et la compilation passe. On verifie donc que chaque image citee existe.
const racineSite = new URL("../site/", import.meta.url);
const cheminsImages = [
  ...equipes.map((e) => e.photo),
  ...(lire("gymnases.json").items || []).map((g) => g.photo),
  ...(lire("club.json").histoire?.photo ? [lire("club.json").histoire.photo] : []),
  ...(lire("club.json").galerie || []),
  ...(lire("news.json").items || []).map((n) => n.image)
].filter(Boolean);

for (const chemin of cheminsImages) {
  if (chemin.startsWith("http")) continue;
  if (!existsSync(new URL(chemin, racineSite))) {
    erreurs.push(`Image introuvable : ${chemin}`);
  }
}
```

Avant d'écrire ce bloc, ouvrir `club.json` pour confirmer le nom exact du tableau qui
porte les six images de la galerie (lignes 104 à 109) : l'adapter si la clé n'est pas
`galerie`. Ne pas deviner — le script échouerait sur une clé inventée.

- [ ] **Étape 6 : `npm run check`**

Attendu : `OK — 5 équipes, 21 matchs…`. Pour prouver que le nouveau contrôle mord,
renommer temporairement un `.webp`, relancer, voir `Image introuvable`, puis rétablir.

- [ ] **Étape 7 : vérifier de ses yeux**

Le dépôt interdit toute affirmation visuelle sans capture. Servir le site et
photographier les trois pages qui portent ces images :

```bash
cd site && python -m http.server 8791 &
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
TMP="C:/Users/nbres/AppData/Local/Temp/claude"
for p in club equipes contact; do
  "$EDGE" --headless=new --disable-gpu --no-first-run --user-data-dir="$TMP/edge" \
    --virtual-time-budget=6000 --window-size=1200,2400 \
    --screenshot="$TMP/apres-$p.png" "http://127.0.0.1:8791/$p.html"
done
```

Regarder les captures : aucune image ne doit manquer ni afficher « [ photo à venir ] ».
Arrêter ensuite le serveur — `pkill` n'existe pas dans ce Git Bash, passer par
PowerShell (`Get-CimInstance Win32_Process` filtré sur le port, puis `Stop-Process`).

- [ ] **Étape 8 : commit**

```bash
git add -A site/assets/uploads site/content scripts/check-content.mjs
git commit
```

Corps : rappeler que le README fixait déjà la règle des 400 Ko et du PNG réservé aux
logos, donner le avant/après du dossier, et noter que les fichiers d'origine restent
définitivement dans l'historique GitHub — c'est ce qui rendait l'attente coûteuse.

---

## Tâche 3 — Chargement différé et garde-fou de poids

**Fichiers :**
- Modifier : `site/assets/site.js`, `site/equipe.html`, `site/article.html`
- Modifier : `scripts/check-content.mjs`

- [ ] **Étape 1 : constater**

```bash
grep -rno '<img[^>]*>' site/*.html site/assets/site.js | grep -v 'loading="lazy"'
```

Six balises ressortent, mais **quatre sont correctes telles quelles** : les deux logos
(`site.js:34`, `index.html:41`) et les deux images d'en-tête (`article.html:25-26`,
`equipe.html:27`), qui doivent s'afficher immédiatement.

Le manque réel se limite à **deux gabarits** : `boutique.html:29` pour les produits et
`salleCard()` dans `site.js:90` pour les gymnases.

- [ ] **Étape 2 : poser `loading="lazy"` dans les gabarits partagés**

`vignette()` porte **déjà** `loading="lazy"` — ne pas y toucher. Le seul gabarit partagé
qui en manque est `salleCard()`, celui des quatre gymnases.

**Ne pas** en poser sur l'image d'en-tête d'`article.html` ni sur celle d'`equipe.html` :
ce sont les plus grandes images visibles d'emblée, et les différer retarderait
l'affichage principal au lieu de l'accélérer.

Dans `site/assets/site.js`, fonction `salleCard()` :

```js
${v.photo?`<img src="${v.photo}" alt="${v.nom}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'<span class="mono" style="color:var(--mention)">[ photo à venir ]</span>'}
```

Puis dans `site/boutique.html`, ligne 29, ajouter `loading="lazy"` à la balise `<img>`
des produits, au même endroit — juste après l'attribut `alt`.

- [ ] **Étape 3 : vérifier la structure servie plutôt que la deviner**

```bash
cd site && python -m http.server 8791 &
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
"$EDGE" --headless=new --disable-gpu --no-first-run \
  --user-data-dir="C:/Users/nbres/AppData/Local/Temp/claude/edge" \
  --virtual-time-budget=6000 --dump-dom "http://127.0.0.1:8791/contact.html" \
  | grep -o 'loading="lazy"' | wc -l
```
Attendu : au moins `4` (les quatre gymnases). Arrêter le serveur.

- [ ] **Étape 4 : ajouter l'avertissement de poids à `check-content.mjs`**

Un **avertissement, pas un échec** : le bureau publie depuis Decap, et faire échouer la
compilation parce qu'une photo d'actualité pèse 450 Ko empêcherait une publication
légitime. La ligne suffit à rendre la dérive visible dans le journal de compilation.

```js
// Le README fixe 400 Ko par image. On avertit sans bloquer : une publication
// du bureau ne doit pas echouer pour une photo un peu lourde, mais la derive
// doit rester visible dans le journal de compilation.
const LIMITE_IMAGE = 400 * 1024;
const dossierUploads = new URL("../site/assets/uploads/", import.meta.url);
for (const nom of readdirSync(dossierUploads)) {
  const taille = statSync(new URL(nom, dossierUploads)).size;
  if (taille > LIMITE_IMAGE) {
    console.warn(`Attention — ${nom} pèse ${Math.round(taille / 1024)} Ko (limite conseillée : 400 Ko)`);
  }
}
```

Ajouter `readdirSync` et `statSync` aux imports `node:fs` existants du fichier.

- [ ] **Étape 5 : `npm run check`**

Attendu : les deux `OK —`, et **aucune** ligne `Attention` puisque la tâche 2 a tout
ramené sous la limite. Pour prouver que le garde-fou fonctionne, copier temporairement
un gros fichier dans `uploads/`, relancer, voir l'avertissement, puis le supprimer.

- [ ] **Étape 6 : commit**

Corps : expliquer le choix de l'avertissement plutôt que de l'échec, et pourquoi les
images d'en-tête d'article et d'équipe restent en chargement immédiat.

---

## Tâche 4 — Polices auto-hébergées

Les quatorze pages chargent la même feuille depuis `fonts.googleapis.com`, qui charge à
son tour les fichiers depuis `fonts.gstatic.com`. Cela impose à chaque visiteur un
transfert de son adresse IP vers un tiers — que les mentions légales admettent
aujourd'hui — et deux connexions externes avant le premier affichage.

Les sous-ensembles `latin` et `latin-ext` représentent **18 fichiers pour 421 Ko**, soit
ce que le navigateur télécharge déjà. Le gain n'est donc pas du poids : c'est la
confidentialité et la latence. `latin-ext` est nécessaire — le site écrit « au cœur de
la Gaillarde ».

**Fichiers :**
- Créer : `site/assets/fonts/` (18 `.woff2`)
- Modifier : `site/assets/style.css`, les 14 `site/*.html`, `site/content/legal.json`

- [ ] **Étape 1 : télécharger la feuille et les fichiers**

```powershell
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
$url = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=DM+Mono:wght@400;500&family=Archivo:wght@400;500;600;700&display=swap"
$css = (Invoke-WebRequest $url -Headers @{ "User-Agent" = $ua } -UseBasicParsing).Content
New-Item -ItemType Directory -Force site/assets/fonts | Out-Null

$sortie = @()
$blocs = [regex]::Matches($css, "(?s)/\* (\S+) \*/\s*(@font-face\s*\{.*?\})")
foreach ($b in $blocs) {
  $sousEnsemble = $b.Groups[1].Value
  if ($sousEnsemble -notin @("latin", "latin-ext")) { continue }
  $bloc = $b.Groups[2].Value
  $famille = ([regex]::Match($bloc, "font-family: '([^']+)'")).Groups[1].Value -replace " ", ""
  $poids   = ([regex]::Match($bloc, "font-weight: (\d+)")).Groups[1].Value
  $style   = if ($bloc -match "font-style: italic") { "italic" } else { "normal" }
  $lien    = ([regex]::Match($bloc, "url\((https://[^)]+\.woff2)\)")).Groups[1].Value
  $nom     = "$famille-$poids-$style-$sousEnsemble.woff2".ToLower()
  Invoke-WebRequest $lien -OutFile "site/assets/fonts/$nom" -UseBasicParsing
  $sortie += ($bloc -replace "url\(https://[^)]+\.woff2\)", "url('fonts/$nom')")
}
$sortie -join "`n" | Set-Content -Path "$env:TEMP\claude\fontface.css" -Encoding utf8
"fichiers : $((Get-ChildItem site/assets/fonts).Count)"
"poids    : {0:N0} Ko" -f ((Get-ChildItem site/assets/fonts | Measure-Object Length -Sum).Sum/1KB)
```

Attendu : `fichiers : 18`, `poids : ~421 Ko`.

- [ ] **Étape 2 : insérer les `@font-face` en tête de `style.css`**

Coller le contenu de `fontface.css` **avant** la première règle du fichier. Les blocs de
Google portent déjà `font-display: swap` et leur `unicode-range` : le conserver est ce
qui fait que le navigateur ne télécharge `latin-ext` que s'il en a besoin.

Aucune classe n'est ajoutée, donc `check-design-system.mjs` n'est pas concerné.

- [ ] **Étape 3 : retirer le `<link>` des quatorze pages**

```bash
grep -rln "fonts.googleapis" site/*.html | wc -l   # doit afficher 14
```

Supprimer dans chaque page la ligne :

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=DM+Mono:wght@400;500&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Puis vérifier qu'il n'en reste aucune :

```bash
grep -rc "fonts.googleapis\|gstatic" site/ | grep -v ":0"
```
Attendu : aucune ligne.

- [ ] **Étape 4 : corriger les mentions légales**

`legal.json`, article « Cookies et mesure d'audience », contient aujourd'hui :

> Les polices de caractères sont chargées depuis les serveurs de Google Fonts, ce qui
> transmet votre adresse IP à Google. Aucune autre donnée n'est communiquée à un tiers.

Cette phrase devient **fausse** dès l'étape 3 — c'est la raison précise qui autorise à
toucher ce fichier Decap à la main. La remplacer par :

> Ce site ne dépose aucun cookie, n'utilise aucun outil de mesure d'audience et
> n'affiche aucune publicité. Les polices de caractères sont hébergées sur ce site :
> aucune donnée n'est transmise à un tiers du seul fait de votre visite.
>
> Les formulaires de contact et d'adhésion font exception, mais seulement lorsque vous
> les envoyez : leur contenu transite alors par le service Web3Forms, comme indiqué
> plus bas.

Mettre à jour `"maj"` à la date du jour.

- [ ] **Étape 5 : comparer l'avant et l'après**

Avant de conclure à l'identité du rendu, capturer les deux états :

```bash
git stash                     # revient a l etat Google Fonts
cd site && python -m http.server 8791 &
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
TMP="C:/Users/nbres/AppData/Local/Temp/claude"
"$EDGE" --headless=new --disable-gpu --no-first-run --user-data-dir="$TMP/edge" \
  --virtual-time-budget=6000 --window-size=1200,900 \
  --screenshot="$TMP/polices-avant.png" "http://127.0.0.1:8791/index.html"
git stash pop
"$EDGE" --headless=new --disable-gpu --no-first-run --user-data-dir="$TMP/edge" \
  --virtual-time-budget=6000 --window-size=1200,900 \
  --screenshot="$TMP/polices-apres.png" "http://127.0.0.1:8791/index.html"
```

Ouvrir les deux images et vérifier que les titres, le monospace et le corps de texte
sont identiques. Regarder en particulier le mot « cœur » du chapeau d'accueil : c'est
lui qui prouve que `latin-ext` est bien servi.

- [ ] **Étape 6 : `npm run check`**, puis commit

Corps : expliquer que le gain n'est pas du poids mais la suppression du seul transfert
de données imposé au visiteur, distinguer ce transfert passif de celui, choisi, des
formulaires, et dire pourquoi `legal.json` devait être corrigé en même temps — sans quoi
il aurait décrit une réalité disparue.

---

## Tâche 5 — Mention RGPD sous les formulaires

**Fichiers :**
- Modifier : `site/contact.html`, `site/adhesion.html`

Le texte existe dans `legal.json` mais pas à l'endroit où l'on saisit son nom et son
email.

- [ ] **Étape 1 : ajouter la mention dans `contact.html`**

Juste après le `<button class="btn btn-primary" type="submit">`, dans le même
`<div style="grid-column:span 2">` :

```html
<p class="muted" style="font-size:12px;margin-top:14px;max-width:60ch">Les informations saisies sont transmises au club par le service Web3Forms, uniquement pour répondre à votre demande. Elles ne sont ni revendues, ni conservées sur ce site. <a href="mentions-legales.html" class="lien">En savoir plus</a>.</p>
```

- [ ] **Étape 2 : ajouter la mention équivalente dans `adhesion.html`**

Même bloc, en adaptant la première phrase au traitement des adhésions :

```html
<p class="muted" style="font-size:12px;margin-top:14px;max-width:60ch">Les informations saisies sont transmises au club par le service Web3Forms, uniquement pour traiter votre adhésion. Elles ne sont ni revendues, ni conservées sur ce site. <a href="mentions-legales.html" class="lien">En savoir plus</a>.</p>
```

Les classes `muted` et `lien` existent déjà : aucune classe nouvelle, donc aucun ajout
requis dans `design-system.html`.

- [ ] **Étape 3 : `npm run check`**

Attendu : les deux `OK —`. Si `check-design-system.mjs` proteste, c'est qu'une classe
inconnue s'est glissée dans le balisage.

- [ ] **Étape 4 : vérifier de ses yeux**

Capturer `contact.html` et `adhesion.html` et confirmer que la mention s'insère sous le
bouton sans casser la grille à deux colonnes.

- [ ] **Étape 5 : commit**

---

## Ce que ce plan ne fait pas

- **La clé Web3Forms.** `adhesion.html:30` et `contact.html:17` portent toujours
  `VOTRE-CLE-WEB3FORMS`, donc les deux formulaires échouent visiblement. C'est le défaut
  le plus coûteux du site, mais il demande une clé créée par le club sur web3forms.com
  avec son adresse. À poser dès qu'elle existe.
- **Le socle SEO** — descriptions, canonical, Open Graph, JSON-LD, sitemap, vignette de
  partage. C'est le lot 2 du design, qui fera l'objet d'un plan distinct.
- **Les redirections des anciennes URLs**, qui attendent l'arbitrage du bureau sur le
  pré-national féminin, l'Ufolep et le volley santé.
- **Les trois détails d'accessibilité** — `<main>`, `aria-current`, `aria-expanded` —
  laissés en réserve.
- **Le filtrage des URLs dans `mdToHtml`**, où un lien `[texte](javascript:…)` saisi dans
  Decap produirait un `href` exécutable, et **la distinction panne/vide dans `getJSON`**,
  qui renvoie `null` dans les deux cas. Signalés à l'audit, non retenus pour ce plan.
