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

// Les seances d entrainement. Elles etaient une phrase libre — trois graphies
// de Saint-Germain et trois formats d heure y avaient deja diverge sans que
// rien ne s en apercoive. Devenues des champs, elles se controlent.
const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const salles = new Set((lire("gymnases.json").items || []).map((v) => v.slug));
for (const e of equipes) {
  for (const c of e.planning || []) {
    const ou = `Équipe « ${e.nom} », séance ${c.jour || "sans jour"}`;
    if (!JOURS.includes(c.jour)) {
      erreurs.push(`${ou} : jour « ${c.jour} » inconnu`);
    }
    // Deux chiffres exiges des deux cotes : c est ce qui rend la comparaison
    // de chaines ci-dessous fiable, « 9:00 » se classant sinon apres « 10:00 ».
    for (const [nom, v] of [["de début", c.debut], ["de fin", c.fin]]) {
      if (v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) {
        erreurs.push(`${ou} : heure ${nom} « ${v} » attendue sous la forme HH:MM`);
      }
    }
    if (c.debut && c.fin && c.fin <= c.debut) {
      erreurs.push(`${ou} : la fin « ${c.fin} » ne suit pas le début « ${c.debut} »`);
    }
    if (c.gymnase && !salles.has(c.gymnase)) {
      erreurs.push(`${ou} : salle inconnue « ${c.gymnase} »`);
    }
  }
}

const seances = equipes.reduce((n, e) => n + (e.planning || []).length, 0);

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

// Les adresses ecrites en dur dans les pages echappaient a tout controle : on
// ne lisait que site/content/*.json. C est par la qu une entree de la galerie a
// pointe des semaines sur un logo inexistant sans que la compilation bronche.
const pages = readdirSync(racineSite).filter((n) => n.endsWith(".html"));
// Une valeur interpolee est calculee au chargement, on ne peut rien en dire.
// Les ancres, les protocoles et les adresses absolues ne designent pas un
// fichier du depot.
const horsDepot = (v) =>
  !v.trim() ||
  v.includes("${") ||
  v.startsWith("#") ||
  /^(?:https?:)?\/\//.test(v) ||
  /^(?:mailto|tel|javascript|data):/i.test(v);

let ciblesPages = 0;
for (const page of pages) {
  const html = readFileSync(new URL(page, racineSite), "utf8");
  for (const [, , valeur] of html.matchAll(/\b(src|href)\s*=\s*"([^"]*)"/g)) {
    if (horsDepot(valeur)) continue;
    // La requete et l ancre ne font pas partie du chemin : equipe.html?e=... et
    // calendrier.html#classement designent bien un fichier du depot.
    const chemin = valeur.split("#")[0].split("?")[0];
    if (!chemin) continue;
    ciblesPages += 1;
    if (!existsSync(new URL(chemin, racineSite))) {
      erreurs.push(`${page} : cible introuvable « ${chemin} »`);
    }
  }
}

// Le bandeau de la page Club peut compter au lieu de recopier. Une source
// inconnue ferait disparaitre le chiffre du bandeau sans un mot — le rendu
// ecarte ce qu il ne sait pas resoudre, pour ne jamais afficher « 0 equipes »
// sur un fichier absent. Le controle rattrape donc la faute de frappe que ce
// repli, sinon, avalerait.
const SOURCES = new Set(["equipes", "sites"]);
const chiffres = (lire("club.json").presentation || {}).chiffres || [];
for (const c of chiffres) {
  // « saisi » et l absence de source disent la meme chose : un nombre tenu a
  // la main. La valeur explicite existe parce que Decap gere mal les valeurs
  // falsy d un select — voir le commentaire du champ dans config.yml.
  const manuel = !c.source || c.source === "saisi";
  if (!manuel && !SOURCES.has(c.source)) {
    erreurs.push(
      `Chiffre « ${c.libelle} » : origine « ${c.source} » inconnue — attendu ` +
        `${[...SOURCES].join(" ou ")}, ou vide pour un nombre saisi à la main.`,
    );
  }
  if (manuel && !String(c.valeur || "").trim()) {
    erreurs.push(`Chiffre « ${c.libelle} » : saisi à la main mais sans nombre`);
  }
}

