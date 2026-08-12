// Controle des invariants de contenu edite via Decap.
// Lance par `npm run check`.
import { readFileSync } from "node:fs";

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

for (const m of matchs) {
  if (m.equipe && !slugs.has(m.equipe)) {
    erreurs.push(`Match contre « ${m.adversaire} » : équipe inconnue « ${m.equipe} »`);
  }
}

// Le rang n est pas un champ : c est l ordre des lignes. On controle donc le
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
// relecture visuelle rate le plus facilement. La coherence de joues avec
// victoires + defaites n est volontairement pas controlee : un forfait ou un
// match a rejouer la rend fausse a raison.
if (notres > 1) {
  erreurs.push(`Classement : ${notres} lignes marquées « notre club », une seule doit l'être`);
}

if (erreurs.length) {
  console.error("Contenu invalide :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const tagues = matchs.filter((m) => m.equipe).length;
console.log(
  `OK — ${equipes.length} équipes, ${matchs.length} matchs dont ${tagues} rattachés à une équipe, ${classement.length} lignes de classement.`,
);
