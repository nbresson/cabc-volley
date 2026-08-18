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

// recuperer est injecte : le controle l appelle avec un echantillon, le worker
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
