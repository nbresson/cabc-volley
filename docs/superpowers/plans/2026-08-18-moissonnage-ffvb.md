# Moissonnage FFVB — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le worker Cloudflare moissonne classements et résultats sur le site de la FFVB le week-end, les garde en cache, et les injecte à la volée dans `matches.json` et `classement.json` sans jamais écrire dans le dépôt.

**Architecture:** Quatre modules purs sous `ffvb/` — normalisation, analyse du calendrier, analyse du classement, fusion — testés sans réseau sur des pages réelles enregistrées. Le worker les câble : un gestionnaire `scheduled` qui moissonne et écrit en KV, un gestionnaire `fetch` qui intercepte les deux fichiers JSON et fusionne. Toute erreur fait servir les octets d'origine.

**Tech Stack:** JavaScript modules ES, Cloudflare Workers (KV, cron triggers), Node 20+ pour les contrôles. Aucune dépendance nouvelle.

**Spec:** [`docs/superpowers/specs/2026-08-18-moissonnage-ffvb-design.md`](../specs/2026-08-18-moissonnage-ffvb-design.md)

## Global Constraints

- **Fins de ligne CRLF** dans tous les fichiers suivis, sauf `wrangler.jsonc`. Écrire un fichier en LF produit un diff qui touche chaque ligne.
- **Commentaires de code en français, sans accents** (`entree`, `equipe`, `perimetre`). Les chaînes affichées gardent leurs accents.
- Les commentaires disent **pourquoi**, pas quoi.
- **Messages de commit** : `Domaine : sujet en français sans accents`, puis un corps qui expose le raisonnement.
- `npm run check` doit passer à la fin de chaque tâche. C'est le seul garde-fou, et il est bloquant en production.
- **Aucune dépendance npm nouvelle.** La seule dépendance du dépôt est `wrangler`.
- Une branche par tâche, PR, `gh pr merge --merge --delete-branch`. **Le merge sur `main` déploie en production : demander avant.**

---

## Structure des fichiers

| Fichier | Responsabilité |
| --- | --- |
| `ffvb/noms.mjs` | Normaliser un nom de club, calculer la saison d'une date. Pur. |
| `ffvb/calendrier.mjs` | Lire les lignes de match d'une page. Pur. |
| `ffvb/classement.mjs` | Lire le tableau de classement d'une page. Pur. |
| `ffvb/fusion.mjs` | Injecter une moisson dans `matches.json` et `classement.json`. Pur. |
| `ffvb/moisson.mjs` | Aller chercher les pages et assembler l'objet mis en cache. Réseau. |
| `ffvb/echantillons/*.html` | Pages réelles figées, pour éprouver les parseurs sans réseau. |
| `scripts/check-ffvb.mjs` | Contrôle des parseurs sur les échantillons, branché sur `npm run check`. |
| `worker.js` | Câblage : gestionnaire `scheduled`, interception des deux JSON. |
| `wrangler.jsonc` | Liaison KV et déclenchement cron. |
| `site/admin/config.yml` | Champ « Nom de l'équipe chez la FFVB ». |

Les modules purs ne connaissent ni Cloudflare ni le réseau : c'est ce qui les rend contrôlables par `npm run check`, qui tourne sous Node.

---

### Task 1 : Socle — normalisation des noms et calcul de saison

**Files:**
- Create: `ffvb/noms.mjs`
- Create: `scripts/check-ffvb.mjs`
- Modify: `package.json` (script `check`)

**Interfaces:**
- Consomme : rien.
- Produit : `normaliserNom(nom) -> string`, `saisonDe(date: Date|string) -> string` au format `"2026/2027"`.

- [ ] **Step 1: Écrire le contrôle qui échoue**

Créer `scripts/check-ffvb.mjs`, dans le style de `check-content.mjs` — on accumule les erreurs, on les affiche toutes, on sort en 1 :

```js
// Controle des parseurs FFVB sur des pages reelles figees. Sans reseau : les
// echantillons sont dans ffvb/echantillons/, et ce sont eux qui figent les cas
// limites que le sondage du 18 aout a fait payer.
// Lance par `npm run check`.
import { normaliserNom, saisonDe } from "../ffvb/noms.mjs";

const erreurs = [];
const verifier = (nom, obtenu, attendu) => {
  const a = JSON.stringify(attendu);
  const o = JSON.stringify(obtenu);
  if (o !== a) erreurs.push(`${nom} : attendu ${a}, obtenu ${o}`);
};

// La federation ecrit le meme club de trois facons. Les quatre ecritures
// doivent se ramener a une seule cle, sans quoi la ligne du club serait perdue
// au hasard des poules et des saisons.
const ecritures = [
  "C.A. BRIVE/CORREZE VOLLEY",
  "C.A.BRIVE/CORREZE VOLLEY",
  "C.A. BRIVE CORREZE VOLLEY",
  "C.A. Brive Corrèze Volley",
];
for (const e of ecritures) {
  verifier(`normaliserNom(${e})`, normaliserNom(e), "CABRIVECORREZEVOLLEY");
}
// Deux equipes du club dans la meme poule doivent rester distinctes : c est la
// raison d etre du champ « Nom de l equipe chez la FFVB ».
verifier("normaliserNom(C.A. BRIVE 1)", normaliserNom("C.A. BRIVE 1"), "CABRIVE1");
verifier("normaliserNom(C.A. BRIVE 2)", normaliserNom("C.A. BRIVE 2"), "CABRIVE2");
verifier("normaliserNom(vide)", normaliserNom(""), "");
verifier("normaliserNom(undefined)", normaliserNom(undefined), "");

// La saison s ouvre en juillet : un match d avril appartient a la saison
// ouverte l annee precedente.
verifier("saisonDe(2026-09-26)", saisonDe("2026-09-26T20:00"), "2026/2027");
verifier("saisonDe(2027-04-24)", saisonDe("2027-04-24T20:00"), "2026/2027");
verifier("saisonDe(2026-07-01)", saisonDe("2026-07-01T00:00"), "2026/2027");
verifier("saisonDe(2026-06-30)", saisonDe("2026-06-30T00:00"), "2025/2026");

if (erreurs.length) {
  console.error("Parseurs FFVB — contrôle échoué :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}
console.log(`OK — parseurs FFVB : ${ecritures.length + 6} vérifications passées.`);
```

