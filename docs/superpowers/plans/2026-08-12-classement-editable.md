# Classement éditable — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sortir le classement de la page Calendrier du HTML en dur vers `site/content/classement.json`, et l'exposer dans Decap — titre, phrase de bas de tableau et lignes éditables par le bureau.

**Architecture:** Le fichier JSON rejoint le `Promise.all` déjà présent dans le `window.__pageInit` de `site/calendrier.html`. Le `<thead>` et l'ossature du tableau restent dans le HTML ; seul le `<tbody>` est rempli en JavaScript. Le rang affiché est la position dans la liste, jamais un champ saisi. Une collection Decap `classement` et un bloc de contrôle dans `scripts/check-content.mjs` complètent le chantier.

**Tech Stack:** HTML/CSS/JavaScript sans framework ni dépendance, Decap CMS, Cloudflare Workers.

**Spec de référence :** `docs/superpowers/specs/2026-08-12-classement-editable-design.md`

## Global Constraints

- **Aucune dépendance nouvelle.** `package.json` n'est pas modifié.
- **Aucune règle CSS nouvelle.** Le tableau se construit avec `table.ds`, `tr.hl`, `.table-wrap`, `.vide`, `.muted`, `.mono`, `.display-s` — toutes existantes et déjà documentées dans la galerie. `site/assets/style.css` et `site/design-system.html` ne sont **pas** touchés.
- **Le compte du garde-fou ne bouge pas :** `npm run check` doit continuer d'afficher `OK — 67 classes dans style.css : 56 documentées, 11 exclues.` à chaque tâche.
- **Langue :** français avec accents pour toute chaîne visible, y compris les libellés et les *hints* Decap, lus par des bénévoles. Les commentaires de code du dépôt sont, eux, en français **sans** accents — s'y conformer.
- **Messages de commit en français sans accents**, suivis de :
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **Aucun fait inventé sur le club.** Le contenu livré reprend **exactement** les cinq lignes aujourd'hui affichées sur la page ; aucune équipe, aucun score, aucun point n'est ajouté ni corrigé.
- **Le rang n'est jamais un champ.** Ni dans le JSON, ni dans Decap, ni dans le contrôle. La colonne `#` vaut l'index plus un.

## Structure des fichiers

| Fichier | Responsabilité | Tâche |
| --- | --- | --- |
| `site/content/classement.json` | **Créé.** Le contenu, repris à l'identique du HTML actuel. | 1 |
| `site/calendrier.html` | **Modifié.** Le `<tbody>` en dur cède la place au rendu JSON. | 1 |
| `site/admin/config.yml` | **Modifié.** Collection `classement`. | 2 |
| `site/README.md` | **Modifié.** Inventaire des fichiers, liste des espaces Decap, phrase sur la FFVB. | 2 |
| `scripts/check-content.mjs` | **Modifié.** Contrôle des invariants du classement. | 3 |

**Ordre des tâches, et pourquoi.** Le contenu et le rendu passent en premier : la collection Decap de la tâche 2 pointe vers `site/content/classement.json`, et une collection dont le fichier n'existe pas s'ouvre en erreur dans l'admin. Le contrôle de la tâche 3 lit ce même fichier et échouerait aussi sans lui.

## Note sur la vérification

Ce dépôt n'a pas de suite de tests automatisés et ce plan n'en introduit pas.

Trois moyens sont utilisés, et chaque tâche indique lequel s'applique :

1. **`npm run check`** — les deux contrôles existants, plus celui ajouté en tâche 3. Ils ne doivent jamais passer au rouge.
2. **Assertions Node ponctuelles**, écrites dans le répertoire de travail temporaire, jamais committées.
3. **Passe visuelle** dans un navigateur, via `npx wrangler dev` depuis la racine, sur `http://localhost:8787/calendrier`. Le tableau étant rendu en JavaScript, `curl` ne le voit pas : seule la page ouverte dans un navigateur prouve le rendu. Arrêter le serveur en ciblant le processus par son port d'écoute ; ne jamais employer de filtre large sur le nom des processus.

Le répertoire de travail temporaire de la session est désigné ci-dessous par `$TMP`. Y écrire les scripts d'assertion, et rien d'autre.

---

### Task 1: Le contenu et le rendu

**Files:**
- Create: `site/content/classement.json`
- Modify: `site/calendrier.html:24-35` (la section classement) et `site/calendrier.html:39` (le `Promise.all`)

