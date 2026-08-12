# Page « Infos & documents » — design

Date : 2026-08-12
Statut : validé, prêt pour le plan d'implémentation

## Contexte

Le club a besoin de diffuser des informations et des documents : informations
juridiques, fiche d'inscription, certificat médical, infos pratiques — un livret
d'accueil.

Rien de tel n'existe aujourd'hui, et surtout **Decap ne sait téléverser aucun
document** : `site/admin/config.yml` ne contient aucun champ `widget: file`, et
`media_folder` ne pointe que vers `site/assets/uploads`, où vivent les 18 images.

## Décision

Une page autonome, `site/infos.html`, dont le contenu est une suite de **blocs de
texte libre**, chacun pouvant porter une liste de **documents** — soit un fichier
téléversé, soit un lien externe.

La page ne reprend aucune donnée des autres pages. Elle partage uniquement
l'en-tête et le pied de page du site.

## Objectifs

- Le bureau publie et modifie ces informations seul, depuis Decap.
- Un document est soit un fichier hébergé avec le site, soit une adresse externe.
- Aucune classe CSS nouvelle : la page se construit avec le vocabulaire existant.

## Non-objectifs

Explicitement écartés, et chacun pour une raison :

- **Aucune reprise du contenu des autres pages.** L'accordéon de `site/adhesion.html`
  répond déjà à « Combien coûte la licence ? », « Quels documents fournir ? »,
  « Peut-on essayer avant de s'inscrire ? » et « Quels sont les horaires ? ». Ce
  contenu est écrit en dur dans la page et n'est pas éditable — c'est un problème
  réel, mais distinct, et le résoudre ici créerait deux sources pour les mêmes faits.
- **Aucun lien depuis `adhesion.html`.** L'accès se fait par le menu, choix retenu.
  Un lien depuis l'accordéon « Quels documents fournir ? » serait utile ; il est
  écarté sciemment, pas par oubli.
- Aucune galerie, aucun aperçu de PDF dans la page, aucune recherche.

## Architecture

| Fichier | Rôle |
| --- | --- |
| `site/infos.html` (nouveau) | La page : ossature et rendu |
| `site/content/infos.json` (nouveau) | Le contenu, édité par Decap |
| `site/admin/config.yml` (modifié) | Collection `infos` |
| `site/assets/site.js` (modifié) | Deux entrées ajoutées à `NAV` |
| `site/assets/style.css` (modifié) | Quatre règles **déplacées**, aucune ajoutée |
| `site/design-system.html` (modifié) | Mise à jour de l'entrée des paliers responsive |

## Le menu passe à huit entrées

`NAV` dans `site/assets/site.js` devient, dans cet ordre :

```
Accueil · Le Club · Équipes · Calendrier · Actualités · Boutique · Infos · Contact
```

plus le bouton « Adhérer ». `contact.html` existe déjà et reste également dans le
pied de page ; l'y garder ne coûte rien et sert les visiteurs arrivés en bas de page.

### Le seuil du menu replié passe de 880 px à 1100 px

Huit entrées plus un bouton, avec `gap:30px` et **aucun `flex-wrap` sur la nav**,
demandent de l'ordre de 900 px de contenu. Le menu ne se replie aujourd'hui qu'en
dessous de 880 px : entre 880 px et environ 1000 px il n'aurait pas la place, et rien
ne le ferait revenir à la ligne.

**Attention à la manière de le faire.** Les quatre règles qui replient le menu vivent
dans le grand bloc `@media(max-width:880px)` de `site/assets/style.css`, aux lignes
173, 174, 175 et 192 :

```css
.site-header nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:var(--creme);border-bottom:2px solid var(--encre);padding:18px 22px;gap:16px}
.site-header nav.open{display:flex}
.burger{display:flex}
.site-header nav a{padding:6px 0}
```

Ce même bloc contient aussi le passage du corps à 16 px, les grilles en une colonne,
les zones tactiles du pied de page et la réduction des espacements. **Changer le
seuil du bloc basculerait tout le comportement mobile à 1100 px**, ce qui n'est pas
voulu.

Il faut donc **déplacer ces quatre règles** dans le bloc `@media(max-width:1100px)`
qui existe déjà en fin de fichier, et non modifier un seuil. Aucune règle n'est
créée : le compte de classes de `style.css` ne bouge pas, et le garde-fou de la
galerie reste au vert sans intervention.

