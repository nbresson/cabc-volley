// Controle des parseurs FFVB sur des pages reelles figees. Sans reseau : les
// echantillons sont dans ffvb/echantillons/, et ce sont eux qui figent les cas
// limites que le sondage du 18 aout a fait payer.
// Lance par `npm run check`.
import { normaliserNom, saisonDe } from "../ffvb/noms.mjs";
import { readFileSync } from "node:fs";
import { analyserCalendrier } from "../ffvb/calendrier.mjs";
import { analyserClassement } from "../ffvb/classement.mjs";
import { fusionnerMatchs, fusionnerClassement } from "../ffvb/fusion.mjs";
import { poulesDeMatchs, moissonner, URL_POULE } from "../ffvb/moisson.mjs";

const erreurs = [];
// Compteur incremente par verifier(), affiche a la fin : ne pas laisser un
// total ecrit en dur se decorreler du nombre reel d appels.
let verifications = 0;
const verifier = (nom, obtenu, attendu) => {
  verifications += 1;
  const a = JSON.stringify(attendu);
  const o = JSON.stringify(obtenu);
  if (o !== a) erreurs.push(`${nom} : attendu ${a}, obtenu ${o}`);
};

// Certains cas nominaux du moissonneur tracent volontairement au journal.
// Sans capture, ce bruit attendu se melerait a la sortie de npm run check a
// chaque lancement ; capture() le detourne le temps de l appel et le rend a
// son tour verifiable, plutot que de le laisser polluer la console.
const capture = (fn) => {
  const messages = [];
  const original = console.error;
  console.error = (...args) => messages.push(args.join(" "));
  try {
    fn();
  } finally {
    console.error = original;
  }
  return messages;
};

// La federation ecrit le meme club de trois facons. Les quatre ecritures
// doivent se ramener a une seule cle, sans quoi la ligne du club serait perdue
// au hasard des poules et des saisons.
const ecritures = [
  "C.A. BRIVE/CORREZE VOLLEY",
  "C.A.BRIVE/CORREZE VOLLEY",
  "C.A. BRIVE CORREZE VOLLEY",
  "C.A. Brive Corrèze Volley",
];
for (const e of ecritures) {
  verifier(`normaliserNom(${e})`, normaliserNom(e), "CABRIVECORREZEVOLLEY");
}
// Deux equipes du club dans la meme poule doivent rester distinctes : c est la
// raison d etre du champ « Nom de l equipe chez la FFVB ».
verifier("normaliserNom(C.A. BRIVE 1)", normaliserNom("C.A. BRIVE 1"), "CABRIVE1");
verifier("normaliserNom(C.A. BRIVE 2)", normaliserNom("C.A. BRIVE 2"), "CABRIVE2");
verifier("normaliserNom(vide)", normaliserNom(""), "");
verifier("normaliserNom(undefined)", normaliserNom(undefined), "");

// La saison s ouvre en juillet : un match d avril appartient a la saison
// ouverte l annee precedente.
verifier("saisonDe(2026-09-26)", saisonDe("2026-09-26T20:00"), "2026/2027");
verifier("saisonDe(2027-04-24)", saisonDe("2027-04-24T20:00"), "2026/2027");
verifier("saisonDe(2026-07-01)", saisonDe("2026-07-01T00:00"), "2026/2027");
verifier("saisonDe(2026-06-30)", saisonDe("2026-06-30T00:00"), "2025/2026");

// La page est servie en latin-1. La decoder autrement casse les noms de clubs.
const echantillon = (nom) =>
  new TextDecoder("iso-8859-1").decode(
    readFileSync(new URL(`../ffvb/echantillons/${nom}`, import.meta.url)),
  );

const rmb25 = echantillon("rmb-2025-2026.html");
const cal25 = analyserCalendrier(rmb25, "RMB");
const nous = cal25.matchs.filter(
  (m) => normaliserNom(m.domicile).includes("BRIVE") || normaliserNom(m.exterieur).includes("BRIVE"),
);

// Seize matchs, huit a domicile : c est le decompte que le bureau a confirme,
// et le classement publie le recoupe (16 joues).
verifier("RMB 2025/2026 — matchs de Brive", nous.length, 16);
verifier(
  "RMB 2025/2026 — dont a domicile",
  nous.filter((m) => normaliserNom(m.domicile).includes("BRIVE")).length,
  8,
);
// Les journees d exemption ne sont pas des matchs : « xxxxx » n est pas un club.
verifier("RMB 2025/2026 — aucun xxxxx retenu", cal25.matchs.filter((m) => /XXXXX/i.test(m.domicile + m.exterieur)).length, 0);
// Aucune ligne ecartee sur une saison entiere et connue.
verifier("RMB 2025/2026 — aucun match ecarte", cal25.ecartes.length, 0);