- [ ] **Step 2: Le lancer pour vérifier qu'il échoue**

Run: `node scripts/check-ffvb.mjs`
Expected: FAIL — `Cannot find module` sur `../ffvb/noms.mjs`.

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `ffvb/noms.mjs` :

```js
// La federation n ecrit pas le nom d un club de facon stable : sur les seules
// pages relevees, « C.A. BRIVE/CORREZE VOLLEY » 83 fois, sans l espace apres
// C.A. 20 fois, avec un espace au lieu de la barre 15 fois. On compare donc des
// cles normalisees, jamais des chaines.
export function normaliserNom(nom) {
  return String(nom == null ? "" : nom)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

// La saison d une date, au format de la federation. Elle s ouvre en juillet :
// un match d avril appartient a la saison ouverte l annee precedente. Le cron
// applique cette regle a la date courante, la fusion a la date du match — ce
// n est pas la meme chose en avril.
export function saisonDe(date) {
  const d = date instanceof Date ? date : new Date(date);
  const annee = d.getFullYear();
  return d.getMonth() >= 6 ? `${annee}/${annee + 1}` : `${annee - 1}/${annee}`;
}
```

- [ ] **Step 4: Le relancer pour vérifier qu'il passe**

Run: `node scripts/check-ffvb.mjs`
Expected: PASS — `OK — parseurs FFVB : 10 vérifications passées.`

- [ ] **Step 5: Brancher sur `npm run check`**

Dans `package.json`, ajouter le contrôle à la chaîne existante :

```json
"check": "node scripts/check-content.mjs && node scripts/check-design-system.mjs && node scripts/check-ffvb.mjs"
```

Run: `npm run check`
Expected: les trois lignes `OK — …`.

- [ ] **Step 6: Commit**

```bash
git add ffvb/noms.mjs scripts/check-ffvb.mjs package.json
git commit -m "FFVB : normalisation des noms de club et calcul de saison"
```

---

### Task 2 : Lire les lignes de match d'une page

**Files:**
- Create: `ffvb/calendrier.mjs`
- Create: `ffvb/echantillons/rmb-2025-2026.html`
- Modify: `scripts/check-ffvb.mjs`

**Interfaces:**
- Consomme : rien.
- Produit : `analyserCalendrier(html, prefixe) -> { matchs, ecartes }`. Chaque match : `{ code, date, domicile, exterieur, setsDomicile, setsExterieur, marqueDomicile, marqueExterieur, detail }`. `setsDomicile` et `setsExterieur` valent `null` pour une rencontre non jouée. `marque*` vaut `"P"`, `"F"` ou `""`. Chaque écarté : `{ code, raison }`.

- [ ] **Step 1: Enregistrer l'échantillon**

```bash
mkdir -p ffvb/echantillons
curl -s -o ffvb/echantillons/rmb-2025-2026.html \
  "https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025%2F2026&codent=LIAQ&poule=RMB"
```

Cette page est en **latin-1** : la conserver telle quelle, sans conversion. C'est le parseur qui décode.
Vérifier : `ls -l ffvb/echantillons/rmb-2025-2026.html` doit montrer environ 125 Ko.

- [ ] **Step 2: Écrire le contrôle qui échoue**

Ajouter à `scripts/check-ffvb.mjs`, après les vérifications de la tâche 1 :

```js
import { readFileSync } from "node:fs";
import { analyserCalendrier } from "../ffvb/calendrier.mjs";

// La page est servie en latin-1. La decoder autrement casse les noms de clubs.
const echantillon = (nom) =>
  new TextDecoder("iso-8859-1").decode(
    readFileSync(new URL(`../ffvb/echantillons/${nom}`, import.meta.url)),
  );

const rmb25 = echantillon("rmb-2025-2026.html");
const cal25 = analyserCalendrier(rmb25, "RMB");
const nous = cal25.matchs.filter(
  (m) => normaliserNom(m.domicile).includes("BRIVE") || normaliserNom(m.exterieur).includes("BRIVE"),
);

// Seize matchs, huit a domicile : c est le decompte que le bureau a confirme,
// et le classement publie le recoupe (16 joues).
verifier("RMB 2025/2026 — matchs de Brive", nous.length, 16);
verifier(
  "RMB 2025/2026 — dont a domicile",
  nous.filter((m) => normaliserNom(m.domicile).includes("BRIVE")).length,
  8,
);
// Les journees d exemption ne sont pas des matchs : « xxxxx » n est pas un club.
verifier("RMB 2025/2026 — aucun xxxxx retenu", cal25.matchs.filter((m) => /XXXXX/i.test(m.domicile + m.exterieur)).length, 0);
// Aucune ligne ecartee sur une saison entiere et connue.
verifier("RMB 2025/2026 — aucun match ecarte", cal25.ecartes.length, 0);

// RMB009 : Cosmic Volley porte le P, penalisation. Zero set pour lui, Brive
// gagne 3-0. Le detail publie confirme, 0:25 trois fois.
const penalise = cal25.matchs.find((m) => m.code === "RMB009");
verifier("RMB009 — marque a domicile", penalise.marqueDomicile, "P");
verifier("RMB009 — sets du penalise", penalise.setsDomicile, 0);
verifier("RMB009 — sets de l adversaire", penalise.setsExterieur, 3);
```

