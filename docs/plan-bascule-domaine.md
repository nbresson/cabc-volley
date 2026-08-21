# Plan de bascule vers www.cabc-volley.fr

Le jour où le Bureau valide, ce document est la marche à suivre — dans l'ordre,
avec les vérifications qui disent si chaque étape a réussi. Il part d'un état
vérifié le 22 août 2026 : **côté code, tout est prêt et rien n'est à modifier
le jour J.**

## 0 · Ce qui basculera tout seul, et pourquoi

Le worker décide de tout d'après l'hôte qui répond (`estBrouillon()`), et
chaque adresse qu'il écrit est calculée, jamais recopiée :

| mécanisme | sur `workers.dev` aujourd'hui | sur `www.cabc-volley.fr` le jour J |
| --- | --- | --- |
| barrage d'indexation (`X-Robots-Tag`) | posé sur chaque réponse | **absent** — se lève seul |
| `robots.txt` | version brouillon | version site, avec le sitemap |
| `canonical`, `og:url`, `og:image` | hôte de brouillon | nouveau domaine |
| JSON-LD (`SportsOrganization`, `SportsEvent`) | adresses relatives | suivent l'hôte |
| CSP et nonce, en-têtes de sécurité | actifs | identiques |
| redirections des anciennes URL, 410 | actives (par chemin) | actives — c'est là qu'elles serviront |

Le `sitemap.xml` et le `site_url` de Decap visent **déjà** le domaine final.
La préversion `workers.dev` restera en service après la bascule, toujours sous
barrage : elle redevient ce qu'elle est, un brouillon.

## 1 · Prérequis — avant même de fixer une date

- [ ] **Validation écrite du Bureau** (compte rendu ou courriel), avec la date.
- [ ] **Accès au registrar** du domaine `cabc-volley.fr` — identifiants
      retrouvés et testés. C'est le prérequis qui prend du temps quand il
      manque.
- [ ] **Inventaire complet de la zone DNS actuelle** : exporter tous les
      enregistrements (A, CNAME, **MX**, TXT, sous-domaines). Le courriel du
      club est chez Wanadoo, mais si le domaine porte des MX ou des TXT
      (SPF, vérifications), ils devront être recopiés à l'identique — les
      perdre casserait des choses sans lien avec le site.
- [ ] **Baisser les TTL à 300 s** chez le registrar, quelques jours avant :
      la bascule et un éventuel retour arrière deviennent des minutes.
- [ ] **Créer la zone `cabc-volley.fr` dans le compte Cloudflare** (offre
      gratuite) sans changer les serveurs de noms : Cloudflare importe la
      zone. Comparer l'import à l'inventaire, corriger les manques.
- [ ] **Archiver l'ancien site** (copie des pages, export si CMS) : après la
      bascule il devient inaccessible au public, et le club peut vouloir sa
      mémoire. Ne pas résilier son hébergement — il sert de roue de secours
      (§ 5).
- [ ] **La clé d'alerte** `WEB3FORMS_ALERTE` posée (deux minutes, voir le
      backlog) : un site public mérite une alerte qui parle.
- [ ] Recommandé, non bloquant : photos de la boutique et effectifs saisis —
      le site sera jugé sur sa première impression.

## 2 · La semaine d'avant

- [ ] `npm run check` vert et action GitHub verte sur `main`.
- [ ] Tournée visuelle des pages principales (accueil, calendrier, horaires,
      boutique, adhésion) sur la préversion.
- [ ] Prévenir le Bureau : **gel des publications Decap** pendant la fenêtre
      de bascule (une demi-journée suffit).
- [ ] Décision d'accompagnement : activer **Cloudflare Web Analytics** ce
      jour-là ou pas (backlog § 5). ⚠️ Si oui, son script vient de
      `static.cloudflareinsights.com` : **la CSP le bloquera** tant que
      `script-src` et `connect-src` ne l'autorisent pas — une ligne dans
      `worker.js`, à fusionner AVANT le jour J, pas après.

## 3 · Le jour J — dans cet ordre

1. [ ] **Basculer les serveurs de noms** du registrar vers ceux donnés par la
       zone Cloudflare. Attendre que la zone passe « Active » (minutes à
       heures ; les TTL abaissés accélèrent le reste).
2. [ ] **Rattacher le domaine au worker** : tableau de bord → Workers →
       `cabc-volley` → Settings → Domains & Routes → *Add Custom Domain* →
       `www.cabc-volley.fr`. Le certificat TLS se provisionne seul.
3. [ ] **Rediriger l'apex** : zone `cabc-volley.fr` → Rules → Redirect Rules →
       `cabc-volley.fr/*` → `https://www.cabc-volley.fr/$1`, 301. Aucun code :
       l'hôte canonique est `www`, comme partout dans le dépôt.