// RMB009 : Cosmic Volley porte le P, penalisation. Zero set pour lui, Brive
// gagne 3-0. Le detail publie confirme, 0:25 trois fois.
const penalise = cal25.matchs.find((m) => m.code === "RMB009");
verifier("RMB009 — marque a domicile", penalise.marqueDomicile, "P");
verifier("RMB009 — sets du penalise", penalise.setsDomicile, 0);
verifier("RMB009 — sets de l adversaire", penalise.setsExterieur, 3);

const cl25 = analyserClassement(rmb25);
verifier("RMB 2025/2026 — neuf equipes classees", cl25.length, 9);

const brive25 = cl25.find((l) => normaliserNom(l.club).includes("BRIVE"));
verifier("RMB 2025/2026 — Brive, points", brive25.points, 34);
verifier("RMB 2025/2026 — Brive, joues", brive25.joues, 16);
verifier("RMB 2025/2026 — Brive, victoires", brive25.victoires, 11);
verifier("RMB 2025/2026 — Brive, defaites", brive25.defaites, 5);

// Cosmic Volley porte une penalisation : la ligue lui retire un point. Le
// classement publie dit 5 la ou le bareme 3/2/1/0 donnerait 6. C est la preuve
// qu on lit le tableau et qu on ne le recalcule jamais.
const cosmic = cl25.find((l) => normaliserNom(l.club).includes("COSMIC"));
verifier("RMB 2025/2026 — Cosmic, points publies", cosmic.points, 5);

// Saison precedente : US Talence a declare un forfait, compte en colonne F.
const rmb24 = echantillon("rmb-2024-2025.html");
const cl24 = analyserClassement(rmb24);
const talence = cl24.find((l) => normaliserNom(l.club).includes("TALENCE"));
verifier("RMB 2024/2025 — Talence, points publies", talence.points, 12);
verifier("RMB 2024/2025 — Talence, forfaits", talence.forfaits, 1);

// Et son forfait porte bien une marque dans le calendrier.
const cal24 = analyserCalendrier(rmb24, "RMB");
const forfait = cal24.matchs.find((m) => m.marqueDomicile === "F" || m.marqueExterieur === "F");
verifier("RMB 2024/2025 — un forfait marque", forfait.code, "RMB002");
verifier("RMB 2024/2025 — sets du forfaitaire", forfait.setsExterieur, 0);
verifier("RMB 2024/2025 — sets de l adversaire", forfait.setsDomicile, 3);

// La fusion des resultats : la saisie manuelle l emporte, jamais ecrasee.
const moisson = {
  "2026/2027": {
    RMB: {
      fait_le: "2026-10-03T18:00:00.000Z",
      resultats: { RMB005: { score: "3-1", gagne: true }, RMB007: { score: "0-3", gagne: false } },
      classement: [
        { club: "C.A. BRIVE/CORREZE VOLLEY", points: 6, joues: 2, victoires: 2, defaites: 0, forfaits: 0 },
        { club: "COSMIC VOLLEY", points: 0, joues: 2, victoires: 0, defaites: 2, forfaits: 0 },
      ],
    },
  },
};

const fichierMatchs = {
  items: [
    { numero: "RMB005", date: "2026-10-03T20:00", statut: "a_venir", score: "", adversaire: "A" },
    // Score deja saisi a la main : il ne doit jamais etre ecrase.
    { numero: "RMB007", date: "2026-10-10T20:00", statut: "termine", score: "3-2", gagne: true, adversaire: "B" },
    // Poule non moissonnee : le match doit ressortir intact.
    { numero: "3MD005", date: "2026-09-26T20:00", statut: "a_venir", score: "", adversaire: "C" },
  ],
};

const fm = fusionnerMatchs(fichierMatchs, moisson);
verifier("fusion — score injecte", fm.items[0].score, "3-1");
verifier("fusion — vainqueur injecte", fm.items[0].gagne, true);
verifier("fusion — statut bascule", fm.items[0].statut, "termine");
verifier("fusion — saisie manuelle preservee", fm.items[1].score, "3-2");
verifier("fusion — poule absente intacte", fm.items[2].score, "");
verifier("fusion — fichier d origine non modifie", fichierMatchs.items[0].score, "");

