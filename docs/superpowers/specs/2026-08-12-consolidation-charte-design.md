# Consolidation de la charte — design

Date : 2026-08-12
Statut : validé, prêt pour le plan d'implémentation

## Contexte

La galerie du design system a rendu visible ce que le site fabrique à la main. Le
relevé, dans les 12 pages et `site/assets/site.js` :

| Motif | Occurrences inline | État dans `style.css` |
| --- | --- | --- |
| `font-family:'Barlow Condensed'` hors `h1`–`h4` | 48, sur 13 tailles | aucune classe |
| Couleurs de mention `#8f8672`, `#a89e87`, `#c9c1ab` | 38 | 2 des 3 en dur dans une règle, la 3ᵉ absente |
| Lien souligné dans du texte courant | 9 | aucune classe |
| Retour de formulaire `.ok` / `.ko` | 4 | **aucune règle** |
| États vides | 3 formulations | aucune classe |

Le quatrième cas mérite d'être souligné : `initForms()` dans `site/assets/site.js`
cherche `.ok` et `.ko` pour afficher la confirmation d'envoi, et **ces deux classes
n'existent nulle part dans la feuille de style**. Tout leur style est inline. C'est
le seul retour interactif du site — la seule chose qui dise à un parent que sa
demande d'adhésion est partie.

Corollaire : le jeton `--erreur` est employé **zéro fois** dans `style.css` et
quatre fois en inline. Il existe uniquement pour colorer deux paragraphes cachés.

## Décision

Le site ne manque pas de composants. Il manque de **noms** pour des composants
qu'il a déjà. Ce chantier nomme cinq motifs récurrents et n'en invente aucun.

Il modifie `site/assets/style.css`, ce que le chantier précédent s'interdisait.
C'est le renversement assumé : la galerie servait à observer, celui-ci à corriger
ce qu'elle a montré.

## Objectifs

- Supprimer la répétition des cinq motifs relevés.
- Donner une existence CSS au retour de formulaire.
- Faire des trois couleurs de mention des jetons à source unique.
- Ne changer l'apparence du site que là où l'écart est imperceptible.

## Non-objectifs

- Aucun composant nouveau : ni bandeau d'alerte, ni pagination, ni galerie
  cliquable, ni onglets. Ils n'ont aucun usage dans les 12 pages.
- Aucune modification de graisse ni d'interlignage — voir « Ce que les classes de
  titrage ne portent pas ».
- Aucune extraction des assemblages inline en fonctions de `site.js`. Autre chantier.

## Lot 1 — Échelle de titrage

### Ce que les classes portent

Cinq classes, qui déclarent **la police et la taille, rien d'autre** :

```css
.display-s{font-family:'Barlow Condensed',sans-serif;font-size:22px}
.display-m{font-family:'Barlow Condensed',sans-serif;font-size:26px}
.display-l{font-family:'Barlow Condensed',sans-serif;font-size:34px}
.display-xl{font-family:'Barlow Condensed',sans-serif;font-size:40px}
.display-2xl{font-family:'Barlow Condensed',sans-serif;font-size:44px}
```

### Ce que les classes ne portent pas, et pourquoi

Le premier réflexe est de leur faire porter aussi la graisse 900, les capitales et
l'interlignage, comme le fait la règle `h1,h2,h3,h4`. C'est impossible sans changer
l'apparence :

- **La graisse varie.** `<strong style="font-family:'Barlow Condensed';font-size:24px">CAB — Poitiers 3</strong>`
  rend en 700, la graisse par défaut de `<strong>`. Forcer 900 alourdirait 14
  éléments, dont toutes les lignes de match.
- **L'interlignage varie.** `line-height:1` n'est déclaré que 15 fois sur 48 ; les
  33 autres héritent du 1,65 du corps de texte. L'imposer casserait leur rythme.
- **Les capitales sont minoritaires.** `text-transform:uppercase` n'accompagne que
  18 des 48 usages.

