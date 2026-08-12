# Page galerie du design system — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une page `site/design-system.html`, hors menu, présentant les fondations, les 58 classes de `style.css` et les cinq assemblages qui ne vivent qu'en styles inline, avec un contrôle automatisé qui interdit à l'inventaire de dériver.

**Architecture:** Page HTML autonome qui charge la vraie feuille de style et les vraies polices, mais pas le chrome partagé du site. Chaque composant est écrit une seule fois dans un `<template>` ; un script de page l'injecte dans la zone de rendu et, échappé, dans le bloc de code. Un script Node compare les classes de `style.css` aux attributs `data-classes` de la galerie.

**Tech Stack:** HTML/CSS/JavaScript sans framework ni dépendance, Node 18+ pour le contrôle, Cloudflare Workers pour le service.

**Spec de référence :** `docs/superpowers/specs/2026-08-12-design-system-design.md`

## Global Constraints

- **Aucune dépendance nouvelle.** `package.json` garde `wrangler` comme seule devDependency.
- **`site/assets/style.css` et `site/assets/site.js` ne sont jamais modifiés.** La galerie observe le design system, elle ne le change pas.
- **Toute règle du `<style>` de la page est préfixée `gal-`.** Le préfixe `ds-` est proscrit : `ds` est la classe des tableaux et des citations, `ds-list` celle des listes. Aucune règle de la page ne redéfinit une classe du design system.
- **La page charge `assets/style.css` et le lien Google Fonts identiques aux autres pages.** C'est la condition pour qu'elle montre le design system réel et non une copie.
- **`data-classes` contient des noms de classe sans point, séparés par des espaces** — `data-classes="btn btn-primary"`, jamais `".btn .btn-primary"`.
- **Langue :** français avec accents pour tout texte visible.
- **Messages de commit en français sans accents** (convention du dépôt), suivis de :
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **Paliers responsive réels : 1100 px et 880 px.** Ce sont les valeurs de `style.css`. La valeur de 720 px qui a circulé dans un plan précédent est fausse.
- **Arithmétique de couverture : 47 classes documentées + 11 exclues = 58.** Le contrôle la vérifie ; elle doit tomber juste à la fin de la tâche 5.

## Structure des fichiers

| Fichier | Responsabilité | Tâche |
| --- | --- | --- |
| `scripts/check-design-system.mjs` | **Créé.** Compare les classes de `style.css` aux `data-classes` de la galerie. Porte la liste d'exclusions et sa justification. | 1 |
| `site/design-system.html` | **Créé** en tâche 1 (ossature), **étendu** en tâches 2 à 5. Contient le contenu, sa charpente `gal-` et son script. | 1-5 |
| `package.json` | **Modifié.** `npm run check` enchaîne les deux contrôles. | 6 |
| `site/README.md` | **Modifié.** Mentionne la page et le contrôle. | 6 |

Le fichier `design-system.html` grossit sur cinq tâches. C'est assumé : c'est un catalogue, sa taille est proportionnelle au design system qu'il décrit, et le découper en fragments obligerait à un assemblage que ce site sans étape de build ne sait pas faire.

## Le garde-fou comme feuille de route

Le contrôle est écrit en **tâche 1**, avant tout contenu, mais n'est branché dans `npm run check` qu'en **tâche 6**.

Ce décalage est délibéré. Branché dès la tâche 1, il ferait échouer la compilation Cloudflare pendant toute la durée des tâches 2 à 5, puisqu'aucune classe n'est encore documentée. Écrit dès la tâche 1 mais lancé à la main, il devient l'inverse : **la liste de travail**. À chaque tâche, `node scripts/check-design-system.mjs` dit exactement ce qui reste à documenter.

## Note sur la vérification

Ce dépôt n'a pas de suite de tests automatisés et ce plan n'en introduit pas. Trois moyens de vérification sont utilisés :

1. **`node scripts/check-design-system.mjs`** — le seul cycle rouge/vert automatisé, et le décompte de progression.
2. **Assertions Node ponctuelles** sur le HTML produit, décrites tâche par tâche.
3. **Vérification manuelle dans le navigateur** — serveur local par `npx wrangler dev` depuis la racine, sur `http://localhost:8787`. Ce serveur redirige les URL en `.html` vers leur forme sans extension : suivre les redirections avec `curl -L` plutôt que traiter le 301 comme un échec.

Ne jamais déclarer une tâche terminée sans avoir exécuté la vérification et constaté le résultat attendu.

---

### Task 1: Le garde-fou et l'ossature de la page

**Files:**
- Create: `scripts/check-design-system.mjs`
- Create: `site/design-system.html`

**Interfaces:**
- Consumes: rien.
- Produces: le contrat `data-classes` (noms de classe sans point, séparés par des espaces) que toutes les tâches suivantes respectent ; la constante `EXCLUES` du script ; les classes de charpente `gal-page`, `gal-nav`, `gal-main`, `gal-head`, `gal-section`, `gal-item`, `gal-meta`, `gal-name`, `gal-note`, `gal-demo`, `gal-code`, `gal-copy`, `gal-swatch` ; la commande `node scripts/check-design-system.mjs`.

- [ ] **Step 1: Écrire le contrôle**

Créer `scripts/check-design-system.mjs` :

```js
// Verifie que la galerie du design system documente toutes les classes de
// style.css. Lance par `npm run check`.
import { readFileSync } from "node:fs";

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

// Classes volontairement absentes de la galerie. Chaque exclusion porte sa
// raison : sans cela la liste se remplit en silence et le controle perd son sens.
const EXCLUES = new Map([
  ["site-header", "chrome de page, hors perimetre de la galerie"],
  ["site-footer", "chrome de page, hors perimetre de la galerie"],
  ["topbar", "chrome de page, hors perimetre de la galerie"],
  ["burger", "chrome de page, hors perimetre de la galerie"],
  ["logo", "chrome de page, hors perimetre de la galerie"],
  ["hero", "gabarit de page, hors perimetre de la galerie"],
  ["lines", "filets decoratifs du heros, indissociables du gabarit de page"],
  ["active", "etat de la navigation, indissociable du chrome de page"],
  ["open", "etat du menu deplie, indissociable du chrome de page"],
  ["wrap", "conteneur de largeur, sans rendu propre a montrer"],
  ["grid", "utilitaire nu (display:grid;gap:0), jamais employe sans styles inline"],
]);

// Noms de classe definis par la feuille de style : commentaires retires, et
// seule la partie selecteur de chaque regle est lue.
function classesDuCss(css) {
  const noms = new Set();
  for (const regle of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const selecteur = regle[1];
    if (/^\s*@/.test(selecteur)) continue;
    for (const c of selecteur.matchAll(/\.([A-Za-z][\w-]*)/g)) noms.add(c[1]);
  }
  return noms;
}

// Noms de classe declares par la galerie, via l attribut data-classes.
function classesDeLaGalerie(html) {
  const noms = new Set();
  for (const attr of html.matchAll(/data-classes\s*=\s*"([^"]*)"/g)) {
    for (const nom of attr[1].trim().split(/\s+/)) if (nom) noms.add(nom);
  }
  return noms;
}

const erreurs = [];
const duCss = classesDuCss(lire("site/assets/style.css"));
const deLaGalerie = classesDeLaGalerie(lire("site/design-system.html"));

for (const nom of [...duCss].sort()) {
  if (deLaGalerie.has(nom) || EXCLUES.has(nom)) continue;
  erreurs.push(`Classe non documentée : « ${nom} » est définie dans style.css mais n'apparaît dans aucun data-classes de la galerie.`);
}