**Interfaces:**
- Consumes: `getJSON(path)`, déjà présent dans `site/assets/site.js`.
- Produces: la forme du JSON que la tâche 2 doit exposer dans Decap et que la tâche 3 doit contrôler — `titre` (string), `note` (string), et `items[]` de `{equipe, joues, victoires, defaites, points, notre_club}`, les quatre chiffres en entiers, `notre_club` en booléen. **Aucun champ de rang.**

- [ ] **Step 1: Écrire l'assertion, et la voir échouer**

L'enjeu de cette tâche est que le tableau affiché **ne change pas** en passant au JSON. L'assertion compare donc le fichier produit aux valeurs relevées dans le HTML actuel.

Écrire `$TMP/verif-classement.mjs` :

```js
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const data = JSON.parse(readFileSync("site/content/classement.json", "utf8"));

assert.equal(data.titre, "Classement Prénationale F");
assert.match(data.note, /^Classement saisi à la main/);

const attendu = [
  ["Ussel VB", 6, 6, 0, 18, false],
  ["C.A. Brive Corrèze Volley", 6, 5, 1, 15, true],
  ["Limoges VB", 6, 4, 2, 13, false],
  ["Tulle VB", 6, 2, 4, 8, false],
  ["Ussac VB", 6, 1, 5, 4, false],
];

assert.equal(data.items.length, attendu.length, "nombre de lignes");
data.items.forEach((l, i) => {
  const [equipe, j, v, d, pts, notre] = attendu[i];
  assert.equal(l.equipe, equipe, `ligne ${i + 1} : equipe`);
  assert.equal(l.joues, j, `ligne ${i + 1} : joues`);
  assert.equal(l.victoires, v, `ligne ${i + 1} : victoires`);
  assert.equal(l.defaites, d, `ligne ${i + 1} : defaites`);
  assert.equal(l.points, pts, `ligne ${i + 1} : points`);
  assert.equal(Boolean(l.notre_club), notre, `ligne ${i + 1} : notre_club`);
  for (const champ of ["joues", "victoires", "defaites", "points"]) {
    assert.ok(Number.isInteger(l[champ]), `ligne ${i + 1} : ${champ} doit etre un entier`);
  }
  assert.equal("rang" in l, false, `ligne ${i + 1} : aucun champ de rang ne doit exister`);
});

console.log("OK — classement.json reproduit le tableau en dur");
```

Lancer : `node $TMP/verif-classement.mjs`
Attendu : ÉCHEC, `ENOENT` sur `site/content/classement.json`.

- [ ] **Step 2: Créer le contenu**

Créer `site/content/classement.json` :

```json
{
  "titre": "Classement Prénationale F",
  "note": "Classement saisi à la main — le détail officiel et à jour est sur le site de la FFVB.",
  "items": [
    { "equipe": "Ussel VB", "joues": 6, "victoires": 6, "defaites": 0, "points": 18, "notre_club": false },
    { "equipe": "C.A. Brive Corrèze Volley", "joues": 6, "victoires": 5, "defaites": 1, "points": 15, "notre_club": true },
    { "equipe": "Limoges VB", "joues": 6, "victoires": 4, "defaites": 2, "points": 13, "notre_club": false },
    { "equipe": "Tulle VB", "joues": 6, "victoires": 2, "defaites": 4, "points": 8, "notre_club": false },
    { "equipe": "Ussac VB", "joues": 6, "victoires": 1, "defaites": 5, "points": 4, "notre_club": false }
  ]
}
```

- [ ] **Step 3: Relancer l'assertion**

Lancer : `node $TMP/verif-classement.mjs`
Attendu : `OK — classement.json reproduit le tableau en dur`

- [ ] **Step 4: Remplacer la section dans la page**

Dans `site/calendrier.html`, remplacer **toute** la section du classement — depuis `<section class="section pad">` jusqu'à son `</section>`, soit les lignes 24 à 35 — par :

```html
<section class="section pad">
  <div class="section-head"><h2 id="cl-titre">Classement</h2><a id="ffvb2" class="mono lien" style="color:var(--encre)" target="_blank" rel="noopener">Classement FFVB officiel →</a></div>
  <div class="table-wrap" id="cl-tableau"><table class="ds"><thead><tr><th>#</th><th>Équipe</th><th style="text-align:center">J</th><th style="text-align:center">V</th><th style="text-align:center">D</th><th style="text-align:right">Pts</th></tr></thead>
  <tbody id="cl-lignes"></tbody></table></div>
  <p class="vide muted" id="cl-vide" style="display:none">Classement à venir.</p>
  <p class="mono" id="cl-note" style="margin-top:14px;font-size:11px"></p>
</section>
```

