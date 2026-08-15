# Backlog

Ce qui reste à faire sur le site, par ordre de valeur — pas par ordre d'arrivée.
Y figurer n'engage à rien : une ligne peut rester en bas indéfiniment, ou être
supprimée. On y retire plus qu'on y ajoute.

Dernière revue : **15 août 2026**. Relecture du même jour : trois entrées ajoutées, une réglée sur place. Les deux sujets Meta — direct et publications — partagent une même question, posée une fois sous « Afficher les publications ». Deux sujets FFVB distincts, à ne pas confondre : les **résultats** publiés après match, et le **score en direct** depuis l'application de feuille de match.

---

## 1 · Personne d'autre ne peut publier

**Relevé le 15 août.** Le dépôt compte **257 commits, un seul auteur, zéro
collaborateur, zéro invitation en attente.** Tous les enregistrements Decap —
« Update Matchs & résultats », « Update Gymnases », « Update Partenaires » — portent
le même nom.

Le bureau n'a jamais ouvert le CMS, et ne le peut pas : Decap commite sur GitHub, ce
qui exige un accès en écriture au dépôt.

Ça change la lecture de la section 4. Les portraits manquants, les six équipes sans
effectif, les galeries vides ne sont peut-être pas un problème de photos : personne
n'a la clé.

C'est aussi le seul point qui remet en cause la promesse du projet — un site que le
club entretient lui-même. Aujourd'hui c'est un site entretenu **pour** le club.

**À faire :** ajouter deux ou trois éditeurs du bureau comme collaborateurs du dépôt
(Settings → Collaborators), puis les faire se connecter une fois sur `/admin/` pour
vérifier que le parcours tient de bout en bout.

## 2 · Ce qui bloque la bascule vers `www.cabc-volley.fr`

### Socle SEO — canonical et JSON-LD
Dernier lot technique. Les descriptions, l'Open Graph, la vignette de partage, le
sitemap et le robots.txt sont faits. Restent :

- une balise `<link rel="canonical">` par page,
- un bloc JSON-LD `SportsOrganization` sur l'accueil, `SportsEvent` sur les matchs.

### Le jour J, deux gestes
Les `og:image` des seize pages pointent sur `.workers.dev` (`grep -rl workers.dev
site/`). Le sitemap et le robots.txt, eux, n'attendent rien — voir
[`site/README.md`](../site/README.md).

---

## 3 · Ajouts et finitions

### Récupérer le classement et les résultats sur le site de la FFVB
**Analysé le 15 août.** Le classement est saisi à la main chaque week-end alors qu'il
existe déjà chez la fédération. **Le concept tient**, vérifié sur les vraies pages.

| | |
| --- | --- |
| Rendu | côté serveur — le tableau est dans le HTML livré, aucun JavaScript à exécuter |
| Réponse | 57 à 125 Ko en 0,3 s |
| Encodage | latin-1, à convertir à la lecture |
| `robots.txt` | absent (404) — aucune consigne d'exploration |

Le tableau contient exactement les champs de `classement.json` : rang, équipe, points,
joués, gagnés, perdus, puis le détail des sets et les ratios.

**Trois découvertes qui changent la mise en œuvre :**

1. **Le lien des réglages n'est pas le bon.** `planning_club_class.php` affiche, malgré
   son titre « Classement des Equipes », la composition des poules — le « 05 » à côté
   du CAB est son rang dans une liste administrative, pas au classement. Le vrai
   tableau est sur `vbspo_calendrier.php`, une page par poule.
2. **Le club a trois poules.** 3MD (Nationale 3 masculine poule D), RFB et RMB en
   régional. Les régionales s'atteignent par `codent=LIAQ&poule=RMB`. La nationale est
   étiquetée `NAT` dans la page du club, mais le bon paramètre reste à trouver.
3. **Le tableau n'existe pas avant le premier match.** Zéro ligne sur 2026/2027,
   tableau complet sur 2025/2026. Le moissonneur doit tolérer son absence — ce que le
   site fait déjà, le mini-classement se masquant tant que rien n'est joué.

