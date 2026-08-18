// Controle des parseurs FFVB sur des pages reelles figees. Sans reseau : les
// echantillons sont dans ffvb/echantillons/, et ce sont eux qui figent les cas
// limites que le sondage du 18 aout a fait payer.
// Lance par `npm run check`.
import { normaliserNom, saisonDe } from "../ffvb/noms.mjs";
import { readFileSync } from "node:fs";
import { analyserCalendrier } from "../ffvb/calendrier.mjs";
import { analyserClassement } from "../ffvb/classement.mjs";

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

if (erreurs.length) {
  console.error("Parseurs FFVB — contrôle échoué :");
  for (const e of erreurs) console.error("  -", e);
  process.exit(1);
}
console.log(`OK — parseurs FFVB : ${verifications} vérifications passées.`);
