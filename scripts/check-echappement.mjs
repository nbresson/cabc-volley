// Verifie qu aucune interpolation des pages ne verse un champ saisi dans du HTML
// sans le faire passer par une fonction sure. Lance par `npm run check`.
//
// Le contenu vient de Decap et repart dans du HTML par des litteraux de gabarit
// puis innerHTML. echapper() a ete pose partout en aout ; ce controle empeche le
// trou de se rouvrir a la ligne suivante ecrite. Il ne remplace pas la lecture :
// il attrape le cas ordinaire, `${n.titre}` ecrit d un trait dans un gabarit.
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

// Fonctions qui neutralisent ce qu on leur passe. La liste est courte a dessein :
// l elargir revient a desarmer le controle, alors qu une exception documentee
// laisse une trace lisible.
const SURES = /\b(echapper|lienSur|mdToHtml|encodeURIComponent|teamUrl|gymnaseUrl)\s*\(/;

// Widgets Decap qui rendent du texte libre ou un chemin : ce sont eux qui peuvent
// porter un guillemet, un chevron ou un javascript:. Les booleens, les nombres et
// les dates n arrivent jamais ici sous une forme dangereuse — Decap ne les ecrit
// pas autrement, et le code les passe de toute facon par Number() ou new Date().
const WIDGETS_SAISIS = new Set(["string", "text", "markdown", "image", "file", "select"]);

// Interpolations qui citent un champ saisi et n ont pourtant pas a etre echappees.
// Chaque exception porte sa raison : sans cela la liste se remplit en silence et
// le controle perd son sens. La cle est « fichier | expression », espaces
// normalises — changer l expression oblige a redeclarer l exception.
const EXCEPTIONS = new Map([
  [
    "site/index.html | n.image?vignette(n.image,n.titre,n.cadrage):'<span>[ photo à venir ]</span>'",
    "vignette() echappe elle-meme son src et son alt ; les lui passer echappes les double-encoderait",
  ],
  [
    'site/actualites.html | n.image?vignette(n.image,n.titre,n.cadrage):\'<span class="mono" style="color:var(--mention)">[ photo à venir ]</span>\'',
    "vignette() echappe elle-meme son src et son alt",
  ],
  [
    "site/gymnase.html | vignette(p.image,p.legende||v.nom)",
    "vignette() echappe elle-meme son src et son alt",
  ],
  [
    "site/club.html | h.photo?vignette(h.photo,h.legende):'<span class=\"mono\" style=\"letter-spacing:.1em;color:var(--mention)\">[ photo d\\'archive ]</span>'",
    "vignette() echappe elle-meme son src et son alt",
  ],
  [
    'site/club.html | m.photo?vignette(m.photo,m.nom):\'<span class="mono" style="color:var(--mention)">[ portrait ]</span>\'',
    "vignette() echappe elle-meme son src et son alt",
  ],
  [
    "site/boutique.html | badge[p.statut]||''",
    "statut n indexe qu une table de badges ecrite dans le code : la valeur saisie ne sort jamais telle quelle",
  ],
  [
    'site/boutique.html | settings.permanence.replace(/\\.$/,"").toLowerCase()',
    "gabarit pose par textContent et non par innerHTML : le navigateur n y lit aucune balise",
  ],
  [
    "site/assets/site.js | ancreBloc(b.titre)",
    "slug() ne rend que des minuscules, des chiffres et des tirets ; l ancre est fabriquee, pas recopiee. L exception a suivi le rendu des documents d infos.html vers site.js, ou les deux pages le partagent.",
  ],
  [
    "site/infos.html | ancreBloc(b.titre)",
    "ancreBloc() ne rend que des minuscules, des chiffres et des tirets ; l ancre du sommaire est fabriquee, pas recopiee",
  ],
]);

// ---------------------------------------------------------------- lecture yml
// Nom de champ -> widget, tire de la configuration Decap plutot que d une liste
// ecrite ici : ajouter un champ dans Decap le met sous controle sans y penser.
function champsSaisis(yml) {
  const noms = new Set();
  const lignes = yml.split(/\r?\n/);
  const retenir = (nom, widget) => {
    if (WIDGETS_SAISIS.has(widget)) noms.add(nom);
  };
  for (let i = 0; i < lignes.length; i += 1) {
    const ligne = lignes[i];
    // Forme compacte : - {name: titre, label: Titre, widget: string}
    const compact = ligne.match(/\{\s*name:\s*([A-Za-z0-9_]+)[^}]*widget:\s*([A-Za-z0-9_]+)/);
    if (compact) {
      retenir(compact[1], compact[2]);
      continue;
    }
    // Forme deployee : « - name: titre » puis « widget: string » plus bas.
    const bloc = ligne.match(/^(\s*)-?\s*name:\s*([A-Za-z0-9_]+)\s*$/);
    if (!bloc) continue;
    const indent = bloc[1].length;
    for (let j = i + 1; j < lignes.length; j += 1) {
      const suite = lignes[j];
      if (!suite.trim()) continue;
      if (suite.length - suite.trimStart().length < indent) break;
      const w = suite.match(/^\s*widget:\s*([A-Za-z0-9_]+)/);
      if (w) {
        retenir(bloc[2], w[1]);
        break;
      }
    }
  }
  return noms;
}

// ------------------------------------------------------- decoupage des sources
// Fin d une chaine ouverte en `i` par le delimiteur `q`. Rend l index du
// delimiteur fermant.
function finChaine(src, i, q) {
  i += 1;
  while (i < src.length) {
    if (src[i] === "\\") i += 2;
    else if (src[i] === q) return i;
    else i += 1;
  }
  return src.length;
}

// Fin d un gabarit ouvert en `i` par une apostrophe inverse. Descend dans ses
// propres ${...}, qui peuvent contenir des accolades et des gabarits imbriques.
function finGabarit(src, i) {
  i += 1;
  while (i < src.length) {
    if (src[i] === "\\") i += 2;
    else if (src[i] === "`") return i;
    else if (src[i] === "$" && src[i + 1] === "{") i = finInterpolation(src, i + 1) + 1;
    else i += 1;
  }
  return src.length;
}

// Fin d une interpolation ouverte en `i` sur son accolade. Rend l index de
// l accolade fermante.
function finInterpolation(src, i) {
  let profondeur = 1;
  i += 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") i += 2;
    else if (c === '"' || c === "'") i = finChaine(src, i, c) + 1;
    else if (c === "`") i = finGabarit(src, i) + 1;
    else {
      if (c === "{") profondeur += 1;
      else if (c === "}") {
        profondeur -= 1;
        if (profondeur === 0) return i;
      }
      i += 1;
    }
  }
  return src.length;
}