Trois points à ne pas manquer :

- Le lien `#ffvb2` est **conservé à l'identique**, attributs compris : `__pageInit` lui affecte déjà `settings.ffvb_classement`, et le perdre casserait ce lien sans erreur visible.
- Le `<thead>` reste en dur, mot pour mot. Les six en-têtes sont de la structure, pas du contenu.
- `#cl-vide` porte `display:none` dès le HTML. Sans cela, le message « Classement à venir. » apparaîtrait une fraction de seconde à chaque chargement, avant que le JSON n'arrive.

- [ ] **Step 5: Charger le JSON et remplir le tableau**

Toujours dans `site/calendrier.html`, dans le `<script>` de fin de page.

D'abord, ajouter le fichier au `Promise.all` existant. Remplacer :

```js
  const [matches,settings]=await Promise.all([getJSON("content/matches.json"),getJSON("content/settings.json")]);
```

par :

```js
  const [matches,settings,classement]=await Promise.all([getJSON("content/matches.json"),getJSON("content/settings.json"),getJSON("content/classement.json")]);
```

La troisième lecture rejoint les deux autres dans le même `Promise.all` : elle part en parallèle, sans allonger le chargement de la page.

Puis, **juste après** la ligne qui affecte les deux liens FFVB (`if(settings?.ffvb_classement){…}`), insérer le rendu :

```js
  // Le rang n est pas stocke : c est la position dans la liste. Reordonner les
  // lignes dans Decap suffit, aucun numero n est a saisir.
  const cl=classement||{};
  document.getElementById("cl-titre").textContent=cl.titre||"Classement";
  const lignes=Array.isArray(cl.items)?cl.items:[];
  // Un chiffre absent ou illisible vaut 0 : la ligne reste lisible plutot que trouee.
  const n=v=>Number.isFinite(+v)?+v:0;
  if(lignes.length){
    document.getElementById("cl-lignes").innerHTML=lignes.map((e,i)=>`
      <tr${e.notre_club?' class="hl"':''}><td>${i+1}</td><td>${e.equipe||""}</td><td style="text-align:center">${n(e.joues)}</td><td style="text-align:center">${n(e.victoires)}</td><td style="text-align:center">${n(e.defaites)}</td><td style="text-align:right"><strong class="display-s">${n(e.points)}</strong></td></tr>`).join("");
    document.getElementById("cl-vide").remove();
  }else{
    // Sans lignes, le tableau disparait mais la section reste : son titre et le
    // lien vers le classement officiel FFVB gardent leur utilite.
    document.getElementById("cl-tableau").remove();
    document.getElementById("cl-vide").style.display="";
  }
  const note=document.getElementById("cl-note");
  if(cl.note)note.textContent=cl.note; else note.remove();
```

L'interpolation est sans échappement, comme partout ailleurs sur le site : le contenu vient d'un CMS dont l'accès est authentifié, et introduire un échappeur ici seulement créerait une exception inexpliquée.

- [ ] **Step 6: Vérifier que plus rien n'est en dur**

Lancer :

```bash
grep -c "Ussel VB\|Limoges VB\|Tulle VB\|Ussac VB" site/calendrier.html
```

Attendu : `0`. Aucun nom d'équipe ne doit subsister dans la page.

Lancer ensuite :

```bash
grep -c "Classement Prénationale F\|Classement saisi à la main" site/calendrier.html
```

Attendu : `0`. Le titre et la note ne vivent plus que dans le JSON.

- [ ] **Step 7: Contrôles existants**

Lancer : `npm run check`
Attendu : les deux lignes `OK`, dont `OK — 67 classes dans style.css : 56 documentées, 11 exclues.`

- [ ] **Step 8: Passe visuelle**

Lancer `npx wrangler dev` depuis la racine, ouvrir `http://localhost:8787/calendrier` dans un navigateur, et vérifier :

1. Cinq lignes, numérotées 1 à 5, dans l'ordre du JSON.
2. La ligne « C.A. Brive Corrèze Volley » est sur fond sable, avec son liseré noir à gauche — c'est `tr.hl`.
3. Les colonnes J, V, D sont centrées, Pts est aligné à droite et en gros caractères.
4. La phrase « Classement saisi à la main… » est sous le tableau, en petites capitales.
5. Le lien « Classement FFVB officiel → » pointe toujours vers l'adresse des réglages du club.
6. À 360 px de large, le tableau défile horizontalement **dans son cadre**, sans pousser la page.