**Cadence retenue : toutes les heures, samedi et dimanche seulement.** Le cron de
Cloudflare l'exprime en `0 * * * 6,0` — 48 déclenchements par semaine au lieu de 168.
Les crons sont en UTC, ce qui tombe bien : la fenêtre couvre le samedi matin jusqu'au
lundi 1 h ou 2 h du matin en heure française, donc les résultats saisis tard le samedi
soir. *À surveiller la première saison : si la fédération valide certains résultats le
lundi, il faudra y ajouter deux ou trois passages.*

**Architecture pressentie :** le worker interroge la FFVB, garde le résultat en KV, et
sert `content/classement.json` depuis le cache quand il est frais. **Repli sur le
fichier saisi à la main dès que quoi que ce soit échoue** — la saisie manuelle ne
disparaît pas, elle devient le filet.

**Deux réserves à porter :**

- **Fragilité.** Ce HTML est d'une autre époque — balises en majuscules, `bgcolor`,
  Apache 2.2. Stable depuis des années parce que personne n'y touche, mais une refonte
  casserait l'analyse **en silence**. D'où le repli, et un signal visible quand le
  moissonnage échoue.
- **Droit.** L'absence de `robots.txt` n'est pas une autorisation. Il existe en France
  un droit du producteur de base de données, et republier un classement n'est pas le
  consulter. Le club étant membre de la fédération et n'affichant que ses propres
  poules, c'est défendable — mais ça se demande à la ligue plutôt que ça ne se suppose.
  **Un mail avant d'écrire le code.**

**Les résultats des matchs sont sur la même page**, et viennent de la même source : la
remontée des feuilles de match électroniques. Pour chaque rencontre jouée, le score set
par set (`22:25, 20:25, 21:25`), le total de points (`063-075`), les arbitres, et un
lien vers la feuille : `ffvolley_fdme.php?saison=…&codent=LIAQ&codmatch=RMB002`.

**Ces données ne remontent qu'une fois le match terminé** — confirmé par le bureau, qui
connaît la chaîne. Ce n'est donc pas une source de score en direct, et il ne sert à
rien d'aller l'observer pendant un match. Le direct est un sujet séparé, voir l'entrée
suivante.

**Un identifiant commun manque.** Aujourd'hui rien ne relie un match saisi dans Decap à
son homologue chez la fédération : il faudrait rapprocher sur la date et le nom de
l'adversaire, ce qui casse au premier report ou à la première orthographe différente.

Le code de match de la FFVB (`RMB002`, `3MD014`…) est un identifiant unique et stable,
déjà présent dans le calendrier publié. **Ajouter un champ « Numéro de match » à la
collection Matchs de Decap** le rendrait saisissable, et tout rapprochement ultérieur
deviendrait exact plutôt qu'approximatif.

C'est un petit pas indépendant : le champ peut être posé maintenant et rester vide
longtemps sans gêner personne, mais rien de sérieux ne se construira sans lui.

**Prochain pas utile :** prototyper l'extraction sur la saison passée — parser les
trois poules et sortir un `classement.json` complet, sans rien brancher. Une heure
pour savoir si le concept résiste au réel.

### Score en direct depuis l'application de feuille de match
**Idée du 15 août, documentation manquante.** La nouvelle version de la feuille de
match électronique offrirait une fonctionnalité de diffusion du score **au fil de la
saisie**, intégrée à l'application elle-même.

**À ne pas confondre avec l'entrée précédente.** Le portail de résultats de la FFVB
publie les scores *après* la rencontre : c'est la même chaîne de données, mais à
l'autre bout. Ce sujet-ci se joue dans l'application du marqueur, pendant le match.

**Ce qui bloque n'est pas technique, c'est documentaire.** Rien ne dit aujourd'hui :

- si la diffusion produit une adresse publique, un flux, ou seulement un affichage
  dans un écran de la fédération ;
- si elle s'active par match, par club, ou pour toute une compétition ;
- s'il faut une autorisation, un compte, ou un jeton ;
- si le format est exploitable par un site tiers.

