// Worker Cloudflare — connecteur OAuth GitHub pour Decap CMS (CABC Volley)
// Endpoints : /auth (démarre la connexion) · /callback (retour de GitHub)
// Variables à définir dans Cloudflare (Settings → Variables and Secrets) :
//   GITHUB_CLIENT_ID      (texte)
//   GITHUB_CLIENT_SECRET  (secret)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/auth") return auth(url, env);
    if (url.pathname === "/callback") return callback(url, request, env);
    return new Response(
      "Connecteur OAuth Decap CMS — CABC Volley.\nEndpoints : /auth et /callback.",
      { headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  },
};

// Étape 1 — redirige l'éditeur vers la page d'autorisation GitHub.
function auth(url, env) {
  const state = crypto.randomUUID();
  const gh = new URL("https://github.com/login/oauth/authorize");
  gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  gh.searchParams.set("redirect_uri", `${url.origin}/callback`);
  gh.searchParams.set("scope", "repo user");
  gh.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      location: gh.toString(),
      // Le state est relu au retour pour bloquer les requêtes forgées (CSRF).
      "set-cookie": `decap_oauth_state=${state}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax`,
    },
  });
}

// Étape 2 — échange le code contre un token puis le transmet à la fenêtre Decap.
async function callback(url, request, env) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (request.headers.get("cookie") || "").match(/decap_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || state !== cookieState) {
    return popupPage("error", "État OAuth invalide — refermez la fenêtre et réessayez.");
  }

  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "cabc-decap-oauth-worker",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await resp.json();

  if (!resp.ok || data.error || !data.access_token) {
    return popupPage("error", data.error_description || "Échec de l'échange du code OAuth.");
  }
  return popupPage("success", { token: data.access_token, provider: "github" });
}

// Page renvoyée dans la popup : dialogue postMessage attendu par Decap CMS.
function popupPage(status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Authentification…</title></head>
<body><p>Authentification en cours… Cette fenêtre va se fermer.</p>
<script>
(function () {
  if (!window.opener) { document.body.textContent = "Fenêtre ouverte hors de Decap CMS."; return; }
  function receiveMessage(e) {
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "set-cookie": "decap_oauth_state=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax",
    },
  });
}