Comparer avec la version précédente : `git stash`, recharger, `git stash pop`. Le rendu doit être indiscernable.

- [ ] **Step 9: Éprouver les états vides**

Toujours avec le serveur lancé, trois essais successifs :

1. Renommer temporairement `site/content/classement.json` → la section affiche le titre « Classement », le lien FFVB, et « Classement à venir. ». Aucune erreur dans la console. Restaurer le fichier.
2. Remplacer temporairement `"items"` par `[]` → même affichage, mais le titre et la note du JSON sont bien repris. Restaurer.
3. Vider `"note"` (`""`) → aucun paragraphe sous le tableau, et **aucun espace vertical résiduel** : le paragraphe doit être retiré du DOM, pas seulement vidé. Restaurer.

Arrêter le serveur en ciblant le processus par son port d'écoute.

- [ ] **Step 10: Commit**

```bash
git add site/content/classement.json site/calendrier.html
git commit -m "Classement : le tableau de la page Calendrier vient du JSON

Le classement etait ecrit en dur dans site/calendrier.html : le club ne
pouvait pas le mettre a jour apres une journee de championnat. Titre,
lignes et phrase de bas de tableau vivent desormais dans
site/content/classement.json, repris a l'identique de l'affichage actuel.

Le rang n'est pas stocke : c'est la position dans la liste. Le thead et
l'ossature du tableau restent en dur, ce sont de la structure. Sans
lignes, la section garde son titre et le lien FFVB, et affiche un etat
vide plutot qu'un tableau creux.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: La collection Decap et la documentation

**Files:**
- Modify: `site/admin/config.yml` (nouvelle collection, après la collection `matches`)
- Modify: `site/README.md:14` (inventaire), `site/README.md:96` (insertion après la ligne « Matchs & résultats ») et `site/README.md:105-106` (phrase sur la FFVB)

**Interfaces:**
- Consumes: la forme du JSON produite en tâche 1 — `titre`, `note`, `items[]` de `{equipe, joues, victoires, defaites, points, notre_club}`.
- Produces: rien que la tâche 3 consomme. Cette tâche est indépendante du contrôle.

- [ ] **Step 1: Ajouter la collection**

Dans `site/admin/config.yml`, insérer le bloc suivant **entre** la collection `matches` et la collection `teams`. La place n'est pas indifférente : le bureau met à jour les scores et le classement dans la même session, après une journée de championnat.

```yaml
  - name: classement
    label: Classement
    files:
      - name: classement
        label: Classement du championnat
        file: site/content/classement.json
        fields:
          - {name: titre, label: Titre de la section, widget: string, hint: "Affiché au-dessus du tableau, ex. Classement Prénationale F"}
          - {name: note, label: Phrase sous le tableau, widget: text, required: false, hint: "Laissez vide pour ne rien afficher sous le tableau."}
          - name: items
            label: Lignes du classement
            label_singular: Équipe
            widget: list
            summary: "{{fields.equipe}} — {{fields.points}} pts"
            hint: "Le rang n'est pas à saisir : c'est l'ordre de cette liste. Faites glisser une ligne pour la déplacer. Sans aucune ligne, la page affiche « Classement à venir »."
            fields:
              - {name: equipe, label: Équipe, widget: string}
              - {name: joues, label: Matchs joués (J), widget: number, value_type: int, min: 0, default: 0}
              - {name: victoires, label: Victoires (V), widget: number, value_type: int, min: 0, default: 0}
              - {name: defaites, label: Défaites (D), widget: number, value_type: int, min: 0, default: 0}
              - {name: points, label: Points (Pts), widget: number, value_type: int, min: 0, default: 0}
              - {name: notre_club, label: Notre club ?, widget: boolean, default: false, required: false, hint: "Met la ligne en avant sur fond sable. À cocher sur une seule ligne."}
