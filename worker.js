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
