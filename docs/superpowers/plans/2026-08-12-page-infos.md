# Page « Infos & documents » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une page `site/infos.html`, alimentée par Decap, dont le contenu est une suite de blocs de texte libre pouvant porter des documents téléversés ou des liens externes.

**Architecture:** Page statique qui lit `site/content/infos.json` et remplit le DOM, sur le patron `window.__pageInit` déjà employé par toutes les pages du site. Les documents sont une liste Decap à **types variables** : le bureau choisit « Document téléversé » ou « Lien externe » à l'ajout, et Decap inscrit un discriminant `type` dans le JSON. Le menu passe à huit entrées, ce qui oblige à replier le menu dès 1100 px — par **déplacement** de quatre règles, jamais par changement de seuil.

**Tech Stack:** HTML/CSS/JavaScript sans framework ni dépendance, Decap CMS, Cloudflare Workers.

**Spec de référence :** `docs/superpowers/specs/2026-08-12-page-infos-design.md`

## Global Constraints

- **Aucune dépendance nouvelle.** `package.json` garde `wrangler` comme seule devDependency et n'est pas modifié.
- **Aucune règle CSS nouvelle.** La page se construit avec le vocabulaire existant : `.section`, `.pad`, `.section-head`, `.crumb`, `.row`, `.btn`, `.btn-secondary`, `.muted`. `site/assets/style.css` n'est touché que pour **déplacer** quatre règles — autant de lignes retirées qu'ajoutées, aucun sélecteur créé.
- **Le compte du garde-fou ne bouge pas :** `npm run check` doit continuer d'afficher `OK — 58 classes dans style.css : 47 documentées, 11 exclues.` à chaque tâche.
- **`data-classes`, entrées de la galerie, gabarits :** rien de tout cela n'est concerné. La galerie n'est modifiée que pour deux phrases de prose.
- **Langue :** français avec accents pour toute chaîne visible, y compris les libellés et les hints Decap, lus par des bénévoles.
- **Messages de commit en français sans accents**, suivis de :
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **Les documents téléversés vont dans `site/assets/documents`**, pas dans `assets/uploads`.
- **Aucun fait inventé sur le club.** Le contenu livré ne contient ni tarif, ni date, ni obligation administrative : le bureau le remplira depuis Decap.

## Structure des fichiers

| Fichier | Responsabilité | Tâche |
| --- | --- | --- |
| `site/content/infos.json` | **Créé.** Le contenu, livré avec une liste de blocs vide. | 1 |
| `site/infos.html` | **Créé.** Ossature et rendu de la page. | 1 |
| `site/admin/config.yml` | **Modifié.** Collection `infos`, avec la liste à types variables. | 2 |
| `site/assets/documents/.gitkeep` | **Créé.** Fait exister le dossier des documents avant le premier téléversement. | 2 |
| `site/assets/site.js` | **Modifié.** Deux entrées ajoutées à `NAV`. | 3 |
| `site/assets/style.css` | **Modifié.** Quatre règles déplacées du bloc 880 px vers le bloc 1100 px. | 3 |
| `site/design-system.html` | **Modifié.** Deux phrases de l'entrée « Paliers responsive ». | 3 |

**Ordre des tâches, et pourquoi.** La page est créée avant d'entrer au menu : ajouter « Infos » à `NAV` alors que `infos.html` n'existe pas mettrait un lien mort dans l'en-tête de **toutes** les pages du site.

## Note sur la vérification

Ce dépôt n'a pas de suite de tests automatisés et ce plan n'en introduit pas.

Trois moyens sont utilisés, et chaque tâche indique lequel s'applique :

1. **`npm run check`** — les deux contrôles existants. Ils ne doivent jamais passer au rouge.
2. **Assertions Node ponctuelles** sur les fichiers produits.
3. **Serveur local** par `npx wrangler dev` depuis la racine, sur `http://localhost:8787`. Il redirige les URL en `.html` vers leur forme sans extension : suivre les redirections avec `curl -L`. Arrêter le serveur en ciblant le processus par son port d'écoute ; ne jamais employer de filtre large sur le nom des processus.

---

### Task 1: La page et son contenu

**Files:**
- Create: `site/content/infos.json`
- Create: `site/infos.html`

