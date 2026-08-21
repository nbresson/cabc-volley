# Backlog

Ce qui reste à faire sur le site, par ordre de valeur — pas par ordre d'arrivée.
Y figurer n'engage à rien : une ligne peut rester en bas indéfiniment, ou être
supprimée. On y retire plus qu'on y ajoute.

Dernière revue : **21 août 2026**. La veille, en deux passes. Le matin : le moissonnage FFVB, le vieillissement des matchs, l'échappement du contenu éditorial et le contrôle des adresses écrites dans les pages. L'après-midi : les deux plannings de la page Horaires et la normalisation des créneaux, qui a fait sortir d'ici une entrée ouverte depuis le 19 au matin. `npm run check` est passé d'un garde-fou à quatre scripts et sept familles de contrôles. Ce qui reste du moissonnage n'est plus du développement mais de l'observation, consigné sous « Surveiller le moissonnage ». Reste distinct, et à ne pas confondre avec lui : le **score en direct** depuis l'application de feuille de match. Les deux sujets Meta — direct et publications — partagent une même question, posée une fois sous « Afficher les publications ». Les livrets d'accueil sont entrés le 15 août.

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

### Le jour J, plus aucun geste
**Réglé le 20 août.** Le socle SEO est posé, et il a emporté avec lui la corvée
de bascule. Le worker écrit `canonical`, `og:url` et `og:image` depuis l'hôte
qui répond : ils sont justes sur `workers.dev` aujourd'hui et le seront sur le
domaine sans qu'on rouvre un fichier. Le sitemap et le robots.txt n'attendaient
déjà rien.

Reste, mais côté Cloudflare et non côté code : brancher le domaine, et vérifier
que le barrage d'indexation se lève bien de lui-même — il se juge sur l'hôte.

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

### Deux mégaoctets et demi d'images au mauvais format
**Relevé le 21 août.** Seize fichiers en JPG ou PNG là où le README impose le
WebP — **2,5 Mo, soit 59 % du poids total des images.** Les plus lourds :
`ecole.jpg` (323 Ko), `annonce_n3m_2026-2027.jpg` (304 Ko),
`echarpe_exemple.jpg` (266 Ko).

**Aucun ne déclenche l'avertissement existant**, qui ne regarde que le poids et
place son seuil à 400 Ko. Ce sont des envois faits depuis Decap, qui ne convertit
pas.

Deux gestes : convertir — 700 à 900 Ko gagnés —, et ajouter au contrôle un
avertissement sur le format, jumeau de celui qui existe sur le poids. Un
avertissement et non une erreur : bloquer la photo d'un bénévole serait
disproportionné.

### Un agenda auquel on s'abonne, plutôt qu'un fichier
**Relevé le 21 août** — et restauré le 22 : la révision de l'entrée sur les
encadrants avait avalé ce paragraphe par un remplacement trop large. Le `.ics`
téléchargé est une photographie : au premier report d'horaire FFVB — et les
horaires bougent, c'est tout l'objet du moissonnage — l'agenda du supporter est
faux sans qu'il le sache. Le worker pourrait servir un `/calendrier.ics` régénéré
depuis `matches.json`, moisson comprise : un abonnement dans Google ou Apple
Agenda, à jour tout seul. Le téléchargement actuel resterait, pour qui préfère
un fichier.

### La case « À la une ? » ne fait rien
**Relevé le 21 août**, en passant les actualités au tri par date. La collection
en porte une case à cocher qu'aucune page n'a jamais lue — la une a toujours été
positionnelle, elle est désormais chronologique. Un champ qui accepte une saisie
sans effet est un piège : c'est l'argument qui avait fait retirer le réglage
« Nom du club ». À retirer du formulaire, ou à câbler comme épinglage si le
bureau veut reprendre la main sur la une.

### Les liens vers la Communauté WhatsApp
**Demandé le 21 août.** Le club anime une communauté WhatsApp qui n'apparaît nulle
part sur le site.