- [ ] **Step 3: Le lancer pour vérifier qu'il échoue**

Run: `node scripts/check-ffvb.mjs`
Expected: FAIL — `Cannot find module` sur `../ffvb/calendrier.mjs`.

- [ ] **Step 4: Écrire l'implémentation**

Créer `ffvb/calendrier.mjs` :

```js
// Structure reelle d une ligne de calendrier, douze cellules DONT DES VIDES qui
// portent l alignement — les retirer decale toutes les colonnes :
//   0 code · 1 date · 2 heure · 3 equipe a domicile · 4 separateur vide
//   5 equipe en deplacement · 6 sets dom. · 7 sets ext. · 8 detail des sets
//   9 total de points · 10 arbitres
// L equipe a domicile est toujours a gauche.
const LIGNE = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELLULE = /<td[^>]*>([\s\S]*?)<\/td>/gi;

function texte(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/ /g, " ")
    .trim();
}

function cellules(ligne) {
  return [...ligne.matchAll(CELLULE)].map((m) => texte(m[1]));
}

// P vaut penalisation, F forfait : dans les deux cas zero set et match perdu.
// Une cellule vide n est pas une anomalie, c est une rencontre non jouee.
// Toute autre valeur fait ecarter le match plutot que d inventer un score.
function lireSets(valeur) {
  const t = String(valeur || "").trim().toUpperCase();
  if (t === "") return { sets: null, marque: "" };
  if (t === "P" || t === "F") return { sets: 0, marque: t };
  if (/^\d+$/.test(t)) return { sets: Number(t), marque: "" };
  return null;
}

export function analyserCalendrier(html, prefixe) {
  const attendu = new RegExp(`^${prefixe}\\d{3}$`);
  const matchs = [];
  const ecartes = [];
  for (const l of String(html).matchAll(LIGNE)) {
    const c = cellules(l[1]);
    const code = (c[0] || "").trim();
    if (!attendu.test(code)) continue;
    const domicile = (c[3] || "").trim();
    const exterieur = (c[5] || "").trim();
    // « xxxxx » n est pas un club : c est une journee d exemption.
    if (/xxxxx/i.test(domicile) || /xxxxx/i.test(exterieur)) continue;
    const sd = lireSets(c[6]);
    const se = lireSets(c[7]);
    if (!sd || !se) {
      ecartes.push({ code, raison: `sets illisibles « ${c[6]} » / « ${c[7]} »` });
      continue;
    }
    matchs.push({
      code,
      date: (c[1] || "").trim(),
      domicile,
      exterieur,
      setsDomicile: sd.sets,
      setsExterieur: se.sets,
      marqueDomicile: sd.marque,
      marqueExterieur: se.marque,
      detail: (c[8] || "").trim(),
    });
  }
  return { matchs, ecartes };
}
```

- [ ] **Step 5: Le relancer pour vérifier qu'il passe**

Run: `npm run check`
Expected: PASS sur les trois contrôles.

- [ ] **Step 6: Commit**

```bash
git add ffvb/calendrier.mjs ffvb/echantillons/rmb-2025-2026.html scripts/check-ffvb.mjs
git commit -m "FFVB : lecture des lignes de match d une page de poule"
```

---

### Task 3 : Lire le tableau de classement, et prouver qu'on ne le recalcule pas

**Files:**
- Create: `ffvb/classement.mjs`
- Create: `ffvb/echantillons/rmb-2024-2025.html`
- Modify: `scripts/check-ffvb.mjs`

**Interfaces:**
- Consomme : rien.
- Produit : `analyserClassement(html) -> [{ club, points, joues, victoires, defaites, forfaits }]`, dans l'ordre du tableau — le rang est la position, il n'est pas stocké.

- [ ] **Step 1: Enregistrer le second échantillon**

C'est la saison où un club a déclaré forfait ; sans elle, le cas `F` n'est éprouvé nulle part.

```bash
curl -s -o ffvb/echantillons/rmb-2024-2025.html \
  "https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2024%2F2025&codent=LIAQ&poule=RMB"
```

- [ ] **Step 2: Écrire le contrôle qui échoue**

Ajouter à `scripts/check-ffvb.mjs` :