**Prochain pas :** obtenir la documentation — auprès de la ligue, de la fédération, ou
du marqueur du club qui utilise l'application. Une capture d'écran des réglages de
diffusion suffirait déjà à savoir de quoi l'on parle.

Tant que ce point n'est pas éclairci, **rien ne peut être chiffré ni conçu** : selon la
réponse, c'est une heure de travail ou un projet entier.

### Lien vers le direct Facebook du match
**Demandé le 15 août.** Le club diffuse certains matchs en direct sur sa page
Facebook. Un visiteur qui arrive sur le site un soir de match ne trouve rien qui l'y
mène.

Forme pressentie : un champ `live` par match dans `matches.json` — l'adresse de la
vidéo, saisie depuis Decap — et un bouton dans le bandeau du prochain match, à côté
de « Venir au match » et « Mon agenda ».

**Trois questions à trancher au moment de le faire**, notées ici pour ne pas les
redécouvrir :

1. **Lien sortant ou vidéo intégrée ?** Même arbitrage que pour les publications,
   développé sous « Afficher les publications Facebook et Instagram » ci-dessous.
   **Recommandation : lien sortant.**
2. **Quand le montrer ?** Un bouton « Regarder le direct » affiché trois semaines
   avant le match ment. Le plus simple qui fonctionne : ne l'afficher qu'à partir
   d'une heure avant le coup d'envoi, et le laisser jusqu'au lendemain — le compte à
   rebours sait déjà lire la date du match.
3. **Et après le match ?** L'adresse d'un direct terminé reste valide et devient un
   replay. Faut-il le laisser paraître sur la fiche d'équipe, ou disparaître ?

Rien de tout cela n'est bloquant : le champ peut arriver d'abord, l'affichage
ensuite.

### Afficher les publications Facebook et Instagram
**Demandé le 15 août.** Le site renvoie vers les deux réseaux sans jamais en montrer
le contenu. Un visiteur doit le quitter pour voir la vie du club.

**Le statique n'est pas ce qui bloque** — un widget est du JavaScript de navigateur,
n'importe quelle page peut en porter un. Trois choses bloquent, elles :

- **Les traceurs.** Le SDK de Meta dépose ses cookies avant tout clic. En droit
  français cela impose une bannière de consentement, et le contenu ne paraît qu'après
  acceptation. Le site ne charge **aucun script externe** aujourd'hui : c'est
  précisément ce qui lui évite cette bannière.
- **L'API d'Instagram s'est fermée.** L'API Basic Display a disparu fin 2024. Il faut
  désormais un compte Professionnel ou Créateur relié à une Page Facebook, une
  application Meta déclarée, et un jeton à renouveler tous les deux mois. *À
  revérifier le jour venu : Meta change ces règles souvent.*
- **Un site statique n'a pas où cacher un jeton.** Mais celui-ci a un worker
  Cloudflare devant lui — un serveur, qui peut détenir un secret, appeler l'API,
  mettre en cache et servir du HTML ordinaire.

| Option | Traceurs | Effort | Automatique |
| --- | --- | --- | --- |
| **A** · Rester aux liens sortants | aucun | nul | — |
| **B** · Widget officiel Meta | oui + bannière | faible | oui |
| **C** · Le worker moissonne l'API | **aucun** | élevé | oui |
| **D** · Le bureau recopie dans Decap | aucun | nul, déjà en place | non |

**Recommandation : D maintenant, C plus tard si le manuel s'essouffle.** La collection
Actualités accepte déjà titre, date, photo et texte. Deux raisons de ne pas
industrialiser tout de suite : personne n'a encore publié une actualité à la main
(voir section 1), et le contenu recopié survit à une panne de Meta, à un changement
d'API ou à la fermeture d'un compte — ce qu'un mur alimenté par API ne fait pas.

**Préalable à vérifier avant tout chiffrage de C :** le compte `cabcvolley` est-il un
compte Professionnel ? Sinon rien n'est possible sans le convertir d'abord.

