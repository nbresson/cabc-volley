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
  ["/ecole-de-volley/", "/equipe?e=ecole-de-volley"],
  // Baby et Kids ont ete fondus dans la fiche Ecole de volley.
  ["/baby-kids-volley/", "/equipe?e=ecole-de-volley"],
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

    const reponse = await env.ASSETS.fetch(request);
    if (!brouillon) return reponse;

    const entetes = new Headers(reponse.headers);
    entetes.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(reponse.body, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: entetes
    });
  }
};
