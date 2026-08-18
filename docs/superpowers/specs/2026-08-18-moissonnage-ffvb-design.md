# Moissonnage FFVB — classements et résultats — design

**Date** : 2026-08-18
**État** : validé, prêt pour la planification

## Le problème

Le classement et les résultats sont saisis à la main alors qu'ils existent déjà chez la
fédération. Trois poules, une cinquantaine de rencontres par saison : c'est du travail
hebdomadaire, et il repose aujourd'hui sur une seule personne — voir la section 1 du
backlog.

L'accord de la ligue est obtenu. C'était la seule réserve qui ne se levait pas avec du
code.

Le sondage du 18 août a validé le concept sur des données réelles. Ses conclusions sont
dans [`docs/backlog.md`](../../backlog.md), entrée « Moissonner classements et résultats
sur le site de la FFVB », et ne sont pas répétées ici. Quatre comptent pour la
conception :

- les résultats sont sur **la même page** que le classement — un seul moissonneur ;
- le rapprochement tient sur **53 matchs sur 53**, par le numéro de match ;
- le code de match **n'est pas unique entre saisons** : la clé est `(saison, code)` ;
- le classement **ne se recalcule pas** : `P` et `F` entraînent des ajustements de
  points que les résultats ne permettent pas de deviner.

## Trois décisions structurantes

### Les données moissonnées sont éphémères

Le worker n'écrit **jamais** dans `matches.json` ni dans `classement.json`. Il moissonne
et garde en cache ; les fichiers du dépôt restent la propriété du bureau.

Trois raisons. Aucun robot ne commite sur `main`, donc aucune collision avec une saisie
Decap en cours. Aucun moissonnage ne déclenche de déploiement. Et le repli existe déjà :
cache vide ou moissonnage cassé, la page affiche « En attente de résultat », état
honnête mis en place le 18 août.

Le coût assumé : les résultats ne sont pas versionnés. La fédération reste la source, et
le bureau peut toujours saisir un score à la main s'il veut qu'il soit permanent.

### La fusion se fait dans le worker

Le worker intercepte les requêtes vers `content/matches.json` et
`content/classement.json`, y injecte ce qu'il a en cache, et sert le résultat. **Aucune
page ne change.**

`run_worker_first` est déjà à `true` : toutes les requêtes traversent le worker, la
fusion ne coûte pas de détour. La logique vit à un seul endroit au lieu de trois — la
page d'accueil, le calendrier et la fiche d'équipe lisent tous ces fichiers.

Decap utilise `backend: github` et lit les fichiers par l'API GitHub, pas par l'adresse
du site. L'éditeur continue donc de voir le fichier réellement saisi. C'était le piège
le plus sérieux de cette approche — un éditeur enregistrant par mégarde une donnée
moissonnée comme étant la sienne — et il n'existe pas ici.

Le coût assumé : le worker devient couplé à la forme du contenu. On le limite en
n'écrivant que des clés connues et en laissant passer tout le reste intact.

### L'échec ne se signale qu'au journal

Pas d'email, pas de mention sur la page. Le worker écrit au journal Cloudflare, dont
l'observabilité est déjà activée dans `wrangler.jsonc`. Personne n'est prévenu : il faut
penser à regarder.

C'est délibéré pour démarrer. On saura vite si les pannes sont fréquentes avant
d'investir dans une alerte, et un email par passage raté produirait 48 messages par
week-end sans anti-répétition.

## Architecture

### Le moissonneur

Déclenché par cron `0 * * * 6,0` — toutes les heures, samedi et dimanche, en UTC. La
fenêtre couvre le samedi matin jusqu'au lundi 1 h ou 2 h du matin en heure française.

**La liste des poules se déduit de `matches.json`**, elle n'est pas écrite en dur. Le
préfixe du numéro de match est le code de poule, et le champ `equipe` du même match donne
le slug de l'équipe :

```
3MD005 + equipe: n3-masculin   ->  poule 3MD  ->  classement de n3-masculin
RMB007 + equipe: r1-masculin   ->  poule RMB  ->  classement de r1-masculin
```

Le club engage une équipe et saisit ses matchs : le moissonneur suit sans qu'on touche au
code.

Seul le `codent` ne se déduit pas — c'est une constante de la fédération, pas une donnée
du club. Table dans le worker : `RMB` et `RFB` vers `LIAQ`, `3MD` vers `ABCCS`, repli sur
`LIAQ` et trace au journal pour une poule inconnue. Le demander à un bénévole dans Decap
n'aurait pas de sens : il ne peut pas le savoir.

La saison se déduit d'une date : de juillet à décembre, `AAAA/AAAA+1` ; de janvier à
juin, `AAAA-1/AAAA`. Le cron l'applique à la date courante, la fusion à la date du
match — ce n'est pas la même chose en avril.