const fichierClassement = {
  items: [
    { equipe: "r1-masculin", titre: "R1 M", une: true, lignes: [{ club: "saisie a la main", joues: 0, victoires: 0, defaites: 0, points: 0, notre_club: true }] },
    { equipe: "n3-masculin", titre: "N3 M", une: false, lignes: [{ club: "intacte", joues: 0, victoires: 0, defaites: 0, points: 0, notre_club: true }] },
  ],
};
// La poule d un classement se deduit du prefixe des numeros de match de son equipe.
const fc = fusionnerClassement(fichierClassement, moisson, { "r1-masculin": "C.A. BRIVE/CORREZE VOLLEY" }, { "r1-masculin": "RMB" });
verifier("fusion classement — lignes remplacees", fc.items[0].lignes.length, 2);
verifier("fusion classement — notre ligne designee", fc.items[0].lignes[0].notre_club, true);
verifier("fusion classement — ligne adverse non marquee", fc.items[0].lignes[1].notre_club, false);
verifier("fusion classement — poule absente intacte", fc.items[1].lignes[0].club, "intacte");

// Deux equipes du club dans la meme poule : le meme tableau nourrit les deux
// entrees, chacune surlignant sa propre ligne. C est le cas qui a fait naitre le
// champ « Nom de l equipe chez la FFVB ».
const deuxEquipes = {
  items: [
    { equipe: "r1-masculin", lignes: [] },
    { equipe: "r1-masculin-2", lignes: [] },
  ],
};
const fc2 = fusionnerClassement(
  deuxEquipes,
  moisson,
  { "r1-masculin": "C.A. BRIVE/CORREZE VOLLEY", "r1-masculin-2": "COSMIC VOLLEY" },
  { "r1-masculin": "RMB", "r1-masculin-2": "RMB" },
);
verifier("une poule, deux classements — premier", fc2.items[0].lignes[0].notre_club, true);
verifier("une poule, deux classements — second", fc2.items[1].lignes[1].notre_club, true);
verifier("une poule, deux classements — pas de debordement", fc2.items[1].lignes[0].notre_club, false);

// Un classement moissonne vide ne remplace rien : avant la premiere journee la
// federation publie un tableau sans lignes, et le fichier saisi doit rester.
const moissonVide = { "2026/2027": { RMB: { fait_le: "x", resultats: {}, classement: [] } } };
const fcv = fusionnerClassement(fichierClassement, moissonVide, {}, { "r1-masculin": "RMB" });
verifier("fusion classement — vide ne remplace rien", fcv.items[0].lignes[0].club, "saisie a la main");

// Plusieurs correspondances : la federation ecrit "C.A. BRIVE 1" et
// "C.A. BRIVE 2" quand deux equipes du club jouent la meme poule. Champ FFVB
// laisse vide ici, donc repli sur la sous-chaine BRIVE, qui matche les deux
// lignes. Aucune ne doit etre marquee, et l ambiguite doit laisser une trace.
const moissonAmbigue = {
  "2026/2027": {
    RMB: {
      fait_le: "x",
      resultats: {},
      classement: [
        { club: "C.A. BRIVE 1", points: 3, joues: 1, victoires: 1, defaites: 0, forfaits: 0 },
        { club: "C.A. BRIVE 2", points: 0, joues: 1, victoires: 0, defaites: 1, forfaits: 0 },
      ],
    },
  },
};
const fichierAmbigu = {
  items: [{ equipe: "r1-masculin", lignes: [{ club: "saisie a la main", joues: 0, victoires: 0, defaites: 0, points: 0, notre_club: true }] }],
};
let fa;
const tracesAmbigu = capture(() => {
  fa = fusionnerClassement(fichierAmbigu, moissonAmbigue, {}, { "r1-masculin": "RMB" });
});
verifier("fusion classement — plusieurs correspondances, aucune marquee", fa.items[0].lignes.some((l) => l.notre_club), false);
verifier("fusion classement — plusieurs correspondances, trace emise", tracesAmbigu.length, 1);

