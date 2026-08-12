# Pages équipe — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éclater la page Équipes en un index de cartes plus une page par équipe, rendue par un gabarit unique `equipe.html?e=<slug>`.

**Architecture:** Site statique sans étape de build, servi par Cloudflare Workers. Le contenu vit dans `site/content/*.json`, édité via Decap CMS. Chaque page HTML définit un `window.__pageInit` que `site/assets/site.js` appelle au chargement, et remplit le DOM en lisant les JSON. Les pages équipe reprennent exactement ce patron, déjà utilisé par `article.html?slug=<slug>` pour les actualités.

**Tech Stack:** HTML/CSS/JavaScript sans framework ni dépendance, Decap CMS, Cloudflare Workers (wrangler 4.120.1), Node 18+ pour le script de contrôle du contenu.

**Spec de référence :** `docs/superpowers/specs/2026-08-12-pages-equipes-design.md`

## Global Constraints

- **Aucune dépendance nouvelle.** Pas de framework, pas de bundler, pas de librairie tierce. `package.json` ne contient que `wrangler` en devDependency.
- **Aucune règle CSS nouvelle.** Tout se fait avec les classes existantes de `site/assets/style.css` : `.card`, `.card.link`, `.cols-3`, `.cols-4`, `.section`, `.section-head`, `.pad`, `.ph`, `.crumb`, `.badge`, `.badge-outline`, `.badge-muted`, `.match-list`, `.match-row`, `.mono`, `.muted`, `.row`, `.eyebrow`, `.btn`, `.btn-primary`, `.btn-secondary`.
- **`.match-row` est une grille à 3 colonnes** (`130px 1fr auto`, et `1fr auto` sous 720 px avec le premier enfant sur toute la largeur). Une ligne de match doit contenir **exactement 3 enfants directs**, sans quoi la grille déborde sur mobile.
- **Langue :** toute chaîne visible est en français, avec accents et espaces insécables selon l'usage déjà en place dans le dépôt.
- **Largeur de référence mobile : 360 px.** C'est la largeur retenue lors des lots A à C, toute vérification visuelle se fait à cette largeur.
- **Aucune régression sur `calendrier.html`.** Cette page continue d'afficher tous les matchs, tagués ou non.
- **Messages de commit en français, sans accents** (convention du dépôt, cf. `git log`), suivis de la ligne `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## Structure des fichiers

| Fichier | Responsabilité | Tâche |
| --- | --- | --- |
| `scripts/check-content.mjs` | **Créé.** Valide les invariants de contenu : slug présent, bien formé, unique ; `equipe` d'un match référence une équipe existante. | 1 |
| `package.json` | **Modifié.** Ajout du script `check`. | 1 |
| `site/content/teams.json` | **Modifié.** Ajout de `slug` et `groupe` aux 5 équipes. | 1 |
| `site/content/matches.json` | **Modifié.** Ajout de `equipe` aux 6 matchs. | 1 |
| `site/assets/site.js` | **Modifié.** Ajout de `teamUrl()`, de `matchRow()`, et correction de l'entrée de nav active sur les pages enfants. | 2, 3 |
| `site/equipe.html` | **Créé.** Gabarit d'une page équipe : en-tête, infos pratiques, matchs, classement, effectif, pied. | 2, 3, 4 |
| `site/calendrier.html` | **Modifié.** Utilise `matchRow()` au lieu de sa copie locale du markup. | 3 |
| `site/equipes.html` | **Réécrit.** Index de cartes groupées, plus d'effectifs. | 5 |
| `site/admin/config.yml` | **Modifié.** Nouveaux champs des collections `teams` et `matches`. | 6 |

Découpage retenu : `equipe.html` est construite bloc par bloc sur trois tâches, chaque tâche ajoutant un bloc vérifiable indépendamment. Le fichier reste sous les 120 lignes, dans la norme des autres pages du dépôt.

## Note sur la vérification

**Ce dépôt n'a pas de suite de tests automatisés et ce plan n'en introduit pas** — ce serait disproportionné pour un site statique de 12 pages sans build.

Deux moyens de vérification sont utilisés, et chaque tâche indique lequel s'applique :

1. **`npm run check`** — contrôle automatisé réel des invariants de contenu, créé en tâche 1. C'est le seul cycle rouge/vert automatisé du plan.
2. **Vérification manuelle dans le navigateur**, avec URL exacte et résultat attendu exact. Le serveur local se lance avec `npx wrangler dev` depuis la racine du dépôt et sert le site sur `http://localhost:8787`.

Ne jamais déclarer une tâche terminée sans avoir exécuté la vérification et constaté le résultat attendu.

---

### Task 1: Données — slugs, groupes et liaison des matchs

Cette tâche ne change rien de visible sur le site. Elle prépare les données et installe le garde-fou qui les protègera ensuite.

**Files:**
- Create: `scripts/check-content.mjs`
- Modify: `package.json`
- Modify: `site/content/teams.json`
- Modify: `site/content/matches.json`

