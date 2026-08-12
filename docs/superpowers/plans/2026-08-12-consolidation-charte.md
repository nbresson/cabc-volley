# Consolidation de la charte — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nommer cinq motifs que le site emploie déjà en styles inline — échelle de titrage, retour de formulaire, jetons de mention, lien dans le texte, état vide — sans inventer aucun composant.

**Architecture:** Chaque lot ajoute ses classes à `site/assets/style.css`, remplace les occurrences inline dans les pages **et dans les gabarits de la galerie**, et ajoute ses entrées à `site/design-system.html` — dans la même tâche. Le garde-fou reste donc au vert à chaque commit, au lieu d'être rouge pendant tout le chantier.

**Tech Stack:** HTML/CSS/JavaScript sans framework ni dépendance, Cloudflare Workers.

**Spec de référence :** `docs/superpowers/specs/2026-08-12-consolidation-charte-design.md`

## Global Constraints

- **Aucune dépendance nouvelle.** `package.json` garde `wrangler` comme seule devDependency et n'est pas modifié.
- **Aucun composant nouveau.** Ce chantier ne fait que nommer des motifs existants. Ni bandeau d'alerte, ni pagination, ni onglets.
- **Aucune modification de graisse, de capitales ni d'interlignage.** Les classes `.display-*` ne portent **que la police et la taille** — voir la justification dans la tâche 5, elle est chiffrée.
- **Les gabarits de la galerie sont dans le périmètre.** `site/design-system.html` porte 13 des 48 usages inline de Barlow, dont 12 dans ses `<template>`. Les laisser en l'état ferait enseigner à la galerie un markup que le site n'emploierait plus.
- **`npm run check` doit passer à chaque commit**, avec le compte attendu de la tâche. Progression : 58/47 → 58/47 → 59/48 → 61/50 → 62/51 → **67/56**, les exclusions restant à 11.
- **Langue :** français avec accents pour toute chaîne visible.
- **Messages de commit en français sans accents**, suivis de :
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **Une seule chaîne visible par le public change dans tout le chantier** : le message d'état vide de `calendrier.html`. Tout le reste est invisible pour un visiteur, hors les 20 éléments dont la taille bouge de 2 px au plus.

## Structure des fichiers

| Fichier | Responsabilité | Tâches |
| --- | --- | --- |
| `site/assets/style.css` | **Modifié.** Trois jetons dans `:root`, neuf classes ajoutées, deux règles existantes passées aux jetons. | 1-5 |
| `site/design-system.html` | **Modifié.** Entrées des nouvelles classes, mise à jour du bloc Couleurs, et remplacement des usages inline dans ses gabarits. | 1-5 |
| Les 12 pages de `site/` | **Modifiées.** Remplacement des occurrences inline. | 1-5 |
| `site/assets/site.js` | **Modifié.** Une occurrence de lien souligné. | 2 |

**Ordre des tâches, et pourquoi.** Le lot de l'échelle de titrage vient en dernier : c'est le seul dont l'effet est visible à l'écran, et le faire après les autres évite de mêler un changement d'apparence à quatre lots invisibles.

## Note sur la vérification

Ce dépôt n'a pas de suite de tests automatisés et ce plan n'en introduit pas.

- **`npm run check`** enchaîne le contrôle de contenu et celui de la galerie. Son compte est l'assertion principale de chaque tâche.
- **Assertions Node et `grep`** sur les fichiers produits, avec des nombres attendus exacts.
- **Serveur local** par `npx wrangler dev`, `curl -L` pour suivre les redirections. Arrêter le serveur en ciblant le processus par son port ; `wrangler` relance son enfant, donc arrêter l'arbre enraciné sur le propriétaire du port. Jamais de filtre large sur le nom des processus.

Le rendu visuel n'est vérifiable par aucun agent de cette chaîne : il appartient au propriétaire du projet.

---

### Task 1: Les jetons de mention