La graisse, les capitales et l'interlignage restent donc des choix explicites,
déclarés en inline là où ils s'appliquent. Ce sont des décisions sémantiques, pas
de la décoration : les fondre dans une classe de taille les rendrait invisibles.

### Correspondance

| Taille actuelle | Occurrences | Devient | Écart |
| --- | --- | --- | --- |
| 21 px | 6 | `.display-s` (22 px) | +1 px |
| 22 px | 5 | `.display-s` | aucun |
| 24 px | 11 | `.display-m` (26 px) | +2 px |
| 25 px | 1 | `.display-m` | +1 px |
| 26 px | 6 | `.display-m` | aucun |
| 27 px | 1 | `.display-m` | −1 px |
| 28 px | 1 | `.display-m` | −2 px |
| 34 px | 1 | `.display-l` | aucun |
| 40 px | 2 | `.display-xl` | aucun |
| 44 px | 8 | `.display-2xl` | aucun |

**31 éléments adoptent une classe. 20 d'entre eux voient leur taille bouger, d'au
plus 2 px.** Sur du Barlow Condensed en graisse lourde, cet écart n'est pas
perceptible à l'œil nu ; il doit néanmoins être contrôlé lors de la passe visuelle.

Les trois valeurs fluides — `clamp(24px,4vw,36px)`, `clamp(24px,4vw,34px)`,
`clamp(20px,3vw,30px)` — **restent en inline**. Elles répondent à une contrainte de
page précise et n'ont pas d'équivalent dans une échelle fixe.

## Lot 2 — Retour de formulaire

`.ok` et `.ko` entrent dans la feuille de style avec ce qu'elles portent
aujourd'hui en inline dans `site/adhesion.html` et `site/contact.html` :

```css
.ok,.ko{display:none;margin-top:14px}
.ok{color:var(--encre)}
.ko{color:var(--erreur)}
```

Le `display:none` par défaut y va aussi. `initForms()` pose un `style.display="block"`
inline au moment d'afficher le message, et un style inline l'emporte sur une règle
de feuille : le mécanisme actuel continue de fonctionner sans être touché.

Les deux paragraphes conservent leur classe `.mono`, qui leur donne déjà leur
police et leur interlettrage.

Effet de bord recherché : `--erreur` cesse d'être un jeton fantôme.

## Lot 3 — Jetons de mention

Trois couleurs employées comme légende, aujourd'hui écrites en dur :

| Valeur | Jeton | Rôle | Où elle vit aujourd'hui |
| --- | --- | --- | --- |
| `#8f8672` | `--mention` | Mention sur fond hachuré | `style.css:76` + 17 inline |
| `#a89e87` | `--mention-sombre` | Mention sur fond encre | `style.css:88` + 12 inline |
| `#c9c1ab` | `--texte-sombre` | Texte courant sur fond encre | 9 inline, absente de `style.css` |

Elles sont déclarées dans `:root` et substituées partout, y compris dans les deux
règles existantes `.card .ph span` et `.countdown span`. Les usages restent inline
mais passent par `var(--…)` : une seule source pour chacune.

`#4a4438` n'est pas concernée : elle est déjà portée par `.muted`, qui est sa
classe. Elle reste dans la liste des valeurs héritées de la galerie.

## Lot 4 — Lien dans le texte

```css
.lien{border-bottom:2px solid var(--encre)}
```

Reprend exactement ce que les neuf usages déclarent en inline. La règle globale
`a{color:var(--encre);text-decoration:none}` reste inchangée : `.lien` ne fait
qu'ajouter le soulignement, sur les liens du corps de texte qui doivent se
distinguer.

## Lot 5 — État vide

```css
.vide{padding:28px 0}
```

La classe ne porte que l'espacement. Elle se compose avec `.muted`, qui donne déjà
la couleur du texte atténué : `<p class="vide muted">`. Écrire la couleur dans
`.vide` dupliquerait `#4a4438` dans un chantier dont l'objet est précisément de
supprimer les valeurs écrites en dur.