**Interfaces:**
- Consumes: rien.
- Produces: le champ `slug` sur chaque équipe (`n3-masculin`, `r1-feminin`, `r1-masculin`, `jeunes`, `ecole-de-volley`), le champ `groupe` (`Séniors` / `Jeunes` / `Formation`), et le champ `equipe` sur chaque match contenant le slug d'une équipe. Toutes les tâches suivantes en dépendent.

- [ ] **Step 1: Écrire le contrôle qui échoue**

Créer `scripts/check-content.mjs` :

```js
// Controle des invariants de contenu edite via Decap.
// Lance par `npm run check`.
import { readFileSync } from "node:fs";

const lire = (nom) =>
  JSON.parse(readFileSync(new URL(`../site/content/${nom}`, import.meta.url), "utf8"));

const erreurs = [];
const equipes = lire("teams.json").items || [];
const matchs = lire("matches.json").items || [];

const slugs = new Set();
for (const e of equipes) {
  if (!e.slug) {
    erreurs.push(`Équipe « ${e.nom} » : slug manquant`);
    continue;
  }
  if (!/^[a-z0-9-]+$/.test(e.slug)) {
    erreurs.push(`Équipe « ${e.nom} » : slug « ${e.slug} » doit être en minuscules, chiffres et tirets`);
  }
  if (slugs.has(e.slug)) {
    erreurs.push(`Slug « ${e.slug} » utilisé par deux équipes`);
  }
  slugs.add(e.slug);
}

for (const m of matchs) {
  if (m.equipe && !slugs.has(m.equipe)) {
    erreurs.push(`Match contre « ${m.adversaire} » : équipe inconnue « ${m.equipe} »`);
  }
}

if (erreurs.length) {
  console.error("Contenu invalide :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const tagues = matchs.filter((m) => m.equipe).length;
console.log(`OK — ${equipes.length} équipes, ${matchs.length} matchs dont ${tagues} rattachés à une équipe.`);
```

Ajouter le script dans `package.json`, dans l'objet `scripts`, avant `deploy` :

```json
    "check": "node scripts/check-content.mjs",
```

- [ ] **Step 2: Lancer le contrôle pour vérifier qu'il échoue**

Run: `npm run check`

Expected: FAIL, code de sortie 1, avec cinq lignes `slug manquant` — une par équipe :

```
Contenu invalide :
  - Équipe « National 3 masculin » : slug manquant
  - Équipe « Régional 1 féminin » : slug manquant
  - Équipe « Régional 1 masculin » : slug manquant
  - Équipe « Jeunes » : slug manquant
  - Équipe « École de volley » : slug manquant
```

- [ ] **Step 3: Ajouter `slug` et `groupe` aux 5 équipes**

Dans `site/content/teams.json`, ajouter les deux champs à chaque entrée de `items`, juste après `nom`. Les valeurs exactes :

| `nom` existant | `slug` à ajouter | `groupe` à ajouter |
| --- | --- | --- |
| National 3 masculin | `n3-masculin` | `Séniors` |
| Régional 1 féminin | `r1-feminin` | `Séniors` |
| Régional 1 masculin | `r1-masculin` | `Séniors` |
| Jeunes | `jeunes` | `Jeunes` |
| École de volley | `ecole-de-volley` | `Formation` |

Exemple pour la première entrée, le reste du contenu de l'objet étant inchangé :

```json
    {
      "nom": "National 3 masculin",
      "slug": "n3-masculin",
      "groupe": "Séniors",
      "categorie": "National 3",
      "creneau": "Mer. 18h30-20h30, Ven. 18h00-20h00 · Rollinat",
      "effectif": [
```

Ne toucher à aucun autre champ, et ne pas réordonner les équipes : l'ordre du fichier est l'ordre d'affichage à l'intérieur d'un groupe.

- [ ] **Step 4: Lancer le contrôle pour vérifier qu'il passe**

Run: `npm run check`

Expected: PASS, code de sortie 0 :

```
OK — 5 équipes, 6 matchs dont 0 rattachés à une équipe.
```

- [ ] **Step 5: Rattacher les 6 matchs à la N3 masculine**

Les 6 matchs de `site/content/matches.json` ont tous `"competition": "National 3 (3MD)"` : ils relèvent tous de la N3 masculine. Ajouter à chacun :

```json
      "equipe": "n3-masculin",
```

Placer le champ juste après `"competition"` dans chaque objet, pour rester lisible dans le diff.

- [ ] **Step 6: Vérifier le rattachement**

Run: `npm run check`

Expected: PASS, avec le compte mis à jour :

```
OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe.
```

- [ ] **Step 7: Vérifier l'absence de régression sur le site**

Run: `npx wrangler dev`

Ouvrir `http://localhost:8787/calendrier.html`. Attendu : les 6 matchs à venir s'affichent, exactement comme avant la tâche. Les nouveaux champs sont ignorés par le code actuel.

Ouvrir `http://localhost:8787/equipes.html`. Attendu : la page affiche toujours les 5 équipes et l'effectif de la N3 masculine, inchangée.

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-content.mjs package.json site/content/teams.json site/content/matches.json
git commit -m "Donnees : slugs, groupes et rattachement des matchs aux equipes

