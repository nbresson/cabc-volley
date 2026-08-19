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
    .replace(/ /g, " ")
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
    // Tant qu un match n est pas joue, la federation ne rend que onze
    // cellules : les colonnes 6 et 7 (sets) sont remplacees par le gymnase,
    // qui deborde alors sur la position 7. Une ligne courte n est donc pas
    // une anomalie a signaler, juste une rencontre qui n a pas encore eu
    // lieu — le meme etat qu une cellule de sets vide sur une ligne complete.
    if (c.length < 12) {
      matchs.push({
        code,
        date: (c[1] || "").trim(),
        domicile,
        exterieur,
        setsDomicile: null,
        setsExterieur: null,
        marqueDomicile: "",
        marqueExterieur: "",
        detail: "",
      });
      continue;
    }
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
