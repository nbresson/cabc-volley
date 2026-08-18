# Backlog

Ce qui reste à faire sur le site, par ordre de valeur — pas par ordre d'arrivée.
Y figurer n'engage à rien : une ligne peut rester en bas indéfiniment, ou être
supprimée. On y retire plus qu'on y ajoute.

Dernière revue : **18 août 2026**. Le moissonnage FFVB a été sondé ce jour-là : l'accord de la ligue est obtenu, le rapprochement est validé sur les 53 matchs, et les deux sujets FFVB qui n'en font plus qu'un — classement **et** résultats viennent de la même page — sont fondus en une seule entrée. Reste distinct, et à ne pas confondre : le **score en direct** depuis l'application de feuille de match. Les deux sujets Meta — direct et publications — partagent une même question, posée une fois sous « Afficher les publications ». Les livrets d'accueil sont entrés le 15 août.

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

### Moissonner classements et résultats sur le site de la FFVB
**Analysé le 15 août, sondé le 18 août — le concept tient, et l'obstacle juridique
est levé.** Le classement et les résultats sont saisis à la main alors qu'ils
existent déjà chez la fédération.

**L'accord de la ligue est obtenu.** C'était la seule réserve qui ne se levait pas
avec du code ; elle est réglée, le chantier peut commencer.

**Un seul chantier, pas deux.** Les résultats sont sur la même page que le
classement : même requête, même cadence, même repli. Trois requêtes HTTP par
passage suffisent pour tout.

| | |
| --- | --- |
| Adresse | `vbspo_calendrier.php?saison=AAAA/AAAA&codent=…&poule=…` |
| Poules | `codent=LIAQ&poule=RMB`, `codent=LIAQ&poule=RFB`, `codent=ABCCS&poule=3MD` |
| Rendu | côté serveur — tout est dans le HTML livré, aucun JavaScript à exécuter |
| Réponse | 125 Ko en 0,6 s |
| Encodage | latin-1, à convertir à la lecture |

**Le paramètre de la nationale était la dernière inconnue : c'est `codent=ABCCS`.**
Il ne figure nulle part sur la page du club, qui renvoie vers
`resu/seniors/2026-2027/index_3md.htm` — un frameset FrontPage dont le cadre
intérieur appelle le même `vbspo_calendrier.php` que les régionales. D'où un seul
parseur pour les trois poules, et non deux formats.

#### Le rapprochement est validé sur la totalité
**53 matchs sur 53** : code présent chez la fédération, date identique au jour près,
dans les trois poules. La saisie du club est bonne d'un bout à l'autre, et le champ
« Numéro de match » est renseigné partout — ce n'était pas le cas le 15 août.

**Mais le code n'est pas unique d'une saison à l'autre.** RMB001–090 et 3MD001–132
sont identiques en 2025/2026 et en 2026/2027. La clé de rapprochement est donc
**(saison, code)**, la saison se déduisant de la date du match : aucun champ à
ajouter. Conséquence immédiate, **ne jamais saisir dans Decap un match d'une saison
passée** : `check-content.mjs` refuserait le doublon de numéro et bloquerait le
déploiement. Ce contrôle deviendra faux le jour où l'on voudra un historique — à
traiter alors, pas avant.

#### Structure des données de la page
Une ligne de calendrier compte douze cellules, **dont des vides qui portent
l'alignement** : les retirer décale toutes les colonnes.

```
0 code · 1 date · 2 heure · 3 équipe à domicile · 4 séparateur vide
5 équipe en déplacement · 6 sets dom. · 7 sets ext. · 8 détail des sets
9 total de points · 10 arbitres
```

L'équipe à domicile est **toujours** à gauche. Une rencontre dont une équipe est
`xxxxx` est une journée d'exemption, pas un match : neuf équipes en R1 masculin,
donc deux exemptions par équipe sur dix-huit journées.

Le tableau de classement vit sur la même page, colonnes `Points · Jou. · Gag. ·
Per. · F. · 3-0 · 3-1 · 3-2 · 2-3 · 1-3 · 0-3 · Set.P · Set.C · Coeff.S · Pts.P ·
Pts.C · Coeff.P`. `F.` compte les **forfaits déclarés**.

#### Le classement se lit, il ne se recalcule pas
Démontré plutôt que supposé. Un `P` dans une colonne de sets signale une
**pénalisation** : le match est perdu pour l'équipe qui la porte, et la ligue lui
retire un point au classement.

Sur RMB 2025/2026, Cosmic Volley totalise une victoire 3-1 et trois défaites 2-3,
soit **6 points** au barème 3/2/1/0. La fédération en publie **5**. Le même calcul
donne 34 points pour Brive, et la fédération en publie 34 : le barème est bon,
l'écart est bien le retrait.

**Et ce retrait est invisible dans le tableau** — la colonne `F.` de Cosmic est
vide, rien ne le signale. Un moissonneur qui reconstruirait le classement depuis
les résultats afficherait cette équipe à 6 points toute la saison sans que personne
ne comprenne pourquoi.

#### Architecture
Le worker interroge la FFVB, garde le résultat en KV, et sert le contenu depuis le
cache quand il est frais. **Repli sur le fichier saisi à la main dès que quoi que ce
soit échoue** — la saisie manuelle ne disparaît pas, elle devient le filet.