Adresse : `vbspo_calendrier.php?saison=AAAA/AAAA&codent=…&poule=…`, réponse en latin-1,
125 Ko en 0,6 s.

### Le cache

Une seule clé par saison, `moisson:AAAA/AAAA`, contenant les trois poules avec leurs
classements et leurs résultats. La fusion se produit à chaque requête sur
`matches.json` : elle ne doit pas y payer trois lectures.

Le cron **met à jour poule par poule sans écraser le reste**. Si une page ne répond pas,
les données de la semaine précédente restent servies au lieu de disparaître.

Pas de durée de péremption : un résultat de samedi dernier est toujours vrai. L'objet
porte la date du dernier moissonnage réussi, par poule.

### La fusion

Deux règles opposées, et l'asymétrie est volontaire — elle suit qui fait autorité sur
quoi.

| | Qui l'emporte | Pourquoi |
| --- | --- | --- |
| **Résultats** | la saisie manuelle | Le bureau corrige une erreur de la fédération, ou saisit un score le samedi soir avant qu'elle ne publie. Un score déjà présent n'est jamais écrasé. |
| **Classement** | le moissonnage | C'est un instantané complet, pas des lignes qu'on amende. Les lignes saisies à la main sont le repli. |

Quand un score est injecté, le match passe aussi en `terminé` : sans quoi il resterait
annoncé « à venir » tout en affichant son score.

**Un classement moissonné vide ne remplace rien.** Avant la première journée, la
fédération publie un tableau sans lignes ; le fichier saisi à la main continue alors
d'être servi. Le moissonnage ne l'emporte que s'il rapporte au moins une ligne.

Le rapprochement se fait sur `(saison, numéro)`, la saison venant de la date du match et
non de la date courante — un match d'avril appartient à la saison ouverte en septembre.

**Toute erreur dans la fusion fait servir les octets d'origine.** Le worker ne casse
jamais le site : on retombe sur le comportement d'aujourd'hui.

## Ce que le parseur refuse de deviner

Structure d'une ligne de calendrier, douze cellules **dont des vides qui portent
l'alignement** — les retirer décale toutes les colonnes :

```
0 code · 1 date · 2 heure · 3 équipe à domicile · 4 séparateur vide
5 équipe en déplacement · 6 sets dom. · 7 sets ext. · 8 détail des sets
9 total de points · 10 arbitres
```

L'équipe à domicile est toujours à gauche.

- Une ligne dont une équipe vaut `xxxxx` est une **journée d'exemption**, pas un match :
  ignorée.
- `P` (pénalisation) et `F` (forfait) valent **zéro set** pour l'équipe qui les porte, et
  match perdu.
- Toute autre valeur non numérique met **ce match seul** de côté, avec une trace au
  journal. Les autres passent. Le moissonneur ne produit jamais un score inventé.

Le classement est recopié tel quel, **jamais recalculé**. `notre_club` est posé sur la
ligne dont le nom contient « BRIVE » : c'est une heuristique assumée, la fédération
écrivant « C.A. BRIVE/CORREZE VOLLEY », et rien de plus fiable n'est disponible.

## Éprouver sans réseau

Le dépôt n'a pas de framework de test, mais il a `npm run check`, bloquant en production.
On y ajoute un contrôle du parseur sur des pages réelles enregistrées comme échantillons,
celles du sondage, vérifiant des valeurs connues :

- seize matchs de Brive en RMB 2025/2026, huit à domicile et huit à l'extérieur ;
- deux journées d'exemption pour Brive dans cette poule ;
- 34 points au classement pour Brive, 5 pour Cosmic Volley ;
- le `P` de Cosmic Volley en RMB 2025/2026 lu comme une défaite 0-3 ;
- le `F` d'US Talence en RMB 2024/2025 lu comme une défaite 0-3.

Ces cinq cas sont exactement ceux qui ont coûté deux allers-retours pendant le sondage.
Les figer les protège d'une régression, et le contrôle tourne sans réseau.

## Hors périmètre

- **Le vieillissement d'un match joué que la fédération n'a pas encore publié.** Le
  moissonneur n'y répond pas. Il faudra la règle sur la date, dont il est établi qu'elle
  ne doit pas affirmer « Défaite ». Sujet voisin, pas le même.
- **L'écriture dans le dépôt.** Écartée ci-dessus.
- **Le score en direct.** Entrée distincte du backlog, source différente.
- **L'historique des saisons passées.** Le contrôle d'unicité des numéros de match
  l'interdit aujourd'hui ; à traiter le jour où on le voudra, pas avant.

## Ce qui reste à décider au moment de planifier

- Le nom de l'espace de stockage clé-valeur et sa création dans le tableau de bord
  Cloudflare — le seul geste manuel de tout le chantier.
- Faut-il moissonner aussi en dehors du week-end la première saison, si la fédération
  valide certains résultats le lundi ? À observer, pas à décider maintenant.