// La liste des poules se deduit de matches.json, elle n est pas ecrite en dur.
// Une poule peut nourrir plusieurs classements : deux equipes du club dans la
// meme competition portent le meme prefixe et des slugs differents.
const matchesFactice = {
  items: [
    { numero: "3MD005", equipe: "n3-masculin" },
    { numero: "RMB007", equipe: "r1-masculin" },
    { numero: "RMB009", equipe: "r1-masculin" },
    { numero: "RFB002", equipe: "r1-feminin" },
    { numero: "", equipe: "jeunes" },
  ],
};
verifier("poules deduites", poulesDeMatchs(matchesFactice), {
  "n3-masculin": "3MD",
  "r1-masculin": "RMB",
  "r1-feminin": "RFB",
});

// codent est une constante de la federation, pas une donnee du club.
verifier("URL nationale", URL_POULE("2026/2027", "3MD").includes("codent=ABCCS"), true);
verifier("URL regionale", URL_POULE("2026/2027", "RMB").includes("codent=LIAQ"), true);
verifier("URL saison encodee", URL_POULE("2026/2027", "RMB").includes("saison=2026%2F2027"), true);

// Le moissonnage n a pas besoin du reseau : on lui injecte de quoi recuperer.
const moissonne = await moissonner(["RMB"], "2025/2026", async () => rmb25);
verifier("moisson — une poule", Object.keys(moissonne), ["RMB"]);
verifier("moisson — neuf equipes classees", moissonne.RMB.classement.length, 9);
verifier("moisson — RMB009 gagne par Brive", moissonne.RMB.resultats.RMB009.score, "3-0");
verifier("moisson — RMB002 perdu par Brive", moissonne.RMB.resultats.RMB002.score, "0-3");
// Une poule injoignable ne fait pas tomber les autres. moissonner est async : la
// trace part apres un await, donc apres que capture() ait deja restaure
// console.error dans son bloc finally synchrone — capture() ne convient qu aux
// verifications entierement synchrones. On reproduit son motif a la main pour
// garder npm run check silencieux et asserer que la trace part bien.
const tracesMoisson = [];
const consoleErreurOriginal = console.error;
console.error = (...args) => tracesMoisson.push(args.join(" "));
let partiel;
try {
  partiel = await moissonner(["RMB", "RFB"], "2025/2026", async (url) => {
    if (url.includes("RFB")) throw new Error("injoignable");
    return rmb25;
  });
} finally {
  console.error = consoleErreurOriginal;
}
verifier("moisson — poule en echec omise", Object.keys(partiel), ["RMB"]);
verifier("moisson — trace emise pour la poule en echec", tracesMoisson.length, 1);

// Un match non joue (sets vides) ne doit produire aucun resultat via
// moissonner : la regle est ecrite dans le code
// (`if (m.setsDomicile === null || m.setsExterieur === null) continue;`) mais
// aucun echantillon reel ne l exerce - rmb-2024-2025.html et
// rmb-2025-2026.html sont deux saisons entierement jouees, championnat clos,
// sans une seule rencontre a venir. Le HTML de ce cas est donc construit ici
// a la main plutot que telecharge : douze cellules par ligne, separateur vide
// en position 4, comme une vraie ligne de calendrier FFVB (voir la structure
// documentee en tete de ffvb/calendrier.mjs). Les deux rencontres impliquent
// Brive, sinon la rencontre non jouee serait de toute facon ecartee par le
// filtre "hors du club" et le test ne prouverait rien sur la regle visee.
const calendrierPartiel = `
  <table>
    <tr>
      <td>RMB101</td><td>01/02/26</td><td>20:00</td>
      <td>C.A. BRIVE/CORREZE VOLLEY</td><td></td>
      <td>AUTRE CLUB</td><td>3</td><td>1</td>
      <td>25:20, 25:20, 20:25, 25:20</td><td>100-085</td>
      <td>ARBITRE UN/ARBITRE DEUX</td><td></td>
    </tr>
    <tr>
      <td>RMB102</td><td>08/02/26</td><td>20:00</td>
      <td>AUTRE CLUB 2</td><td></td>
      <td>C.A. BRIVE/CORREZE VOLLEY</td><td></td><td></td>
      <td></td><td></td>
      <td></td><td></td>
    </tr>
  </table>
`;
const moissonPartiel = await moissonner(["RMB"], "2025/2026", async () => calendrierPartiel);
verifier(
  "moisson — match joue produit un resultat, match non joue aucun",
  Object.keys(moissonPartiel.RMB.resultats),
  ["RMB101"],
);

if (erreurs.length) {
  console.error("Parseurs FFVB — contrôle échoué :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}
console.log(`OK — parseurs FFVB : ${verifications} vérifications passées.`);