Aucune classe créée : les jetons sont des propriétés personnalisées, que le garde-fou ne compte pas. Le compte reste donc à **58 classes, 47 documentées, 11 exclues**.

**Files:**
- Modify: `site/assets/style.css`
- Modify: `site/design-system.html`
- Modify: les pages portant ces couleurs (voir la table)

**Interfaces:**
- Consumes: rien.
- Produces: les jetons `--mention`, `--mention-sombre` et `--texte-sombre`, utilisables par les tâches suivantes.

- [ ] **Step 1: Déclarer les trois jetons**

Dans `site/assets/style.css`, dans le bloc `:root`, à la suite des jetons existants et avant `--hachures` :

```css
  --mention:#8f8672; --mention-sombre:#a89e87; --texte-sombre:#c9c1ab;
```

- [ ] **Step 2: Passer les deux règles existantes aux jetons**

Toujours dans `site/assets/style.css`, deux règles écrivent ces couleurs en dur :

```css
.card .ph span{font-family:'DM Mono',monospace;font-size:11px;color:#8f8672}
.countdown span{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.2em;color:#a89e87}
```

Remplacer `#8f8672` par `var(--mention)` et `#a89e87` par `var(--mention-sombre)` dans ces deux règles, sans rien changer d'autre.

- [ ] **Step 3: Remplacer les 38 occurrences inline**

Dans les pages et dans `site/assets/site.js`, remplacer partout :

| Valeur | Devient | Occurrences |
| --- | --- | --- |
| `#8f8672` | `var(--mention)` | 17 |
| `#a89e87` | `var(--mention-sombre)` | 12 |
| `#c9c1ab` | `var(--texte-sombre)` | 9 |

Répartition, à utiliser comme liste de contrôle :

| Fichier | `#8f8672` | `#a89e87` | `#c9c1ab` |
| --- | --- | --- | --- |
| `404.html` | | 1 | 1 |
| `actualites.html` | 1 | | |
| `adhesion.html` | | 5 | 1 |
| `article.html` | 1 | | |
| `boutique.html` | 1 | | |
| `club.html` | 2 | 1 | 1 |
| `contact.html` | 1 | 1 | 1 |
| `design-system.html` | 8 | 2 | 3 |
| `equipe.html` | 2 | | |
| `equipes.html` | 1 | | |
| `index.html` | | 2 | 1 |
| `mentions-legales.html` | | | 1 |

Les 8 occurrences de `design-system.html` comprennent les 5 qui vivent dans ses `<template>` : elles se remplacent comme les autres, c'est ce qui garde la galerie fidèle au site.

- [ ] **Step 4: Déplacer les trois couleurs dans le bloc Couleurs de la galerie**

Dans `site/design-system.html`, ces trois pastilles vivent aujourd'hui sous l'intertitre « Valeurs héritées (non tokenisées) » :

```html
<div><div class="gal-swatch" style="background:#8f8672"></div><div class="gal-name" style="margin-top:7px">#8f8672</div><div class="gal-note">mention de cadre vide</div></div>
<div><div class="gal-swatch" style="background:#a89e87"></div><div class="gal-name" style="margin-top:7px">#a89e87</div><div class="gal-note">libellé sur fond sombre</div></div>
<div><div class="gal-swatch" style="background:#c9c1ab"></div><div class="gal-name" style="margin-top:7px">#c9c1ab</div><div class="gal-note">texte de corps sur fond sombre, six pages</div></div>
```

Les déplacer dans la liste des jetons officiels, au-dessus, et les réécrire sous la forme des jetons existants :