4. [ ] **La tournée de vérification** — chaque ligne doit donner exactement ceci :

       ```bash
       # la page d accueil : 200, indexable, canonical juste
       curl -s -D - -o /dev/null https://www.cabc-volley.fr/
       #   → HTTP 200 ; AUCUN X-Robots-Tag ; Content-Security-Policy présent
       curl -s https://www.cabc-volley.fr/ | grep canonical
       #   → <link rel="canonical" href="https://www.cabc-volley.fr/">

       # robots et sitemap : la version site
       curl -s https://www.cabc-volley.fr/robots.txt
       #   → Disallow: /admin/ … Sitemap: https://www.cabc-volley.fr/sitemap.xml
       curl -s -o /dev/null -w "%{http_code}\n" https://www.cabc-volley.fr/sitemap.xml
       #   → 200

       # l apex redirige, les anciennes URL vivent
       curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://cabc-volley.fr/
       #   → 301 https://www.cabc-volley.fr/
       curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.cabc-volley.fr/ecole-de-volley/
       #   → 301 …/equipes

       # la preversion garde son barrage
       curl -s -D - -o /dev/null https://cabc-volley.nkobrs21.workers.dev/ | grep -i x-robots
       #   → X-Robots-Tag: noindex, nofollow
       ```

5. [ ] **Le nonce en conditions de retour** (la leçon du 22 août) :

       ```bash
       curl -s -o /dev/null -w "%{http_code}\n" -H 'If-None-Match: "bidon"' https://www.cabc-volley.fr/tarifs
       #   → 200 (jamais 304)
       ```

6. [ ] **L'admin Decap depuis le nouveau domaine** :
       `https://www.cabc-volley.fr/admin/` → se connecter à GitHub → modifier
       un champ anodin → publier. C'est le seul point que rien ne peut
       éprouver avant le jour J : le connecteur OAuth
       (`cabc-decap-oauth.nkobrs21.workers.dev`) renvoie le jeton à l'origine
       qui l'appelle, et le nouveau domaine est un origine nouveau. **Si la
       connexion échoue**, le site public n'est pas en danger : l'admin reste
       pleinement fonctionnel sur la préversion `workers.dev` (Decap écrit sur
       `main` d'où qu'il soit), et le connecteur s'ajuste à froid.
7. [ ] **Un envoi réel du formulaire de contact** — Web3Forms n'est pas lié à
       l'hôte, mais la preuve vaut mieux que la doctrine.
8. [ ] **Une carte de gymnase** (tuiles OpenStreetMap) et **un téléchargement
       d'agenda** depuis le domaine.

## 4 · Les jours et semaines d'après

- [ ] **Search Console** : ajouter la propriété (validation DNS — un TXT posé
      dans la zone Cloudflare, immédiat), soumettre le sitemap. Bing Webmaster
      en option. Les anciennes URL indexées de l'ex-site retomberont sur nos
      301 et 410 au fil du crawl : c'est prévu, pas un incident.
- [ ] **Surveiller les 404** dans Search Console les premières semaines : une
      vieille adresse oubliée de l'inventaire (`docs/anciennes-urls…`) mérite
      sa redirection — la carte s'enrichit dans `worker.js`.
- [ ] **Une retouche de texte, après coup** : le commentaire de
      `ROBOTS_BROUILLON` dit encore que « le site officiel reste
      www.cabc-volley.fr » — une fois la bascule faite, la préversion doit se
      présenter comme la préversion *du* site officiel. Une ligne, sans
      urgence.
- [ ] **Annonces** : réseaux du club, affichage au gymnase — après la tournée
      du § 3, jamais avant.
- [ ] **Mettre à jour** : la section 2 du backlog se ferme, le README note le
      domaine, ce plan rejoint « Fait, pour mémoire ».
- [ ] **À froid (un mois)** : résilier l'ancien hébergement si tout est sain,
      après un dernier regard à l'archive du § 1.

## 5 · Retour arrière, si le jour J tourne mal

Tant que l'ancien hébergement vit, le retour est une opération DNS :

1. Détacher le Custom Domain du worker (le site retombe sur la préversion).
2. Dans la zone Cloudflare, recréer les enregistrements de l'inventaire du
   § 1 pointant vers l'ancien hébergeur — avec les TTL à 300 s, l'ancien site
   revient en minutes. Pas besoin de re-changer les serveurs de noms.
3. Analyser à froid, recommencer un autre jour. Le site n'aura jamais été
   cassé : au pire, l'ancien aura duré un jour de plus.

---

*Écrit le 22 août 2026. À relire le jour où la date se fixe : la seule chose
qui périme un plan, c'est le temps entre son écriture et son exécution.*
