import { poulesDeMatchs, moissonner } from "./ffvb/moisson.mjs";
import { fusionnerMatchs, fusionnerClassement } from "./ffvb/fusion.mjs";
import { saisonDe } from "./ffvb/noms.mjs";

const CLE_MOISSON = "moisson";

// La page de la federation est servie en latin-1 : la decoder autrement casse
// les noms de clubs.
async function texteLatin1(reponse) {
  return new TextDecoder("iso-8859-1").decode(await reponse.arrayBuffer());
}

async function json(env, origine, chemin) {
  const r = await env.ASSETS.fetch(new URL(chemin, origine));
  return r.ok ? await r.json() : null;
}

// Tant que ce site n est qu un projet, il ne doit exister pour aucun moteur.
// Le barrage se juge sur l hote plutot que dans un fichier _headers : il tombe
// ainsi de lui-meme le jour ou un vrai domaine pointe sur ce worker, au lieu
// de laisser une consigne a se rappeler dans un README. Un barrage oublie
// ferait naitre le site officiel invisible.

// Ces robots ignorent l en-tete X-Robots-Tag mais respectent robots.txt.
// C est donc la, et seulement la, qu on peut les tenir a distance.
const ROBOTS_IA = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
  "Amazonbot"
];

// Contre-intuitif et volontaire : les moteurs sont autorises a explorer. C est
// ainsi qu ils lisent le noindex servi avec chaque reponse. Un Disallow les en
// empecherait, et l URL pourrait alors etre listee sans avoir jamais ete lue.
const ROBOTS_BROUILLON = `# Ce site est un projet. Il ne remplace pas encore le site officiel du club,
# qui reste https://www.cabc-volley.fr
#
# L'exploration est volontairement autorisée aux moteurs : c'est ainsi qu'ils
# lisent l'en-tête « X-Robots-Tag: noindex » servi avec chaque réponse.

User-agent: *
Disallow: /admin/

${ROBOTS_IA.map((a) => "User-agent: " + a).join("\n")}
Disallow: /
`;

const ROBOTS_SITE = `User-agent: *
Disallow: /admin/
Disallow: /design-system.html

Sitemap: https://www.cabc-volley.fr/sitemap.xml
`;

// Tout ce qui n est pas un sous-domaine workers.dev est traite comme le site
// officiel, y compris l apercu local : c est le sens de la bascule.
function estBrouillon(hote) {
  return hote.endsWith(".workers.dev");
}

// Redirections depuis l ancien site WordPress. L inventaire complet et le
// raisonnement de chaque ligne sont dans
// docs/superpowers/specs/2026-08-13-anciennes-urls-inventaire.md
//
// Les cibles s ecrivent SANS extension : Cloudflare sert /contact et repond 307
// sur /contact.html. Viser la forme .html produirait une chaine 301 puis 307,
// un saut de plus a chaque visite et un signal dilue pour les moteurs.
const REDIRECTIONS = new Map([
  ["/lhistoire-du-club/", "/club"],
  ["/constitution-du-bureau/", "/club"],
  ["/contacts/", "/contact"],
  ["/devenir-benevole/", "/contact"],
  ["/inscription/", "/adhesion"],
  ["/seances-dessais/", "/adhesion"],
  ["/guide-des-parents/", "/infos"],
  ["/informations-importantes/", "/infos"],
  ["/proces-verbaux/", "/infos"],
  ["/mentions-legales/", "/mentions-legales"],
  ["/boutique-2/", "/boutique"],
  ["/sur-les-reseaux/", "/"],
  ["/senior-masculin-n3/", "/equipe?e=n3-masculin"],
  ["/regional-1-masculin/", "/equipe?e=r1-masculin"],
  ["/regional-1-feminine/", "/equipe?e=r1-feminin"],
  ["/ecole-de-volley/", "/equipe?e=baby-kid-volley"],
  // Baby et Kids ont ete fondus dans la fiche Ecole de volley.
  ["/baby-kids-volley/", "/equipe?e=baby-kid-volley"],
  ["/volley-sante/", "/equipe?e=volley-sante"],
  ["/ufolep/", "/equipe?e=ufolep"],
  // Ces trois pages n etaient plus liees par l ancien site lui-meme et n ont
  // pas d equipe correspondante : la liste est la cible la plus honnete.
  ["/prenational-feminin/", "/equipes"],
  ["/pre-national-feminine/", "/equipes"],
  ["/m21-moins/", "/equipes"],
  // Deux URLs laides mais bien vivantes : page-d-exemple s intitulait « Nos
  // partenaires », typography « Le Gymnase ».
  ["/page-d-exemple/", "/partenaires"],
  ["/devenir-partenaire/", "/partenaires"],
  ["/typography/", "/gymnase?g=rollinat"]
]);

