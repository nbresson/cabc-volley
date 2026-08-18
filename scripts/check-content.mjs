// Controle des invariants de contenu edite via Decap.
// Lance par `npm run check`.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";

const lire = (nom) =>
  JSON.parse(readFileSync(new URL(`../site/content/${nom}`, import.meta.url), "utf8"));

const erreurs = [];
const equipes = lire("teams.json").items || [];
const matchs = lire("matches.json").items || [];
const classement = lire("classement.json").items || [];

const slugs = new Set();
for (const e of equipes) {
  if (!e.slug) {
    erreurs.push(`Équipe « ${e.nom} » : slug manquant`);
    continue;
  }
  if (!/^[a-z0-9-]+$/.test(e.slug)) {
    erreurs.push(`Équipe « ${e.nom} » : slug « ${e.slug} » doit être en minuscules, chiffres et tirets`);
    continue;
  }
  if (slugs.has(e.slug)) {
    erreurs.push(`Slug « ${e.slug} » utilisé par deux équipes`);
  }
  slugs.add(e.slug);
}

const numeros = new Map();
for (const m of matchs) {
  if (m.equipe && !slugs.has(m.equipe)) {
    erreurs.push(`Match contre « ${m.adversaire} » : équipe inconnue « ${m.equipe} »`);
  }
  // Le numero de match est facultatif, mais s il est saisi il doit rester unique :
  // c est sa seule raison d etre. Deux rencontres partageant le meme code feraient
  // rapprocher les resultats de l une avec ceux de l autre. Comparaison en
  // majuscules, la federation ecrivant RMB002 mais une saisie a la main pouvant
  // donner rmb002.
  const num = typeof m.numero === "string" ? m.numero.trim().toUpperCase() : "";
  if (!num) continue;
  if (numeros.has(num)) {
    erreurs.push(
      `Numéro de match « ${num} » porté deux fois : « ${numeros.get(num)} » et « ${m.adversaire} »`,
    );
  }
  numeros.set(num, m.adversaire);
}

// Un classement par poule, rattache a une equipe du club par son slug — le
// meme rattachement que les matchs. Le rang n est pas un champ : c est l ordre
// des lignes. On controle donc le contenu de chaque ligne, jamais sa
// numerotation.
let auneUne = 0;
classement.forEach((tableau, t) => {
  const oule = tableau.titre ? `« ${tableau.titre} »` : `n° ${t + 1}`;
  if (!tableau.equipe) {
    erreurs.push(`Classement ${oule} : aucune équipe rattachée`);
  } else if (!slugs.has(tableau.equipe)) {
    erreurs.push(`Classement ${oule} : équipe inconnue « ${tableau.equipe} »`);
  }
  if (tableau.une) auneUne += 1;

  const lignes = Array.isArray(tableau.lignes) ? tableau.lignes : [];
  let notres = 0;
  lignes.forEach((ligne, i) => {
    const rang = i + 1;
    const nom = typeof ligne.club === "string" ? ligne.club.trim() : "";
    if (!nom) {
      erreurs.push(`Classement ${oule}, ligne ${rang} : nom de club manquant`);
    }
    for (const champ of ["joues", "victoires", "defaites", "points"]) {
      const valeur = ligne[champ];
      if (!Number.isInteger(valeur) || valeur < 0) {
        erreurs.push(
          `Classement ${oule}, ligne ${rang} (${nom || "sans nom"}) : « ${champ} » doit être un entier positif ou nul, reçu ${JSON.stringify(valeur)}`,
        );
      }
    }
    if (ligne.notre_club) notres += 1;
  });
  // Le surlignage se compte par tableau et non plus sur tout le fichier : le
  // club figure une fois dans chacune de ses poules, c est le cas normal.
  // Deux lignes surlignees dans le meme tableau restent l erreur de saisie la
  // plus probable, et celle que la relecture visuelle rate le plus facilement.
  // La coherence de joues avec victoires + defaites n est volontairement pas
  // controlee : un forfait ou un match a rejouer la rend fausse a raison.
  if (notres > 1) {
    erreurs.push(`Classement ${oule} : ${notres} lignes marquées « notre club », une seule doit l'être`);
  }
});
// L accueil ne montre qu un classement : sans « a la une » il prendrait le
// premier venu, avec deux il en cacherait un sans le dire.
if (auneUne > 1) {
  erreurs.push(`Classement : ${auneUne} tableaux marqués « à la une », un seul doit l'être`);
}

// Un chemin d image casse ne se voit pas : la page affiche « photo a venir » et
// la compilation passe. On parcourt donc tout le contenu plutot que d enumerer
// les champs, parce que Decap peut en ajouter et qu une liste se perimerait.
const racineSite = new URL("../site/", import.meta.url);
const cheminsCites = new Map();
const parcourir = (valeur, source) => {
  if (typeof valeur === "string") {
    if (valeur.startsWith("assets/")) cheminsCites.set(valeur, source);
  } else if (Array.isArray(valeur)) {
    for (const v of valeur) parcourir(v, source);
  } else if (valeur && typeof valeur === "object") {
    for (const v of Object.values(valeur)) parcourir(v, source);
  }
};
const fichiersContenu = readdirSync(new URL("../site/content/", import.meta.url)).filter((n) =>
  n.endsWith(".json"),
);
for (const nom of fichiersContenu) parcourir(lire(nom), nom);

// Le README fixe 400 Ko par image. On avertit sans bloquer : le bureau publie
// depuis Decap, et faire echouer la compilation parce qu une photo d actualite
// pese un peu trop empecherait une publication legitime. L avertissement suffit
// a rendre la derive visible dans le journal de compilation.
const LIMITE_IMAGE = 400 * 1024;
const lourdes = [];

for (const [chemin, source] of cheminsCites) {
  const fichier = new URL(chemin, racineSite);
  if (!existsSync(fichier)) {
    erreurs.push(`${source} : image introuvable « ${chemin} »`);
    continue;
  }
  const taille = statSync(fichier).size;
  if (taille > LIMITE_IMAGE) lourdes.push({ chemin, ko: Math.round(taille / 1024) });
}

for (const { chemin, ko } of lourdes) {
  console.warn(`Attention — ${chemin} pèse ${ko} Ko, au-dessus des 400 Ko conseillés par le README.`);
}

if (erreurs.length) {
  console.error("Contenu invalide :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const tagues = matchs.filter((m) => m.equipe).length;
const lignesClassement = classement.reduce((n, t) => n + (Array.isArray(t.lignes) ? t.lignes.length : 0), 0);
console.log(
  `OK — ${equipes.length} équipes, ${matchs.length} matchs dont ${tagues} rattachés à une équipe, ${classement.length} classements totalisant ${lignesClassement} lignes, ${cheminsCites.size} images toutes présentes.`,
);
