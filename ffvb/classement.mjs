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
    .replace(/ /g, " ")
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