Ajoute un script de controle des invariants de contenu, lance par
npm run check, puis les champs slug et groupe sur les 5 equipes et le
champ equipe sur les 6 matchs de N3 masculine.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Gabarit `equipe.html` — en-tête, pied et cas introuvable

À la fin de cette tâche, chaque équipe a une page qui s'affiche, sans encore son calendrier ni son effectif.

**Files:**
- Modify: `site/assets/site.js`
- Create: `site/equipe.html`

**Interfaces:**
- Consumes: `slug` sur les équipes (tâche 1) ; `getJSON(path)` déjà présent dans `site.js`.
- Produces: `teamUrl(slug)` dans `site.js`, qui retourne l'URL d'une page équipe sous forme de chaîne — seul point du code autorisé à construire cette URL. La tâche 5 l'utilise. Produit aussi le conteneur `<div id="equipe">` que les tâches 3 et 4 remplissent.

- [ ] **Step 1: Ajouter `teamUrl()` et corriger la nav active dans `site.js`**

Dans `site/assets/site.js`, juste après la ligne `const NAV=[...]`, insérer :

```js
// Pages enfants : elles allument l'entree de nav de leur page parente.
const PARENT={"equipe.html":"equipes.html","article.html":"actualites.html"};
// Seul endroit du code qui construit l'URL d'une page equipe.
// Passer a des URLs propres plus tard ne touchera que cette fonction.
function teamUrl(slug){return "equipe.html?e="+encodeURIComponent(slug);}
```

Puis, dans `renderChrome()`, remplacer la ligne :

```js
  const cur=here();
```

par :

```js
  const cur=PARENT[here()]||here();
```

Cette correction allume aussi « Actualités » sur `article.html`, ce qui n'était pas le cas auparavant. C'est le comportement attendu, pas une régression.

- [ ] **Step 2: Créer `site/equipe.html`**

Le fichier reprend l'ossature de `site/article.html`, à l'identique pour la partie `<head>` :

```html
<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Équipe — C.A. Brive Corrèze Volley</title>
<link rel="icon" href="assets/logo.png">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=DM+Mono:wght@400;500&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head><body>
<div id="header"></div>
<div id="equipe"></div>
<div id="footer"></div><script src="assets/site.js"></script>
<script>
window.__pageInit=async function(){
  const slug=new URLSearchParams(location.search).get("e");
  const [teams,matches,settings]=await Promise.all([
    getJSON("content/teams.json"),getJSON("content/matches.json"),getJSON("content/settings.json")]);
  const el=document.getElementById("equipe");
  const t=(teams?.items||[]).find(x=>x.slug&&x.slug===slug);
  if(!t){el.innerHTML='<section class="pad section"><p class="muted">Équipe introuvable. <a href="equipes.html" style="border-bottom:2px solid var(--encre)">Retour aux équipes</a></p></section>';return;}
  document.title=t.nom+" — C.A. Brive Corrèze Volley";

  const entete=`<section class="pad section">
    <div class="crumb"><a href="index.html">Accueil</a><span>/</span><a href="equipes.html">Équipes</a><span>/</span><span style="color:var(--encre)">${t.nom}</span></div>
    <div class="section-head" style="margin-bottom:0"><h1 style="font-size:clamp(32px,7vw,72px)">${t.nom}</h1><span class="mono" style="align-self:flex-end">${t.categorie||""}</span></div>
    ${t.creneau?`<p class="mono" style="margin-top:12px;font-size:12px;letter-spacing:.14em;color:var(--taupe)">${t.creneau}</p>`:""}
    ${t.photo
      ?`<img src="${t.photo}" alt="${t.nom}" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border:2px solid var(--encre);margin-top:24px">`
      :'<div class="ph" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;border:2px solid var(--encre);margin-top:24px"><span class="mono" style="color:#8f8672">[ photo à venir ]</span></div>'}
  </section>`;

  const pied=`<section class="pad section" style="border-bottom:none">
    <div class="row" style="justify-content:space-between;padding-top:24px;border-top:2px solid var(--encre)">
      <a href="equipes.html" class="btn btn-secondary">← Toutes les équipes</a>
      <a href="calendrier.html" class="btn btn-primary">Calendrier complet</a></div>
  </section>`;

  el.innerHTML=entete+pied;
};
</script></body></html>
```

`settings` et `matches` sont chargés dès maintenant mais ne servent qu'aux tâches 3 et 4 : cela évite de retoucher la séquence de chargement à chaque bloc ajouté.

- [ ] **Step 3: Vérifier dans le navigateur**

Run: `npx wrangler dev`