Conséquence assumée : les tablettes en paysage auront le menu replié. Pour une nav de
huit entrées, c'est le comportement attendu.

Point à contrôler lors de la passe visuelle : entre 880 px et 1100 px, le menu
déplié aura `padding:18px 22px` alors que l'en-tête garde `padding:16px 48px`. Le
panneau et le contenu de l'en-tête ne seront pas alignés à gauche. C'est cosmétique
et corrigible d'un style inline si ça choque.

### La galerie doit suivre

L'entrée « Paliers responsive » de `site/design-system.html` devient fausse **des
deux côtés**. Ses deux phrases actuelles, relevées telles quelles :

> **1100 px** — `.cols-3` et `.cols-4` passent à deux colonnes.

> **880 px** — la mise en page repasse en une colonne, sauf `.match-row` et `.stats`
> qui passent à deux ; le corps grimpe à 16 px, **le menu devient un burger**, la date
> de `.match-row` prend toute la largeur, les filets verticaux deviennent horizontaux.

Deux corrections, donc, pas une :

1. la phrase des **1100 px** gagne le repli du menu ;
2. la phrase des **880 px** perd « le menu devient un burger », qui n'y sera plus vrai.

C'est le premier cas où la galerie sert de garde-fou documentaire à un chantier qui
ne la concernait pas. Le contrôle automatisé n'aurait pas attrapé celui-là : il
compte les classes, il ne lit pas la prose. Ne corriger qu'une des deux phrases
laisserait la page se contredire elle-même — exactement le défaut que sa revue finale
avait relevé et fait corriger.

## Le modèle Decap

Collection `infos`, fichier unique `site/content/infos.json` :

```
titre            Titre de la page
chapo            Texte d'introduction (optionnel)
blocs[]
  titre          Titre du bloc
  texte          Markdown (optionnel)
  documents[]    liste à types variables, le bureau choisit à l'ajout :
    ┌ Document téléversé ┐   ┌ Lien externe ┐
    │ libelle            │   │ libelle      │
    │ fichier            │   │ url          │
    └────────────────────┘   └──────────────┘
```

Les **types variables** de la liste Decap font que le bureau choisit « Document
téléversé » ou « Lien externe » au moment d'ajouter, et ne voit que les champs du
type retenu. Decap inscrit un discriminant `type` dans le JSON.

Forme du contenu produit :

```json
{
  "titre": "Infos & documents",
  "chapo": "Tout ce qu'il faut savoir avant de s'inscrire.",
  "blocs": [
    {
      "titre": "Dossier d'inscription",
      "texte": "Trois pièces à fournir, toutes téléchargeables ici.",
      "documents": [
        { "type": "fichier", "libelle": "Fiche d'inscription", "fichier": "assets/documents/fiche-inscription.pdf" },
        { "type": "lien", "libelle": "Formulaire de licence FFVB", "url": "https://www.ffvb.org/..." }
      ]
    }
  ]
}
```

Le texte est en `widget: markdown` et rendu par `mdToHtml()`, déjà présent dans
`site/assets/site.js` : le bureau obtient paragraphes, sous-titres, listes, gras et
liens sans une ligne de code supplémentaire.

**Repli si les types variables se comportent mal dans l'admin** — fonctionnalité que
je ne peux pas éprouver sans y ouvrir une session : un seul type d'objet portant
`libelle`, `fichier` et `url`, les deux derniers optionnels, avec la règle « l'adresse
l'emporte si elle est remplie ». Même rendu, saisie moins guidée. Le choix se tranche
au premier essai dans l'admin, pas avant.

## Les PDF et l'historique Git

Les documents téléversés vont dans **`site/assets/documents`**, séparés des images,
via un `media_folder` propre au champ.

Deux raisons : on retrouve les documents sans fouiller parmi les photos, et leur
poids se surveille séparément.

Cela compte, parce qu'**un fichier téléversé par Decap reste définitivement dans
l'historique Git**. Le dépôt fait 15 Mo, dont 11 Mo d'images. Une fiche de 3 Mo
remplacée cinq saisons de suite, c'est 15 Mo d'historique pour un fichier utile de
3 Mo.

