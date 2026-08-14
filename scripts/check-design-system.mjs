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
  ["reveal", "etat d apparition pose par revelerSections(), jamais ecrit dans le HTML"],
  ["vu", "etat d apparition pose par revelerSections(), jamais ecrit dans le HTML"],
  ["num", "numero des entrees du menu mobile, indissociable du chrome de page"],
  ["visible", "etat de la barre match pose par initBarreMatchMobile(), jamais ecrit dans le HTML"],
  ["evitement", "lien d evitement du chrome de page, hors ecran sauf au clavier"],
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

// Pour chaque entree <article class="gal-item" data-classes="..."> pourvue
// d un <template>, verifie que chaque classe declaree dans data-classes
// apparait bien dans un class="..." a l interieur de ce meme template. Une
// entree sans data-classes ou sans template est ignoree. C est ce controle
// qui aurait detecte, mecaniquement, l ecart ou l entree des grilles
// declarait .cols-2 et .cols-4 sans les rendre.
function classesDeclareesSansRendu(html) {
  const manquantes = [];
  for (const article of html.matchAll(/<article class="gal-item"([^>]*)>([\s\S]*?)<\/article>/g)) {
    const attrMatch = article[1].match(/data-classes\s*=\s*"([^"]*)"/);
    if (!attrMatch) continue;
    const tplMatch = article[2].match(/<template>([\s\S]*?)<\/template>/);
    if (!tplMatch) continue;
    const nomMatch = article[2].match(/<div class="gal-name">([\s\S]*?)<\/div>/);
    const nomEntree = nomMatch ? nomMatch[1].replace(/<[^>]+>/g, "").trim() : "(sans nom)";
    const dansTemplate = new Set();
    for (const m of tplMatch[1].matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].trim().split(/\s+/)) if (c) dansTemplate.add(c);
    }
    for (const nom of attrMatch[1].trim().split(/\s+/)) {
      if (nom && !dansTemplate.has(nom)) manquantes.push({ nom, nomEntree });
    }
  }
  return manquantes;
}

const erreurs = [];
const duCss = classesDuCss(lire("site/assets/style.css"));
const htmlGalerie = lire("site/design-system.html");
const deLaGalerie = classesDeLaGalerie(htmlGalerie);

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

for (const { nom, nomEntree } of classesDeclareesSansRendu(htmlGalerie)) {
  erreurs.push(`Classe déclarée sans rendu : « ${nom} » figure dans le data-classes de l'entrée « ${nomEntree} » mais n'apparaît dans aucun class="" de son <template>.`);
}

if (erreurs.length) {
  console.error("Galerie du design system désynchronisée :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const documentees = [...duCss].filter((n) => deLaGalerie.has(n)).length;
console.log(`OK — ${duCss.size} classes dans style.css : ${documentees} documentées, ${EXCLUES.size} exclues.`);