Les trois états vides vivent dans les scripts de page, pas dans `site/assets/site.js` :

| Fichier | Chaîne actuelle |
| --- | --- |
| `site/index.html:78` | `'<p class="muted">Aucun match programmé pour le moment.</p>'` |
| `site/calendrier.html:46` | `'<p class="muted pad">Aucun match programmé.</p>'` |
| `site/actualites.html:24` | `'<p class="muted">Aucune actualité pour le moment.</p>'` |

Le message reste propre à son contexte mais suit une seule tournure,
`Aucun<e> <chose> pour le moment.` : `calendrier.html` s'aligne donc sur
« Aucun match programmé pour le moment. » Les deux autres formulations sont déjà
conformes.

`calendrier.html` conserve sa classe `.pad`, qui lui donne l'espacement horizontal
dont il a besoin dans son conteneur ; `.vide` s'y ajoute.

C'est le seul lot qui touche à du texte visible par le public. L'écart est mince,
mais un site qui répond de trois façons différentes à la même absence donne
l'impression d'avoir été écrit par trois personnes.

## Ce que le garde-fou impose

Ajouter neuf classes à `style.css` — `display-s`, `display-m`, `display-l`,
`display-xl`, `display-2xl`, `ok`, `ko`, `lien`, `vide` — fera **échouer
`npm run check`** tant qu'elles ne figureront pas dans la galerie.

Ce chantier inclut donc leurs entrées dans `site/design-system.html`, et la mise à
jour de l'entrée « Couleurs » pour déplacer les trois teintes de la liste des
valeurs héritées vers les jetons.

Ce n'est pas une contrainte subie. Le chantier précédent a été écrit sans filet et
sept erreurs factuelles ont dû être rattrapées en revue ; celui-ci ne peut pas
oublier de se documenter. C'est la première fois que le mécanisme travaille pour
nous.

Le décompte de couverture passe de 47 + 11 = 58 à **56 + 11 = 67**.

## Séquence

Ce chantier dépend de la galerie, qui vit sur `feat/design-system`, dont la PR #2
n'est pas fusionnée. La branche `feat/consolidation-charte` part donc de
`feat/design-system`.

Si la PR #2 est fusionnée avant celle-ci, l'historique se réduit sans conflit :
les deux branches touchent `site/design-system.html` à des endroits différents et
`style.css` n'est modifié que par celle-ci.

## Vérifications

Le dépôt n'a pas de suite de tests automatisés et ce design n'en introduit pas.

- `npm run check` passe, avec le nouveau décompte `56 documentées, 11 exclues`.
- Aucune occurrence de `font-family:'Barlow Condensed'` ne subsiste en inline, hors
  des trois valeurs fluides.
- Aucune occurrence en dur de `#8f8672`, `#a89e87` ou `#c9c1ab` ne subsiste, ni
  dans `style.css` ni dans les pages.
- `grep -c "var(--erreur)" site/assets/style.css` retourne au moins 1.
- Les deux formulaires affichent toujours leur message : la règle `display:none` ne
  doit pas empêcher `initForms()` de le révéler.
- **Passe visuelle** sur les 20 éléments dont la taille bouge, et sur les deux
  formulaires en cas de succès et d'échec.

## Risques

| Risque | Parade |
| --- | --- |
| Un écart de 2 px se voit sur un élément précis | Passe visuelle ciblée ; la correspondance est écrite ici, élément par élément |
| La règle `display:none` masque définitivement un message de formulaire | Un style inline l'emporte sur une règle de feuille ; à vérifier en soumettant réellement les deux formulaires |
| `.vide` reste inutilisée si les états vides sont générés en JavaScript | Les trois le sont, dans les scripts de `index.html`, `calendrier.html` et `actualites.html` ; le lot inclut leur mise à jour, fichier et ligne indiqués |
| La galerie n'est pas mise à jour et bloque la compilation | C'est le comportement voulu, et le lot inclut les entrées |