| URL | Résultat attendu |
| --- | --- |
| `http://localhost:8787/equipe.html?e=n3-masculin` | Titre « National 3 masculin », catégorie « National 3 » à droite, créneau en dessous, cadre hachuré `[ photo à venir ]`, boutons de pied. Onglet du navigateur : « National 3 masculin — C.A. Brive Corrèze Volley ». « Équipes » est surligné dans la nav. |
| `http://localhost:8787/equipe.html?e=ecole-de-volley` | Titre « École de volley », catégorie « M11 & baby ». |
| `http://localhost:8787/equipe.html?e=nimportequoi` | « Équipe introuvable » et lien de retour cliquable vers la page Équipes. |
| `http://localhost:8787/equipe.html` | Idem, « Équipe introuvable ». |
| `http://localhost:8787/article.html` | S'affiche normalement, et « Actualités » est désormais surligné dans la nav. |

Réduire la fenêtre à 360 px de large sur `?e=n3-masculin` : aucun débordement horizontal, les deux boutons du pied passent à la ligne sans se chevaucher.

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add site/assets/site.js site/equipe.html
git commit -m "Page equipe : gabarit, en-tete, pied et cas introuvable

Ajoute teamUrl() comme unique constructeur d URL de page equipe, et
allume l entree de nav parente sur les pages enfants equipe.html et
article.html.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Blocs matchs et classement

**Files:**
- Modify: `site/assets/site.js`
- Modify: `site/calendrier.html`
- Modify: `site/equipe.html`

**Interfaces:**
- Consumes: `teamUrl()` non utilisé ici ; le champ `equipe` des matchs (tâche 1) ; le conteneur `#equipe` et les variables `t`, `matches`, `settings`, `entete`, `pied` de la tâche 2.
- Produces: `matchRow(m)` dans `site.js`, qui retourne le HTML d'une ligne de match à venir sous forme de chaîne — utilisée par `calendrier.html` et `equipe.html`.

- [ ] **Step 1: Extraire `matchRow()` dans `site.js`**

Le markup d'une ligne de match à venir existe déjà dans `site/calendrier.html`. Il va servir à deux pages : on le déplace dans `site.js` plutôt que de le dupliquer.

Dans `site/assets/site.js`, après la fonction `fmtDate`, ajouter :

```js
// Ligne d un match a venir. Exactement 3 enfants directs : .match-row est
// une grille a 3 colonnes qui deborde au-dela.
function matchRow(m){const d=new Date(m.date);return `
    <div class="match-row">
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()}<br><span style="color:var(--taupe)">${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span></span>
      <div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition} · ${m.lieu}</div></div>
      <span class="${m.domicile?'badge':'badge-outline'}">${m.domicile?"Domicile":"Extérieur"}</span></div>`;}
```

- [ ] **Step 2: Faire consommer `matchRow()` par `calendrier.html`**

Dans `site/calendrier.html`, remplacer :

```js
  document.getElementById("upcoming").innerHTML=(matches?.items||[]).filter(m=>m.statut==="a_venir").map(m=>{const d=new Date(m.date);return `
    <div class="match-row">
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()}<br><span style="color:var(--taupe)">${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span></span>
      <div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition} · ${m.lieu}</div></div>
      <span class="${m.domicile?'badge':'badge-outline'}">${m.domicile?"Domicile":"Extérieur"}</span></div>`;}).join("")||'<p class="muted pad">Aucun match programmé.</p>';
```

par :

```js
  document.getElementById("upcoming").innerHTML=(matches?.items||[]).filter(m=>m.statut==="a_venir").map(matchRow).join("")||'<p class="muted pad">Aucun match programmé.</p>';
```

- [ ] **Step 3: Vérifier que le calendrier est inchangé**

Run: `npx wrangler dev`

Ouvrir `http://localhost:8787/calendrier.html`. Attendu : rendu **strictement identique** à avant — 6 matchs, dates en capitales, heure en dessous, badge Domicile ou Extérieur à droite. C'est un remaniement sans changement de comportement ; toute différence visible est un défaut à corriger avant de continuer.

Laisser le serveur tourner pour l'étape suivante.

- [ ] **Step 4: Ajouter les blocs matchs et classement dans `equipe.html`**

Dans `site/equipe.html`, entre la définition de `entete` et celle de `pied`, insérer :

```js
  const mine=(matches?.items||[]).filter(m=>m.equipe===t.slug);
  const avenir=mine.filter(m=>m.statut==="a_venir").sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
  const finis=mine.filter(m=>m.statut==="termine").sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);

  // Ligne de resultat : score et badge sont groupes dans une seule cellule,
  // .match-row n acceptant que 3 enfants directs.
  const ligneResultat=m=>{const d=new Date(m.date);return `
    <div class="match-row">
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()}</span>
      <div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition}</div></div>
      <span class="row" style="align-items:center;gap:12px;flex-wrap:nowrap">
        <strong style="font-family:'Barlow Condensed';font-weight:900;font-size:26px">${m.score||"–"}</strong>
        <span class="${m.gagne?'badge':'badge-muted'}">${m.gagne?"Victoire":"Défaite"}</span></span></div>`;};

  const blocAvenir=avenir.length?`<section class="section">
    <div class="pad"><div class="eyebrow">— Prochains matchs</div></div>
    <div class="match-list">${avenir.map(matchRow).join("")}</div></section>`:"";

  const blocResultats=finis.length?`<section class="section">
    <div class="pad"><div class="eyebrow">— Derniers résultats</div></div>
    <div class="match-list">${finis.map(ligneResultat).join("")}</div></section>`:"";

  // Le lien propre a l equipe prime. Le lien general des reglages ne sert de
  // repli que pour une equipe qui joue reellement des matchs : sans cela,
  // l ecole de volley afficherait un classement qui ne la concerne pas.
  const lienClassement=t.classement||(mine.length?settings?.ffvb_classement:null);
  const blocClassement=lienClassement?`<section class="pad section">
    <a class="btn btn-secondary" href="${lienClassement}" target="_blank" rel="noopener">Classement FFVB ↗</a></section>`:"";
```

