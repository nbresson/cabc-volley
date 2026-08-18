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