```js
import { analyserClassement } from "../ffvb/classement.mjs";

const cl25 = analyserClassement(rmb25);
verifier("RMB 2025/2026 — neuf equipes classees", cl25.length, 9);

const brive25 = cl25.find((l) => normaliserNom(l.club).includes("BRIVE"));
verifier("RMB 2025/2026 — Brive, points", brive25.points, 34);
verifier("RMB 2025/2026 — Brive, joues", brive25.joues, 16);
verifier("RMB 2025/2026 — Brive, victoires", brive25.victoires, 11);
verifier("RMB 2025/2026 — Brive, defaites", brive25.defaites, 5);

// Cosmic Volley porte une penalisation : la ligue lui retire un point. Le
// classement publie dit 5 la ou le bareme 3/2/1/0 donnerait 6. C est la preuve
// qu on lit le tableau et qu on ne le recalcule jamais.
const cosmic = cl25.find((l) => normaliserNom(l.club).includes("COSMIC"));
verifier("RMB 2025/2026 — Cosmic, points publies", cosmic.points, 5);

// Saison precedente : US Talence a declare un forfait, compte en colonne F.
const rmb24 = echantillon("rmb-2024-2025.html");
const cl24 = analyserClassement(rmb24);
const talence = cl24.find((l) => normaliserNom(l.club).includes("TALENCE"));
verifier("RMB 2024/2025 — Talence, points publies", talence.points, 12);
verifier("RMB 2024/2025 — Talence, forfaits", talence.forfaits, 1);

// Et son forfait porte bien une marque dans le calendrier.
const cal24 = analyserCalendrier(rmb24, "RMB");
const forfait = cal24.matchs.find((m) => m.marqueDomicile === "F" || m.marqueExterieur === "F");
verifier("RMB 2024/2025 — un forfait marque", forfait.code, "RMB002");
verifier("RMB 2024/2025 — sets du forfaitaire", forfait.setsExterieur, 0);
verifier("RMB 2024/2025 — sets de l adversaire", forfait.setsDomicile, 3);
```

- [ ] **Step 3: Le lancer pour vérifier qu'il échoue**

Run: `node scripts/check-ffvb.mjs`
Expected: FAIL — `Cannot find module` sur `../ffvb/classement.mjs`.

- [ ] **Step 4: Écrire l'implémentation**

Créer `ffvb/classement.mjs` :

```js
// Le tableau de classement vit sur la meme page que le calendrier. On le
// reconnait a son en-tete « Coeff.S », qu aucune autre table ne porte.
// Colonnes : 0 rang · 1 club · 2 Points · 3 Jou. · 4 Gag. · 5 Per. · 6 F.
// F. compte les forfaits declares. Il ne compte pas les penalisations.
const LIGNE = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELLULE = /<td[^>]*>([\s\S]*?)<\/td>/gi;

function texte(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/ /g, " ")
    .trim();
}

export function analyserClassement(html) {
  const tables = String(html).match(/<table[\s\S]*?<\/table>/gi) || [];
  const table = tables.find((t) => t.includes("Coeff.S"));
  if (!table) return [];
  const lignes = [];
  for (const l of table.matchAll(LIGNE)) {
    const c = [...l[1].matchAll(CELLULE)].map((m) => texte(m[1]));
    // Une ligne de classement commence par un rang suivi d un point : « 1. ».
    if (!/^\d{1,2}\.$/.test((c[0] || "").trim())) continue;
    const n = (i) => {
      const v = (c[i] || "").trim();
      return /^-?\d+$/.test(v) ? Number(v) : 0;
    };
    lignes.push({
      club: (c[1] || "").trim(),
      points: n(2),
      joues: n(3),
      victoires: n(4),
      defaites: n(5),
      forfaits: n(6),
    });
  }
  return lignes;
}
```

- [ ] **Step 5: Le relancer pour vérifier qu'il passe**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ffvb/classement.mjs ffvb/echantillons/rmb-2024-2025.html scripts/check-ffvb.mjs
git commit -m "FFVB : lecture du tableau de classement, jamais recalcule"
```

---

### Task 4 : La fusion, avec ses deux règles opposées

**Files:**
- Create: `ffvb/fusion.mjs`
- Modify: `scripts/check-ffvb.mjs`

**Interfaces:**
- Consomme : `normaliserNom`, `saisonDe` de `ffvb/noms.mjs`.
- Produit :
  - `fusionnerMatchs(fichier, moisson) -> objet` — copie de `fichier` dont les matchs sans score reçoivent celui de la moisson.
  - `fusionnerClassement(fichier, moisson, nomsFfvb, poules) -> objet` — copie de `fichier` dont chaque tableau reçoit les lignes moissonnées de sa poule. `nomsFfvb` est une table `{ slug: "nom chez la FFVB" }` issue de `teams.json` ; `poules` est `{ slug: "RMB" }`, produit par `poulesDeMatchs` à la tâche 5.
  - Forme de `moisson` : `{ "2026/2027": { RMB: { fait_le, resultats: { RMB007: { score, gagne } }, classement: [...] } } }`.

**Écart assumé avec la spécification.** Elle annonce une clé KV par saison,
`moisson:AAAA/AAAA`. Le plan n'en utilise qu'une, `moisson`, contenant les saisons.
L'intention — une seule lecture par requête — est respectée, et cette forme la tient
même quand une page mêle des matchs de deux saisons. À reporter dans la spécification
si l'implémentation le confirme.

- [ ] **Step 1: Écrire le contrôle qui échoue**

Ajouter à `scripts/check-ffvb.mjs` :

```js
import { fusionnerMatchs, fusionnerClassement } from "../ffvb/fusion.mjs";

const moisson = {
  "2026/2027": {
    RMB: {
      fait_le: "2026-10-03T18:00:00.000Z",
      resultats: { RMB005: { score: "3-1", gagne: true }, RMB007: { score: "0-3", gagne: false } },
      classement: [
        { club: "C.A. BRIVE/CORREZE VOLLEY", points: 6, joues: 2, victoires: 2, defaites: 0, forfaits: 0 },
        { club: "COSMIC VOLLEY", points: 0, joues: 2, victoires: 0, defaites: 2, forfaits: 0 },
      ],
    },
  },
};