// Le point porte sur la carte de chaque fiche de gymnase. Il entre dans
// l adresse d un cadre : le controle d echappement ne le voit pas — il repere
// les interpolations de la forme `v.champ`, pas une variable locale qui en
// derive — donc la garantie se prend ici, sur la donnee elle-meme.
const sites = lire("gymnases.json").items || [];
// Brive et ses environs. Un point hors de cette boite n est pas refuse : le
// club peut jouer ailleurs. Mais il est signale, parce que la faute connue est
// silencieuse — trois positions ont ete commitees fausses en prenant le nombre
// qui suit @ dans une adresse Google Maps, soit le centre de la carte, decale
// de deux cents metres par le panneau lateral.
const BOITE = { lat: [44.9, 45.4], lon: [1.3, 1.8] };
for (const v of sites) {
  const a = v.lat === "" || v.lat == null ? null : Number(v.lat);
  const o = v.lon === "" || v.lon == null ? null : Number(v.lon);
  if (a === null && o === null) continue;
  const ou = `Gymnase « ${v.nom} »`;
  if (a === null || o === null) {
    erreurs.push(`${ou} : latitude et longitude vont par deux — l'une est saisie, l'autre non`);
    continue;
  }
  if (!Number.isFinite(a) || !Number.isFinite(o)) {
    erreurs.push(`${ou} : coordonnées « ${v.lat} , ${v.lon} » non numériques`);
    continue;
  }
  if (Math.abs(a) > 90 || Math.abs(o) > 180) {
    erreurs.push(`${ou} : coordonnées hors du globe — latitude ${a}, longitude ${o}`);
    continue;
  }
  if (a < BOITE.lat[0] || a > BOITE.lat[1] || o < BOITE.lon[0] || o > BOITE.lon[1]) {
    console.warn(
      `Attention — ${ou} est situé en ${a}, ${o}, loin de Brive. ` +
        `Vérifier qu'il s'agit bien des nombres suivant !3d et !4d, et non de celui qui suit @.`,
    );
  }
}

// Les anciennes URL du site officiel sont renvoyees vers une fiche d equipe.
// Rien ne verifiait que le slug vise existait encore : la refonte des equipes
// du 19 aout a laisse deux 301 permanents aboutir sur « Equipe introuvable »,
// et un 301 se met en cache chez le visiteur comme chez le moteur.
let renvois = 0;
const worker = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
for (const [, source, cible] of worker.matchAll(
  /\["([^"]+)",\s*"\/equipe\?e=([^"]+)"\]/g,
)) {
  renvois += 1;
  if (!slugs.has(cible)) {
    erreurs.push(
      `worker.js : « ${source} » renvoie vers l'équipe « ${cible} », qui n'existe plus. ` +
        `Corriger la ligne dans worker.js pour viser une équipe de teams.json — ` +
        `sans quoi ce déploiement et tous les suivants resteront bloqués.`,
    );
  }
}

if (erreurs.length) {
  console.error("Contenu invalide :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const tagues = matchs.filter((m) => m.equipe).length;
const lignesClassement = classement.reduce((n, t) => n + (Array.isArray(t.lignes) ? t.lignes.length : 0), 0);
console.log(
  `OK — ${equipes.length} équipes totalisant ${seances} séances, ${matchs.length} matchs dont ${tagues} rattachés à une équipe, ${classement.length} classements totalisant ${lignesClassement} lignes, ${cheminsCites.size} images toutes présentes, ${sites.filter((v) => v.lat !== "" && v.lat != null).length} sites situés, ${ciblesPages} adresses vérifiées dans ${pages.length} pages, ${renvois} renvois d'anciennes URL.`,
);