**Ce sur quoi s'appuyer.** Le bandeau réseaux est déjà une table dans `site.js` :
chaque entrée porte un nom, une URL de secours, un glyphe et le nom d'un champ de
Réglages qui fait autorité sur l'adresse. Instagram, Facebook et le classement FFVB
y sont. Ajouter WhatsApp, c'est une ligne dans cette table, un champ dans Réglages,
et un glyphe à dessiner dans le même trait que les trois autres — deux pixels, sans
remplissage, dans un cadre carré.

**Le pluriel de la demande est la vraie question.** Un lien unique vers la communauté
tient dans le bandeau, qui paraît sur les vingt-sept pages. Plusieurs — un groupe par
équipe — n'y tiennent pas : leur place serait la fiche de chaque équipe, donc un champ
dans la collection Équipes, et non dans Réglages. Les deux ne s'excluent pas, mais ce
ne sont pas les mêmes travaux.

**Et un point qui doit être tranché avant d'écrire la ligne.** Un lien d'invitation
WhatsApp est ouvert : quiconque le trouve entre dans le groupe. Sur un site public,
il ne s'agit plus d'inviter des adhérents mais de publier une porte. Dans un club où
des mineurs sont inscrits, cela mérite une décision explicite du bureau — et, si le
choix est fait, une administration qui surveille les arrivées. Une autre voie existe :
ne pas publier le lien, et le faire envoyer par le formulaire de contact ou à
l'inscription.

### L'encadrant d'un créneau — en consultation au bureau
**Demandé le 21 août, situation arrêtée le même jour.** Les encadrants sont désormais
**publiés en nom complet**, saisis dans le champ Précision des créneaux — « Encadrement :
Jean-Pierre DELOST » — et visibles sur Horaires, les fiches d'équipe et les fiches de
gymnase. C'est le niveau d'exposition le plus élevé des quatre possibles, retenu à
titre provisoire.

**Le bureau est consulté** sur ce qu'il veut en faire : garder les noms complets — ce
qui suppose l'accord de chaque personne, accord qui se retire —, passer au prénom et
à l'initiale, à une mention sans nom, ou réserver l'information au bureau. Chaque nom
se retire en une ligne dans Decap.

Aucun développement n'est nécessaire tant que la réponse est l'un des trois premiers
niveaux : le champ Précision les porte tous. Seule la réservation au bureau demanderait
de retirer les noms du site. Un champ structuré — relation vers l'effectif — reste
possible plus tard, mais la question d'exposition précède la forme du champ.
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

| Ce qui manque | État au 21 août |
| --- | --- |
| Portraits du bureau | **3 sur 3** affichent `[ portrait ]` |
| Photo d'archive de l'histoire | champ vide, le placeholder est en ligne |
| Effectifs des équipes | **16 sur 18** n'ont aucun inscrit ; les deux autres en comptent 5 et 1 |
| Photo d'équipe | **12 sur 18** n'en ont pas |
| Entraîneur d'une équipe | **18 sur 18** ont le champ vide |
| Galeries des quatre gymnases | vides |
| Description du gymnase d'Arsonval | absente — les trois autres l'ont |
| « Mot » des partenaires | aucun des 17 n'en a |
| Accroche de la carte « Devenir partenaire » | absente |

---

## 5 · Gouvernance et mesure

### Le club ne saura pas s'il est lu
Aucune mesure d'audience. Après la bascule, personne ne saura si le site reçoit dix
ou mille visites, ni quelles pages servent. Cloudflare Web Analytics est gratuit,
sans cookie et sans bannière de consentement — le seul tiers qui resterait cohérent
avec le choix d'avoir tout auto-hébergé. Décision à prendre, pas une évidence.

### L'alerte de compilation attend sa clé
**Posée le 21 août**, après que la panne s'est produite pour de bon : une refonte
des équipes publiée depuis Decap a cassé deux renvois du worker, le contrôle a
arrêté le déploiement, et personne n'en a rien su pendant une heure.

Une action GitHub lance désormais `npm run check` à chaque poussée sur `main` —
donc à chaque publication Decap, et **avant** que Cloudflare ne compile. Elle
échoue bruyamment, et GitHub prévient l'auteur du commit.