### Navigation entre fiches d'équipe
En pied de fiche, à côté de « Toutes les équipes » : ← équipe précédente / suivante →.
L'ordre est celui de `teams.json`, déjà l'ordre éditorial du bureau. Les équipes sans
slug sont sautées.

### Timeline du Club — la période dite deux fois
La colonne affiche « 1960 » quand le texte commence par « Années 1960–1983 — ».

**Attention au format :** sur huit entrées, six portent un préfixe de période, mais
sous **trois formes différentes** — `Après-guerre 39/45 —`, `Années 1960–1983 —`, et
`1987–1997 —`. La huitième (2026) n'en a aucun. Une règle qui ne reconnaîtrait que
`AAAA–AAAA —` n'en attraperait que cinq sur six.

Rien à changer côté Decap : le bureau continue d'écrire comme aujourd'hui, c'est
l'affichage qui remonte la période dans la grande colonne.

### L'entraîneur n'est pas un numéro de maillot
Jean-Pierre Delost porte `num: "E"`, affiché en grand sur sa photo comme un numéro.
Proposition : quand `num` n'est pas numérique, remplacer le grand chiffre par un badge
« Staff » en DM Mono sous le nom, et classer ces cartes en fin de grille. Aucun
changement de données — c'est le seul cas aujourd'hui.

---

## 4 · Pas du code — une chasse aux photos

Le design attend déjà ces images ; il n'y a rien à développer.

| Ce qui manque | État au 15 août |
| --- | --- |
| Portraits du bureau | **3 sur 3** affichent `[ portrait ]` |
| Photo d'archive de l'histoire | champ vide, le placeholder est en ligne |
| Effectif National 3 masculin | 5 inscrits, **4 sans photo** |
| Effectifs des six autres équipes | **aucun inscrit** — R1 féminin, R1 masculin, Jeunes, École de volley, Volley Santé, UFOLEP |
| Galeries des quatre gymnases | vides |
| Description du gymnase d'Arsonval | absente |
| « Mot » des partenaires | aucun des 17 n'en a |
| Accroche de la carte « Devenir partenaire » | absente |

---

## 5 · Gouvernance et mesure

### Le club ne saura pas s'il est lu
Aucune mesure d'audience. Après la bascule, personne ne saura si le site reçoit dix
ou mille visites, ni quelles pages servent. Cloudflare Web Analytics est gratuit,
sans cookie et sans bannière de consentement — le seul tiers qui resterait cohérent
avec le choix d'avoir tout auto-hébergé. Décision à prendre, pas une évidence.

### Tout tient sur un seul compte
Le worker, le dépôt et le connecteur OAuth vivent sur des comptes Cloudflare et
GitHub personnels. Si leur titulaire s'éloigne, le club ne peut plus ni déployer, ni
corriger, ni récupérer le site autrement qu'en clonant le dépôt public. Pas urgent —
mais ça se prépare mieux à froid qu'à chaud.

## 6 · Décisions en attente

**Description du gymnase Rollinat** — trois reformulations proposées le 13 août, aucune
retenue. Le texte officiel actuel manque de charme.

---

## Fait, pour mémoire

Barrage d'indexation · redirections des anciennes URL · images en WebP · polices
auto-hébergées · page Partenaires et fiches de gymnase · formulaires Web3Forms ·
carte des gymnases et vignette de partage · page Adhésion entièrement sous Decap ·
mini-classement · favicon et sitemap.

**15 août** — le réglage « Nom du club », qui n'était lu nulle part : un éditeur
pouvait le modifier sans que rien ne change. Retiré plutôt qu'affiché — le nom est
écrit en dur à 34 endroits, dont 15 `<title>` et 15 `og:site_name` que les moteurs
lisent et qu'un JSON ne peut pas nourrir. Un champ ne gouvernant que les 3 rendus par
JS aurait produit un site incohérent. La dénomination officielle reste modifiable
dans Mentions légales, là où un changement de nom compte vraiment.

**15 août** — les trois défauts de la section 2 : `og:title` doublé sur trois pages
(et `titrePage()` qui le fait désormais suivre `document.title`), cadres à logo de
hauteurs inégales, six libellés YAML sans guillemets.