// Prefixes engendres par le plugin SportsPress, plus les pages de demonstration
// du theme. Cent quarante-quatre URLs sans equivalent : un 410 dit « cette page
// a existe et n existera plus », ce que Google traite plus vite qu un 404.
// Les fiches /player/ sont volontairement de celles-la : ce sont des donnees
// personnelles de licencies, et le nouveau site n a deliberement pas d
// equivalent.
const PREFIXES_DISPARUS = [
  "/player/", "/team/", "/venue/", "/position/", "/season/", "/league/",
  "/list/", "/role/", "/staff/", "/event/", "/medias/", "/author/",
  "/donations/", "/page-1/"
];

// Les anciennes adresses finissaient toutes par une barre oblique, mais un lien
// recopie a la main peut l avoir perdue : on cherche les deux formes.
function cibleRedirection(chemin) {
  return REDIRECTIONS.get(chemin) || REDIRECTIONS.get(chemin + "/");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const brouillon = estBrouillon(url.hostname);

    if (url.pathname === "/robots.txt") {
      return new Response(brouillon ? ROBOTS_BROUILLON : ROBOTS_SITE, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }

    const cible = cibleRedirection(url.pathname);
    if (cible) {
      return Response.redirect(new URL(cible, url.origin).toString(), 301);
    }

    // Le 410 reutilise la page 404 du site : un humain qui suit un vieux lien
    // merite autre chose qu une ligne de texte nu, et le statut suffit a dire
    // aux moteurs que la page ne reviendra pas.
    if (PREFIXES_DISPARUS.some((p) => url.pathname.startsWith(p))) {
      const page = await env.ASSETS.fetch(new URL("/404.html", url.origin));
      const entetes = new Headers(page.headers);
      if (brouillon) entetes.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(page.body, { status: 410, statusText: "Gone", headers: entetes });
    }

    // Les deux fichiers que la moisson peut enrichir. Toute erreur fait servir
    // les octets d origine : le worker ne casse jamais le site, on retombe sur
    // « En attente de resultat », qui reste honnete.
    //
    // Seul un GET emprunte ce chemin. Un HEAD n a pas de corps a fusionner :
    // il tomberait dans le repli et ecrirait une ligne ERROR par appel, ce
    // qu une sonde de disponibilite produirait en continu — le journal est le
    // seul canal d alerte du projet, le noyer reviendrait a le perdre. Le
    // chemin normal, plus bas, sert la reponse et pose le meme noindex sur l
    // hote de brouillon.
    const enrichissable =
      request.method === "GET" &&
      (url.pathname === "/content/matches.json" ||
        url.pathname === "/content/classement.json");
    if (enrichissable) {
      // Sans les en-tetes conditionnels : ASSETS calcule son ETag sur le
      // fichier du depot, pas sur le corps fusionne qu on renvoie plus bas.
      // Les laisser passer ferait rendre un 304 sur la base d un validateur
      // qui ne correspond plus au corps promis, et le client garderait une
      // copie non fusionnee.
      const entetesRequete = new Headers(request.headers);
      entetesRequete.delete("if-none-match");
      entetesRequete.delete("if-modified-since");
      const brut = await env.ASSETS.fetch(new Request(request, { headers: entetesRequete }));
      try {
        const moisson = (await env.FFVB.get(CLE_MOISSON, "json")) || {};
        const fichier = await brut.clone().json();
        let sortie;
        if (url.pathname === "/content/matches.json") {
          sortie = fusionnerMatchs(fichier, moisson);
        } else {
          const [matches, teams] = await Promise.all([
            json(env, url.origin, "/content/matches.json"),
            json(env, url.origin, "/content/teams.json")
          ]);
          const noms = Object.fromEntries(
            ((teams && teams.items) || []).map((t) => [t.slug, t.ffvb_nom || ""])
          );
          sortie = fusionnerClassement(fichier, moisson, noms, poulesDeMatchs(matches));
        }
        const entetes = new Headers(brut.headers);
        // Le corps fusionne n a pas la taille de l objet d origine : un ETag
        // recopie de brut validerait un If-None-Match futur contre un corps
        // que le client n a jamais recu.
        entetes.delete("etag");
        if (brouillon) entetes.set("X-Robots-Tag", "noindex, nofollow");
        return new Response(JSON.stringify(sortie), { headers: entetes });
      } catch (e) {
        console.error(`FFVB : fusion impossible sur ${url.pathname} — ${e && e.message}`);
        // Le repli doit rester aussi noindex que le reste du brouillon : un
        // cache corrompu ou un fichier illisible ne doivent pas faire fuiter
        // une reponse indexable.
        if (!brouillon) return brut;
        const entetes = new Headers(brut.headers);
        entetes.set("X-Robots-Tag", "noindex, nofollow");
        return new Response(brut.body, {
          status: brut.status,
          statusText: brut.statusText,
          headers: entetes
        });
      }
    }

    const reponse = await env.ASSETS.fetch(request);
    if (!brouillon) return reponse;

    const entetes = new Headers(reponse.headers);
    entetes.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(reponse.body, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: entetes
    });
  },

  // Cron du week-end. Le moissonnage ecrit poule par poule par-dessus l objet
  // en cache : une poule injoignable garde sa derniere valeur connue au lieu de
  // disparaitre.
  async scheduled(evenement, env, ctx) {
    const saison = saisonDe(new Date());
    const matches = await json(env, "https://cabc-volley/", "/content/matches.json");
    const poules = [...new Set(Object.values(poulesDeMatchs(matches)))];
    if (!poules.length) {
      console.error("FFVB : aucune poule deduite de matches.json, rien a moissonner");
      return;
    }
    const frais = await moissonner(poules, saison, async (url) =>
      texteLatin1(await fetch(url, { headers: { "user-agent": "cabc-volley-moissonneur" } }))
    );
    // Lu en texte puis parse ici plutot qu en « json » : sur un cache corrompu,
    // get(..., "json") leve avant le put, et le cron echouerait alors a l
    // identique toutes les heures sans jamais pouvoir reparer — panne
    // invisible, le site continuant de servir les octets d origine. Repartir
    // d un objet vide fait reecrire la cle au passage suivant.
    let ancien = {};
    const cache = await env.FFVB.get(CLE_MOISSON, "text");
    if (cache) {
      try {
        const lu = JSON.parse(cache);
        if (!lu || typeof lu !== "object") throw new Error("le cache n est pas un objet");
        ancien = lu;
      } catch (e) {
        console.error(`FFVB : cache illisible, il sera reecrit — ${e && e.message}`);
      }
    }
    const fusionne = { ...ancien, [saison]: { ...(ancien[saison] || {}), ...frais } };
    await env.FFVB.put(CLE_MOISSON, JSON.stringify(fusionne));
    console.log(`FFVB : ${Object.keys(frais).length}/${poules.length} poules moissonnees pour ${saison}`);
  }
};