const fichierMatchs = {
  items: [
    { numero: "RMB005", date: "2026-10-03T20:00", statut: "a_venir", score: "", adversaire: "A" },
    // Score deja saisi a la main : il ne doit jamais etre ecrase.
    { numero: "RMB007", date: "2026-10-10T20:00", statut: "termine", score: "3-2", gagne: true, adversaire: "B" },
    // Poule non moissonnee : le match doit ressortir intact.
    { numero: "3MD005", date: "2026-09-26T20:00", statut: "a_venir", score: "", adversaire: "C" },
  ],
};

const fm = fusionnerMatchs(fichierMatchs, moisson);
verifier("fusion — score injecte", fm.items[0].score, "3-1");
verifier("fusion — vainqueur injecte", fm.items[0].gagne, true);
verifier("fusion — statut bascule", fm.items[0].statut, "termine");
verifier("fusion — saisie manuelle preservee", fm.items[1].score, "3-2");
verifier("fusion — poule absente intacte", fm.items[2].score, "");
verifier("fusion — fichier d origine non modifie", fichierMatchs.items[0].score, "");

const fichierClassement = {
  items: [
    { equipe: "r1-masculin", titre: "R1 M", une: true, lignes: [{ club: "saisie a la main", joues: 0, victoires: 0, defaites: 0, points: 0, notre_club: true }] },
    { equipe: "n3-masculin", titre: "N3 M", une: false, lignes: [{ club: "intacte", joues: 0, victoires: 0, defaites: 0, points: 0, notre_club: true }] },
  ],
};
// La poule d un classement se deduit du prefixe des numeros de match de son equipe.
const fc = fusionnerClassement(fichierClassement, moisson, { "r1-masculin": "C.A. BRIVE/CORREZE VOLLEY" }, { "r1-masculin": "RMB" });
verifier("fusion classement — lignes remplacees", fc.items[0].lignes.length, 2);
verifier("fusion classement — notre ligne designee", fc.items[0].lignes[0].notre_club, true);
verifier("fusion classement — ligne adverse non marquee", fc.items[0].lignes[1].notre_club, false);
verifier("fusion classement — poule absente intacte", fc.items[1].lignes[0].club, "intacte");

// Deux equipes du club dans la meme poule : le meme tableau nourrit les deux
// entrees, chacune surlignant sa propre ligne. C est le cas qui a fait naitre le
// champ « Nom de l equipe chez la FFVB ».
const deuxEquipes = {
  items: [
    { equipe: "r1-masculin", lignes: [] },
    { equipe: "r1-masculin-2", lignes: [] },
  ],
};
const fc2 = fusionnerClassement(
  deuxEquipes,
  moisson,
  { "r1-masculin": "C.A. BRIVE/CORREZE VOLLEY", "r1-masculin-2": "COSMIC VOLLEY" },
  { "r1-masculin": "RMB", "r1-masculin-2": "RMB" },
);
verifier("une poule, deux classements — premier", fc2.items[0].lignes[0].notre_club, true);
verifier("une poule, deux classements — second", fc2.items[1].lignes[1].notre_club, true);
verifier("une poule, deux classements — pas de debordement", fc2.items[1].lignes[0].notre_club, false);

// Un classement moissonne vide ne remplace rien : avant la premiere journee la
// federation publie un tableau sans lignes, et le fichier saisi doit rester.
const moissonVide = { "2026/2027": { RMB: { fait_le: "x", resultats: {}, classement: [] } } };
const fcv = fusionnerClassement(fichierClassement, moissonVide, {}, { "r1-masculin": "RMB" });
verifier("fusion classement — vide ne remplace rien", fcv.items[0].lignes[0].club, "saisie a la main");
```

- [ ] **Step 2: Le lancer pour vérifier qu'il échoue**

Run: `node scripts/check-ffvb.mjs`
Expected: FAIL — `Cannot find module` sur `../ffvb/fusion.mjs`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `ffvb/fusion.mjs` :

```js
import { normaliserNom, saisonDe } from "./noms.mjs";

// Les deux fusions suivent des regles opposees, et l asymetrie est voulue :
// elle suit qui fait autorite sur quoi.
//
//   Resultats  -> la saisie manuelle l emporte. Le bureau corrige une erreur de
//                 la federation, ou saisit un score le samedi soir avant qu elle
//                 ne publie. Un score deja present n est jamais ecrase.
//   Classement -> le moissonnage l emporte. C est un instantane complet, pas des
//                 lignes qu on amende. Le fichier saisi est le repli.
//
// Aucune des deux ne modifie l objet recu : le worker doit pouvoir servir les
// octets d origine si quoi que ce soit echoue.

export function fusionnerMatchs(fichier, moisson) {
  const items = (fichier && fichier.items) || [];
  return {
    ...fichier,
    items: items.map((m) => {
      const numero = String(m.numero || "").trim().toUpperCase();
      // Un score deja saisi fait autorite : on ne regarde meme pas la moisson.
      if (!numero || String(m.score || "").trim()) return m;
      const poule = numero.slice(0, 3);
      const saison = (moisson || {})[saisonDe(m.date)];
      const trouve = saison && saison[poule] && saison[poule].resultats[numero];
      if (!trouve) return m;
      // Un match qui affiche un score ne peut pas rester annonce « a venir ».
      return { ...m, score: trouve.score, gagne: trouve.gagne, statut: "termine" };
    }),
  };
}