**Le worker ne doit pas écrire dans `matches.json`.** C'est le fichier que le bureau
édite dans Decap ; le réécrire effacerait une saisie en cours. Il expose les
résultats moissonnés à côté, indexés par (saison, code), et la page fusionne à la
lecture : **un score saisi à la main gagne toujours sur un score moissonné**. Le
classement, lui, peut être servi directement — personne d'autre ne le touche.

**Cadence : toutes les heures, samedi et dimanche seulement**, soit `0 * * * 6,0` —
48 déclenchements par semaine au lieu de 168. Les crons sont en UTC, ce qui couvre
le samedi matin jusqu'au lundi 1 h ou 2 h du matin en heure française. *À surveiller
la première saison : si la fédération valide certains résultats le lundi, il faudra
deux ou trois passages de plus.*

#### Ce que le parseur doit refuser de deviner
Sur les trois poules de 2025/2026, la seule valeur non numérique rencontrée dans les
colonnes de sets est `P`, une fois par poule. Aucune marque de forfait n'a été vue.
Toute valeur inconnue doit donc **mettre le match de côté avec une alerte visible**,
jamais produire un score inventé.

**Fragilité.** Ce HTML est d'une autre époque — balises en majuscules, `bgcolor`,
Apache 2.2. Stable depuis des années parce que personne n'y touche, mais une refonte
casserait l'analyse **en silence**. D'où le repli, et un signal visible quand le
moissonnage échoue.

**Prochain pas :** écrire le moissonneur. Le sondage a validé l'extraction des
résultats et du classement sur la saison passée ; le code du sondage était jetable et
n'a pas été conservé.

**Les feuilles de match** restent accessibles par
`ffvolley_fdme.php?saison=…&codent=…&codmatch=RMB002` si l'on veut un jour lier le
détail officiel d'une rencontre.

**Ces données ne remontent qu'une fois le match terminé** — confirmé par le bureau,
qui connaît la chaîne. Ce n'est donc pas une source de score en direct. Le direct est
un sujet séparé, voir l'entrée suivante.

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

### Quatre livrets d'accueil
**Demandé le 15 août.** Un livret par public — licencié majeur, licencié mineur (et ses
parents), bénévole, entraîneur — sur une architecture **tronc commun + module**, pour
qu'une correction du socle se répercute partout.

Le sommaire détaillé, les neuf sections du tronc commun et les quatre modules sont dans
[`docs/superpowers/specs/2026-08-15-livrets-accueil-sommaire.md`](superpowers/specs/2026-08-15-livrets-accueil-sommaire.md),
avec l'analyse complète. Trois points en ressortent :

**Le sommaire fourni se trompe sur la pile.** Il évoque « Astro + Decap » : le site
n'est pas en Astro, sa seule dépendance est `wrangler`. Toute recommandation appuyée
sur des composants Astro est à réécrire.

**Six des neuf sections du tronc commun existent déjà** sur le site — histoire, chiffres
clés, gouvernance, gymnases, licence et tarifs, partenaires, RGPD. Les recopier dans
quatre livrets crée huit versions de la même information. Les tarifs sont l'exemple
type : ils changent chaque saison, et un PDF distribué en septembre survit à sa propre
péremption. Le tronc commun devrait **renvoyer** au site plutôt que le répéter.

**Le chemin le moins cher est déjà ouvert.** La bibliothèque Infos accepte des
documents téléversés — elle en compte seize. Le bureau peut rédiger, exporter en PDF et
déposer **sans une ligne de code**. Le chemin intermédiaire, des pages web nourries par
les JSON existants avec une feuille de style d'impression, est le seul où une
correction de tarif se propage d'elle-même ; il ne se justifie que si le manuel
s'essouffle.

**Ce projet est surtout de l'écriture** : une cinquantaine de pages, dont une bonne part
relève de décisions du bureau qui n'existent pas encore par écrit — charte du club,
charte des parents supporters, politique vestiaires, référent intégrité, plan de
formation. Le code n'est pas le chemin critique.

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

**15 août** — les trois finitions de la relecture d'août, avec leurs entrées de galerie
dans le même commit : navigation entre fiches d'équipe, période remontée dans la colonne
de la frise, badge « Staff » pour l'encadrement. Au passage, l'« écart connu » des
variantes de badge est résorbé — cinq usages et non deux, la relecture ayant omis
`boutique.html` et la liste de l'accueil, et cité `equipe.html` où il n'y en avait aucun.

**15 août** — le réglage « Nom du club », qui n'était lu nulle part : un éditeur
pouvait le modifier sans que rien ne change. Retiré plutôt qu'affiché — le nom est
écrit en dur à 34 endroits, dont 15 `<title>` et 15 `og:site_name` que les moteurs
lisent et qu'un JSON ne peut pas nourrir. Un champ ne gouvernant que les 3 rendus par
JS aurait produit un site incohérent. La dénomination officielle reste modifiable
dans Mentions légales, là où un changement de nom compte vraiment.

**15 août** — les trois défauts de la section 2 : `og:title` doublé sur trois pages
(et `titrePage()` qui le fait désormais suivre `document.title`), cadres à logo de
hauteurs inégales, six libellés YAML sans guillemets.