// Toutes les interpolations du fichier, a tous les niveaux d imbrication.
function interpolations(src) {
  const trouvees = [];
  for (let i = 0; i < src.length - 1; i += 1) {
    if (src[i] !== "$" || src[i + 1] !== "{") continue;
    const fin = finInterpolation(src, i + 1);
    trouvees.push({ debut: i, expr: src.slice(i + 2, fin) });
  }
  return trouvees;
}

// Code propre a une interpolation : les gabarits imbriques sont retires, leurs
// propres ${...} etant deja controles pour eux-memes. Sans cela, la condition
// d un `${t.photo?`…${echapper(t.photo)}…`:""}` passerait pour un rendu.
function codePropre(expr) {
  let sortie = "";
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === "\\") {
      sortie += expr.slice(i, i + 2);
      i += 2;
    } else if (c === '"' || c === "'") {
      const fin = finChaine(expr, i, c);
      sortie += expr.slice(i, fin + 1);
      i = fin + 1;
    } else if (c === "`") {
      i = finGabarit(expr, i) + 1;
    } else {
      sortie += c;
      i += 1;
    }
  }
  return sortie;
}

// Une reference sert-elle de condition plutot que de valeur rendue ? On avance
// depuis elle en sautant chaines et groupes : tomber sur un « ? » de ternaire dit
// que la valeur nourrit un test, pas la sortie. `p.nom||""` , lui, va jusqu au
// bout de l expression : il est rendu.
function estCondition(propre, apres) {
  let i = apres;
  while (i < propre.length) {
    const c = propre[i];
    if (c === "\\") i += 2;
    else if (c === '"' || c === "'") i = finChaine(propre, i, c) + 1;
    else if (c === "(" || c === "[") {
      let profondeur = 1;
      i += 1;
      while (i < propre.length && profondeur > 0) {
        const d = propre[i];
        if (d === "\\") i += 2;
        else if (d === '"' || d === "'") i = finChaine(propre, i, d) + 1;
        else {
          if (d === "(" || d === "[") profondeur += 1;
          else if (d === ")" || d === "]") profondeur -= 1;
          i += 1;
        }
      }
    } else if (c === "?") {
      // ?. et ?? ne sont pas des ternaires.
      if (propre[i + 1] === "." || propre[i + 1] === "?") i += 2;
      else return true;
    } else i += 1;
  }
  return false;
}

// ------------------------------------------------------------------- controle
const saisis = champsSaisis(lire("site/admin/config.yml"));
const motifChamp = new RegExp(`\\.(${[...saisis].join("|")})\\b`, "g");

const fichiers = [
  ...readdirSync(new URL("../site/", import.meta.url))
    .filter((n) => n.endsWith(".html"))
    .sort()
    .map((n) => `site/${n}`),
  "site/assets/site.js",
];

const erreurs = [];
const utilisees = new Set();

for (const fichier of fichiers) {
  const src = lire(fichier);
  for (const { debut, expr } of interpolations(src)) {
    const propre = codePropre(expr);
    motifChamp.lastIndex = 0;
    const rendus = new Set();
    let m;
    while ((m = motifChamp.exec(propre))) {
      if (!estCondition(propre, m.index + m[0].length)) rendus.add(m[1]);
    }
    if (!rendus.size) continue;
    const cle = `${fichier} | ${expr.replace(/\s+/g, " ").trim()}`;
    if (EXCEPTIONS.has(cle)) {
      utilisees.add(cle);
      continue;
    }
    if (SURES.test(propre)) continue;
    const ligne = src.slice(0, debut).split("\n").length;
    const champs = [...rendus].map((c) => `« ${c} »`).join(", ");
    erreurs.push(
      `${fichier}:${ligne} — l'interpolation \${${expr.replace(/\s+/g, " ").trim()}} rend ${champs} ` +
        `sans passer par echapper(), lienSur(), mdToHtml(), encodeURIComponent(), teamUrl() ni gymnaseUrl().`,
    );
  }
}

for (const [cle, raison] of EXCEPTIONS) {
  if (!utilisees.has(cle)) {
    erreurs.push(
      `Exception inutile : « ${cle} » (${raison}) ne correspond plus à aucune interpolation, retirez-la d'EXCEPTIONS.`,
    );
  }
}

if (erreurs.length) {
  console.error("Contenu saisi versé dans du HTML sans échappement :");
  for (const e of erreurs) console.error("  -", e);
  console.error(
    "  Corrigez l'interpolation ; si le cas est légitime, déclarez-le dans EXCEPTIONS avec sa raison.",
  );
  process.exit(1);
}

console.log(
  `OK — ${fichiers.length} fichiers balayés, ${saisis.size} champs saisis surveillés, ${EXCEPTIONS.size} exceptions déclarées.`,
);