export function fusionnerClassement(fichier, moisson, nomsFfvb, poules) {
  const items = (fichier && fichier.items) || [];
  return {
    ...fichier,
    items: items.map((tableau) => {
      const poule = (poules || {})[tableau.equipe];
      if (!poule) return tableau;
      // Le classement d une poule vaut pour la saison en cours : c est le cron
      // qui l a ecrit, avec la date du jour.
      const saison = (moisson || {})[saisonDe(new Date())];
      const lignes = saison && saison[poule] && saison[poule].classement;
      // Un tableau vide ne remplace rien : avant la premiere journee, la
      // federation en publie un sans lignes.
      if (!Array.isArray(lignes) || !lignes.length) return tableau;
      const attendu = normaliserNom((nomsFfvb || {})[tableau.equipe] || "");
      // Champ vide : on retombe sur la sous-chaine BRIVE, suffisante tant qu une
      // seule equipe du club joue la poule.
      const estNotre = (club) => {
        const cle = normaliserNom(club);
        return attendu ? cle === attendu : cle.includes("BRIVE");
      };
      const marquees = lignes.filter((l) => estNotre(l.club)).length;
      return {
        ...tableau,
        lignes: lignes.map((l) => ({
          club: l.club,
          joues: l.joues,
          victoires: l.victoires,
          defaites: l.defaites,
          points: l.points,
          // Zero ou plusieurs correspondances : aucune ligne marquee. On ne
          // devine pas plus ici qu ailleurs.
          notre_club: marquees === 1 && estNotre(l.club),
        })),
      };
    }),
  };
}
```

- [ ] **Step 4: Le relancer pour vérifier qu'il passe**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ffvb/fusion.mjs scripts/check-ffvb.mjs
git commit -m "FFVB : fusion, la saisie gagne sur les resultats et le moissonnage sur le classement"
```

---

### Task 5 : Le moissonneur, et la configuration du worker

**Files:**
- Create: `ffvb/moisson.mjs`
- Modify: `wrangler.jsonc`
- Modify: `scripts/check-ffvb.mjs`

**Interfaces:**
- Consomme : `analyserCalendrier`, `analyserClassement`, `saisonDe`.
- Produit :
  - `poulesDeMatchs(matches) -> { slug: "RMB" }` — la liste des poules déduite de `matches.json`.
  - `moissonner(poules, saison, recuperer) -> { poule: { fait_le, resultats, classement } }`. `recuperer(url)` est injecté pour que la fonction reste contrôlable sans réseau.
  - `URL_POULE(saison, poule) -> string`.

- [ ] **Step 1: Écrire le contrôle qui échoue**

Ajouter à `scripts/check-ffvb.mjs` :

```js
import { poulesDeMatchs, moissonner, URL_POULE } from "../ffvb/moisson.mjs";

// La liste des poules se deduit de matches.json, elle n est pas ecrite en dur.
// Une poule peut nourrir plusieurs classements : deux equipes du club dans la
// meme competition portent le meme prefixe et des slugs differents.
const matchesFactice = {
  items: [
    { numero: "3MD005", equipe: "n3-masculin" },
    { numero: "RMB007", equipe: "r1-masculin" },
    { numero: "RMB009", equipe: "r1-masculin" },
    { numero: "RFB002", equipe: "r1-feminin" },
    { numero: "", equipe: "jeunes" },
  ],
};
verifier("poules deduites", poulesDeMatchs(matchesFactice), {
  "n3-masculin": "3MD",
  "r1-masculin": "RMB",
  "r1-feminin": "RFB",
});

// codent est une constante de la federation, pas une donnee du club.
verifier("URL nationale", URL_POULE("2026/2027", "3MD").includes("codent=ABCCS"), true);
verifier("URL regionale", URL_POULE("2026/2027", "RMB").includes("codent=LIAQ"), true);
verifier("URL saison encodee", URL_POULE("2026/2027", "RMB").includes("saison=2026%2F2027"), true);

// Le moissonnage n a pas besoin du reseau : on lui injecte de quoi recuperer.
const moissonne = await moissonner(["RMB"], "2025/2026", async () => rmb25);
verifier("moisson — une poule", Object.keys(moissonne), ["RMB"]);
verifier("moisson — neuf equipes classees", moissonne.RMB.classement.length, 9);
verifier("moisson — RMB009 gagne par Brive", moissonne.RMB.resultats.RMB009.score, "3-0");
verifier("moisson — RMB002 perdu par Brive", moissonne.RMB.resultats.RMB002.score, "0-3");
// Une poule injoignable ne fait pas tomber les autres.
const partiel = await moissonner(["RMB", "RFB"], "2025/2026", async (url) => {
  if (url.includes("RFB")) throw new Error("injoignable");
  return rmb25;
});
verifier("moisson — poule en echec omise", Object.keys(partiel), ["RMB"]);
```

- [ ] **Step 2: Le lancer pour vérifier qu'il échoue**

Run: `node scripts/check-ffvb.mjs`
Expected: FAIL — `Cannot find module` sur `../ffvb/moisson.mjs`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `ffvb/moisson.mjs` :