for (const nom of [...deLaGalerie].sort()) {
  if (!duCss.has(nom)) {
    erreurs.push(`Entrée obsolète : la galerie documente « ${nom} », qui n'existe plus dans style.css.`);
  }
}

for (const [nom, raison] of EXCLUES) {
  if (!duCss.has(nom)) {
    erreurs.push(`Exclusion inutile : « ${nom} » (${raison}) n'existe plus dans style.css, retirez-la de EXCLUES.`);
  }
  if (deLaGalerie.has(nom)) {
    erreurs.push(`Exclusion contradictoire : « ${nom} » est à la fois documentée dans la galerie et listée dans EXCLUES.`);
  }
}

if (erreurs.length) {
  console.error("Galerie du design system désynchronisée :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const documentees = [...duCss].filter((n) => deLaGalerie.has(n)).length;
console.log(`OK — ${duCss.size} classes dans style.css : ${documentees} documentées, ${EXCLUES.size} exclues.`);
```

- [ ] **Step 2: Créer l'ossature de la page**

Créer `site/design-system.html`. L'en-tête reprend celui des autres pages, avec en plus `<meta name="robots" content="noindex">` :

```html
<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Design system — C.A. Brive Corrèze Volley</title>
<link rel="icon" href="assets/logo.png">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=DM+Mono:wght@400;500&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
<style>
/* Charpente de la galerie uniquement. Prefixe gal- obligatoire : ds- est deja
   pris par .ds (tableaux, citations) et .ds-list. Aucune regle ici ne doit
   redefinir une classe du design system. */
.gal-page{display:grid;grid-template-columns:220px 1fr;align-items:start}
.gal-nav{position:sticky;top:0;max-height:100vh;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:26px 18px;border-right:2px solid var(--encre)}
.gal-nav a{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--taupe)}
.gal-nav a:hover{color:var(--encre);opacity:1}
.gal-main{min-width:0}
.gal-head{padding:34px 28px;border-bottom:2px solid var(--encre)}
.gal-section{padding:32px 28px;border-bottom:2px solid var(--encre)}
.gal-item{display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:22px 0;border-top:1px solid var(--lin);align-items:start}
.gal-item:first-of-type{border-top:none}
.gal-meta{min-width:0}
.gal-name{font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.1em;color:var(--encre)}
.gal-note{font-size:13px;color:#4a4438;margin-top:6px}
.gal-demo{margin-top:15px}
.gal-code{margin:0;background:var(--encre);color:var(--creme);padding:14px 16px;font-family:'DM Mono',monospace;font-size:11px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.gal-copy{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;background:none;color:var(--encre);border:1px solid var(--encre);padding:5px 11px;cursor:pointer;margin-top:9px}
.gal-copy:hover{background:var(--encre);color:var(--creme)}
.gal-swatch{height:66px;border:2px solid var(--encre)}
@media(max-width:880px){
  .gal-page{grid-template-columns:1fr}
  .gal-nav{position:static;max-height:none;flex-direction:row;flex-wrap:wrap;gap:10px 16px;padding:16px 22px;border-right:none;border-bottom:2px solid var(--encre)}
  .gal-item{grid-template-columns:1fr;gap:14px}
  .gal-head,.gal-section{padding:24px 22px}
}
</style>
</head><body>
<div class="gal-page">
  <nav class="gal-nav" id="gal-nav"></nav>
  <main class="gal-main">
    <header class="gal-head">
      <h1 style="font-size:clamp(32px,6vw,64px)">Design system</h1>
      <p class="gal-note" style="max-width:60ch">Cette page n'est liée depuis aucun menu du site : elle s'atteint en saisissant son adresse. Elle charge la vraie feuille de style, donc ce qu'on y voit est ce que le site produit. Un contrôle automatisé vérifie qu'aucune classe de <code>style.css</code> n'y manque.</p>
    </header>
  </main>
</div>
<script>
// Chaque composant est ecrit une seule fois, dans un <template>. Le rendu et le
// bloc de code sortent du meme markup : le code affiche EST le code rendu.
document.querySelectorAll(".gal-item").forEach(item=>{
  const tpl=item.querySelector("template");
  if(!tpl)return;
  const markup=tpl.innerHTML.trim();
  const demo=item.querySelector(".gal-demo");
  if(demo)demo.innerHTML=markup;
  const code=item.querySelector(".gal-code");
  if(code)code.textContent=markup;
  const btn=item.querySelector(".gal-copy");
  if(!btn)return;
  // Hors contexte securise, l API presse-papier n existe pas : on retire le
  // bouton plutot que d offrir une action qui echouera.
  if(!navigator.clipboard){btn.remove();return;}
  btn.addEventListener("click",async()=>{
    await navigator.clipboard.writeText(markup);
    const avant=btn.textContent;btn.textContent="Copié";
    setTimeout(()=>{btn.textContent=avant},1200);
  });
});
// Le sommaire est deduit des sections : une section ajoutee y apparait seule.
document.getElementById("gal-nav").innerHTML=
  [...document.querySelectorAll("section.gal-section")]
    .map(s=>`<a href="#${s.id}">${s.querySelector("h2").textContent}</a>`).join("");
</script>
</body></html>
```

- [ ] **Step 3: Lancer le contrôle et constater l'état rouge**

Run: `node scripts/check-design-system.mjs`

Expected: FAIL, code de sortie 1. La page n'a encore aucun `data-classes`, donc les 47 classes non exclues sont signalées, une par ligne, par ordre alphabétique :

```
Galerie du design system désynchronisée :
  - Classe non documentée : « acc » est définie dans style.css mais n'apparaît dans aucun data-classes de la galerie.
  - Classe non documentée : « acc-body » est définie dans style.css mais n'apparaît dans aucun data-classes de la galerie.
  …
```

Compter les lignes pour vérifier le point de départ :

Run: `node scripts/check-design-system.mjs 2>&1 | grep -c "Classe non documentée"`
Expected: `47`

C'est la feuille de route des tâches 2 à 5. Ce nombre doit tomber à 0.

- [ ] **Step 4: Vérifier que la page se sert et ne casse rien**

Run: `npm run check`

Expected: PASS — `OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe.` Le nouveau contrôle n'est pas encore branché, la compilation reste verte.

Run: `npx wrangler dev` puis, dans un autre terminal :
- `curl -L -s -o /dev/null -w "%{http_code}" http://localhost:8787/design-system.html` → `200`
- `curl -L -s http://localhost:8787/design-system.html | grep -c "gal-page"` → au moins `1`

Arrêter le serveur en ciblant le processus par son port d'écoute. Ne pas utiliser de filtre large sur le nom des processus.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-design-system.mjs site/design-system.html
git commit -m "Design system : garde-fou et ossature de la galerie

Le controle compare les classes de style.css aux data-classes de la
galerie. Il n est pas encore branche dans npm run check : lance a la
main, il sert de feuille de route aux taches suivantes.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Les fondations

**Files:**
- Modify: `site/design-system.html`

**Interfaces:**
- Consumes: la charpente `gal-` et le script de la tâche 1.
- Produces: la section `#fondations`, première entrée du sommaire. Aucune classe documentée ici : les fondations sont des jetons et des règles, pas des composants. Le décompte du contrôle ne bouge donc pas.

- [ ] **Step 1: Ajouter la section fondations**

Dans `site/design-system.html`, à l'intérieur de `<main class="gal-main">`, après `</header>`, insérer :

```html
<section class="gal-section" id="fondations">
  <h2>Fondations</h2>

  <div class="gal-item">
    <div class="gal-meta">
      <div class="gal-name">Couleurs</div>
      <p class="gal-note">Six jetons déclarés dans <code>:root</code>, plus un motif hachuré. Aucune autre couleur ne doit apparaître dans le site, à deux exceptions près, héritées : <code>#4a4438</code> pour le texte atténué et <code>#8f8672</code> pour les mentions de cadre vide.</p>
      <div class="cols-3" style="gap:16px;margin-top:16px">
        <div><div class="gal-swatch" style="background:var(--encre)"></div><div class="gal-name" style="margin-top:7px">--encre</div><div class="gal-note">#17150F — texte, bordures, fonds inversés</div></div>
        <div><div class="gal-swatch" style="background:var(--creme)"></div><div class="gal-name" style="margin-top:7px">--creme</div><div class="gal-note">#EFE9DB — fond de page, texte sur fond sombre</div></div>
        <div><div class="gal-swatch" style="background:var(--sable)"></div><div class="gal-name" style="margin-top:7px">--sable</div><div class="gal-note">#E6DFCD — fond alterné, ligne de tableau mise en avant</div></div>
        <div><div class="gal-swatch" style="background:var(--taupe)"></div><div class="gal-name" style="margin-top:7px">--taupe</div><div class="gal-note">#6B6353 — texte secondaire, surtitres</div></div>
        <div><div class="gal-swatch" style="background:var(--lin)"></div><div class="gal-name" style="margin-top:7px">--lin</div><div class="gal-note">#CFC7B2 — filets fins, séparateurs internes</div></div>
        <div><div class="gal-swatch" style="background:var(--erreur)"></div><div class="gal-name" style="margin-top:7px">--erreur</div><div class="gal-note">#8C2F1E — messages d'erreur</div></div>
        <div><div class="gal-swatch" style="background:var(--hachures)"></div><div class="gal-name" style="margin-top:7px">--hachures</div><div class="gal-note">Fond des cadres d'image manquante</div></div>
      </div>
    </div>
    <div>
      <pre class="gal-code">background: var(--encre);
color: var(--creme);
border: 2px solid var(--encre);</pre>
    </div>
  </div>

  <div class="gal-item">
    <div class="gal-meta">
      <div class="gal-name">Typographies</div>
      <p class="gal-note">Trois familles, chacune avec un rôle exclusif. Les mélanger est le moyen le plus rapide de faire dérailler la charte.</p>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:18px">
        <div><h3 style="font-size:clamp(34px,5vw,52px)">Barlow Condensed 900</h3><div class="gal-note">Titres, scores, chiffres. Toujours en capitales, interligne 0.92. C'est la voix qui crie.</div></div>
        <div><strong style="font-family:'Barlow Condensed';font-weight:700;font-size:21px;text-transform:uppercase;letter-spacing:.04em">Barlow Condensed 700</strong><div class="gal-note">Boutons, navigation, résumés d'accordéon.</div></div>
        <div><span style="font-size:15px">Archivo — le texte courant respire à 15 px, interligne 1.65. Il passe à 16 px sous 880 px.</span><div class="gal-note">Corps de texte, champs de formulaire.</div></div>
        <div><span class="mono">DM Mono — les surtitres chuchotent</span><div class="gal-note">Surtitres, badges, dates, métadonnées. Toujours espacé et en capitales.</div></div>
      </div>
    </div>
    <div>
      <pre class="gal-code">h1,h2,h3,h4 → Barlow Condensed 900
.btn        → Barlow Condensed 700
body        → Archivo 15px / 16px
.mono .eyebrow → DM Mono</pre>
    </div>
  </div>

  <div class="gal-item">
    <div class="gal-meta">
      <div class="gal-name">Paliers responsive</div>
      <p class="gal-note">Deux paliers seulement. Ce sont les valeurs réelles de <code>style.css</code> — les vérifier ici évite de tester à la mauvaise largeur.</p>
      <ul class="ds-list" style="margin-top:14px">
        <li><strong>1100 px</strong> — <code>.cols-3</code> et <code>.cols-4</code> passent à deux colonnes.</li>
        <li><strong>880 px</strong> — tout passe sur une colonne, le corps grimpe à 16 px, le menu devient un burger, <code>.match-row</code> passe à deux colonnes avec la date sur toute la largeur, les filets verticaux deviennent horizontaux.</li>
      </ul>
      <p class="gal-note">Largeur de contrôle retenue pour les vérifications visuelles : <strong>360 px</strong>.</p>
    </div>
    <div>
      <pre class="gal-code">@media(max-width:1100px){ … }
@media(max-width:880px){ … }</pre>
    </div>
  </div>
</section>
```

Ces trois entrées n'ont pas de `<template>` : il n'y a pas de markup à copier, seulement des valeurs. Le script les traverse sans rien faire, ce qui est le comportement voulu.

- [ ] **Step 2: Vérifier que le décompte n'a pas bougé**

Run: `node scripts/check-design-system.mjs 2>&1 | grep -c "Classe non documentée"`
Expected: `47` — inchangé, les fondations ne documentent aucune classe.

- [ ] **Step 3: Vérifier le sommaire et l'absence d'erreur**

Run: `node -e "const h=require('fs').readFileSync('site/design-system.html','utf8');console.log('sections:',[...h.matchAll(/section class=\"gal-section\" id=\"([a-z-]+)\"/g)].map(m=>m[1]).join(', '));console.log('entrees:',(h.match(/class=\"gal-item\"/g)||[]).length);"`

Expected: `sections: fondations` et `entrees: 3`

Run: `npx wrangler dev`, ouvrir `http://localhost:8787/design-system.html`. Attendu : le sommaire latéral affiche un seul lien, « Fondations », et y mène. Les sept pastilles de couleur s'affichent, la dernière montrant le motif hachuré. Aucune erreur dans la console. Arrêter le serveur par son port.

- [ ] **Step 4: Commit**

```bash
git add site/design-system.html
git commit -m "Design system : fondations, couleurs, typographies et paliers

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Texte, structure, boutons et badges

**Files:**
- Modify: `site/design-system.html`

**Interfaces:**
- Consumes: la charpente `gal-`, le script et le contrat `data-classes` de la tâche 1.
- Produces: la section `#texte` documentant 18 classes : `mono`, `eyebrow`, `muted`, `section`, `pad`, `section-head`, `crumb`, `dark`, `on-sable`, `btn`, `btn-primary`, `btn-secondary`, `btn-inverse`, `btn-outline-light`, `badge`, `badge-outline`, `badge-muted`, `sep`.

- [ ] **Step 1: Ajouter la section**

Dans `site/design-system.html`, après `</section>` de `#fondations`, insérer :

```html
<section class="gal-section" id="texte">
  <h2>Texte, structure et actions</h2>

  <article class="gal-item" data-classes="mono">
    <div class="gal-meta"><div class="gal-name">.mono</div><p class="gal-note">Métadonnée : date, catégorie, mention discrète. Interlettrage 0.24em.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><span class="mono">Saison 2026–2027</span></template>
  </article>

  <article class="gal-item" data-classes="eyebrow">
    <div class="gal-meta"><div class="gal-name">.eyebrow</div><p class="gal-note">Surtitre annonçant une section. Plus espacé que <code>.mono</code> (0.3em), et généralement précédé d'un tiret cadratin.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="eyebrow">— Prochaines journées</div></template>
  </article>

  <article class="gal-item" data-classes="muted">
    <div class="gal-meta"><div class="gal-name">.muted</div><p class="gal-note">Texte secondaire. Ce n'est pas du gris : c'est l'encre éclaircie, pour rester lisible sur le crème.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><p class="muted">Entrée libre pour tous les matchs à domicile.</p></template>
  </article>

  <article class="gal-item" data-classes="section pad">
    <div class="gal-meta"><div class="gal-name">.section &middot; .pad</div><p class="gal-note"><code>.section</code> ne fait qu'une chose : le filet de 2 px en bas. <code>.pad</code> ne fait que l'espacement intérieur, 56 px qui tombent à 38 px sous 880 px. Elles se combinent presque toujours.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="section pad">Un bloc avec son espacement et son filet de séparation.</div></template>
  </article>

  <article class="gal-item" data-classes="section-head">
    <div class="gal-meta"><div class="gal-name">.section-head</div><p class="gal-note">Titre de section et mention alignés sur la même ligne de base. La mention de droite passe à la ligne sous 880 px.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="section-head"><h2>Nos gymnases</h2><span class="mono">3 salles · Brive</span></div></template>
  </article>

  <article class="gal-item" data-classes="crumb">
    <div class="gal-meta"><div class="gal-name">.crumb</div><p class="gal-note">Fil d'ariane. Le dernier élément n'est pas un lien et repasse en encre.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="crumb"><a href="index.html">Accueil</a><span>/</span><a href="equipes.html">Équipes</a><span>/</span><span style="color:var(--encre)">National 3 masculin</span></div></template>
  </article>

  <article class="gal-item" data-classes="dark">
    <div class="gal-meta"><div class="gal-name">.dark</div><p class="gal-note">Inverse le bloc. Attention : les boutons ordinaires y deviennent illisibles, il faut passer à <code>.btn-inverse</code> ou <code>.btn-outline-light</code>.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="dark pad">Bloc inversé, texte crème sur encre.</div></template>
  </article>

  <article class="gal-item" data-classes="on-sable">
    <div class="gal-meta"><div class="gal-name">.on-sable</div><p class="gal-note">Fond sable, pour distinguer un bloc sans l'inverser complètement.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="on-sable pad">Bloc sur fond sable.</div></template>
  </article>

  <article class="gal-item" data-classes="btn btn-primary btn-secondary">
    <div class="gal-meta"><div class="gal-name">.btn.btn-primary &middot; .btn.btn-secondary</div><p class="gal-note">Une seule action primaire par écran : c'est celle qu'on veut voir choisie. Tout le reste est secondaire. Le secondaire s'inverse au survol.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="row"><a class="btn btn-primary">Adhérer</a><a class="btn btn-secondary">En savoir plus</a></div></template>
  </article>

  <article class="gal-item" data-classes="btn-inverse btn-outline-light">
    <div class="gal-meta"><div class="gal-name">.btn-inverse &middot; .btn-outline-light</div><p class="gal-note">Les deux variantes pour fond sombre. Sur <code>.dark</code>, ce sont les seules utilisables.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="dark pad"><div class="row"><a class="btn btn-inverse">Adhérer</a><a class="btn btn-outline-light">En savoir plus</a></div></div></template>
  </article>

  <article class="gal-item" data-classes="badge badge-outline badge-muted">
    <div class="gal-meta"><div class="gal-name">.badge &middot; .badge-outline &middot; .badge-muted</div><p class="gal-note">Étiquette d'état. Plein pour l'état par défaut, contour pour l'alternative, taupe pour l'état éteint.</p><p class="gal-note"><strong>Écart connu :</strong> <code>.badge-outline</code> et <code>.badge-muted</code> ne redéfinissent que couleur, bordure et espacement — ni la police, ni la taille, ni les capitales. Employées seules, elles ne ressemblent pas à une étiquette. C'est pourtant ce que fait le site aujourd'hui dans <code>matchRow()</code> et dans <code>equipe.html</code>. La première rangée ci-dessous montre l'usage actuel, la seconde le rendu obtenu en ajoutant <code>.badge</code>.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div><div class="row" style="margin-bottom:12px"><span class="badge">Domicile</span><span class="badge-outline">Extérieur</span><span class="badge-muted">Défaite</span></div><div class="row"><span class="badge">Domicile</span><span class="badge badge-outline">Extérieur</span><span class="badge badge-muted">Défaite</span></div></div></template>
  </article>

  <article class="gal-item" data-classes="sep">
    <div class="gal-meta"><div class="gal-name">.sep</div><p class="gal-note">Mention encadrée de deux filets. Sert de respiration entre deux blocs, souvent centrée.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><span class="sep">Depuis 1946</span></template>
  </article>
</section>
```

- [ ] **Step 2: Vérifier la progression du décompte**

Run: `node scripts/check-design-system.mjs 2>&1 | grep -c "Classe non documentée"`
Expected: `29` — les 47 de départ moins les 18 documentées ici.

Run: `node scripts/check-design-system.mjs 2>&1 | grep -c "Entrée obsolète"`
Expected: `0` — aucune classe déclarée qui n'existerait pas dans le CSS. Une valeur non nulle signale une faute de frappe dans un `data-classes`.

- [ ] **Step 3: Vérifier le rendu**

Run: `npx wrangler dev`, ouvrir `http://localhost:8787/design-system.html`.

Attendu :
- le sommaire compte deux liens, « Fondations » et « Texte, structure et actions » ;
- chacune des 12 entrées affiche **à la fois** un rendu et un bloc de code non vide — un bloc vide signale un `<template>` mal fermé ;
- le bouton « Copier » d'une entrée met bien le markup dans le presse-papier et affiche « Copié » brièvement ;
- sur `.btn-inverse`, les deux boutons sont lisibles sur le fond sombre.

À 360 px : la grille de chaque entrée passe sur une colonne, le sommaire devient une bande horizontale en haut, aucun débordement latéral.

Arrêter le serveur par son port.

- [ ] **Step 4: Commit**

```bash
git add site/design-system.html
git commit -m "Design system : texte, structure, boutons et badges

18 classes documentees. Reste 29 au controle.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Blocs, grilles et composants riches

**Files:**
- Modify: `site/design-system.html`

**Interfaces:**
- Consumes: la charpente `gal-`, le script et le contrat `data-classes` de la tâche 1.
- Produces: la section `#blocs` documentant les 29 classes restantes : `card`, `body`, `ph`, `link`, `shadow`, `cols-2`, `cols-3`, `cols-4`, `duo`, `split`, `band`, `row`, `stats`, `match-row`, `match-list`, `match-band`, `score`, `countdown`, `ds`, `hl`, `table-wrap`, `field`, `acc`, `acc-body`, `ds-list`, `social`, `frame`, `lbl`, `timeline`. À l'issue de cette tâche le contrôle passe au vert.

- [ ] **Step 1: Ajouter la section**

Dans `site/design-system.html`, après `</section>` de `#texte`, insérer :

```html
<section class="gal-section" id="blocs">
  <h2>Blocs et grilles</h2>

  <article class="gal-item" data-classes="card body ph">
    <div class="gal-meta"><div class="gal-name">.card &middot; .card .ph &middot; .card .body</div><p class="gal-note">La carte de base : bordure 2 px, fond crème. <code>.ph</code> est le cadre hachuré d'image, en 4/3 par défaut. <code>.body</code> est le corps texte.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="card" style="max-width:260px"><div class="ph"><span>[ photo ]</span></div><div class="body"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:22px;text-transform:uppercase">Écharpe du club</strong><span class="mono" style="font-size:11px">18 €</span></div></div></template>
  </article>

  <article class="gal-item" data-classes="link shadow">
    <div class="gal-meta"><div class="gal-name">.card.link &middot; .card.shadow</div><p class="gal-note"><code>.link</code> inverse la carte au survol, <code>.shadow</code> lui donne une ombre dure décalée. À réserver aux cartes réellement cliquables.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><a class="card link shadow" href="#blocs" style="max-width:260px;text-decoration:none;color:inherit"><div class="ph"><span>[ photo ]</span></div><div class="body"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:22px;text-transform:uppercase">Survolez-moi</strong></div></a></template>
  </article>

  <article class="gal-item" data-classes="cols-2 cols-3 cols-4">
    <div class="gal-meta"><div class="gal-name">.cols-2 &middot; .cols-3 &middot; .cols-4</div><p class="gal-note">Grilles à gouttière de 28 px. <code>.cols-3</code> et <code>.cols-4</code> passent à deux colonnes sous 1100 px, puis à une seule sous 880 px. <code>.cols-2</code> passe directement à une colonne.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="cols-3"><div class="card"><div class="body">Un</div></div><div class="card"><div class="body">Deux</div></div><div class="card"><div class="body">Trois</div></div></div></template>
  </article>

  <article class="gal-item" data-classes="duo split">
    <div class="gal-meta"><div class="gal-name">.duo &middot; .split</div><p class="gal-note">Deux colonnes de proportions réglables par <code>--a</code> et <code>--b</code>. <code>.split</code> ajoute le filet de séparation, <code>.duo</code> s'en passe. Sous 880 px le filet devient horizontal.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="split" style="--b:1.5fr"><div class="pad">Colonne étroite</div><div class="pad">Colonne large, une fois et demie plus grande</div></div></template>
  </article>

  <article class="gal-item" data-classes="band">
    <div class="gal-meta"><div class="gal-name">.band</div><p class="gal-note">Bandeau de N cellules séparées par des filets, N réglé par <code>--n</code>. Empilé sous 880 px, les filets passant à l'horizontale.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="band section" style="--n:3"><div class="pad">Premier</div><div class="pad">Deuxième</div><div class="pad">Troisième</div></div></template>
  </article>

  <article class="gal-item" data-classes="row">
    <div class="gal-meta"><div class="gal-name">.row</div><p class="gal-note">Rangée souple à gouttière de 14 px, qui passe à la ligne. C'est l'utilitaire à réflexe pour aligner des boutons ou des badges.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="row"><span class="badge">Un</span><span class="badge">Deux</span><span class="badge">Trois</span></div></template>
  </article>

  <article class="gal-item" data-classes="stats">
    <div class="gal-meta"><div class="gal-name">.stats</div><p class="gal-note">Bandeau de chiffres clés, N cellules via <code>--n</code>. Passe à deux colonnes sous 880 px. Presque toujours combiné à <code>.dark</code>.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="section dark stats" style="--n:3"><div><strong>220</strong><span class="mono">Licencié·es</span></div><div><strong>1946</strong><span class="mono">Fondation</span></div><div><strong>3</strong><span class="mono">Gymnases</span></div></div></template>
  </article>

  <article class="gal-item" data-classes="match-row match-list">
    <div class="gal-meta"><div class="gal-name">.match-row &middot; .match-list</div><p class="gal-note"><strong>Grille à trois colonnes</strong> (130px 1fr auto) : une ligne doit avoir exactement trois enfants directs, sinon elle déborde sous 880 px, où elle passe à deux colonnes avec la date sur toute la largeur. <code>.match-list</code> encadre plusieurs lignes et les sépare d'un filet.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="match-list section"><div class="match-row"><span class="mono" style="letter-spacing:.06em;color:var(--encre)">SAM. 26 SEPT.<br><span style="color:var(--taupe)">20:00</span></span><div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — Poitiers 3</strong><div class="muted" style="font-size:13px">National 3 · Gymnase Rollinat</div></div><span class="badge">Domicile</span></div></div></template>
  </article>

  <article class="gal-item" data-classes="match-band score">
    <div class="gal-meta"><div class="gal-name">.match-band &middot; .score</div><p class="gal-note">Le bandeau de résultat mis en avant. Centré et empilé sous 880 px.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="match-band"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:clamp(24px,4vw,36px)">C.A. Brive</strong><span class="score">3–1</span><strong style="font-family:'Barlow Condensed';font-weight:700;font-size:clamp(24px,4vw,36px);color:var(--taupe)">Poitiers 3</strong></div></template>
  </article>

  <article class="gal-item" data-classes="countdown">
    <div class="gal-meta"><div class="gal-name">.countdown</div><p class="gal-note">Compte à rebours du prochain match. Bordures crème : il est prévu pour un fond sombre.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="dark pad"><div class="countdown"><div><strong>12</strong><span>JOURS</span></div><div><strong>04</strong><span>HEURES</span></div><div><strong>37</strong><span>MIN</span></div></div></div></template>
  </article>

  <article class="gal-item" data-classes="ds hl table-wrap">
    <div class="gal-meta"><div class="gal-name">table.ds &middot; tr.hl &middot; .table-wrap</div><p class="gal-note"><code>.hl</code> met en avant la ligne du club, avec un liseré à gauche. <code>.table-wrap</code> fait défiler le tableau dans son cadre plutôt que de pousser la page — indispensable sur mobile.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="table-wrap"><table class="ds"><thead><tr><th>#</th><th>Équipe</th><th style="text-align:right">Pts</th></tr></thead><tbody><tr><td>1</td><td>Ussel VB</td><td style="text-align:right">18</td></tr><tr class="hl"><td>2</td><td>C.A. Brive Corrèze Volley</td><td style="text-align:right">15</td></tr></tbody></table></div></template>
  </article>

  <article class="gal-item" data-classes="ds">
    <div class="gal-meta"><div class="gal-name">blockquote.ds</div><p class="gal-note">Citation sur fond sable, barre épaisse à gauche. La même classe <code>ds</code> sert aux tableaux : c'est voulu, ce sont deux éléments distincts.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><blockquote class="ds"><p>On ne joue pas pour le classement, on joue pour le club.</p><cite>Jean-Pierre Delost, entraîneur</cite></blockquote></template>
  </article>

  <article class="gal-item" data-classes="field">
    <div class="gal-meta"><div class="gal-name">label.field</div><p class="gal-note">Champ de formulaire avec son intitulé. Au focus, le champ blanchit et prend une ombre dure. La taille passe à 16 px sous 880 px : en dessous, Safari iOS zoome à chaque prise de focus.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><label class="field" style="max-width:320px"><span>Adresse email</span><input type="email" placeholder="prenom.nom@exemple.fr"></label></template>
  </article>

  <article class="gal-item" data-classes="acc acc-body">
    <div class="gal-meta"><div class="gal-name">details.acc &middot; .acc-body</div><p class="gal-note">Accordéon natif, sans JavaScript. Le marqueur passe de + à – à l'ouverture, et le résumé s'inverse.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div><details class="acc"><summary>Comment s'inscrire ?</summary><div class="acc-body muted">Le dossier se remplit en ligne, puis se dépose lors d'une permanence.</div></details><details class="acc"><summary>Quel équipement prévoir ?</summary><div class="acc-body muted">Une tenue de sport et des chaussures de salle propres.</div></details></div></template>
  </article>

  <article class="gal-item" data-classes="ds-list">
    <div class="gal-meta"><div class="gal-name">ul.ds-list</div><p class="gal-note">Liste à tirets cadratins. C'est ce que produit le convertisseur Markdown de <code>site.js</code> pour le contenu rédigé dans Decap.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><ul class="ds-list"><li>Entraînement le mercredi et le vendredi</li><li>Matchs à domicile au gymnase Rollinat</li><li>Buvette ouverte une heure avant</li></ul></template>
  </article>

  <article class="gal-item" data-classes="social frame lbl">
    <div class="gal-meta"><div class="gal-name">.social &middot; .frame &middot; .lbl</div><p class="gal-note">Lien réseau social : le carré du pictogramme s'inverse au survol, comme les cartes. <code>color:inherit</code> y est indispensable — sans lui, la règle globale <code>a{color:var(--encre)}</code> rend ces liens invisibles sur fond sombre.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="dark pad"><a class="social" href="#blocs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect class="frame" x="2" y="2" width="20" height="20"/><circle cx="12" cy="12" r="4.6"/><rect x="16.3" y="5.7" width="2.5" height="2.5" fill="currentColor" stroke="none"/></svg><span class="lbl">Instagram ↗</span></a></div></template>
  </article>

  <article class="gal-item" data-classes="timeline">
    <div class="gal-meta"><div class="gal-name">.timeline</div><p class="gal-note">Frise année · texte, en deux colonnes de 120 px et 1fr. Empilée sous 880 px.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="pad timeline"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:34px">1946</strong><p class="muted">Fondation de la section volley-ball du Club Athlétique de Brive.</p></div></template>
  </article>
</section>
```

- [ ] **Step 2: Constater le passage au vert**

Run: `node scripts/check-design-system.mjs`

Expected: PASS, code de sortie 0 :

```
OK — 58 classes dans style.css : 47 documentées, 11 exclues.
```

C'est le moment où l'arithmétique de couverture doit tomber juste. Si le total n'est pas 58, ou les documentées pas 47, une entrée manque ou un `data-classes` contient une faute.

- [ ] **Step 3: Vérifier que le contrôle détecte réellement une dérive**

Un contrôle qu'on n'a jamais vu échouer ne prouve rien. Retirer temporairement `timeline` du dernier `data-classes` (sans toucher au reste), puis :

Run: `node scripts/check-design-system.mjs`
Expected: FAIL avec exactement `Classe non documentée : « timeline » …`

**Rétablir la valeur**, puis :

Run: `node scripts/check-design-system.mjs`
Expected: PASS à nouveau.

Run: `git diff --stat site/design-system.html`
Expected: le diff correspond à l'ajout de la section, sans trace de la modification de test.

- [ ] **Step 4: Vérifier le rendu**

Run: `npx wrangler dev`, ouvrir `http://localhost:8787/design-system.html`.

Attendu :
- le sommaire compte trois liens ;
- les 17 entrées de cette section affichent un rendu **et** un bloc de code non vide ;
- l'accordéon s'ouvre et se ferme au clic, le marqueur passant de + à – ;
- le champ de formulaire blanchit et prend son ombre au focus ;
- le lien réseau social s'inverse au survol et reste lisible sur le fond sombre ;
- le tableau défile horizontalement dans son cadre si la fenêtre est étroite, sans pousser la page.

À 360 px, puis à 1000 px (entre les deux paliers) : vérifier que `.cols-3` montre bien une colonne à 360 px et deux à 1000 px, et qu'aucune ligne de match ne déborde.

Arrêter le serveur par son port.

- [ ] **Step 5: Commit**

```bash
git add site/design-system.html
git commit -m "Design system : blocs, grilles et composants riches

29 classes documentees, le controle passe au vert : 47 documentees,
11 exclues, 58 au total.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Les motifs composites

**Files:**
- Modify: `site/design-system.html`

**Interfaces:**
- Consumes: la charpente `gal-` et le script de la tâche 1.
- Produces: la section `#composites`. Ces motifs n'ont pas de classe propre : leurs entrées **ne portent pas de `data-classes`**, et le décompte du contrôle reste à 47 documentées.

- [ ] **Step 1: Ajouter la section**

Les cinq markups ci-dessous sont repris **verbatim** de leur source, valeurs d'exemple substituées aux variables de gabarit. Ne pas les reformater : c'est leur fidélité qui fait l'intérêt de la section.

Dans `site/design-system.html`, après `</section>` de `#blocs`, insérer :

```html
<section class="gal-section" id="composites">
  <h2>Motifs composites</h2>
  <p class="gal-note" style="max-width:70ch;margin-bottom:8px">Ces cinq assemblages n'ont pas de classe à eux : ils vivent en styles inline dans les pages. Le contrôle automatisé ne peut donc pas vérifier qu'ils sont à jour — leur exactitude repose sur la discipline. La source de chacun est indiquée.</p>

  <article class="gal-item">
    <div class="gal-meta"><div class="gal-name">Carte joueur</div><p class="gal-note">Source : <code>site/equipe.html</code>. Portrait en 3/4, numéro en surimpression avec une ombre crème pour rester lisible sur toute photo. Le portrait porte <code>loading="lazy"</code> : un effectif complet, c'est une douzaine d'images.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="card shadow" style="max-width:230px"><div class="ph" style="aspect-ratio:3/4;position:relative;overflow:hidden"><span class="mono" style="color:#8f8672">[ portrait ]</span><strong style="position:absolute;top:8px;right:14px;font-family:'Barlow Condensed';font-weight:900;font-size:40px;text-shadow:0 0 6px var(--creme)">10</strong></div><div class="body"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:22px;text-transform:uppercase;line-height:1">Rémi DARDANELLI</strong><span class="mono" style="font-size:11px;letter-spacing:.14em">Attaquant R4/Pointe</span></div></div></template>
  </article>

  <article class="gal-item">
    <div class="gal-meta"><div class="gal-name">Cadre hachuré de remplacement</div><p class="gal-note">Sources : <code>site/equipe.html</code>, <code>site/equipes.html</code>. Ce qui s'affiche tant qu'aucune photo n'a été téléversée. Deux proportions selon l'emplacement : 16/9 pour une photo d'équipe, 3/4 pour un portrait. La couleur <code>#8f8672</code> de la mention est un héritage, pas un jeton.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="cols-2"><div class="ph" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;border:2px solid var(--encre)"><span class="mono" style="color:#8f8672">[ photo à venir ]</span></div><div class="ph" style="aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;border:2px solid var(--encre)"><span class="mono" style="color:#8f8672">[ portrait ]</span></div></div></template>
  </article>

  <article class="gal-item">
    <div class="gal-meta"><div class="gal-name">Ligne de match à venir</div><p class="gal-note">Source : <code>matchRow()</code> dans <code>site/assets/site.js</code>. C'est la seule des cinq à être déjà une fonction partagée — l'appeler vaut mieux que copier ce markup. <strong>Exactement trois enfants directs</strong> : au-delà, la grille déborde sous 880 px.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="match-row"><span class="mono" style="letter-spacing:.06em;color:var(--encre)">SAM. 26 SEPT.<br><span style="color:var(--taupe)">20:00</span></span><div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — Poitiers 3</strong><div class="muted" style="font-size:13px">National 3 · Gymnase Rollinat</div></div><span class="badge">Domicile</span></div></template>
  </article>

  <article class="gal-item">
    <div class="gal-meta"><div class="gal-name">Ligne de résultat</div><p class="gal-note">Source : <code>site/equipe.html</code>. Variante de la précédente. Le score et le badge sont groupés dans <strong>une seule</strong> cellule : c'est ce qui préserve les trois enfants directs de la grille.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><div class="match-row"><span class="mono" style="letter-spacing:.06em;color:var(--encre)">SAM. 26 SEPT.</span><div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — Poitiers 3</strong><div class="muted" style="font-size:13px">National 3</div></div><span class="row" style="align-items:center;gap:12px"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:26px">3–1</strong><span class="badge">Victoire</span></span></div></template>
  </article>

  <article class="gal-item">
    <div class="gal-meta"><div class="gal-name">Carte d'index cliquable</div><p class="gal-note">Source : <code>site/equipes.html</code>. La carte entière est le lien, d'où <code>text-decoration:none;color:inherit</code>. Sans identifiant, la page rend un <code>&lt;div&gt;</code> au lieu du <code>&lt;a&gt;</code> : la carte reste visible mais n'est pas cliquable, plutôt que de produire un lien mort.</p><div class="gal-demo"></div></div>
    <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
    <template><a class="card link shadow" href="#composites" style="max-width:300px;text-decoration:none;color:inherit"><div class="ph" style="aspect-ratio:16/9;position:relative;overflow:hidden"><span class="mono" style="color:#8f8672">[ photo à venir ]</span></div><div class="body"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:26px;text-transform:uppercase;line-height:1.05">National 3 masculin</strong><span class="mono" style="font-size:11px;letter-spacing:.14em">National 3</span><span class="muted" style="font-size:13px">Mer. 18h30-20h30 · Rollinat</span><span class="mono" style="font-size:11px;letter-spacing:.12em;border-top:1px solid var(--lin);padding-top:8px;margin-top:4px">Prochain · SAM. 26 SEPT. · Poitiers 3</span></div></a></template>
  </article>
</section>
```

- [ ] **Step 2: Vérifier que le décompte n'a pas bougé**

Run: `node scripts/check-design-system.mjs`
Expected: PASS, `OK — 58 classes dans style.css : 47 documentées, 11 exclues.` — identique à la tâche 4. Ces entrées ne déclarent aucune classe, c'est voulu.

Run: `node -e "const h=require('fs').readFileSync('site/design-system.html','utf8');const items=(h.match(/class=\"gal-item\"/g)||[]).length;const dc=(h.match(/data-classes/g)||[]).length;console.log('entrees:',items,'| avec data-classes:',dc,'| sans:',items-dc);"`

Expected: `entrees: 37 | avec data-classes: 29 | sans: 8`

Le détail : 3 entrées de fondations (tâche 2) + 12 de texte (tâche 3) + 17 de blocs (tâche 4) + 5 composites (tâche 5) = 37. Les 29 qui portent un `data-classes` sont celles des tâches 3 et 4 ; les 8 sans sont les 3 fondations et les 5 composites, qui ne documentent aucune classe.

Le motif de recherche cible `class="gal-item"` et non la simple chaîne `gal-item`, qui apparaît aussi trois fois dans le `<style>` de la page. Si le compte diffère, une entrée a été omise ou dupliquée.

- [ ] **Step 3: Vérifier le rendu**

Run: `npx wrangler dev`, ouvrir `http://localhost:8787/design-system.html`.

Attendu :
- le sommaire compte quatre liens, le dernier menant à « Motifs composites » ;
- les cinq entrées affichent un rendu et un bloc de code non vide ;
- la carte joueur montre son numéro en surimpression, lisible sur le fond hachuré ;
- la carte d'index s'inverse au survol.

À 360 px : les deux lignes de match passent en deux colonnes avec la date sur toute la largeur, et rien ne déborde.

Arrêter le serveur par son port.

- [ ] **Step 4: Commit**

```bash
git add site/design-system.html
git commit -m "Design system : les cinq motifs composites

Assemblages qui ne vivent qu en styles inline : carte joueur, cadre
hachure, ligne de match, ligne de resultat, carte d index. Hors portee
du controle automatise, la section le dit.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Brancher le garde-fou et documenter

**Files:**
- Modify: `package.json`
- Modify: `site/README.md`

**Interfaces:**
- Consumes: `scripts/check-design-system.mjs` de la tâche 1, vert depuis la tâche 4.
- Produces: rien.

- [ ] **Step 1: Enchaîner les deux contrôles**

Dans `package.json`, remplacer :

```json
    "check": "node scripts/check-content.mjs",
```

par :

```json
    "check": "node scripts/check-content.mjs && node scripts/check-design-system.mjs",
```

`npm run check` reste le point d'entrée unique, donc **la commande de compilation Cloudflare (`npm run check && npx wrangler deploy`) n'a pas à changer.**

- [ ] **Step 2: Vérifier l'enchaînement**

Run: `npm run check`

Expected: PASS, les deux sorties à la suite :

```
OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe.
OK — 58 classes dans style.css : 47 documentées, 11 exclues.
```

- [ ] **Step 3: Documenter dans le README du site**

Lire `site/README.md`, puis, en respectant son ton et sa structure :

- ajouter `design-system.html` à la liste de la section **Structure**, avec la mention qu'elle n'est liée depuis aucun menu et s'atteint en saisissant son adresse ;
- dans le paragraphe qui décrit déjà `npm run check`, ajouter que la commande vérifie désormais aussi que la galerie du design system documente toutes les classes de `style.css`, et qu'ajouter une classe sans l'y documenter fait échouer la compilation. Préciser que seul un développeur peut déclencher cet échec : le bureau ne le peut pas depuis Decap.

- [ ] **Step 4: Vérifier l'ensemble une dernière fois**

Run: `npm run check`
Expected: PASS, les deux lignes.

Run: `git diff --stat b15e402..HEAD -- site/assets/style.css site/assets/site.js`
Expected: aucune sortie — les deux fichiers du design system sont restés intacts sur toute la durée du chantier.

Run: `node -e "const h=require('fs').readFileSync('site/design-system.html','utf8');const m=h.match(/<style>[\s\S]*?<\/style>/)[0];const mauvaises=[...m.matchAll(/\.([A-Za-z][\w-]*)/g)].map(x=>x[1]).filter(c=>!c.startsWith('gal-'));console.log(mauvaises.length?'REGLES NON PREFIXEES : '+[...new Set(mauvaises)].join(', '):'toutes les regles du style de page sont prefixees gal-');"`

Expected: `toutes les regles du style de page sont prefixees gal-`

Run: `npx wrangler dev`, puis vérifier que `curl -L -s -o /dev/null -w "%{http_code}" http://localhost:8787/design-system.html` renvoie `200` et que `http://localhost:8787/equipes.html` répond toujours. Arrêter le serveur par son port.

- [ ] **Step 5: Commit**

```bash
git add package.json site/README.md
git commit -m "Design system : branche le controle et documente la page

npm run check enchaine desormais le controle de contenu et celui de la
galerie. La commande de compilation Cloudflare est inchangee.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Récapitulatif de la couverture du spec

| Exigence du spec | Tâche |
| --- | --- |
| `site/design-system.html` hors `NAV`, avec `noindex` | 1 |
| Charge la vraie `style.css` et les vraies polices | 1 |
| Pas de chrome partagé ; en-tête propre et sommaire latéral collant | 1 |
| `<style>` propre à la page, toutes règles préfixées `gal-` | 1, vérifié en 6 |
| Un `<template>` par composant, rendu et code issus du même markup | 1 |
| Bouton « Copier », retiré si `navigator.clipboard` est indisponible | 1 |
| Fondations : 6 jetons + hachures, 3 typographies, paliers 1100/880 | 2 |
| 47 classes documentées, regroupées par famille | 3 (18) et 4 (29) |
| 11 classes exclues, chacune avec sa raison | 1 |
| Cinq motifs composites, avec leur source et leurs pièges | 5 |
| Contrôle : classe non documentée, entrée obsolète, exclusion inutile, exclusion contradictoire | 1 |
| Contrôle branché dans `npm run check`, commande Cloudflare inchangée | 6 |
| `style.css` et `site.js` jamais modifiés | vérifié en 6 |
| Arithmétique 47 + 11 = 58 | vérifiée en 4 |
| Le contrôle détecte réellement une dérive | vérifié en 4 |