Puis remplacer la ligne de rendu final :

```js
  el.innerHTML=entete+pied;
```

par :

```js
  el.innerHTML=entete+blocAvenir+blocResultats+blocClassement+pied;
```

- [ ] **Step 5: Vérifier dans le navigateur**

| URL | Résultat attendu |
| --- | --- |
| `http://localhost:8787/equipe.html?e=n3-masculin` | Section « — Prochains matchs » avec **3 lignes** : Poitiers 3 le 26 sept., Saint-Barthélemy le 4 oct., Vannes le 11 oct. Pas de section « Derniers résultats » (aucun match terminé). Bouton « Classement FFVB ↗ » présent, pointant vers l'URL de `settings.json`. |
| `http://localhost:8787/equipe.html?e=r1-feminin` | En-tête et pied seulement. **Aucune** section matchs, **aucun** bouton classement — c'est le point de contrôle du repli conditionnel. |
| `http://localhost:8787/equipe.html?e=ecole-de-volley` | Idem : aucun bouton classement. |
| `http://localhost:8787/calendrier.html` | Toujours 6 matchs, inchangé. |

À 360 px sur `?e=n3-masculin` : les lignes de match passent en deux colonnes avec la date sur toute la largeur, sans débordement horizontal.

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add site/assets/site.js site/calendrier.html site/equipe.html
git commit -m "Page equipe : prochains matchs, resultats et classement

Extrait la ligne de match partagee dans site.js pour eviter de la
dupliquer entre calendrier.html et equipe.html. Le lien de classement
general ne sert de repli que pour les equipes qui jouent des matchs.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Blocs effectif et infos pratiques

**Files:**
- Modify: `site/equipe.html`

**Interfaces:**
- Consumes: `t.effectif` (déjà dans `teams.json`), `t.infos` (champ lu ici, alimenté par Decap en tâche 6) ; les variables `entete`, `blocAvenir`, `blocResultats`, `blocClassement`, `pied` de la tâche 3.
- Produces: le rendu complet d'une page équipe. La tâche 5 n'en dépend pas.

- [ ] **Step 1: Ajouter les deux blocs**

Dans `site/equipe.html`, après la définition de `blocClassement`, insérer :

