import { normaliserNom, saisonDe } from "./noms.mjs";

// Les deux fusions suivent des regles opposees, et l asymetrie est voulue :
// elle suit qui fait autorite sur quoi.
//
//   Resultats  -> la saisie manuelle l emporte. Le bureau corrige une erreur de
//                 la federation, ou saisit un score le samedi soir avant qu elle
//                 ne publie. Un score deja present n est jamais ecrase.
//   Classement -> le moissonnage l emporte. C est un instantane complet, pas des
//                 lignes qu on amende. Le fichier saisi est le repli.
//
// Aucune des deux ne modifie l objet recu : le worker doit pouvoir servir les
// octets d origine si quoi que ce soit echoue.

export function fusionnerMatchs(fichier, moisson) {
  const items = (fichier && fichier.items) || [];
  return {
    ...fichier,
    items: items.map((m) => {
      const numero = String(m.numero || "").trim().toUpperCase();
      // Un score deja saisi fait autorite : on ne regarde meme pas la moisson.
      if (!numero || String(m.score || "").trim()) return m;
      const poule = numero.slice(0, 3);
      const saison = (moisson || {})[saisonDe(m.date)];
      const trouve = saison && saison[poule] && saison[poule].resultats[numero];
      if (!trouve) return m;
      // Un match qui affiche un score ne peut pas rester annonce « a venir ».
      return { ...m, score: trouve.score, gagne: trouve.gagne, statut: "termine" };
    }),
  };
}

export function fusionnerClassement(fichier, moisson, nomsFfvb, poules) {
  const items = (fichier && fichier.items) || [];
  return {
    ...fichier,
    items: items.map((tableau) => {
      const poule = (poules || {})[tableau.equipe];
      if (!poule) return tableau;
      // Le classement d une poule vaut pour la saison en cours : c est le cron
      // qui l a ecrit, avec la date du jour.
      const saison = (moisson || {})[saisonDe(new Date())];
      const lignes = saison && saison[poule] && saison[poule].classement;
      // Un tableau vide ne remplace rien : avant la premiere journee, la
      // federation en publie un sans lignes.
      if (!Array.isArray(lignes) || !lignes.length) return tableau;
      const attendu = normaliserNom((nomsFfvb || {})[tableau.equipe] || "");
      // Champ vide : on retombe sur la sous-chaine BRIVE, suffisante tant qu une
      // seule equipe du club joue la poule.
      const estNotre = (club) => {
        const cle = normaliserNom(club);
        return attendu ? cle === attendu : cle.includes("BRIVE");
      };
      const marquees = lignes.filter((l) => estNotre(l.club)).length;
      return {
        ...tableau,
        lignes: lignes.map((l) => ({
          club: l.club,
          joues: l.joues,
          victoires: l.victoires,
          defaites: l.defaites,
          points: l.points,
          // Zero ou plusieurs correspondances : aucune ligne marquee. On ne
          // devine pas plus ici qu ailleurs.
          notre_club: marquees === 1 && estNotre(l.club),
        })),
      };
    }),
  };
}
