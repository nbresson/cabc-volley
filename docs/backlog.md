# Backlog

Ce qui reste à faire sur le site, par ordre de valeur — pas par ordre d'arrivée.
Y figurer n'engage à rien : une ligne peut rester en bas indéfiniment, ou être
supprimée. On y retire plus qu'on y ajoute.

Dernière revue : **19 août 2026**, en deux passes. Le matin : le moissonnage FFVB, le vieillissement des matchs, l'échappement du contenu éditorial et le contrôle des adresses écrites dans les pages. L'après-midi : les deux plannings de la page Horaires et la normalisation des créneaux, qui a fait sortir d'ici une entrée ouverte depuis le 19 au matin. `npm run check` est passé d'un garde-fou à quatre scripts et sept familles de contrôles. Ce qui reste du moissonnage n'est plus du développement mais de l'observation, consigné sous « Surveiller le moissonnage ». Reste distinct, et à ne pas confondre avec lui : le **score en direct** depuis l'application de feuille de match. Les deux sujets Meta — direct et publications — partagent une même question, posée une fois sous « Afficher les publications ». Les livrets d'accueil sont entrés le 15 août.

---

## 1 · Personne d'autre ne peut publier

**Relevé le 15 août.** Le dépôt compte **257 commits, un seul auteur, zéro
collaborateur, zéro invitation en attente.** Tous les enregistrements Decap —
« Update Matchs & résultats », « Update Gymnases », « Update Partenaires » — portent
le même nom.

Le bureau n'a jamais ouvert le CMS, et ne le peut pas : Decap commite sur GitHub, ce
qui exige un accès en écriture au dépôt.

Ça change la lecture de la section 4. Les portraits manquants, les douze équipes sans
effectif, les galeries vides ne sont peut-être pas un problème de photos : personne
n'a la clé. La refonte à treize équipes du 19 août l'a rendu plus visible encore : huit
équipes sont nées ce jour-là, aucune n'a d'inscrit ni d'entraîneur nommé.

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

### Surveiller le moissonnage FFVB sa première saison
**Livré le 19 août.** Le worker interroge les trois poules le week-end, garde le
résultat en cache et l'injecte à la volée dans `matches.json` et `classement.json`.
Il n'écrit jamais dans le dépôt : une saisie manuelle l'emporte toujours sur un score
moissonné. Le raisonnement complet est dans
[`docs/superpowers/specs/2026-08-18-moissonnage-ffvb-design.md`](superpowers/specs/2026-08-18-moissonnage-ffvb-design.md).

Ce qui reste n'est plus du développement, c'est de l'observation. Quatre points, par
ordre d'échéance.

**Le premier week-end de championnat, regarder les journaux.** Le journal Cloudflare
est le **seul** canal d'alerte du dispositif : pas d'email, pas de mention sur la
page. C'était un choix assumé pour démarrer — on saura vite si les pannes sont
fréquentes avant d'investir dans une alerte. Personne n'est prévenu, il faut penser à
regarder.

**Une page mêlant matchs joués et à venir n'a jamais été analysée.** La fédération
publie onze colonnes pour un match programmé et douze pour un match joué, en mettant
le gymnase là où iront les sets. Les deux cas sont éprouvés séparément, sur des
échantillons réels ; leur mélange n'existera qu'à partir du 26 septembre.

**Le classement du National 3 n'a jamais été moissonné pour de vrai.** La fédération
ne publie aucun tableau avant la première journée. La voie de remplacement — le
moissonnage écrase les lignes saisies — n'a donc tourné que sur des données
fabriquées. Le champ « Nom de l'équipe chez la FFVB » est renseigné pour les trois
équipes seniors et vérifié contre les vraies pages : chacun désigne exactement un
club de sa poule.

**Faut-il moissonner hors week-end ?** Si la fédération valide certains résultats le
lundi, il faudra deux ou trois passages de plus. À observer, pas à décider maintenant.

#### Points mineurs différés, aucun bloquant
Relevés pendant l'exécution et jugés non bloquants par la relecture finale :
duplication des utilitaires d'analyse entre `ffvb/calendrier.mjs` et
`ffvb/classement.mjs` · `capture()` du fichier de contrôle est synchrone et son nom
ne le dit pas, un appelant asynchrone y perdrait sa trace · `fusionnerMatchs` lève si
le cache n'a pas de champ `resultats`, là où `fusionnerClassement` garde le même accès
· la non-mutation n'est éprouvée qu'au premier niveau, et seulement pour les matchs ·
`date`, `detail` et `forfaits` sont produits par les parseurs sans que personne ne les
lise · le journal trace un écart par match plutôt qu'un résumé par poule, ce qui
amplifierait un vrai changement de format · `X-Robots-Tag` manque sur `/robots.txt` et
sur les redirections 301, défaut antérieur au chantier · la fenêtre de dédoublonnage
des traces suit la durée de vie de l'isolat, sans délai explicite.

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

### Un champ de tarifs attend encore le club
**Ouverts le 19 août**, avec le déplacement du contenu vers les pages du menu Infos.
La collection **Tarifs & licences** portait trois blocs facultatifs et vides. Le
Pass'Sport et le paiement en plusieurs fois ont été renseignés le jour même ; **ce que
la licence comprend** reste vide. Ils n'avaient pas été préremplis à dessein : les mêmes informations existent déjà, mais enfermées dans des
phrases — le texte de la troisième étape d'Adhésion, le chapô de son formulaire, la
première réponse de la FAQ. Les recopier aurait fait une quatrième version à corriger
à la main.

Le jour où le club les remplit, **ces trois phrases deviennent redondantes** et méritent
d'être allégées : c'est un geste éditorial, pas un développement.