```html
<div><div class="gal-swatch" style="background:var(--mention)"></div><div class="gal-name" style="margin-top:7px">--mention</div><div class="gal-note">#8f8672 — mention sur fond hachuré</div></div>
<div><div class="gal-swatch" style="background:var(--mention-sombre)"></div><div class="gal-name" style="margin-top:7px">--mention-sombre</div><div class="gal-note">#a89e87 — mention sur fond encre</div></div>
<div><div class="gal-swatch" style="background:var(--texte-sombre)"></div><div class="gal-name" style="margin-top:7px">--texte-sombre</div><div class="gal-note">#c9c1ab — texte courant sur fond encre</div></div>
```

L'entrée compte aujourd'hui **14 pastilles** réparties en trois groupes : 7 jetons officiels (les 6 de `:root` plus le motif hachuré), 6 valeurs supplémentaires, et 1 sous l'intertitre « Hors style.css (répétée en style inline, pas même héritée du fichier) », qui est `#c9c1ab`.

Après le déplacement des trois couleurs :

- le groupe des jetons passe à **10 pastilles** — 9 jetons plus le motif hachuré ;
- les valeurs supplémentaires tombent à **quatre** : `#4a4438`, `#3a352b`, `#fff` et `rgba(23,21,15,.05)` ;
- le groupe « Hors style.css » **devient vide** : `#c9c1ab` est désormais un jeton. Supprimer cet intertitre et son conteneur, puisqu'il ne couvre plus rien.

La phrase d'introduction dit aujourd'hui, mot pour mot :

> Six jetons déclarés dans `:root`, plus un motif hachuré : c'est la palette officielle. Six valeurs supplémentaires subsistent dans `style.css`…

Les deux nombres deviennent faux. La réécrire en **neuf jetons** et **quatre valeurs supplémentaires**, en conservant le reste de la phrase et sa consigne finale de ne pas en ajouter d'autres.

- [ ] **Step 5: Vérifier**

Run: `npm run check`
Expected: PASS, `OK — 58 classes dans style.css : 47 documentées, 11 exclues.` — **inchangé**, les jetons ne sont pas des classes.

Run: `grep -rc "#8f8672\|#a89e87\|#c9c1ab" site/*.html site/assets/site.js site/assets/style.css | grep -v ":0"`
Expected: **une seule ligne**, `site/design-system.html:3` — les trois valeurs hexadécimales subsistent uniquement dans les notes du bloc Couleurs, où elles sont documentaires. Toute autre ligne signale un remplacement oublié.

Run: `grep -c "var(--mention)\|var(--mention-sombre)\|var(--texte-sombre)" site/assets/style.css`
Expected: au moins `2` — les deux règles converties.

Extraire les `<script>` inline de `site/design-system.html` et des pages modifiées dans des fichiers `.mjs` du dossier temporaire système, `node --check` sur chacun, puis les supprimer.

Lancer `npx wrangler dev`, vérifier avec `curl -L` que `/design-system.html`, `/index.html` et `/adhesion.html` répondent en `200`, puis arrêter le serveur par son port.

- [ ] **Step 6: Commit**