Le hint du champ porte donc les deux consignes qui limitent la croissance :
**remplacer le fichier existant plutôt qu'en ajouter un nouveau**, et viser moins de
2 Mo. Le lien externe est la porte de sortie pour un document trop lourd : on
l'héberge ailleurs et on ne versionne que l'adresse.

Même réserve que ci-dessus : le `media_folder` par champ est une fonctionnalité dont
je ne peux pas vérifier le comportement exact sans ouvrir l'admin. Repli : le dossier
global `assets/uploads`. Le site fonctionne pareil, seul le rangement est moins
propre.

## Le rendu de la page

Séquence : lire `content/infos.json`, puis rendre.

1. Fil d'ariane `Accueil / Infos`.
2. Titre de la page et chapô.
3. Un `<section class="pad section">` par bloc : `.section-head` avec le titre, le
   texte passé dans `mdToHtml()`, puis les documents.
4. Les documents forment une `.row` de boutons `.btn.btn-secondary`.

Les deux types se distinguent selon la convention que le site applique déjà partout —
`↗` et nouvel onglet pour l'externe, comme « Classement FFVB ↗ » et les liens du
pied de page :

| Type | Rendu | Comportement |
| --- | --- | --- |
| `fichier` | `↓ Fiche d'inscription (PDF)` | même onglet, attribut `download` |
| `lien` | `Formulaire de licence FFVB ↗` | `target="_blank" rel="noopener"` |

Un lien externe ne porte pas la mention « (PDF) » : il peut pointer vers une page.

**Normalisation de l'adresse.** Une adresse saisie sans protocole — `www.ffvb.org/…` —
serait résolue relativement au site et mènerait à la page 404. L'URL est donc
préfixée de `https://` si elle ne commence pas par `http`. C'est un champ neuf, la
faute est probable, et la parade tient en une expression.

## Cas limites

- **`infos.json` absent ou illisible** : `getJSON()` retourne `null`, la page affiche
  « Aucune information pour le moment. » et rien ne casse.
- **Aucun bloc** : même message.
- **Bloc sans texte ni document** : son titre seul est rendu. C'est un usage légitime,
  un intertitre.
- **Document de type `fichier` sans fichier**, ou de type `lien` sans adresse : ce
  document est ignoré, le reste du bloc s'affiche.
- **Type inconnu** dans le JSON : ignoré, sans erreur de console.

La tournure du message vide, « Aucune information pour le moment. », suit celle que
le chantier de consolidation retiendra pour les états vides du site. La page n'en
dépend pas — elle emploie `<p class="muted">`, la classe existante — mais elle ne
crée pas une quatrième formulation à réconcilier plus tard.

## Vérifications

Le dépôt n'a pas de suite de tests automatisés et ce design n'en introduit pas.

- `npm run check` passe, avec les comptes **inchangés** : 58 classes, 47 documentées,
  11 exclues. Ce chantier n'ajoute aucune classe.
- `git diff` sur `site/assets/style.css` ne montre que le **déplacement** des quatre
  règles : autant de lignes retirées que d'ajoutées, aucun sélecteur nouveau.
- La page répond, et rend un bloc portant les deux types de document.
- Les huit entrées du menu sont présentes, et « Infos » s'allume sur `infos.html`.
- **Passe visuelle** à 360 px, à 1000 px — entre les deux seuils, là où le menu se
  replie désormais — et en pleine largeur.
- Dans l'admin : le choix entre les deux types apparaît à l'ajout d'un document, et
  un PDF téléversé atterrit dans `site/assets/documents`.

## Risques

| Risque | Parade |
| --- | --- |
| Le seuil est changé sur le bloc 880 px au lieu de déplacer les règles | Le spec le dit explicitement ; la vérification du `diff` de `style.css` l'attrape |
| Les types variables Decap ne fonctionnent pas | Repli documenté : un seul objet, `fichier` et `url` optionnels |
| Le `media_folder` par champ ne fonctionne pas | Repli : dossier global `assets/uploads` |
| L'historique Git gonfle avec les PDF | Dossier dédié, consignes dans le hint, lien externe comme échappatoire |
| Le menu déplié n'est pas aligné avec l'en-tête entre 880 et 1100 px | Signalé pour la passe visuelle, corrigible par un style inline |