```js
import { analyserCalendrier } from "./calendrier.mjs";
import { analyserClassement } from "./classement.mjs";
import { normaliserNom } from "./noms.mjs";

// codent designe l entite qui organise la competition : la ligue pour les poules
// regionales, la federation pour les nationales. C est une constante de la
// federation et non une donnee du club — le demander a un benevole dans Decap
// n aurait pas de sens, il ne peut pas le savoir.
const CODENT = { RMB: "LIAQ", RFB: "LIAQ", "3MD": "ABCCS" };

export function URL_POULE(saison, poule) {
  const codent = CODENT[poule] || "LIAQ";
  return (
    "https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php" +
    `?saison=${encodeURIComponent(saison)}&codent=${codent}&poule=${poule}`
  );
}

// Le prefixe du numero de match EST le code de poule, et le champ equipe du meme
// match donne le slug. Le club engage une equipe et saisit ses matchs : le
// moissonneur suit sans qu on touche au code.
export function poulesDeMatchs(matches) {
  const out = {};
  for (const m of (matches && matches.items) || []) {
    const numero = String(m.numero || "").trim().toUpperCase();
    if (!numero || !m.equipe) continue;
    out[m.equipe] = numero.slice(0, 3);
  }
  return out;
}

// recuperer est injecte : le contrôle l appelle avec un echantillon, le worker
// avec fetch. C est ce qui rend le moissonnage eprouvable sans reseau.
export async function moissonner(poules, saison, recuperer) {
  const resultat = {};
  for (const poule of poules) {
    try {
      const html = await recuperer(URL_POULE(saison, poule), poule);
      const { matchs, ecartes } = analyserCalendrier(html, poule);
      for (const e of ecartes) {
        console.error(`FFVB ${poule} : match ${e.code} ecarte — ${e.raison}`);
      }
      const resultats = {};
      for (const m of matchs) {
        if (m.setsDomicile === null || m.setsExterieur === null) continue;
        const nous = normaliserNom(m.domicile).includes("BRIVE");
        const autre = normaliserNom(m.exterieur).includes("BRIVE");
        if (!nous && !autre) continue;
        const [a, b] = nous
          ? [m.setsDomicile, m.setsExterieur]
          : [m.setsExterieur, m.setsDomicile];
        resultats[m.code] = { score: `${a}-${b}`, gagne: a > b };
      }
      resultat[poule] = {
        fait_le: new Date().toISOString(),
        resultats,
        classement: analyserClassement(html),
      };
    } catch (e) {
      // Une poule injoignable ne doit pas emporter les autres : le cron ecrira
      // les poules reussies par-dessus l objet en cache, laissant celle-ci a sa
      // derniere valeur connue.
      console.error(`FFVB ${poule} : moissonnage echoue — ${e && e.message}`);
    }
  }
  return resultat;
}
```

- [ ] **Step 4: Le relancer pour vérifier qu'il passe**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Créer l'espace KV et déclarer la configuration**

Geste manuel, une seule fois :

```bash
npx wrangler kv namespace create FFVB
```

La commande imprime un `id`. Ajouter dans `wrangler.jsonc` — **ce fichier est le seul du dépôt en LF, ne pas le convertir** :

```jsonc
  "kv_namespaces": [
    { "binding": "FFVB", "id": "COLLER_ICI_L_ID_IMPRIME" }
  ],
  // Toutes les heures, samedi et dimanche seulement : 48 declenchements par
  // semaine au lieu de 168. Les crons sont en UTC, ce qui couvre le samedi matin
  // jusqu au lundi 1 h ou 2 h du matin en heure francaise.
  "triggers": { "crons": ["0 * * * 6,0"] },
```

- [ ] **Step 6: Commit**

```bash
git add ffvb/moisson.mjs wrangler.jsonc scripts/check-ffvb.mjs
git commit -m "FFVB : moissonneur des trois poules, et configuration du worker"
```

---

### Task 6 : Câbler le worker — cron et interception

**Files:**
- Modify: `worker.js`

**Interfaces:**
- Consomme : tout `ffvb/`.
- Produit : un gestionnaire `scheduled`, et l'interception de `/content/matches.json` et `/content/classement.json` dans `fetch`.

- [ ] **Step 1: Ajouter les imports et le gestionnaire de cron**

En tête de `worker.js`, sous les constantes existantes :

```js
import { poulesDeMatchs, moissonner } from "./ffvb/moisson.mjs";
import { fusionnerMatchs, fusionnerClassement } from "./ffvb/fusion.mjs";
import { saisonDe } from "./ffvb/noms.mjs";

const CLE_MOISSON = "moisson";

// La page de la federation est servie en latin-1 : la decoder autrement casse
// les noms de clubs.
async function texteLatin1(reponse) {
  return new TextDecoder("iso-8859-1").decode(await reponse.arrayBuffer());
}

async function json(env, origine, chemin) {
  const r = await env.ASSETS.fetch(new URL(chemin, origine));
  return r.ok ? await r.json() : null;
}
```

Puis, dans l'objet exporté, à côté de `fetch` :

```js
  // Cron du week-end. Le moissonnage ecrit poule par poule par-dessus l objet
  // en cache : une poule injoignable garde sa derniere valeur connue au lieu de
  // disparaitre.
  async scheduled(evenement, env, ctx) {
    const saison = saisonDe(new Date());
    const matches = await json(env, "https://cabc-volley/", "/content/matches.json");
    const poules = [...new Set(Object.values(poulesDeMatchs(matches)))];
    if (!poules.length) {
      console.error("FFVB : aucune poule deduite de matches.json, rien a moissonner");
      return;
    }
    const frais = await moissonner(poules, saison, async (url) =>
      texteLatin1(await fetch(url, { headers: { "user-agent": "cabc-volley-moissonneur" } })),
    );
    const ancien = (await env.FFVB.get(CLE_MOISSON, "json")) || {};
    const fusionne = { ...ancien, [saison]: { ...(ancien[saison] || {}), ...frais } };
    await env.FFVB.put(CLE_MOISSON, JSON.stringify(fusionne));
    console.log(`FFVB : ${Object.keys(frais).length}/${poules.length} poules moissonnees pour ${saison}`);
  },
```