```js
  // Bloc des equipes sans calendrier : masque tant que le bureau n a pas
  // rempli au moins un titre dans Decap.
  const i=t.infos||{};
  const blocInfos=i.titre?`<section class="pad section">
    <div class="section-head" style="margin-bottom:14px"><h2>${i.titre}</h2></div>
    ${i.texte?`<p class="muted" style="max-width:60ch;line-height:1.8">${i.texte}</p>`:""}
    ${i.bouton&&i.lien?`<a class="btn btn-primary" style="margin-top:20px" href="${i.lien}">${i.bouton}</a>`:""}
  </section>`:"";

  const eff=t.effectif||[];
  const blocEffectif=eff.length?`<section class="pad section">
    <div class="section-head"><h2>L'effectif</h2><span class="mono">${eff.length} membre${eff.length>1?"s":""}</span></div>
    <div class="cols-4">${eff.map(p=>`
      <div class="card shadow"><div class="ph" style="aspect-ratio:3/4;position:relative;overflow:hidden">${p.photo?`<img src="${p.photo}" alt="${p.nom}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'<span class="mono" style="color:#8f8672">[ portrait ]</span>'}<strong style="position:absolute;top:8px;right:14px;font-family:'Barlow Condensed';font-weight:900;font-size:40px;text-shadow:0 0 6px var(--creme)">${p.num||""}</strong></div><div class="body"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:22px;text-transform:uppercase;line-height:1">${p.nom}</strong><span class="mono" style="font-size:11px;letter-spacing:.14em">${p.poste||""}</span></div></div>`).join("")}</div>
  </section>`:"";
```

Le markup des cartes de joueur est repris tel quel de `equipes.html`, avec un seul ajout : `loading="lazy"` sur les portraits.

Puis remplacer la ligne de rendu final par l'ordre définitif défini dans le spec :

```js
  el.innerHTML=entete+blocInfos+blocAvenir+blocResultats+blocClassement+blocEffectif+pied;
```

- [ ] **Step 2: Vérifier dans le navigateur**

Run: `npx wrangler dev`

| URL | Résultat attendu |
| --- | --- |
| `http://localhost:8787/equipe.html?e=n3-masculin` | Section « L'effectif » après le classement, mention « 5 membres », 5 cartes : Jean-Pierre DELOST avec son portrait, les 4 autres avec le cadre hachuré `[ portrait ]`. Aucune section infos pratiques. |
| `http://localhost:8787/equipe.html?e=r1-masculin` | `effectif` est un tableau vide dans `teams.json` : **aucune** section effectif, pas de grille vide. |
| `http://localhost:8787/equipe.html?e=ecole-de-volley` | En-tête et pied seulement — le bloc infos apparaîtra en tâche 6, quand le contenu sera saisi. |

Dans les outils de développement, onglet Réseau, sur `?e=n3-masculin` : `jp_delost-297x300.png` est bien chargé en différé (`loading="lazy"`).

À 360 px : les cartes de l'effectif passent sur une seule colonne.

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add site/equipe.html
git commit -m "Page equipe : effectif et bloc infos pratiques

Les deux blocs disparaissent quand leur donnee est absente. Les
portraits passent en chargement differe.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Refonte de `equipes.html` en index

**Files:**
- Modify: `site/equipes.html`

**Interfaces:**
- Consumes: `teamUrl(slug)` et `fmtDate(iso)` de `site.js` ; `slug`, `groupe`, `photo` sur les équipes.
- Produces: rien pour les tâches suivantes.

- [ ] **Step 1: Réécrire le script de la page**

Dans `site/equipes.html`, remplacer intégralement le bloc `<script>` final par :

```html
<script>
window.__pageInit=async function(){
  const [teams,matches]=await Promise.all([getJSON("content/teams.json"),getJSON("content/matches.json")]);
  const items=teams?.items||[];
  const wrap=document.getElementById("teams-detail");

  // Prochain match de chaque equipe, pour donner envie de cliquer.
  const prochain={};
  (matches?.items||[]).filter(m=>m.equipe&&m.statut==="a_venir")
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
    .forEach(m=>{if(!prochain[m.equipe])prochain[m.equipe]=m;});

  const carte=t=>{
    const m=prochain[t.slug];
    const inner=`<div class="ph" style="aspect-ratio:16/9;position:relative;overflow:hidden">${t.photo?`<img src="${t.photo}" alt="${t.nom}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'<span class="mono" style="color:#8f8672">[ photo à venir ]</span>'}</div>
      <div class="body"><strong style="font-family:'Barlow Condensed';font-weight:900;font-size:26px;text-transform:uppercase;line-height:1.05">${t.nom}</strong>
      <span class="mono" style="font-size:11px;letter-spacing:.14em">${t.categorie||""}</span>
      ${t.creneau?`<span class="muted" style="font-size:13px">${t.creneau}</span>`:""}
      ${m?`<span class="mono" style="font-size:11px;letter-spacing:.12em;border-top:1px solid var(--lin);padding-top:8px;margin-top:4px">Prochain · ${fmtDate(m.date)} · ${m.adversaire}</span>`:""}</div>`;
    // Une equipe sans slug reste visible mais n est pas cliquable :
    // une saisie incomplete degrade la carte, elle ne cree pas de lien mort.
    return t.slug
      ?`<a class="card link shadow" href="${teamUrl(t.slug)}" style="text-decoration:none;color:inherit">${inner}</a>`
      :`<div class="card shadow">${inner}</div>`;
  };

  const ORDRE=["Séniors","Jeunes","Formation"];
  const groupes=new Map(ORDRE.map(g=>[g,[]]));
  groupes.set("Autres",[]);
  // Un groupe vide ou inconnu ne doit jamais faire disparaitre une equipe.
  items.forEach(t=>groupes.get(groupes.has(t.groupe)?t.groupe:"Autres").push(t));

  wrap.innerHTML=[...groupes].filter(([,l])=>l.length).map(([nom,liste])=>`
    <div style="margin-bottom:56px">
      <div class="section-head" style="margin-bottom:20px"><h2>${nom}</h2><span class="mono">${liste.length} équipe${liste.length>1?"s":""}</span></div>
      <div class="cols-3">${liste.map(carte).join("")}</div>
    </div>`).join("");
};
</script>
```

Le reste du fichier — `<head>`, fil d'ariane, titre « Nos équipes », mention de saison, `<div id="teams-detail">` — reste inchangé.

`groupes.get(...)` est sûr : `"Autres"` est présent dans la Map dès sa construction, et le ternaire garantit qu'on ne demande jamais une clé absente.

- [ ] **Step 2: Vérifier dans le navigateur**

Run: `npx wrangler dev`

Ouvrir `http://localhost:8787/equipes.html`. Attendu :

- Trois groupes, dans cet ordre : « Séniors » (3 équipes), « Jeunes » (1 équipe), « Formation » (1 équipe). Pas de groupe « Autres ».
- Aucun effectif n'est affiché sur cette page.
- La carte « National 3 masculin » porte une ligne « Prochain · … · Alterna Stade Poitevin Volley Ball 3 », la date étant celle du samedi 26 septembre au format rendu par `fmtDate`. Les 4 autres cartes n'ont pas cette ligne.
- Survol d'une carte : fond qui s'inverse en encre, texte en crème (comportement `.card.link` existant).
- Un clic sur « Régional 1 féminin » mène à `equipe.html?e=r1-feminin` et la page s'affiche.

Test du repli sur le groupe « Autres » : retirer temporairement la ligne `"groupe": "Formation",` de l'École de volley dans `teams.json`, recharger. Attendu : un groupe « Autres » apparaît en dernier avec l'École de volley — l'équipe reste visible. **Rétablir la ligne** et recharger pour vérifier le retour à trois groupes.

À 360 px : une carte par ligne, aucun débordement horizontal.

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 3: Vérifier que le contenu est resté intact**

Run: `npm run check`

Expected: PASS — `OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe.` Cela confirme que la modification temporaire de l'étape précédente a bien été rétablie.

Run: `git diff --stat site/content/`

Expected: aucune sortie. Si un fichier de contenu apparaît, la modification de test n'a pas été rétablie.

- [ ] **Step 4: Commit**

```bash
git add site/equipes.html
git commit -m "Page equipes : index de cartes au lieu des effectifs

Les equipes sont groupees en Seniors, Jeunes et Formation, chaque carte
menant a la page de l equipe et annoncant son prochain match. Une equipe
sans groupe tombe dans Autres, une equipe sans slug reste visible mais
non cliquable.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Champs Decap et contenu des équipes de formation

Sans cette tâche, le bureau ne peut remplir aucun des nouveaux champs : c'est elle qui rend l'ensemble autonome.

**Files:**
- Modify: `site/admin/config.yml`
- Modify: `site/content/teams.json`

**Interfaces:**
- Consumes: tous les champs lus par les tâches 2 à 5 : `slug`, `groupe`, `photo`, `classement`, `infos.{titre,texte,bouton,lien}` sur les équipes, `equipe` sur les matchs.
- Produces: rien.

- [ ] **Step 1: Ajouter les champs de la collection `teams`**

Dans `site/admin/config.yml`, collection `teams`, dans la liste `fields` de l'entrée `items`, remplacer :

```yaml
              - {name: nom, label: Nom de l'équipe, widget: string}
              - {name: categorie, label: Catégorie / niveau, widget: string}
              - {name: creneau, label: Créneau, widget: string}
```

par :

```yaml
              - {name: nom, label: Nom de l'équipe, widget: string}
              - {name: slug, label: Identifiant URL, widget: string, hint: "Sans espaces ni accents, en minuscules, ex. n3-masculin. Ne le modifiez plus une fois la page en ligne : les liens déjà partagés cesseraient de fonctionner."}
              - {name: groupe, label: Groupe, widget: select, options: ["Séniors","Jeunes","Formation"], default: "Séniors", required: false, hint: "Regroupe les équipes sur la page Équipes."}
              - {name: categorie, label: Catégorie / niveau, widget: string}
              - {name: creneau, label: Créneau, widget: string}
              - {name: photo, label: Photo d'équipe, widget: image, required: false, hint: "Paysage : 1600 × 900 px (format 16/9), moins de 400 Ko."}
              - {name: classement, label: Lien classement FFVB de l'équipe, widget: string, required: false, hint: "Chaque équipe a sa poule, donc son propre classement. Ouvrez le classement de cette équipe sur le site de la FFVB et collez ici l'adresse de la page. Laissé vide, le lien général des « Réglages du club » est utilisé — et seulement si l'équipe a des matchs."}
              - name: infos
                label: Infos pratiques
                widget: object
                collapsed: true
                required: false
                hint: "Pour les équipes sans calendrier de matchs : jeunes, école de volley. Laissez le titre vide pour ne rien afficher."
                fields:
                  - {name: titre, label: Titre, widget: string, required: false, hint: "Laissez vide pour masquer complètement le bloc."}
                  - {name: texte, label: Texte, widget: text, required: false}
                  - {name: bouton, label: Libellé du bouton, widget: string, required: false, hint: "Le bouton n'apparaît que si le libellé ET le lien sont remplis."}
                  - {name: lien, label: Lien du bouton, widget: string, required: false, hint: "Ex. adhesion.html ou contact.html"}
```

Le champ `effectif` reste tel quel, après ce bloc.

- [ ] **Step 2: Ajouter le champ `equipe` à la collection `matches`**

Dans la collection `matches`, après la ligne du champ `competition`, insérer :

```yaml
              - name: equipe
                label: Équipe
                widget: relation
                collection: teams
                file: teams
                required: false
                value_field: "items.*.slug"
                search_fields: ["items.*.nom"]
                display_fields: ["items.*.nom"]
                hint: "Nécessaire pour que le match apparaisse sur la page de l'équipe. Sans équipe, il reste affiché sur la page Calendrier."
```

- [ ] **Step 3: Vérifier l'admin dans le navigateur**

Run: `npx wrangler dev`

Ouvrir `http://localhost:8787/admin/`. L'authentification GitHub est requise ; si elle n'est pas disponible en local, décommenter `local_backend: true` dans `config.yml`, relancer, et **penser à le recommenter avant le commit**.

| Écran | Résultat attendu |
| --- | --- |
| Équipes & effectifs → une équipe | Les champs Identifiant URL, Groupe (liste déroulante à 3 valeurs), Photo d'équipe, Lien classement FFVB et le bloc repliable Infos pratiques sont présents, avec leurs hints. |
| Matchs & résultats → un match | Le champ Équipe est une liste déroulante proposant les 5 noms d'équipes, et le match de N3 affiche déjà « National 3 masculin ». |

**Si la liste déroulante Équipe est vide ou en erreur**, le widget `relation` ne sait pas cibler une liste imbriquée dans une collection `files`. Appliquer alors le repli prévu au spec — remplacer tout le bloc de l'étape 2 par :

```yaml
              - {name: equipe, label: Équipe, widget: string, required: false, hint: "Identifiant de l'équipe, ex. n3-masculin. Recopiez-le depuis « Équipes & effectifs ». Sans équipe, le match reste affiché sur la page Calendrier mais n'apparaît sur aucune page d'équipe."}
```

Le rendu du site est identique dans les deux cas. Noter le choix retenu dans le message de commit.

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 4: Rédiger les infos pratiques de Jeunes et École de volley**

Dans `site/content/teams.json`, ajouter le bloc `infos` à ces deux équipes. Ces textes ne s'appuient que sur des informations déjà présentes dans le fichier ; le bureau les affinera lui-même via Decap.

Pour « Jeunes » :

```json
      "infos": {
        "titre": "Jouer en compétition jeunes",
        "texte": "Le club engage des équipes en M18, M15 et M13. Les entraînements ont lieu le mercredi et le samedi après-midi. Pour connaître le créneau exact de votre catégorie, écrivez-nous.",
        "bouton": "Nous contacter",
        "lien": "contact.html"
      }
```

Pour « École de volley » :

```json
      "infos": {
        "titre": "Découvrir le volley",
        "texte": "L'école de volley accueille les plus jeunes, en catégories M11 et baby-volley, le samedi matin à 10h au gymnase Lavoisier. Pour inscrire votre enfant ou poser une question, écrivez-nous.",
        "bouton": "Nous contacter",
        "lien": "contact.html"
      }
```

- [ ] **Step 5: Vérifier le rendu complet**

Run: `npm run check`

Expected: PASS — `OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe.`

Run: `npx wrangler dev`

| URL | Résultat attendu |
| --- | --- |
| `http://localhost:8787/equipe.html?e=ecole-de-volley` | En-tête, puis « Découvrir le volley » avec son texte et un bouton « Nous contacter » menant à `contact.html`, puis le pied. Toujours aucune section matchs, classement ni effectif. |
| `http://localhost:8787/equipe.html?e=jeunes` | Idem avec « Jouer en compétition jeunes ». |
| `http://localhost:8787/equipe.html?e=n3-masculin` | Inchangé : pas de bloc infos, matchs et effectif toujours là. |

Passer une dernière fois sur les 5 pages équipe, sur `equipes.html` et sur `calendrier.html` à 360 px de large : aucun débordement horizontal nulle part.

Vérifier enfin que `local_backend: true` est bien recommenté dans `config.yml` s'il a été décommenté à l'étape 3 :

Run: `grep -n "local_backend" site/admin/config.yml`

Expected: la ligne est présente mais commentée — `  # local_backend: true`

Arrêter le serveur avec Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add site/admin/config.yml site/content/teams.json
git commit -m "Decap : champs des pages equipe et infos des equipes de formation

Ajoute slug, groupe, photo, lien de classement propre a l equipe et bloc
infos pratiques a la collection Equipes, ainsi que le rattachement du
match a une equipe. Redige les infos pratiques des jeunes et de l ecole
de volley, que le bureau pourra affiner.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Récapitulatif de la couverture du spec

| Exigence du spec | Tâche |
| --- | --- |
| `slug`, `groupe`, `photo`, `classement`, `infos` sur les équipes | 1 (slug, groupe), 6 (Decap et contenu) |
| Champ `equipe` sur les matchs, valeurs des 6 matchs existants | 1 |
| Non-régression : match non tagué toujours visible sur `calendrier.html` | 3 (vérifié), 6 (hint Decap) |
| `teamUrl(slug)` unique constructeur d'URL | 2 |
| Bloc 1 en-tête, bloc 7 pied, cas introuvable | 2 |
| Blocs 3 et 4 matchs, bloc 5 classement avec repli conditionnel | 3 |
| Blocs 2 infos pratiques et 6 effectif | 4 |
| Index groupé, carte non cliquable sans slug, groupe « Autres » | 5 |
| Portraits en `loading="lazy"`, index allégé | 4, 5 |
| Aucune règle CSS nouvelle | toutes |
| Repli si le widget `relation` échoue | 6 |
