# Livrets d'accueil — sommaire et analyse

Quatre livrets d'accueil : licencié majeur, licencié mineur, bénévole, entraîneur.
Sommaire fourni par le bureau le 15 août 2026. Ce document en garde le détail et y
ajoute ce que la confrontation au site a appris.

## L'architecture retenue

**Tronc commun + modules.** Un socle identique aux quatre livrets, puis une partie
propre à chaque public. Une correction du tronc se répercute partout, ce qui est
l'intérêt principal : quatre documents indépendants divergeraient en une saison.

Format visé : **12 à 16 pages par livret**, tronc commun compris — et condensé
différemment selon le public, les mineurs n'ayant pas besoin du détail de la
gouvernance.

Versionné par saison (« Livret d'accueil 2026-2027 »), avec date de mise à jour en pied
de page.

---

## Tronc commun

1. **Mot de bienvenue** — édito du président (une demi-page, ton chaleureux), pourquoi
   ce livret et comment l'utiliser.
2. **Présentation du club** — histoire (dates clés, palmarès), valeurs et projet
   associatif, chiffres clés, affiliations (FFVB, ligue Nouvelle-Aquitaine, comité
   Corrèze).
3. **Organisation et gouvernance** — organigramme (bureau, CA, commissions),
   trombinoscope des contacts avec leurs rôles, tableau « question → interlocuteur ».
4. **Vie pratique** — gymnases (adresses, plans d'accès, parkings, horaires), planning
   des créneaux par catégorie, calendrier de la saison (reprise, vacances, événements,
   AG).
5. **Communication** — site web, réseaux sociaux, groupes de messagerie ; où trouver
   les convocations, annulations et résultats ; charte d'usage des groupes.
6. **Licence et assurance** — types de licences FFVB, procédure d'inscription et de
   renouvellement (certificat médical, questionnaire santé), tarifs et aides
   (Pass'Sport, coupons ANCV, aides CE, paiement échelonné), assurance : ce qui est
   couvert et comment déclarer un accident.
7. **Règles de vie commune** — charte du club (respect, ponctualité, matériel,
   vestiaires), lutte contre les violences (référent intégrité, cellule fédérale, 119),
   droit à l'image (formulaire de consentement), RGPD.
8. **Événements et vie du club** — tournois, fêtes, loto, stages ; boutique ;
   partenaires et sponsors.
9. **Annexes** — lexique du volley pour les nouveaux, FAQ, formulaires utiles (ou QR
   codes vers les versions en ligne).

---

## Livret licencié majeur

- **Ma saison de joueur** — catégories, championnats (départemental, régional), format
  des compétitions, loisir contre compétition.
- **Engagements du licencié** — assiduité, prévenir en cas d'absence, obligations
  d'arbitrage et de table selon le niveau.
- **Équipement** — tenue, genouillères, chaussures, ce que fournit le club.
- **Santé** — échauffement, hydratation, blessures courantes, partenaires mutuelle ou
  ostéopathie s'il y en a.
- **Déplacements** — organisation du covoiturage, remboursements éventuels.
- **S'impliquer davantage** — passerelles vers le bénévolat, l'arbitrage,
  l'encadrement. Renvoi vers les autres livrets.

## Livret licencié mineur

Destiné **aussi aux parents**, en deux sous-parties : « Pour toi, jeune joueur » (ton
direct, illustré) et « Pour les parents ».

- **Parcours du jeune** — catégories M11 à M18, pôle espoir, détection, passerelles
  vers les seniors.
- **Rôle des parents** — dépose et récupération, avec la règle : l'enfant est sous la
  responsabilité du club **uniquement pendant le créneau**, et il faut vérifier la
  présence de l'entraîneur. Autorisations de sortie, transport lors des déplacements.
- **Charte du jeune joueur** — version simplifiée et positive des règles.
- **Charte des parents supporters** — comportement en tribune, relation avec
  l'entraîneur : qui parle sélection, et à quel moment.
- **Protection de l'enfance** — référent club, honorabilité des encadrants, numéros
  utiles (119), politique des vestiaires.
- **Scolarité et volley** — gestion des devoirs, aménagements éventuels.
- **École de volley / baby volley** le cas échéant.

## Livret bénévole

- **Pourquoi devenir bénévole** — besoins concrets du club, témoignages.
- **Les missions possibles** — une fiche par mission (table de marque, buvette,
  transport, logistique tournois, communication, sponsoring, encadrement AG…) avec
  temps estimé et compétences requises.
- **Cadre du bénévolat** — statut juridique, assurance du bénévole, remboursement de
  frais ou abandon de frais (reçu fiscal 66 %), défraiement kilométrique.
- **Formations accessibles** — table de marque, arbitrage, PSC1, formations fédérales
  et FDVA.
- **Fonctionnement interne** — accès aux clés, matériel, caisse buvette, procédures
  (commandes, remboursements, notes de frais).
- **Reconnaissance** — licence offerte, invitations, soirée des bénévoles.

## Livret entraîneur

- **Projet sportif du club** — philosophie de formation, objectifs par catégorie,
  continuité pédagogique entre groupes.
- **Cadre administratif** — statut (bénévole, indemnisé, salarié CCNS), diplômes requis
  (DRE1/2, BEF…), honorabilité, carte professionnelle si rémunéré.
- **Responsabilités** — encadrement des mineurs (jamais seul avec un enfant, gestion
  des vestiaires), pharmacie de premiers secours, conduite à tenir en cas d'accident
  (protocole et fiche réflexe), registre de présence.
- **Organisation sportive** — constitution des équipes, engagement en championnat,
  surclassements, mutations.
- **Outils** — accès gymnase (clés, alarme), matériel (inventaire, rangement),
  logiciels (feuilles de match électroniques, licences), budget alloué par équipe.
- **Relations** — avec les parents (cadre de communication), avec le bureau (réunions
  techniques), avec les arbitres.
- **Formation continue** — plan de formation du club, prise en charge financière,
  recyclages.
- **Fiches pratiques** — trame de séance type, checklist match à domicile, checklist
  déplacement, tournoi.

---

## Ce que la confrontation au site apprend

### Une erreur à corriger dans le sommaire fourni

Il évoque « votre stack site web (Astro + Decap) ». **Le site n'est pas en Astro.** La
seule dépendance du projet est `wrangler` : ce sont des fichiers HTML, CSS et JS servis
tels quels par un worker Cloudflare, sans étape de compilation. Toute recommandation
qui s'appuierait sur des composants Astro est à réécrire.

### Six des neuf sections du tronc commun existent déjà

| Section du tronc commun | Ce que le site contient au 15 août 2026 |
| --- | --- |
| Histoire, dates clés | 8 dates dans `club.json` |
| Chiffres clés | 220 · 8 · 32 · 4 |
| Gouvernance | 3 membres du bureau |
| Gymnases, accès | 4 sites avec adresses et itinéraires |
| Licence : tarifs et procédure | 90 / 120 / 160 €, 3 étapes, 4 questions fréquentes |
| Partenaires | 17 |
| RGPD, mentions légales | éditeur, hébergeur, articles |
| Communication | réseaux sociaux réglables, page Contact |

**C'est le point qui change la forme du projet.** Recopier ces contenus dans quatre
livrets crée huit versions de la même information. Les tarifs sont l'exemple type : ils
changent chaque saison, et un livret PDF distribué en septembre survit à sa propre
péremption.

Le tronc commun devrait donc **renvoyer** au site plutôt que le répéter — ce que le
sommaire prévoit d'ailleurs avec ses QR codes, à généraliser au-delà des seuls
formulaires.

### Trois chemins possibles, du moins cher au plus cher

1. **PDF déposés dans la bibliothèque Infos.** Possible **aujourd'hui, sans une ligne
   de code** : la collection Infos accepte déjà des documents téléversés, et en compte
   seize. Le bureau rédige dans son traitement de texte, exporte, dépose. Aucune
   automatisation, aucune garantie de fraîcheur.
2. **Pages web générées depuis les JSON existants**, une par livret, avec une feuille
   de style d'impression pour que « Imprimer → PDF » donne un document propre. Le tronc
   commun n'est plus recopié : il est lu à la source. Coût moyen, et c'est le seul
   chemin où une correction de tarif se répercute partout d'elle-même.
3. **Génération de PDF côté serveur.** Un vrai projet, et probablement inutile : le
   navigateur sait déjà imprimer en PDF.

### La page de signature ne peut pas être une page web

Le sommaire prévoit, en dernière page, un accusé de réception et une adhésion à la
charte, à signer — utile juridiquement, notamment pour les mineurs et les entraîneurs.
C'est le seul élément qui **exige** un artefact imprimable. Il conditionne le choix : le
chemin 2 doit produire une impression correcte, pas seulement un affichage.

### Ce projet est surtout de l'écriture

Quatre livrets de 12 à 16 pages, c'est de l'ordre de cinquante pages de rédaction, dont
une bonne part relève de décisions du bureau qui n'existent pas encore par écrit :
charte du club, charte des parents supporters, politique vestiaires, référent
intégrité, plan de formation. **Le code n'est pas le chemin critique.**