```bash
git add site/assets/style.css site/design-system.html site/*.html site/assets/site.js
git commit -m "Charte : trois jetons pour les couleurs de mention

38 occurrences inline et 2 regles de la feuille de style passent par
var(). Les trois couleurs quittent la liste des valeurs heritees de la
galerie pour rejoindre les jetons officiels.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Le lien dans le texte

**Files:**
- Modify: `site/assets/style.css`
- Modify: `site/design-system.html`
- Modify: `site/assets/site.js` et les pages portant un lien souligné

**Interfaces:**
- Consumes: rien.
- Produces: la classe `.lien`.

- [ ] **Step 1: Ajouter la classe**

Dans `site/assets/style.css`, à la suite de la règle `.muted{color:#4a4438}` :

```css
.lien{border-bottom:2px solid var(--encre)}
```

C'est exactement ce que les usages déclarent en inline. La règle globale `a{color:var(--encre);text-decoration:none}` reste inchangée.

- [ ] **Step 2: Remplacer les 9 liens**

`border-bottom:2px solid var(--encre)` apparaît **15 fois** au total, mais **seulement 9 sur des `<a>`**. Les 6 autres sont des filets de séparation sur des `<div>` ou des `<section>` : **ne pas y toucher**.

Répartition des 15 occurrences, à croiser avec la balise porteuse :

| Fichier | occurrences |
| --- | --- |
| `article.html` | 1 |
| `calendrier.html` | 1 |
| `contact.html` | 4 |
| `design-system.html` | 3 |
| `equipe.html` | 1 |
| `index.html` | 2 |
| `mentions-legales.html` | 2 |
| `assets/site.js` | 1 |

Pour chaque occurrence, vérifier la balise : si c'est un `<a>`, retirer la déclaration du `style` et ajouter `lien` à sa `class`. Si la balise n'a pas d'attribut `class`, en créer un. Si le `style` devient vide, retirer l'attribut.

- [ ] **Step 3: Documenter la classe dans la galerie**

Dans `site/design-system.html`, section `#texte`, insérer cette entrée après celle de `.muted` :

```html
      <article class="gal-item" data-classes="lien">
        <div class="gal-meta"><div class="gal-name">.lien</div><p class="gal-note">Lien à l'intérieur d'un paragraphe. La règle globale <code>a</code> retire déjà le soulignement du navigateur ; cette classe rend le lien repérable dans du texte courant, là où la couleur seule ne suffit pas.</p><div class="gal-demo"></div></div>
        <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
        <template><p class="muted">Le détail officiel est sur <a class="lien" href="#texte">le site de la FFVB</a>.</p></template>
      </article>
```

- [ ] **Step 4: Vérifier**

Run: `npm run check`
Expected: PASS, `OK — 59 classes dans style.css : 48 documentées, 11 exclues.`

Run: `grep -rhoE '<a [^>]*border-bottom:2px solid var\(--encre\)[^>]*' site/*.html site/assets/site.js | wc -l`
Expected: `0` — plus aucun `<a>` ne porte cette déclaration en inline.

Run: `grep -rho "border-bottom:2px solid var(--encre)" site/*.html site/assets/site.js | wc -l`
Expected: `6` — les filets de séparation, intacts.

Run: `grep -rho 'class="[^"]*\blien\b[^"]*"' site/*.html site/assets/site.js | wc -l`
Expected: `9`

Extraire les `<script>` inline modifiés dans des `.mjs` du dossier temporaire système, `node --check`, puis les supprimer.

- [ ] **Step 5: Commit**

```bash
git add site/assets/style.css site/design-system.html site/*.html site/assets/site.js
git commit -m "Charte : classe lien pour les liens dans le texte

Neuf liens quittent le style inline. Les six filets de separation qui
partageaient la meme declaration ne sont pas touches.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Le retour de formulaire

C'est le lot qui comble le trou le plus béant : `initForms()` dans `site/assets/site.js` cherche `.ok` et `.ko` depuis toujours, et **ces deux classes n'existent nulle part dans la feuille de style**.

**Files:**
- Modify: `site/assets/style.css`
- Modify: `site/design-system.html`
- Modify: `site/adhesion.html`, `site/contact.html`

**Interfaces:**
- Consumes: rien.
- Produces: les classes `.ok` et `.ko`.

- [ ] **Step 1: Ajouter les deux classes**

Dans `site/assets/style.css`, à la suite des règles de formulaire — après `input:focus,textarea:focus,select:focus{…}` :

```css
.ok,.ko{display:none;margin-top:14px}
.ok{color:var(--encre)}
.ko{color:var(--erreur)}
```

Le `display:none` par défaut est indispensable : c'est lui qui masque les messages avant l'envoi. `initForms()` pose ensuite un `style.display="block"` inline, et un style inline l'emporte sur une règle de feuille — le mécanisme actuel continue de fonctionner sans être touché.

Effet recherché : `--erreur`, déclaré depuis toujours et employé **zéro fois** dans `style.css`, cesse d'être un jeton fantôme.

- [ ] **Step 2: Alléger les quatre paragraphes**

Les quatre occurrences, deux par formulaire :

```html
<p class="ok mono" style="display:none;margin-top:14px;color:var(--encre)">✓ Demande envoyée — on te répond sous 48 h.</p>
<p class="ko mono" style="display:none;margin-top:14px;color:var(--erreur)">✗ L'envoi a échoué — réessaie, ou écris-nous directement (voir page Contact).</p>
```
(`site/adhesion.html`)

```html
<p class="ok mono" style="display:none;margin-top:14px;color:var(--encre)">✓ Message envoyé — réponse sous 48 h.</p>
<p class="ko mono" style="display:none;margin-top:14px;color:var(--erreur)">✗ L'envoi a échoué — réessayez, ou écrivez-nous directement par email.</p>
```
(`site/contact.html`)

Retirer l'attribut `style` en entier dans les quatre : la classe porte désormais tout ce qu'il contenait. Conserver `class="ok mono"` et `class="ko mono"` — `.mono` continue de donner la police et l'interlettrage. Ne pas toucher aux textes.

- [ ] **Step 3: Documenter les deux classes dans la galerie**

Dans `site/design-system.html`, section `#blocs`, insérer cette entrée juste après celle de `label.field` :

```html
      <article class="gal-item" data-classes="ok ko">
        <div class="gal-meta"><div class="gal-name">.ok &middot; .ko</div><p class="gal-note">Retour d'envoi d'un formulaire. Les deux sont masqués par défaut ; <code>initForms()</code> dans <code>site.js</code> révèle le bon en posant un <code>display:block</code> inline, qui l'emporte sur la règle. <code>.ko</code> est le seul usage de <code>--erreur</code> dans tout le site.</p><div class="gal-demo"></div></div>
        <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
        <template><div><p class="ok mono" style="display:block">✓ Demande envoyée — on te répond sous 48 h.</p><p class="ko mono" style="display:block">✗ L'envoi a échoué — réessaie, ou écris-nous directement.</p></div></template>
      </article>
```

Le `style="display:block"` du gabarit est délibéré et doit être mentionné dans la note s'il ne l'est pas déjà : sans lui, la démonstration afficherait deux paragraphes invisibles.

- [ ] **Step 4: Vérifier**

Run: `npm run check`
Expected: PASS, `OK — 61 classes dans style.css : 50 documentées, 11 exclues.`

Run: `grep -c "var(--erreur)" site/assets/style.css`
Expected: `1` — le jeton n'est plus fantôme.

Run: `grep -rhoE '<p class="(ok|ko) mono"[^>]*>' site/adhesion.html site/contact.html`
Expected: quatre lignes, **aucune ne portant d'attribut `style`**.

Run: `grep -c "display:none" site/assets/style.css`
Expected: au moins `1`.

Lancer `npx wrangler dev`, puis vérifier avec `curl -L` que `/adhesion.html` et `/contact.html` répondent en `200`. Arrêter le serveur par son port.

**Point à signaler dans le rapport, pour la passe visuelle du propriétaire :** le seul contrôle qui prouve vraiment ce lot est de soumettre les deux formulaires et de voir apparaître le message de succès puis, en cas d'échec, celui d'erreur. La règle `display:none` ne doit pas empêcher `initForms()` de les révéler. Aucun agent de cette chaîne ne peut le faire.

- [ ] **Step 5: Commit**

```bash
git add site/assets/style.css site/design-system.html site/adhesion.html site/contact.html
git commit -m "Charte : ok et ko entrent dans la feuille de style

initForms() cherchait ces deux classes depuis toujours alors qu elles
n existaient nulle part. Le jeton --erreur cesse d etre fantome.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: L'état vide

**Files:**
- Modify: `site/assets/style.css`
- Modify: `site/design-system.html`
- Modify: `site/index.html`, `site/calendrier.html`, `site/actualites.html`

**Interfaces:**
- Consumes: rien.
- Produces: la classe `.vide`.

- [ ] **Step 1: Ajouter la classe**

Dans `site/assets/style.css`, à la suite de `.lien` ajoutée en tâche 2 :

```css
.vide{padding:28px 0}
```

Elle ne porte que l'espacement et se compose avec `.muted`, qui donne déjà la couleur du texte atténué. Y écrire la couleur dupliquerait `#4a4438` dans un chantier dont l'objet est de supprimer les valeurs écrites en dur.

- [ ] **Step 2: Unifier les trois états vides**

Les trois vivent dans les scripts de page, pas dans `site/assets/site.js` :

| Fichier | Chaîne actuelle | Devient |
| --- | --- | --- |
| `site/index.html` | `'<p class="muted">Aucun match programmé pour le moment.</p>'` | `'<p class="vide muted">Aucun match programmé pour le moment.</p>'` |
| `site/calendrier.html` | `'<p class="muted pad">Aucun match programmé.</p>'` | `'<p class="vide muted pad">Aucun match programmé pour le moment.</p>'` |
| `site/actualites.html` | `'<p class="muted">Aucune actualité pour le moment.</p>'` | `'<p class="vide muted">Aucune actualité pour le moment.</p>'` |

`calendrier.html` conserve `.pad`, qui lui donne l'espacement horizontal dont il a besoin dans son conteneur, et **s'aligne sur la tournure des deux autres** : c'est la seule chaîne visible par le public que ce chantier modifie.

- [ ] **Step 3: Documenter la classe dans la galerie**

Dans `site/design-system.html`, section `#texte`, insérer cette entrée après celle de `.lien` ajoutée en tâche 2 :

```html
      <article class="gal-item" data-classes="vide">
        <div class="gal-meta"><div class="gal-name">.vide</div><p class="gal-note">Ce qui s'affiche quand une liste est vide. Ne porte que l'espacement et se compose avec <code>.muted</code>. Le message suit une seule tournure dans tout le site : <em>Aucun<span>·</span>e &lt;chose&gt; pour le moment.</em></p><div class="gal-demo"></div></div>
        <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
        <template><p class="vide muted">Aucun match programmé pour le moment.</p></template>
      </article>
```

- [ ] **Step 4: Vérifier**

Run: `npm run check`
Expected: PASS, `OK — 62 classes dans style.css : 51 documentées, 11 exclues.`

Run: `grep -rho 'class="vide[^"]*"' site/*.html | wc -l`
Expected: `4` — les trois états vides et le gabarit de la galerie.

Run: `grep -rc "Aucun match programmé\." site/calendrier.html`
Expected: `0` — l'ancienne tournure a disparu.

Run: `grep -rho "Aucun[^<\"']\{0,60\}" site/index.html site/calendrier.html site/actualites.html | sort -u`
Expected: exactement deux tournures, `Aucun match programmé pour le moment.` et `Aucune actualité pour le moment.`

Extraire les `<script>` inline des trois pages dans des `.mjs` du dossier temporaire système, `node --check`, puis les supprimer.

- [ ] **Step 5: Commit**

```bash
git add site/assets/style.css site/design-system.html site/index.html site/calendrier.html site/actualites.html
git commit -m "Charte : classe vide et tournure unique pour les etats vides

calendrier.html s aligne sur la tournure des deux autres pages. C est la
seule chaine visible par le public que ce chantier modifie.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: L'échelle de titrage

Le seul lot dont l'effet se voit à l'écran, et le plus volumineux : 42 remplacements.

**Files:**
- Modify: `site/assets/style.css`
- Modify: `site/design-system.html`
- Modify: les 11 pages portant du Barlow inline

**Interfaces:**
- Consumes: rien.
- Produces: les classes `.display-s`, `.display-m`, `.display-l`, `.display-xl`, `.display-2xl`.

- [ ] **Step 1: Ajouter les cinq classes**

Dans `site/assets/style.css`, à la suite de la règle `.eyebrow{…}` :

```css
.display-s{font-family:'Barlow Condensed',sans-serif;font-size:22px}
.display-m{font-family:'Barlow Condensed',sans-serif;font-size:26px}
.display-l{font-family:'Barlow Condensed',sans-serif;font-size:34px}
.display-xl{font-family:'Barlow Condensed',sans-serif;font-size:40px}
.display-2xl{font-family:'Barlow Condensed',sans-serif;font-size:44px}
```

**Elles ne portent que la police et la taille, et c'est délibéré.** Y ajouter la graisse ou l'interlignage changerait l'apparence :

- la graisse varie — `<strong style="font-family:'Barlow Condensed';font-size:24px">CAB — Poitiers 3</strong>` rend en 700, la graisse par défaut de `<strong>`. Forcer 900 alourdirait **14 éléments**, dont toutes les lignes de match ;
- l'interlignage varie — `line-height:1` n'est déclaré que **15 fois sur 48** ; les 33 autres héritent du 1,65 du corps de texte, et l'imposer casserait leur rythme ;
- les capitales ne concernent que **18 usages sur 48**.

La graisse, les capitales et l'interlignage restent donc déclarés en inline là où ils s'appliquent.

- [ ] **Step 2: Remplacer les 42 usages à taille fixe**

Dans chaque `style` inline contenant `font-family:'Barlow Condensed'` **et** une `font-size` en pixels, retirer ces deux déclarations et ajouter la classe correspondante :

| Taille actuelle | Occurrences | Classe | Écart |
| --- | --- | --- | --- |
| 21 px | 6 | `display-s` | +1 px |
| 22 px | 5 | `display-s` | aucun |
| 24 px | 11 | `display-m` | +2 px |
| 25 px | 1 | `display-m` | +1 px |
| 26 px | 6 | `display-m` | aucun |
| 27 px | 1 | `display-m` | −1 px |
| 28 px | 1 | `display-m` | −2 px |
| 34 px | 1 | `display-l` | aucun |
| 40 px | 2 | `display-xl` | aucun |
| 44 px | 8 | `display-2xl` | aucun |

**Les six valeurs fluides restent en inline**, police comprise : `clamp(24px,4vw,36px)` ×4, `clamp(24px,4vw,34px)` ×1, `clamp(20px,3vw,30px)` ×1. Elles répondent à une contrainte de page précise et n'ont pas d'équivalent dans une échelle fixe.

Répartition des 48 usages, à utiliser comme liste de contrôle :

| Fichier | usages |
| --- | --- |
| `actualites.html` | 1 |
| `adhesion.html` | 3 |
| `boutique.html` | 8 |
| `calendrier.html` | 7 |
| `club.html` | 3 |
| `contact.html` | 3 |
| `design-system.html` | 13 |
| `equipe.html` | 4 |
| `equipes.html` | 1 |
| `index.html` | 3 |
| `mentions-legales.html` | 2 |

Les 13 de `design-system.html` comprennent les **12 qui vivent dans ses `<template>`** : elles se remplacent comme les autres. Une galerie qui montrerait encore du Barlow inline enseignerait un markup que le site n'emploie plus.

- [ ] **Step 3: Documenter les cinq classes dans la galerie**

Dans `site/design-system.html`, section `#texte`, insérer cette entrée juste après celle de `.eyebrow` :

```html
      <article class="gal-item" data-classes="display-s display-m display-l display-xl display-2xl">
        <div class="gal-meta"><div class="gal-name">.display-s &middot; -m &middot; -l &middot; -xl &middot; -2xl</div><p class="gal-note">Barlow Condensed sur autre chose qu'un titre : score, chiffre, nom, prix. Ces classes ne portent <strong>que la police et la taille</strong> — la graisse, les capitales et l'interlignage restent des choix explicites, parce qu'ils varient d'un usage à l'autre. Une taille fluide se déclare toujours en inline.</p><div class="gal-demo"></div></div>
        <div><pre class="gal-code"></pre><button class="gal-copy">Copier</button></div>
        <template><div style="display:flex;flex-direction:column;gap:10px"><span class="display-s">22 px &middot; .display-s</span><span class="display-m">26 px &middot; .display-m</span><span class="display-l">34 px &middot; .display-l</span><span class="display-xl">40 px &middot; .display-xl</span><span class="display-2xl">44 px &middot; .display-2xl</span></div></template>
      </article>
```

- [ ] **Step 4: Vérifier**

Run: `npm run check`
Expected: PASS, `OK — 67 classes dans style.css : 56 documentées, 11 exclues.` — le compte final du chantier.

Run: `grep -rho "font-family:'Barlow Condensed'" site/*.html | wc -l`
Expected: `6` — uniquement les six valeurs fluides. Tout autre nombre signale un remplacement oublié.

Run: `grep -rhoE "font-family:'Barlow Condensed'[^\"]*" site/*.html | grep -c "clamp("`
Expected: `6` — les six restants sont bien tous des `clamp()`.

Run: `grep -rho 'class="[^"]*\bdisplay-\(s\|m\|l\|xl\|2xl\)\b[^"]*"' site/*.html | wc -l`
Expected: au moins `42` — les 42 remplacements, plus le gabarit de la galerie qui en porte cinq.

Run: `grep -c "font-family:'Barlow Condensed'" site/assets/style.css`
Expected: `14` — les **9** occurrences préexistantes de la feuille de style, relevées avant ce chantier, plus les cinq nouvelles classes. Rapporter le nombre réel et le justifier s'il diffère.

Extraire les `<script>` inline de toutes les pages modifiées dans des `.mjs` du dossier temporaire système, `node --check` sur chacun, puis les supprimer.

Lancer `npx wrangler dev`, vérifier avec `curl -L` que les 13 pages du site répondent en `200`, puis arrêter le serveur par son port.

**Point à signaler dans le rapport :** 20 éléments changent de taille, d'au plus 2 px — ceux qui étaient en 21, 24, 25, 27 et 28 px. Le propriétaire du projet doit les contrôler visuellement ; aucun agent de cette chaîne ne le peut.

- [ ] **Step 5: Commit**

```bash
git add site/assets/style.css site/design-system.html site/*.html
git commit -m "Charte : echelle de titrage en cinq classes

42 usages inline de Barlow Condensed adoptent une classe, dont 12 dans
les gabarits de la galerie. Les six valeurs fluides restent en inline.
Les classes ne portent que police et taille : imposer graisse ou
interlignage changerait l apparence de 14 et 33 elements.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Récapitulatif de la couverture du spec

| Exigence du spec | Tâche |
| --- | --- |
| Trois jetons de mention, deux règles converties, 38 occurrences inline | 1 |
| Bloc Couleurs de la galerie mis à jour, décompte des héritées corrigé | 1 |
| `.lien` pour les 9 liens, les 6 filets non touchés | 2 |
| `.ok` et `.ko` dans la feuille de style, `--erreur` plus fantôme | 3 |
| `.vide` composée avec `.muted`, tournure unifiée | 4 |
| Échelle `.display-*`, 42 remplacements, 6 clamps préservés | 5 |
| Les classes ne portent que police et taille | 5, chiffré au step 1 |
| Gabarits de la galerie mis à jour dans chaque lot | 1 et 5 |
| Une entrée de galerie par lot, garde-fou vert à chaque commit | 2, 3, 4, 5 |
| Compte final 56 documentées + 11 exclues = 67 | 5 |
| Aucun composant nouveau | toutes |
