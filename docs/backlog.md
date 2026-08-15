# Backlog

Ce qui reste à faire sur le site, par ordre de valeur — pas par ordre d'arrivée.
Y figurer n'engage à rien : une ligne peut rester en bas indéfiniment, ou être
supprimée. On y retire plus qu'on y ajoute.

Dernière revue : **15 août 2026**. Relecture du même jour : trois entrées ajoutées, une réglée sur place.

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

### Lien vers le direct Facebook du match
**Demandé le 15 août.** Le club diffuse certains matchs en direct sur sa page
Facebook. Un visiteur qui arrive sur le site un soir de match ne trouve rien qui l'y
mène.

Forme pressentie : un champ `live` par match dans `matches.json` — l'adresse de la
vidéo, saisie depuis Decap — et un bouton dans le bandeau du prochain match, à côté
de « Venir au match » et « Mon agenda ».

**Trois questions à trancher au moment de le faire**, notées ici pour ne pas les
redécouvrir :

1. **Lien sortant ou vidéo intégrée ?** Facebook fournit un embed, mais il charge ses
   scripts et dépose ses traceurs. Le site a délibérément auto-hébergé ses polices
   pour n'appeler aucun tiers ; une intégration reviendrait sur ce choix et
   demanderait une bannière de consentement. Un lien sortant ne coûte rien de tout
   cela. **Recommandation : lien sortant.**
2. **Quand le montrer ?** Un bouton « Regarder le direct » affiché trois semaines
   avant le match ment. Le plus simple qui fonctionne : ne l'afficher qu'à partir
   d'une heure avant le coup d'envoi, et le laisser jusqu'au lendemain — le compte à
   rebours sait déjà lire la date du match.
3. **Et après le match ?** L'adresse d'un direct terminé reste valide et devient un
   replay. Faut-il le laisser paraître sur la fiche d'équipe, ou disparaître ?

Rien de tout cela n'est bloquant : le champ peut arriver d'abord, l'affichage
ensuite.

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