- [ ] **Step 2: Intercepter les deux fichiers dans `fetch`**

Dans le gestionnaire `fetch`, **avant** `const reponse = await env.ASSETS.fetch(request)` :

```js
    // Les deux fichiers que la moisson peut enrichir. Toute erreur fait servir
    // les octets d origine : le worker ne casse jamais le site, on retombe sur
    // « En attente de resultat », qui reste honnete.
    const enrichissable =
      url.pathname === "/content/matches.json" || url.pathname === "/content/classement.json";
    if (enrichissable) {
      const brut = await env.ASSETS.fetch(request);
      try {
        const moisson = (await env.FFVB.get(CLE_MOISSON, "json")) || {};
        const fichier = await brut.clone().json();
        let sortie;
        if (url.pathname === "/content/matches.json") {
          sortie = fusionnerMatchs(fichier, moisson);
        } else {
          const [matches, teams] = await Promise.all([
            json(env, url.origin, "/content/matches.json"),
            json(env, url.origin, "/content/teams.json"),
          ]);
          const noms = Object.fromEntries(
            ((teams && teams.items) || []).map((t) => [t.slug, t.ffvb_nom || ""]),
          );
          sortie = fusionnerClassement(fichier, moisson, noms, poulesDeMatchs(matches));
        }
        const entetes = new Headers(brut.headers);
        if (brouillon) entetes.set("X-Robots-Tag", "noindex, nofollow");
        return new Response(JSON.stringify(sortie), { headers: entetes });
      } catch (e) {
        console.error(`FFVB : fusion impossible sur ${url.pathname} — ${e && e.message}`);
        return brut;
      }
    }
```

- [ ] **Step 3: Vérifier en local**

```bash
npx wrangler dev
```

Puis, dans un autre terminal :

```bash
curl -s http://127.0.0.1:8787/content/matches.json | head -c 300
```

Expected: du JSON valide. Sans KV rempli, il doit être **identique** au fichier du dépôt — c'est le repli qui se vérifie ici.

- [ ] **Step 4: Déclencher le cron à la main**

Le point d'entrée du cron sous `wrangler dev` est `/cdn-cgi/handler/scheduled`,
sans drapeau. `/__scheduled` rend un 404 trompeur — la page 404 du site — avec
le wrangler de ce dépôt.

```bash
curl -s "http://127.0.0.1:8787/cdn-cgi/handler/scheduled?cron=0+*+*+*+6"
```

Expected: dans la sortie de `wrangler dev`, `FFVB : 3/3 poules moissonnees pour 2026/2027`.

- [ ] **Step 5: Vérifier que la fusion opère**

```bash
curl -s http://127.0.0.1:8787/content/classement.json | head -c 400
```

Expected: les lignes de National 3 M ne sont plus celles du dépôt mais celles de la fédération.

- [ ] **Step 6: Commit**

```bash
git add worker.js
git commit -m "FFVB : le worker moissonne au cron et fusionne a la volee"
```

---

### Task 7 : Le champ Decap, et la documentation

**Files:**
- Modify: `site/admin/config.yml`
- Modify: `site/README.md`
- Modify: `docs/backlog.md`

**Interfaces:**
- Consomme : `t.ffvb_nom` lu par la tâche 6.
- Produit : rien pour le code.

- [ ] **Step 1: Ajouter le champ à la collection Équipes**

Dans `site/admin/config.yml`, juste après le champ `classement` de la collection `teams` :

```yaml
              - {name: ffvb_nom, label: Nom de l'équipe chez la FFVB, widget: string, required: false, hint: "À remplir seulement si le club aligne deux équipes dans la même poule — la fédération écrit alors « C.A. BRIVE 1 » et « C.A. BRIVE 2 ». Recopiez le nom tel qu'il figure au classement. Laissé vide, l'équipe est reconnue automatiquement."}
```

- [ ] **Step 2: Vérifier que le YAML reste valide**

```bash
node -e "console.log('config.yml lu :', require('fs').readFileSync('site/admin/config.yml','utf8').includes('ffvb_nom'))"
npm run check
```

Expected: `true`, puis les trois `OK — …`.

- [ ] **Step 3: Décrire le champ dans le README**

Dans `site/README.md`, à la ligne de la collection **Équipes & effectifs**, ajouter après « son lien de classement FFVB » : « , son nom chez la FFVB si deux équipes du club jouent la même poule ».

- [ ] **Step 4: Retirer l'entrée du backlog**

Le chantier est fait : dans `docs/backlog.md`, supprimer la section `### Moissonner classements et résultats sur le site de la FFVB` et ajouter à la liste « Fait, pour mémoire » : « moissonnage FFVB des classements et résultats ». Mettre à jour la ligne « Dernière revue ».

- [ ] **Step 5: Commit**

```bash
git add site/admin/config.yml site/README.md docs/backlog.md
git commit -m "FFVB : champ Nom de l equipe chez la FFVB, et documentation"
```

---

## Après le plan

Le moissonneur ne répond pas au **vieillissement d'un match joué que la fédération n'a pas encore publié** : la règle sur la date reste entière, et il est établi qu'elle ne doit pas affirmer « Défaite ». C'est le sujet suivant, pas celui-ci.