**Interfaces:**
- Consumes: `getJSON(path)` et `mdToHtml(md)`, déjà présents dans `site/assets/site.js`.
- Produces: la forme du JSON que la tâche 2 doit exposer dans Decap — `titre`, `chapo`, et `blocs[]` de `{titre, texte, documents[]}` où chaque document est `{type:"fichier", libelle, fichier}` ou `{type:"lien", libelle, url}`.

- [ ] **Step 1: Créer le contenu**

Créer `site/content/infos.json` :

```json
{
  "titre": "Infos & documents",
  "chapo": "Les informations pratiques du club et les documents à télécharger.",
  "blocs": []
}
```

La liste de blocs est vide à dessein. Le bureau la remplira depuis Decap ; livrer du contenu inventé sur un site public serait pire que livrer une page vide, et l'état vide doit de toute façon être vu au moins une fois.

- [ ] **Step 2: Créer la page**

Créer `site/infos.html`. L'en-tête reprend celui des autres pages, à l'identique :

```html
<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Infos &amp; documents — C.A. Brive Corrèze Volley</title>
<link rel="icon" href="assets/logo.png">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=DM+Mono:wght@400;500&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head><body>
<div id="header"></div>
<section class="pad section">
  <div class="crumb"><a href="index.html">Accueil</a><span>/</span><span style="color:var(--encre)">Infos &amp; documents</span></div>
  <div class="section-head" style="margin-bottom:0"><h1 style="font-size:clamp(38px,9vw,88px)" id="titre"></h1></div>
  <p class="muted" id="chapo" style="max-width:60ch;margin-top:14px"></p>
</section>
<div id="blocs"></div>
<div id="footer"></div><script src="assets/site.js"></script>
<script>
window.__pageInit=async function(){
  const data=await getJSON("content/infos.json");
  const titre=data?.titre||"Infos & documents";
  document.title=titre+" — C.A. Brive Corrèze Volley";
  document.getElementById("titre").textContent=titre;
  const chapo=document.getElementById("chapo");
  if(data?.chapo)chapo.textContent=data.chapo; else chapo.remove();

  // Une adresse saisie sans protocole serait resolue relativement au site et
  // menerait a la page 404. Ce champ est neuf, la faute est probable.
  const externe=u=>/^https?:/i.test(u)?u:"https://"+u;

  // Un document dont le champ utile est vide, ou dont le type est inconnu, est
  // ignore : le reste du bloc s affiche quand meme.
  const bouton=d=>{
    if(d?.type==="fichier"&&d.fichier)
      return `<a class="btn btn-secondary" href="${d.fichier}" download>↓ ${d.libelle||"Document"} (PDF)</a>`;
    if(d?.type==="lien"&&d.url)
      return `<a class="btn btn-secondary" href="${externe(d.url)}" target="_blank" rel="noopener">${d.libelle||"Lien"} ↗</a>`;
    return "";
  };

  const blocs=data?.blocs||[];
  document.getElementById("blocs").innerHTML=blocs.length?blocs.map(b=>{
    const docs=(b.documents||[]).map(bouton).join("");
    return `<section class="pad section">
      <div class="section-head" style="margin-bottom:14px"><h2>${b.titre||""}</h2></div>
      ${b.texte?mdToHtml(b.texte):""}
      ${docs?`<div class="row" style="margin-top:18px">${docs}</div>`:""}
    </section>`;
  }).join(""):'<section class="pad section"><p class="muted">Aucune information pour le moment.</p></section>';
};
</script></body></html>
```

- [ ] **Step 3: Vérifier la syntaxe et le contenu**

Run: `node -e "JSON.parse(require('fs').readFileSync('site/content/infos.json','utf8'));console.log('infos.json : JSON valide')"`
Expected: `infos.json : JSON valide`

Extraire le `<script>` inline de `site/infos.html` dans un fichier `.mjs` du dossier temporaire système — **pas dans l'arbre de travail** — lancer `node --check` dessus, puis supprimer le fichier. Une erreur de syntaxe dans ce script laisserait la page blanche sans que rien d'autre ne le signale.

Run: `npm run check`
Expected: PASS, les deux lignes inchangées, dont `OK — 58 classes dans style.css : 47 documentées, 11 exclues.`

- [ ] **Step 4: Éprouver le rendu des deux types de document**

