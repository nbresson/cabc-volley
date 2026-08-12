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

if (erreurs.length) {
  console.error("Contenu invalide :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}

const tagues = matchs.filter((m) => m.equipe).length;
console.log(`OK — ${equipes.length} équipes, ${matchs.length} matchs dont ${tagues} rattachés à une équipe.`);