### Trois libellés d'équipe à revoir
**Relevé le 19 août**, après la refonte à treize équipes. `baby-kid-volley` porte la
catégorie `baby-volley` — seule étiquette en minuscules et à tiret parmi treize, quand
ses sœurs portent « Régional 2 F », « M13 », « UFOLEP ». Elle s'affiche telle quelle
sous le titre de la fiche et sur les cartes de l'accueil.

Deux autres disent moins que leur nom : `m15-m18-f` est étiquetée « M18 F » et
`m13-m11-m9` simplement « M13 ». Rien n'est cassé — c'est de la saisie Decap, à faire
en repassant.

### Revoir la présentation des partenaires
**Demandé le 19 août.** La page Partenaires et le mur de logos posé en pied de chaque
page méritent une passe de mise en forme. Cinq points relevés à la capture, du plus
visible au plus discret.

**Les cartes ne s'alignent pas entre elles.** Les cadres ont bien la même hauteur, mais
le lien « Voir le site » flotte à des hauteurs différentes selon que le nom tient sur
une, deux ou trois lignes — « Netto » contre « Comité départemental de volley de la
Corrèze ». Une rangée se lit en dents de scie.

**Une carte reste orpheline.** Cinq institutions dans une grille de quatre colonnes
laissent trois cellules vides sur la seconde rangée. Le mur de logos a reçu son
correctif le 17 août — sa dernière ligne se centre —, la grille de cartes non.

**Les fonds de logos sont hétérogènes.** Certains portent leur propre rectangle blanc
ou gris, hérité du fichier fourni ; d'autres sont détourés et posent directement sur le
crème. La grille paraît rapiécée. Un fond uniforme derrière chaque logo, ou un
détourage à la source, réglerait la question.

**Les échelles ne sont pas harmonisées.** CGR Cinémas remplit son cadre quand le
Département de la Corrèze y flotte, et le logo de TDSC est un pavé de texte illisible à
cette taille. Un cadrage optique — plutôt qu'un simple `object-fit` — demanderait de
retoucher les fichiers, ce qui est du travail d'image et non de code.

**Sur téléphone, la page est interminable.** Une carte par ligne avec un cadre en 4/3 :
dix-sept partenaires font défiler très longtemps pour peu d'information. Deux colonnes,
ou un cadre moins haut, suffiraient.

Rien de tout cela n'est urgent ni bloquant : c'est de la finition, à faire d'un bloc
plutôt que par retouches successives.

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

| Ce qui manque | État au 19 août |
| --- | --- |
| Portraits du bureau | **3 sur 3** affichent `[ portrait ]` |
| Photo d'archive de l'histoire | champ vide, le placeholder est en ligne |
| Effectif National 3 masculin | 5 inscrits, **4 sans photo** |
| Effectifs des douze autres équipes | **un seul inscrit au total** — R1 féminin en compte un, les onze autres aucun |
| Entraîneur d'une équipe | **13 sur 13** ont le champ vide |
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

### Un échec de compilation ne prévient personne
**Relevé le 19 août.** `npm run check` bloque le déploiement quand le contenu devient
incohérent — c'est voulu, et depuis ce jour les messages disent quoi corriger. Mais
rien ne signale l'échec : il faut ouvrir l'onglet Builds du worker pour le voir.

Tant que le seul éditeur est aussi celui qui code, ça passe. Le jour où le bureau
publie depuis Decap, un échec figera le site sans que l'éditeur comprenne pourquoi —
c'est exactement le « j'ai saisi et rien ne change » que le manuel décrit déjà.
Cloudflare sait envoyer une notification sur échec de build : un réglage du tableau de
bord, pas une ligne de code. **À régler avant d'ajouter les collaborateurs de la
section 1**, sans quoi on leur donne la clé d'une porte qui peut se fermer en silence.

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

**19 août** — le moissonnage FFVB des classements et des résultats, du sondage sur données réelles jusqu'à la mise en ligne. Trois autres chantiers le même jour, tous nés de la relecture du 17 août : une rencontre vieillit désormais avec sa date et non avec sa saisie — sans quoi l'accueil aurait annoncé un prochain match déjà joué dès le lendemain du 26 septembre ; le contenu éditorial est échappé avant insertion, avec un garde-fou qui refuse toute interpolation non protégée ; et le contrôle vérifie enfin les adresses écrites en dur dans les seize pages, trou par lequel un logo cassé était passé.

**19 août, seconde passe** — les deux plannings de la page Horaires, et ce qu'ils ont
obligé à ranger derrière eux. Les créneaux d'entraînement étaient une phrase saisie à
la main, redite sur quatre pages ; trois graphies de Saint-Germain et trois formats
d'heure y avaient divergé sans que rien ne s'en aperçoive. Ils sont devenus des champs
— jour, début, fin, salle, précision — et le champ `creneau` a disparu : cinq
affichages composent désormais leur phrase d'une seule saisie. L'alternance du vendredi
est devenue deux séances, le code n'en gardant qu'une jusque-là. Un second tableau a
suivi, par gymnase, pour que le bureau voie l'occupation des salles ; aucune alerte de
collision ne l'accompagne, les deux seuls chevauchements des données étant précisément
l'alternance.

Deux ruptures trouvées en vérifiant, le même jour. La refonte à treize équipes publiée
depuis Decap avait laissé deux redirections **301 permanentes** aboutir sur « Équipe
introuvable » ; elles visent désormais Baby - Kid Volley, et `check-content` refuse tout
renvoi vers une équipe qui n'existe pas. Et la galerie du design system affirmait quatre
couleurs hors jetons quand `style.css` en portait six ; le contrôle vérifie maintenant
que cette liste reste complète.

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