La page livrée n'a aucun bloc : sans ce test, le rendu des documents ne serait éprouvé par personne avant que le bureau ne s'en serve.

Ajouter **temporairement** à `site/content/infos.json`, sans committer, un contenu couvrant tous les cas :

```json
{
  "titre": "Infos & documents",
  "chapo": "Les informations pratiques du club et les documents à télécharger.",
  "blocs": [
    {
      "titre": "Bloc complet",
      "texte": "Un paragraphe.\n\n## Un sous-titre\n\n- une puce\n- une autre\n\nUn **gras** et un [lien](https://www.ffvb.org/).",
      "documents": [
        { "type": "fichier", "libelle": "Fiche d'inscription", "fichier": "assets/documents/exemple.pdf" },
        { "type": "lien", "libelle": "Site de la FFVB", "url": "https://www.ffvb.org/" },
        { "type": "lien", "libelle": "Adresse sans protocole", "url": "www.ffvb.org" },
        { "type": "fichier", "libelle": "Fichier manquant" },
        { "type": "inconnu", "libelle": "Type inconnu" }
      ]
    },
    { "titre": "Bloc sans texte ni document" },
    { "titre": "Bloc avec texte seul", "texte": "Rien d'autre." }
  ]
}
```

Lancer `npx wrangler dev`, puis vérifier avec `curl -L` que `/infos.html` répond en `200`.

Puis, dans Node, charger le JSON servi et rapporter les valeurs réelles :

- le nombre de blocs rendus : attendu `3` ;
- pour le premier bloc, le nombre de documents dont le bouton n'est **pas** vide : attendu `3` — les deux liens et le fichier renseigné. Le fichier sans chemin et le type inconnu produisent une chaîne vide et disparaissent.
- l'adresse produite pour « Adresse sans protocole » : attendue `https://www.ffvb.org`.

Ces trois valeurs se déduisent des règles de `bouton()` et de `externe()` ; reproduire ces deux fonctions dans le script de test et rapporter leur sortie réelle.

**Rétablir ensuite `blocs: []`**, arrêter le serveur par son port, puis :

Run: `git status --porcelain site/content/infos.json`
Expected: aucune sortie une fois le fichier ajouté à l'index à l'étape suivante — et surtout, `git diff` ne doit montrer aucune trace du contenu de test.

- [ ] **Step 5: Commit**