```

Les quatre chiffres sont en `widget: number` et non en `string` comme la plupart des champs du site : c'est le seul contenu **arithmétique**, et le widget interdit d'y écrire une lettre.

- [ ] **Step 2: Vérifier que le YAML reste valide**

Le fichier n'est jamais parsé au build ; une erreur d'indentation ne se verrait qu'en ouvrant l'admin. Contrôler tout de suite, sans ajouter de dépendance — Node lit le YAML via un module intégré à `wrangler`, déjà installé :

```bash
node -e "const y=require('js-yaml');const c=y.load(require('fs').readFileSync('site/admin/config.yml','utf8'));const n=c.collections.map(x=>x.name);console.log(n.join(' · '));if(!n.includes('classement'))throw new Error('collection classement absente');console.log('OK — '+c.collections.length+' collections')"
```

Attendu : la liste des collections contient `classement` entre `matches` et `teams`, puis `OK — 10 collections`.

Si `js-yaml` n'est pas résoluble depuis la racine, le repli est un contrôle visuel dans l'admin (étape 3) : ne pas installer de dépendance pour cette vérification.

- [ ] **Step 3: Vérifier dans l'admin**

Lancer `npx decap-server` dans un terminal, décommenter `local_backend: true` dans `site/admin/config.yml`, servir le site (`npx serve site`) et ouvrir `/admin/`.

Vérifier :

1. « Classement » apparaît dans le menu de gauche, entre « Matchs & résultats » et « Équipes & effectifs ».
2. Les cinq lignes s'affichent, chacune résumée `Ussel VB — 18 pts` une fois repliée.
3. Une ligne s'ajoute, se déplace par glisser-déposer, et se supprime.
4. Les champs chiffrés refusent une lettre.
5. Enregistrer sans rien changer ne réordonne ni ne réécrit le JSON de façon inattendue : `git diff site/content/classement.json` reste vide, ou ne montre qu'une différence de formatage.

**Remettre `local_backend: true` en commentaire** avant de committer. Le laisser actif casserait l'admin en production.

- [ ] **Step 4: Mettre le README à jour**

Trois passages, et les trois comptent.

D'abord l'inventaire des fichiers, ligne 14. Remplacer :

```
  content/     settings/news/matches/teams/products/gymnases/club/legal/infos .json  ← contenu éditable
```

par :

```
  content/     settings/news/matches/classement/teams/products/gymnases/club/legal/infos .json  ← contenu éditable
```

Ensuite la liste des espaces Decap. Insérer, juste après la ligne « **Matchs & résultats** » :

```markdown
- **Classement** — titre de la section, lignes du tableau (équipe, J, V, D, points) et phrase affichée sous le tableau ; le rang n'est pas saisi, c'est l'ordre des lignes
```

Enfin la phrase des lignes 105-106, qui devient fausse. Remplacer :

```markdown
Les classements/calendriers détaillés restent sur la FFVB (bouton présent sur la page Calendrier) ;
seuls les matchs mis en avant sont saisis à la main.
```

par :

```markdown
Le classement affiché sur la page Calendrier est saisi à la main, dans l'espace « Classement » ;
les calendriers et classements détaillés restent sur la FFVB (bouton présent sur la page Calendrier).
```

Cette troisième correction est la plus facile à oublier et la seule qu'aucun contrôle automatique n'attrapera : `npm run check` compte des classes, il ne lit pas la prose.

- [ ] **Step 5: Contrôles existants**

Lancer : `npm run check`
Attendu : les deux lignes `OK`, inchangées.

- [ ] **Step 6: Commit**

```bash
git add site/admin/config.yml site/README.md
git commit -m "Classement : collection Decap et documentation

Le bureau edite le classement depuis l'admin : titre, phrase de bas de
tableau et lignes, avec les quatre chiffres en widget number pour
interdire d'y saisir une lettre. La collection est placee juste apres
les matchs, mis a jour dans la meme session.

Le README suit sur trois points : l'inventaire des fichiers de contenu,
la liste des espaces Decap, et la phrase qui affirmait que seuls les
matchs etaient saisis a la main.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Le garde-fou

**Files:**
- Modify: `scripts/check-content.mjs`

**Interfaces:**
- Consumes: `site/content/classement.json`, tel que produit en tâche 1, et l'utilitaire `lire(nom)` déjà défini en tête du script.
- Produces: rien. C'est la dernière tâche.

- [ ] **Step 1: Voir le contrôle manquer**

Introduire délibérément la faute la plus probable — deux lignes marquées « notre club » :

```bash
node -e "const f='site/content/classement.json';const fs=require('fs');const d=JSON.parse(fs.readFileSync(f,'utf8'));d.items[2].notre_club=true;fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n')"
npm run check
```

Attendu : `npm run check` **passe** alors que le contenu est faux. C'est le manque que cette tâche comble.

Ne pas restaurer le fichier tout de suite : il sert à l'étape 3.

- [ ] **Step 2: Ajouter le contrôle**

Dans `scripts/check-content.mjs`, ajouter la lecture du fichier sous celle des matchs :