**Reste à faire, deux minutes.** Pour que l'alerte atteigne quelqu'un d'autre que
l'auteur : créer une clé sur `web3forms.com` au nom de l'adresse destinataire
— le champ de copie de Web3Forms est payant, une clé gratuite ne délivre qu'à
l'adresse qui l'a créée — puis la ranger dans le secret `WEB3FORMS_ALERTE`
(`gh secret set WEB3FORMS_ALERTE`). Le dépôt étant public, ni l'adresse ni la clé
ne doivent figurer dans un fichier.

C'est le préalable posé par la section 1 : sans lui, on donne au bureau la clé
d'une porte qui peut se fermer en silence.

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

**22 août** — la vraie CSP, plus tôt que « un jour ». Le vecteur qui compte — le
script — est verrouillé par un nonce tiré à chaque requête et posé au vol par le
worker sur chaque balise ; un script injecté ne peut pas le connaître, et
l'épreuve le montre : l'intrus est bloqué quand le légitime s'exécute. Les styles
restent en ligne, et c'est documenté : un nonce ne s'applique pas aux attributs
`style=""`, qui sont l'écriture même du site — l'échappement sous contrôle de
compilation reste leur garde. L'admin est hors politique : Decap vient d'unpkg,
ce sont ses règles. La page Partenaires refaite le même jour — fusion d'encre
des cadres, rangées alignées, orpheline centrée, deux colonnes au téléphone —
il ne reste de son entrée que les échelles, travail d'image.

**21 août, seconde vague** — la passe d'idées et sa récolte. La saison n'est
plus jamais recopiée : calculée partout, pivot de juillet, le doublon des
licencié·es retiré avec elle. Les plannings s'impriment en affiches — neuf pages
inutilisables devenues cinq utiles, sections invisibles corrigées. Trois
en-têtes de sécurité sur chaque réponse du worker. La salle d'un créneau mène à
sa fiche. Les actualités paraissent par date, post-dater programme. Le même
jour : les cartes OpenStreetMap des quatre sites, teintées dans la charte, la
section « Qui s'y entraîne » des fiches de gymnase, la fusion d'encre du mur de
logos, et le formulaire des chiffres débarrassé de ses champs vides qui
bloquaient l'enregistrement.

Barrage d'indexation · redirections des anciennes URL · images en WebP · polices
auto-hébergées · page Partenaires et fiches de gymnase · formulaires Web3Forms ·
carte des gymnases et vignette de partage · page Adhésion entièrement sous Decap ·
mini-classement · favicon et sitemap.

**19 août** — le moissonnage FFVB des classements et des résultats, du sondage sur données réelles jusqu'à la mise en ligne. Trois autres chantiers le même jour, tous nés de la relecture du 17 août : une rencontre vieillit désormais avec sa date et non avec sa saisie — sans quoi l'accueil aurait annoncé un prochain match déjà joué dès le lendemain du 26 septembre ; le contenu éditorial est échappé avant insertion, avec un garde-fou qui refuse toute interpolation non protégée ; et le contrôle vérifie enfin les adresses écrites en dur dans les seize pages, trou par lequel un logo cassé était passé.

**21 août** — le socle SEO, et la corvée de bascule avec lui. Aucune des vingt
pages ne portait de `canonical` ni de JSON-LD. Le worker les écrit désormais
depuis l'hôte qui répond — il est le seul à le connaître, c'est ainsi qu'il juge
du barrage d'indexation — et il y ajoute `og:url`, qu'aucune page n'avait, en
ramenant `og:image` sur le même hôte. Les « deux gestes du jour J » n'existent
plus. Trois paramètres seulement font une page distincte, sans quoi une adresse
ornée de n'importe quel paramètre publicitaire se déclarerait canonique ; et une
page servie en 404 n'en reçoit pas.

Le même jour, l'alerte de compilation, et le contraste : soixante-trois textes en
taupe sous le seuil AA. La cause principale n'était pas la palette mais une
couleur imposée — le nom de salle des cases du planning portait `class="mono"`,
qui écrasait la couleur d'encre de sa case ; sur la case sombre il tombait à 3,07
et remonte à 9,94. Le jeton lui-même manquait de trois centièmes sur fond sable.

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