```bash
git add site/content/infos.json site/infos.html
git commit -m "Page infos : la page et son contenu

La liste de blocs est livree vide : le bureau la remplit depuis Decap.
Les deux types de document et les cas limites ont ete eprouves avec un
contenu temporaire, non commite.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: La collection Decap

**Files:**
- Modify: `site/admin/config.yml`
- Create: `site/assets/documents/.gitkeep`

**Interfaces:**
- Consumes: la forme du JSON définie en tâche 1 — `titre`, `chapo`, `blocs[]` de `{titre, texte, documents[]}`, chaque document portant `type` valant `fichier` ou `lien`.
- Produces: rien pour la tâche 3.

- [ ] **Step 1: Faire exister le dossier des documents**

Créer `site/assets/documents/.gitkeep`, fichier vide. Git ne versionne pas les dossiers vides, et Decap doit pouvoir y déposer le premier téléversement.

- [ ] **Step 2: Ajouter la collection**

Dans `site/admin/config.yml`, **à la fin du fichier**, après la dernière ligne de la collection `legal` (`- {name: corps, label: Texte, widget: markdown}`), ajouter :

```yaml

  - name: infos
    label: Infos & documents
    files:
      - name: infos
        label: Contenu de la page
        file: site/content/infos.json
        fields:
          - {name: titre, label: Titre de la page, widget: string}
          - {name: chapo, label: Texte d'introduction, widget: text, required: false}
          - name: blocs
            label: Blocs
            label_singular: Bloc
            widget: list
            required: false
            summary: "{{fields.titre}}"
            hint: "Chaque bloc est une section de la page : un titre, du texte, et autant de documents ou de liens que nécessaire."
            fields:
              - {name: titre, label: Titre du bloc, widget: string}
              - {name: texte, label: Texte, widget: markdown, required: false}
              - name: documents
                label: Documents et liens
                label_singular: Document ou lien
                widget: list
                required: false
                types:
                  - name: fichier
                    label: Document téléversé
                    widget: object
                    summary: "{{fields.libelle}}"
                    fields:
                      - {name: libelle, label: Libellé du bouton, widget: string, hint: "Ce que lit le visiteur, ex. Fiche d'inscription"}
                      - {name: fichier, label: Fichier, widget: file, media_folder: "/site/assets/documents", public_folder: "/assets/documents", hint: "PDF de préférence, moins de 2 Mo. Pour une mise à jour, remplacez le fichier existant plutôt que d'en téléverser un nouveau : chaque version reste définitivement dans l'historique du dépôt."}
                  - name: lien
                    label: Lien externe
                    widget: object
                    summary: "{{fields.libelle}}"
                    fields:
                      - {name: libelle, label: Libellé du bouton, widget: string, hint: "Ce que lit le visiteur, ex. Formulaire de licence FFVB"}
                      - {name: url, label: Adresse du lien, widget: string, hint: "Collez l'adresse complète, avec https://. Le lien s'ouvrira dans un nouvel onglet."}
```

- [ ] **Step 3: Vérifier que le YAML est valide et bien formé**

Un `config.yml` malformé casse l'admin entière, et rien d'autre dans ce dépôt ne l'attraperait.

Run: `npx --yes js-yaml@4 site/admin/config.yml > /dev/null && echo "config.yml : YAML valide"`
Expected: `config.yml : YAML valide`

Cette commande s'exécute de façon transitoire et **ne doit pas** modifier `package.json`. Le prouver :

Run: `git diff --stat package.json package-lock.json`
Expected: aucune sortie.

Puis, en canalisant la sortie de l'analyseur dans Node, vérifier et rapporter les valeurs réelles :

- la collection `infos` existe et porte un fichier dont le `file` vaut `site/content/infos.json` ;
- son champ `blocs` contient bien un sous-champ `documents` ;
- ce sous-champ `documents` déclare **deux** types, nommés `fichier` et `lien` ;
- le type `fichier` porte un `media_folder` valant `/site/assets/documents`.

- [ ] **Step 4: Vérifier l'admin — et ce qui ne peut pas l'être**

Run: `npm run check`
Expected: PASS, les deux lignes inchangées.

Lancer `npx wrangler dev`, vérifier avec `curl -L` que `/admin/` répond en `200`, puis arrêter le serveur par son port.

**Deux points ne peuvent pas être vérifiés sans ouvrir une session dans l'admin, ce qui demande un navigateur et l'authentification GitHub. Les signaler dans le rapport, ne pas prétendre les avoir contrôlés :**

1. Le choix entre « Document téléversé » et « Lien externe » apparaît-il à l'ajout d'un document ? Si les **types variables** ne fonctionnent pas, le repli documenté dans le spec est un seul type d'objet portant `libelle`, `fichier` et `url`, les deux derniers optionnels, avec la règle « l'adresse l'emporte si elle est remplie ».
2. Un PDF téléversé atterrit-il bien dans `site/assets/documents` ? Si le `media_folder` par champ ne prend pas, le repli est le dossier global `assets/uploads` : le site fonctionne pareil, seul le rangement est moins propre.

- [ ] **Step 5: Commit**

```bash
git add site/admin/config.yml site/assets/documents/.gitkeep
git commit -m "Page infos : collection Decap avec types variables

Un document est soit un fichier televerse dans assets/documents, soit un
lien externe. Le bureau choisit le type a l ajout.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Le menu à huit entrées

C'est la tâche délicate du lot. Elle ne consiste pas à changer un seuil.

**Files:**
- Modify: `site/assets/site.js:2`
- Modify: `site/assets/style.css` — retrait de 4 lignes du bloc `@media(max-width:880px)`, ajout des mêmes dans le bloc `@media(max-width:1100px)`
- Modify: `site/design-system.html` — deux phrases

**Interfaces:**
- Consumes: `site/infos.html`, créée en tâche 1. Le lien de menu ne doit être ajouté qu'une fois la page existante.
- Produces: rien.

- [ ] **Step 1: Ajouter les deux entrées au menu**

Dans `site/assets/site.js`, remplacer intégralement la ligne 2 :

```js
const NAV=[["index.html","Accueil"],["club.html","Le Club"],["equipes.html","Équipes"],["calendrier.html","Calendrier"],["actualites.html","Actualités"],["boutique.html","Boutique"]];
```

par :

```js
const NAV=[["index.html","Accueil"],["club.html","Le Club"],["equipes.html","Équipes"],["calendrier.html","Calendrier"],["actualites.html","Actualités"],["boutique.html","Boutique"],["infos.html","Infos"],["contact.html","Contact"]];
```

`contact.html` reste également dans le pied de page rendu par `renderChrome()` : ne pas l'en retirer.

- [ ] **Step 2: Déplacer les quatre règles du menu replié**

**Lire d'abord cette explication en entier.** Les quatre règles qui replient le menu vivent dans le grand bloc `@media(max-width:880px)` de `site/assets/style.css`. Ce bloc porte aussi le passage du corps à 16 px, les grilles en une colonne, les zones tactiles du pied de page et la réduction des espacements. **Changer son seuil basculerait tout le comportement mobile à 1100 px**, ce qui n'est pas voulu.

Retirer du bloc `@media(max-width:880px)` ces quatre lignes, et **elles seules** :

```css
  .site-header nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:var(--creme);border-bottom:2px solid var(--encre);padding:18px 22px;gap:16px}
  .site-header nav.open{display:flex}
  .burger{display:flex}
  .site-header nav a{padding:6px 0}
```

Puis remplacer le bloc `@media(max-width:1100px)` existant, qui est aujourd'hui :

```css
@media(max-width:1100px){
  .cols-3,.cols-4{grid-template-columns:repeat(2,1fr)}
}
```

par :

```css
@media(max-width:1100px){
  .cols-3,.cols-4{grid-template-columns:repeat(2,1fr)}
  /* Le menu se replie des 1100 px : huit entrees plus le bouton ne tiennent pas
     en dessous. Ces regles vivaient dans le bloc 880 px, qui porte aussi le corps
     a 16 px et les grilles en une colonne — d ou le deplacement plutot qu un
     changement de seuil. */
  .site-header nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:var(--creme);border-bottom:2px solid var(--encre);padding:18px 22px;gap:16px}
  .site-header nav.open{display:flex}
  .burger{display:flex}
  .site-header nav a{padding:6px 0}
}
```

Le commentaire de deux lignes qui précède ce bloc — « Palier tablette. Ce bloc doit rester après les définitions `.cols-*` ci-dessus… » — reste où il est.

- [ ] **Step 3: Prouver que c'est un déplacement, pas un ajout**

Run: `npm run check`
Expected: PASS, avec `OK — 58 classes dans style.css : 47 documentées, 11 exclues.` — **inchangé**. Un compte différent signifie qu'un sélecteur a été créé ou perdu.

Run: `git diff --numstat site/assets/style.css`
Expected: autant de lignes ajoutées que retirées, aux quatre lignes de commentaire près. Rapporter les nombres réels.

Vérifier en Node que l'ensemble des noms de classe de `style.css` est **identique** avant et après : extraire les noms depuis `git show HEAD:site/assets/style.css` et depuis le fichier courant, puis comparer les deux ensembles. Attendu : aucune différence dans un sens ni dans l'autre.

Run: `grep -c "burger{display:flex}" site/assets/style.css`
Expected: `1` — la règle existe une seule fois, pas dupliquée dans les deux blocs.

- [ ] **Step 4: Corriger les deux phrases de la galerie**

L'entrée « Paliers responsive » de `site/design-system.html` devient fausse des deux côtés. Ne corriger qu'une des deux phrases laisserait la page se contredire elle-même.

Remplacer, à l'identique :

```html
<li><strong>1100 px</strong> — <code>.cols-3</code> et <code>.cols-4</code> passent à deux colonnes.</li>
```

par :

```html
<li><strong>1100 px</strong> — <code>.cols-3</code> et <code>.cols-4</code> passent à deux colonnes, et le menu principal se replie en burger : ses huit entrées plus le bouton ne tiennent pas en dessous.</li>
```

Puis remplacer :

```html
<li><strong>880 px</strong> — la mise en page repasse en une colonne, sauf <code>.match-row</code> et <code>.stats</code> qui passent à deux ; le corps grimpe à 16 px, le menu devient un burger, la date de <code>.match-row</code> prend toute la largeur, les filets verticaux deviennent horizontaux.</li>
```

par :

```html
<li><strong>880 px</strong> — la mise en page repasse en une colonne, sauf <code>.match-row</code> et <code>.stats</code> qui passent à deux ; le corps grimpe à 16 px, les espacements se resserrent, la date de <code>.match-row</code> prend toute la largeur, les filets verticaux deviennent horizontaux.</li>
```

La mention du burger disparaît de la seconde et « les espacements se resserrent » prend sa place — c'est ce que le bloc 880 px continue de faire, et l'énumération reste équilibrée.

Run: `grep -c "le menu devient un burger" site/design-system.html`
Expected: `0`

Run: `grep -o "1100 px</strong>[^<]*" site/design-system.html`
Expected: une phrase mentionnant à la fois les colonnes et le repli du menu.

- [ ] **Step 5: Vérifier l'ensemble**

Run: `npm run check`
Expected: PASS, les deux lignes, comptes inchangés.

Extraire le `<script>` inline de `site/design-system.html` dans un `.mjs` du dossier temporaire système, `node --check`, puis supprimer le fichier.

Run: `node -e "const j=require('fs').readFileSync('site/assets/site.js','utf8');const n=[...j.match(/\[\"[a-z0-9-]+\.html\",\"[^\"]+\"\]/g)||[]];console.log('entrees de menu :',n.length);console.log(n.join(' '))"`
Expected: `entrees de menu : 8`, et la liste se terminant par `["infos.html","Infos"] ["contact.html","Contact"]`.

Lancer `npx wrangler dev`, puis vérifier avec `curl -L` que chacune des huit cibles répond en `200` — `index.html`, `club.html`, `equipes.html`, `calendrier.html`, `actualites.html`, `boutique.html`, `infos.html`, `contact.html`. Un lien mort dans l'en-tête toucherait toutes les pages du site. Arrêter le serveur par son port.

**À signaler dans le rapport, pour la passe visuelle du propriétaire du projet :** entre 880 px et 1100 px, le menu déplié porte `padding:18px 22px` alors que l'en-tête garde `padding:16px 48px`. Le panneau et le contenu de l'en-tête ne seront donc pas alignés à gauche dans cette plage. C'est cosmétique, connu, et corrigible par un style inline si ça choque — mais personne ne peut le constater sans navigateur.

- [ ] **Step 6: Commit**

```bash
git add site/assets/site.js site/assets/style.css site/design-system.html
git commit -m "Menu a huit entrees, replie des 1100 px

Infos et Contact rejoignent le menu. Les quatre regles du menu replie
sont DEPLACEES du bloc 880 px vers le bloc 1100 px : le bloc 880 px
porte aussi le corps a 16 px, les grilles en une colonne et les zones
tactiles, qui ne doivent pas basculer si tot.

La galerie disait le burger a 880 px : ses deux phrases de paliers sont
corrigees.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Récapitulatif de la couverture du spec

| Exigence du spec | Tâche |
| --- | --- |
| `site/infos.html` alimentée par `content/infos.json` | 1 |
| Blocs de texte libre en markdown, rendus par `mdToHtml()` | 1 |
| Documents : type `fichier` avec `download`, type `lien` avec `↗` et nouvel onglet | 1 |
| Normalisation de l'adresse sans protocole | 1 |
| Cas limites : JSON absent, aucun bloc, bloc sans contenu, document vide, type inconnu | 1, éprouvés au step 4 |
| État vide « Aucune information pour le moment. » | 1 |
| Collection Decap à types variables | 2 |
| Documents dans `site/assets/documents` | 2 |
| Hints portant les consignes de poids et de remplacement | 2 |
| Replis documentés si types variables ou `media_folder` échouent | 2, signalés au step 4 |
| Menu à huit entrées, `contact.html` conservée au pied de page | 3 |
| Seuil du menu replié à 1100 px **par déplacement** | 3, prouvé au step 3 |
| Les deux phrases de paliers de la galerie corrigées | 3 |
| Aucune classe CSS nouvelle, compte du garde-fou inchangé | 1, 2 et 3 |
| Aucun fait inventé sur le club | 1 |