```js
const classement = lire("classement.json").items || [];
```

Puis, après la boucle qui contrôle les matchs et **avant** le `if (erreurs.length)`, insérer :

```js
// Le rang n est pas un champ : c est l ordre des lignes. On contrele donc le
// contenu de chaque ligne, jamais sa numerotation.
let notres = 0;
classement.forEach((ligne, i) => {
  const rang = i + 1;
  const nom = typeof ligne.equipe === "string" ? ligne.equipe.trim() : "";
  if (!nom) {
    erreurs.push(`Classement, ligne ${rang} : nom d'équipe manquant`);
  }
  for (const champ of ["joues", "victoires", "defaites", "points"]) {
    const valeur = ligne[champ];
    if (!Number.isInteger(valeur) || valeur < 0) {
      erreurs.push(
        `Classement, ligne ${rang} (${nom || "sans nom"}) : « ${champ} » doit être un entier positif ou nul, reçu ${JSON.stringify(valeur)}`,
      );
    }
  }
  if (ligne.notre_club) notres += 1;
});
// Deux lignes surlignees : l erreur de saisie la plus probable, et celle que la
// relecture visuelle rate le plus facilement.
if (notres > 1) {
  erreurs.push(`Classement : ${notres} lignes marquées « notre club », une seule doit l'être`);
}
```

Enfin, la ligne finale. Remplacer :

```js
console.log(`OK — ${equipes.length} équipes, ${matchs.length} matchs dont ${tagues} rattachés à une équipe.`);
```

par :

```js
console.log(
  `OK — ${equipes.length} équipes, ${matchs.length} matchs dont ${tagues} rattachés à une équipe, ${classement.length} lignes de classement.`,
);
```

**Volontairement non contrôlé :** la cohérence de `joues` avec `victoires + defaites`. Un forfait ou un match à rejouer la rend fausse à raison ; le contrôle bloquerait alors une saisie correcte.

- [ ] **Step 3: Voir le contrôle attraper la faute**

Lancer : `npm run check`
Attendu : ÉCHEC, avec la ligne `- Classement : 2 lignes marquées « notre club », une seule doit l'être`, et un code de sortie non nul.

- [ ] **Step 4: Restaurer le contenu**

```bash
git checkout site/content/classement.json
npm run check
```

Attendu : `OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe, 5 lignes de classement.` puis la ligne des classes, inchangée.

- [ ] **Step 5: Éprouver les deux autres contrôles**

Un chiffre non entier :

```bash
node -e "const f='site/content/classement.json';const fs=require('fs');const d=JSON.parse(fs.readFileSync(f,'utf8'));d.items[0].points='dix-huit';fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n')"
npm run check
```

Attendu : ÉCHEC, message nommant la ligne 1, le champ `points` et la valeur reçue.

Un nom vide :

```bash
git checkout site/content/classement.json
node -e "const f='site/content/classement.json';const fs=require('fs');const d=JSON.parse(fs.readFileSync(f,'utf8'));d.items[3].equipe='   ';fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n')"
npm run check
```

Attendu : ÉCHEC, `- Classement, ligne 4 : nom d'équipe manquant`.

Restaurer : `git checkout site/content/classement.json`

- [ ] **Step 6: Commit**

```bash
git add scripts/check-content.mjs
git commit -m "Classement : controle des lignes avant mise en ligne

Trois invariants : un nom d'equipe sur chaque ligne, des entiers positifs
dans les quatre colonnes chiffrees, et au plus une ligne marquee « notre
club ». Cette derniere est l'erreur de saisie la plus probable et celle
que la relecture visuelle rate le plus facilement.

La coherence de J avec V + D n'est volontairement pas controlee : un
forfait ou un match a rejouer la rend fausse a raison.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Vérification finale

Après les trois tâches, avant de proposer la fusion :

- [ ] `npm run check` affiche `OK — 5 équipes, 6 matchs dont 6 rattachés à une équipe, 5 lignes de classement.` et `OK — 67 classes dans style.css : 56 documentées, 11 exclues.`
- [ ] `git diff main --stat` ne montre que les cinq fichiers du tableau de structure, plus la spec et ce plan. **`site/assets/style.css` et `site/design-system.html` ne doivent pas y figurer.**
- [ ] La page Calendrier rend le même tableau qu'avant le chantier, à 360 px et en pleine largeur.
- [ ] `local_backend: true` est bien resté en commentaire dans `site/admin/config.yml`.
- [ ] Aucun script d'assertion n'a été committé : `git status` est propre.
