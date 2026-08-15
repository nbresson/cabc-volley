// Site CABC Volley — header/footer partagés + rendu du contenu JSON (Decap)
const NAV=[["index.html","Accueil"],["club.html","Le Club"],["equipes.html","Équipes"],["calendrier.html","Calendrier"],["actualites.html","Actualités"],["boutique.html","Boutique"],["infos.html","Infos"],["contact.html","Contact"]];
// Pages enfants : elles allument l'entree de nav de leur page parente.
const PARENT={"equipe.html":"equipes.html","article.html":"actualites.html","partenaires.html":"club.html","gymnase.html":"contact.html"};
// Reseaux du club. Seule source des deux adresses, pour le bandeau ci-dessous
// comme pour tout <div id="reseaux"> pose dans une page.
const RESEAUX=[
  ["Instagram","https://www.instagram.com/cabcvolley/",'<rect class="frame" x="2" y="2" width="20" height="20"/><circle cx="12" cy="12" r="4.6"/><rect x="16.3" y="5.7" width="2.5" height="2.5" fill="currentColor" stroke="none"/>',"instagram"],
  ["Facebook","https://www.facebook.com/cabvolley19/",'<rect class="frame" x="2" y="2" width="20" height="20"/><path d="M14.5 6.5H12.2V17.5M9.5 11H14.5"/>',"facebook"],
  // Le 4e champ nomme une cle de settings.json qui fait autorite sur l adresse.
  // Les trois en portent une : le club change de page Facebook ou de compte
  // Instagram sans toucher au code, et l adresse du classement porte la saison,
  // qui change tous les etes. Les URL ecrites ici ne sont que des secours, si le
  // fichier ne repond pas ou si le champ est laisse vide.
  ["FFVB","https://www.ffvbbeach.org/ffvbapp/resu/planning_club_class.php?cnclub=0198049&saison=2026%2F2027",'<rect class="frame" x="2" y="2" width="20" height="20"/><path d="M7.6 17.4V12.4M12 17.4V6.6M16.4 17.4V9.6"/>',"ffvb_classement"]
];
// Bandeau reseaux : bloc autonome sur fond encre. Pose par defaut juste
// avant le pied de page, mais deplacable — un seul appel a bouger — et
// utilisable dans une page en y ecrivant <div id="reseaux"></div>.
function barreReseaux(){return `<div class="socialbar">${RESEAUX.map(([nom,url,glyphe,reglage])=>
  `<a class="social" href="${url}"${reglage?` data-reglage="${reglage}"`:""} target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${glyphe}</svg><span class="lbl">${nom} ↗</span></a>`).join("")}</div>`;}
// Seul endroit du code qui construit l'URL d'une page equipe.
// Passer a des URLs propres plus tard ne touchera que cette fonction.
function teamUrl(slug){return "equipe.html?e="+encodeURIComponent(slug);}
// Jumelle de teamUrl, pour la meme raison : une seule ligne a changer le jour
// ou les fiches de salle prendront une URL propre.
function gymnaseUrl(slug){return "gymnase.html?g="+encodeURIComponent(slug);}

// Mur de partenaires, insere juste avant le bandeau reseaux sur toutes les
// pages. Pose apres coup plutot que dans renderChrome, parce qu il faut lire
// un fichier : ainsi rien n est insere tant qu on ne sait pas s il y a des
// partenaires, et le bandeau reseaux garde son adjacence avec la derniere
// section jusqu a preuve du contraire. Aucun noeud vide n est laisse.
// Choisit la hauteur des logos et le nombre de colonnes. Deux idees :
// moins il y a de partenaires, plus on peut les montrer grands ; et le nombre
// de colonnes se deduit du nombre de lignes necessaires, pas l inverse — c est
// ce qui donne 5 + 5 + 5 la ou un simple wrap donnait 13 + 2.
// La largeur minimale d une colonne suit la hauteur des logos : un logo plus
// grand a besoin de plus de place autour de lui.
function disposerMur(mur,nombre){
  // 48 = les deux paddings lateraux declares dans .murlogos
  const dispo=Math.max(1,mur.clientWidth-48);
  // Plafond de hauteur : moins ils sont nombreux, plus on peut les montrer grands.
  const plafond=nombre<=6?76:nombre<=12?62:54;
  // Le nombre de colonnes se decide sur une hauteur PLANCHER, pas sur le
  // plafond : sinon six logos reclamaient des colonnes si larges qu ils
  // tenaient sur deux lignes au lieu d une seule. Le plancher est plus bas sur
  // telephone, sans quoi quinze logos y faisaient un mur de 540 px de haut.
  const plancher=dispo<560?30:38;
  const colonnesMax=Math.max(2,Math.floor(dispo/(plancher*3)));
  const lignes=Math.ceil(nombre/colonnesMax);
  const colonnes=Math.ceil(nombre/lignes);
  // La hauteur finale profite de la place reellement laissee par la colonne,
  // sans jamais depasser le plafond fixe par le nombre.
  const hauteur=Math.min(plafond,Math.round(dispo/colonnes/2.8));
  mur.style.setProperty("--h-logo",hauteur+"px");
  mur.style.setProperty("--colonnes",colonnes);
}

async function murPartenaires(){
  const barre=document.querySelector(".socialbar");
  if(!barre)return;
  const data=await getJSON("content/partenaires.json");
  const items=(data?.items||[]).filter(p=>p.logo);
  if(!items.length)return;
  // Tous les logos menent a la page Partenaires, jamais au site du partenaire :
  // le mur sert a faire connaitre la page, pas a envoyer le visiteur ailleurs.
  // Sur la page Partenaires, l en-tete repeterait mot pour mot le titre et le
  // chapo affiches en haut, et son lien pointerait sur la page courante.
  // Cloudflare sert les pages sans extension, d ou les deux formes.
  const tete=/^partenaires(.html)?$/.test(here())?"":`<div class="mur-tete">
    <div>
      <h2>Ils nous soutiennent</h2>
      ${data?.chapo?`<p class="muted">${data.chapo}</p>`:""}
    </div>
    <a href="partenaires.html" class="mono lien" style="color:var(--encre)">Tous nos partenaires →</a>
  </div>`;
  barre.insertAdjacentHTML("beforebegin",`<div class="murlogos">${tete}
  ${items.map(p=>`<a href="partenaires.html" title="${p.nom||""}"><img src="${p.logo}" alt="${p.nom||""}" loading="lazy"></a>`).join("")}
</div>`);
  const mur=document.querySelector(".murlogos");
  disposerMur(mur,items.length);
  // Le nombre de colonnes depend de la largeur : il se recalcule au
  // redimensionnement, mais pas a chaque pixel parcouru.
  let attente;
  window.addEventListener("resize",()=>{
    clearTimeout(attente);
    attente=setTimeout(()=>disposerMur(mur,items.length),150);
  });
}
async function getJSON(p){try{const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw 0;return await r.json();}catch(e){return null;}}
function here(){const p=location.pathname.split("/").pop();return p||"index.html";}
function renderChrome(){
  const cur=PARENT[here()]||here();
  // aria-current double la classe active : le soulignement ne dit rien a qui
  // n a pas l ecran, et les neuf liens s annoncaient jusqu ici a l identique.
  // Le libelle est enveloppe : sur mobile, le soulignement de l entree active
  // ne doit porter que sur lui, pas sur le numero qui le precede.
  const links=NAV.map(([h,t],i)=>`<a href="${h}"${h===cur?' class="active" aria-current="page"':''}><span class="num">${String(i+1).padStart(2,"0")}</span><span>${t}</span></a>`).join("");
  const header=document.getElementById("header");
  if(header)header.innerHTML=`
    <a class="evitement" href="#main">Aller au contenu ↓</a>
    <div class="topbar">CLUB ATHLÉTIQUE DE BRIVE — SECTION VOLLEY-BALL — DEPUIS 1946</div>
    <header class="site-header">
      <button class="burger" type="button" aria-label="Menu" aria-controls="mainnav" aria-expanded="false"><span></span><span></span><span></span></button>
      <a class="logo" href="index.html"><img src="assets/logo.png" alt="C.A. Brive Corrèze Volley"></a>
      <nav id="mainnav">${links}<a href="adhesion.html" class="btn btn-primary" style="padding:9px 20px">ADHÉRER</a></nav>
    </header>`;
  // Le onclick en ligne a laisse la place a un ecouteur : il fallait un endroit
  // ou tenir aria-expanded a jour. Sans lui, le bouton annonce « Menu » sans
  // jamais dire s il est ouvert ou ferme.
  const burger=header&&header.querySelector(".burger");
  if(burger)burger.addEventListener("click",()=>{
    const nav=document.getElementById("mainnav");
    if(!nav)return;
    const ouvert=nav.classList.toggle("open");
    burger.setAttribute("aria-expanded",String(ouvert));
    // Le menu couvre l ecran : sans ce verrou, la page continuerait de defiler
    // derriere lui. Il se leve a la fermeture, et de toute facon au changement
    // de page, qui recharge le document.
    document.body.style.overflow=ouvert?"hidden":"";
  });
  const footer=document.getElementById("footer");
  // Le bandeau est pose en frere du pied de page, jamais dedans : c est ce qui
  // permet a .dark+.socialbar de voir une section sombre juste au-dessus et de
  // tracer le filet qui les separe.
  if(footer){
    footer.insertAdjacentHTML("beforebegin",barreReseaux());
    footer.innerHTML=`
    <footer class="site-footer section" style="border-bottom:none;border-top:2px solid var(--encre)">
      <span class="mono">© ${new Date().getFullYear()} C.A. BRIVE CORRÈZE VOLLEY / Réalisation Nicolas BRESSON</span>
      <nav><a href="contact.html">Contact</a><a href="mentions-legales.html">Mentions légales</a></nav>
    </footer>`;
  }
  const reseaux=document.getElementById("reseaux");
  if(reseaux)reseaux.innerHTML=barreReseaux();
  ajusterLiensReglables();
}
// Les liens porteurs de data-reglage prennent leur adresse dans settings.json.
// Volontairement detache du rendu : le bandeau s affiche tout de suite avec son
// adresse de secours, et se corrige ensuite si le fichier repond.
async function ajusterLiensReglables(){
  const cibles=document.querySelectorAll("a[data-reglage]");
  if(!cibles.length)return;
  const reglages=await getJSON("content/settings.json");
  if(!reglages)return;
  cibles.forEach(a=>{const url=reglages[a.dataset.reglage];if(url)a.href=url;});
}
function fmtDate(iso){try{return new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase();}catch(e){return iso;}}
// Ligne d un match a venir. Exactement 3 enfants directs : .match-row est
// une grille a 3 colonnes qui deborde au-dela.
// Le surlignage des matchs a domicile et l attribut de filtre voyagent avec la
// ligne : le calendrier comme la fiche d equipe en profitent sans y toucher.
function matchRow(m){const d=new Date(m.date);return `
    <div class="match-row${m.domicile?' hl':''}"${m.equipe?` data-filtre="${m.equipe}"`:""}>
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()}<br><span style="color:var(--taupe)">${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span></span>
      <div><strong class="display-m">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition} · ${m.lieu}</div></div>
      <span class="${m.domicile?'badge':'badge-outline'}">${m.domicile?"Domicile":"Extérieur"}</span></div>`;}
// Ligne de resultat. Le score et le badge sont groupes dans une seule cellule,
// .match-row n acceptant que trois enfants directs. Partagee par la fiche
// d equipe et le calendrier depuis que ce dernier montre les derniers matchs.
function ligneResultat(m){return `
    <div class="match-row">
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${fmtDate(m.date)}</span>
      <div><strong class="display-m">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition}</div></div>
      <span class="row" style="align-items:center;gap:12px">
        <strong class="display-m" style="font-weight:900">${m.score||"–"}</strong>
        <span class="${m.gagne?'badge':'badge-muted'}">${m.gagne?"Victoire":"Défaite"}</span></span></div>`;}

// Fichier .ics fabrique dans le navigateur, sans service tiers. Duree fixee a
// deux heures. Les dates sont ecrites en heure locale avec TZID Europe/Paris :
// un match a 20 h reste a 20 h, en hiver comme en ete.
function icsDate(d){const p=n=>String(n).padStart(2,"0");
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+"T"+p(d.getHours())+p(d.getMinutes())+"00";}
function icsEvenement(m){
  const deb=new Date(m.date),fin=new Date(deb.getTime()+72e5);
  const lieu=(m.lieu||"").replace(/[,;]/g,"\\$&");
  return ["BEGIN:VEVENT","UID:"+deb.getTime()+"-"+(m.adversaire||"").replace(/\W/g,"")+"@cabc-volley",
    "DTSTART;TZID=Europe/Paris:"+icsDate(deb),"DTEND;TZID=Europe/Paris:"+icsDate(fin),
    "SUMMARY:Volley — CAB vs "+(m.adversaire||""),
    "LOCATION:"+lieu,"DESCRIPTION:"+(m.competition||"")+(m.domicile?" · Domicile — entrée libre":" · Extérieur"),
    "END:VEVENT"].join("\r\n");
}
function telechargerICS(matchs,nomFichier){
  const corps=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CABC Volley//FR",
    matchs.map(icsEvenement).join("\r\n"),"END:VCALENDAR"].join("\r\n");
  const url=URL.createObjectURL(new Blob([corps],{type:"text/calendar"}));
  const a=Object.assign(document.createElement("a"),{href:url,download:nomFichier||"cab-volley.ics"});
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4e3);
}

// Lightbox partagee. initLightbox(idConteneur, photos) ou photos vaut
// [{src, legende}]. Un <dialog> natif : Echap ferme tout seul et le focus
// reste dedans, sans qu on ait a le pieger a la main.
function initLightbox(idConteneur,photos){
  const cont=document.getElementById(idConteneur);
  if(!cont||!photos.length)return;
  let dlg=document.querySelector("dialog.lightbox");
  if(!dlg){
    document.body.insertAdjacentHTML("beforeend",`<dialog class="lightbox">
      <button class="fermer" aria-label="Fermer">✕</button>
      <div class="corps"><button class="nav" data-sens="-1" aria-label="Précédente">←</button><img alt=""><button class="nav" data-sens="1" aria-label="Suivante">→</button></div>
      <div class="legende"><span data-legende></span><span data-compte></span></div></dialog>`);
    dlg=document.querySelector("dialog.lightbox");
    dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
    dlg.querySelector(".fermer").addEventListener("click",()=>dlg.close());
  }
  let liste=[],i=0;
  const montrer=n=>{i=(n+liste.length)%liste.length;const p=liste[i];
    dlg.querySelector("img").src=p.src;dlg.querySelector("img").alt=p.legende||"";
    dlg.querySelector("[data-legende]").textContent=p.legende||"";
    dlg.querySelector("[data-compte]").textContent=(i+1)+" / "+liste.length;};
  dlg.querySelectorAll(".nav").forEach(b=>b.onclick=()=>montrer(i+Number(b.dataset.sens)));
  cont.addEventListener("click",e=>{
    const img=e.target.closest("img");if(!img)return;
    liste=photos;
    // findIndex rend -1 si l image n est pas retrouvee : on retombe alors sur
    // la premiere plutot que d ouvrir une vue vide.
    const trouve=photos.findIndex(p=>img.src.endsWith(p.src));
    montrer(trouve<0?0:trouve);
    dlg.showModal();
  });
  cont.querySelectorAll("img").forEach(img=>img.style.cursor="zoom-in");
}

// Bandeau du prochain match, partage par l accueil et les fiches d equipe.
// Il rend l interieur d une section .dark, et non la section elle-meme :
// l accueil la declare dans son HTML quand la fiche d equipe la fabrique.
// Le compte a rebours est fige au chargement, comme il l a toujours ete —
// le faire battre demanderait un minuteur sur toutes les pages pour gagner
// une minute d exactitude.
function bandeauProchainMatch(m){
  if(!m)return"";
  const d=new Date(m.date);
  // Date, heure, competition, lieu : l ordre « competition puis lieu » est
  // celui de matchRow() et des autres pages. filter(Boolean) evite le « · »
  // orphelin si un champ venait a manquer.
  const infos=[d.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"}),d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),m.competition,m.lieu].filter(Boolean).join(" · ");
  // Les cellules naissent a « -- » et sont remplies par battreCompteARebours().
  // Le bandeau reste donc lisible meme si le minuteur ne demarre jamais.
  // aria-hidden sur chaque cellule : sans cela un lecteur d ecran reannonce le
  // compteur a chaque seconde ecoulee. La date en clair, juste apres, dit la
  // meme chose une fois pour toutes.
  const cell=(u,lbl,cls)=>`<div${cls?` class="${cls}"`:""} aria-hidden="true"><strong data-u="${u}">--</strong><span>${lbl}</span></div>`;
  return `<div class="pad duo" style="--b:auto;gap:32px;align-items:center">
        <div>
          <div class="eyebrow" style="color:var(--mention-sombre)">Prochain match ${m.domicile?"à domicile":"à l'extérieur"}</div>
          <h2 style="color:var(--creme);font-size:clamp(32px,5vw,52px);margin:10px 0">C.A. Brive — ${m.adversaire}</h2>
          <div class="mono" style="color:var(--mention-sombre)">${infos}</div>
          <div class="row" style="margin-top:22px;align-items:center">
            ${m.domicile?`<a href="calendrier.html" class="btn btn-outline-light">Venir au match — entrée libre</a>`:""}
            <button type="button" class="chip" data-ics style="border-color:var(--mention-sombre);color:var(--creme);padding:12px 18px">+ Mon agenda (.ics)</button>
          </div>
        </div>
        <div>
          <div class="countdown" data-cible="${m.date}" role="timer" aria-label="Compte à rebours avant le match">
            ${cell("j","JOURS")}${cell("h","HEURES")}${cell("m","MIN")}${cell("s","SEC","sec")}
          </div>
          <span class="sr-only">Match le ${d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} à ${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}.</span>
        </div>
      </div>`;
}
// Fait battre le compte a rebours a la seconde. A appeler apres l insertion du
// bandeau, l accueil et la fiche d equipe le posant a des moments differents.
function battreCompteARebours(){
  const c=document.querySelector(".countdown[data-cible]");
  if(!c)return;
  const cible=new Date(c.dataset.cible);
  const maj=()=>{
    const diff=Math.max(0,cible-new Date());
    const v={j:Math.floor(diff/864e5),h:Math.floor(diff%864e5/36e5),m:Math.floor(diff%36e5/6e4),s:Math.floor(diff%6e4/1e3)};
    c.querySelectorAll("[data-u]").forEach(el=>el.textContent=String(v[el.dataset.u]).padStart(2,"0"));
  };
  maj();setInterval(maj,1000);
}
// Barre « prochain match » collee en bas sur mobile. Elle ne parait que pour un
// match a domicile — inviter a venir voir un deplacement n aurait pas de sens —
// et s efface tant que le bandeau sombre de l accueil est a l ecran, sinon la
// meme information serait affichee deux fois.
function initBarreMatchMobile(m){
  if(!m||!m.domicile)return;
  const d=new Date(m.date);
  const j=Math.max(0,Math.floor((d-new Date())/864e5));
  document.body.insertAdjacentHTML("beforeend",`<div class="match-sticky">
    <div style="min-width:0">
      <div class="sur">Prochain match · ${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"})} · ${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
      <div class="titre">CAB — ${m.adversaire} · J-${j}</div>
    </div>
    <a href="calendrier.html" class="btn">J'y vais</a></div>`);
  const barre=document.querySelector(".match-sticky");
  const bandeau=document.getElementById("next-match");
  // Sur une page sans bandeau, rien ne fait doublon : la barre reste montree.
  if(!bandeau){barre.classList.add("visible");return;}
  new IntersectionObserver(es=>es.forEach(e=>{
    barre.classList.toggle("visible",!e.isIntersecting);
  })).observe(bandeau);
}

// Compte de 0 jusqu a la valeur cible quand la bande de statistiques entre dans
// l ecran. Seuls les entiers nus sont animes : « 80 ans » reste fige, son texte
// ne se reduisant pas exactement a son nombre. Une annee saisie seule, « 1946 »,
// defilerait en revanche depuis zero — le bureau la mettra plutot sous une forme
// parlante s il veut l afficher.
function animerChiffres(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const bande=document.getElementById("chiffres");
  if(!bande)return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    io.disconnect();
    bande.querySelectorAll("strong").forEach(el=>{
      const cible=parseInt(el.textContent.replace(/\s/g,""),10);
      if(!Number.isFinite(cible)||String(cible)!==el.textContent.trim())return;
      const debut=performance.now(),duree=1400;
      const pas=now=>{
        // Bornee des deux cotes : requestAnimationFrame recoit l horodatage du
        // debut de la frame, qui peut preceder le performance.now() capture
        // juste avant. Sans le plancher, la progression devient negative, le
        // cube l amplifie, et le compteur affiche brievement « -28 ».
        const p=Math.min(1,Math.max(0,(now-debut)/duree));
        el.textContent=Math.round(cible*(1-Math.pow(1-p,3)));
        if(p<1)requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });
  }),{threshold:.4});
  io.observe(bande);
}

// Filtre par chips : les elements de `conteneur` portant data-filtre sont
// montres ou masques selon la chip active, « tout » les reaffichant tous.
// L ecouteur est pose sur le groupe et non sur chaque bouton : les chips sont
// fabriquees apres coup, et une delegation evite de les recabler.
function initChips(idChips,idConteneur){
  const chips=document.getElementById(idChips),cont=document.getElementById(idConteneur);
  if(!chips||!cont)return;
  chips.addEventListener("click",e=>{
    const b=e.target.closest(".chip");if(!b)return;
    chips.querySelectorAll(".chip").forEach(c=>c.classList.remove("actif"));
    b.classList.add("actif");
    const v=b.dataset.valeur;
    cont.querySelectorAll("[data-filtre]").forEach(el=>{
      el.style.display=(v==="tout"||el.dataset.filtre===v)?"":"none";
    });
  });
}
// Revele les sections au defilement. La premiere reste visible d emblee, sans
// quoi le haut de page clignoterait au chargement. Les classes ne sont jamais
// ecrites dans le HTML : sans JavaScript, rien n est masque.
function revelerSections(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const els=[...document.querySelectorAll("main>.section")].slice(1);
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add("vu");io.unobserve(e.target);}
  }),{threshold:.12});
  els.forEach(el=>{el.classList.add("reveal");io.observe(el);});
}
// Vignette : cadrage "entier" montre l'image complète sur le fond hachuré (affiches),
// sinon elle remplit le cadre quitte à être recadrée (photos).
function vignette(src,alt,cadrage){if(!src)return"";
  const entier=cadrage==="entier";
  return `<img src="${src}" alt="${alt||""}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${entier?"contain":"cover"}${entier?";padding:14px":""}">`;}
// Markdown minimal (Decap) : paragraphes, ## titres, > citations, - listes, **gras**, [lien](url)
function mdToHtml(md){if(!md)return"";
  const inl=s=>s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" class="lien">$1</a>');
  return md.split(/\n\n+/).map(b=>{b=b.trim();if(!b)return"";
    if(b.startsWith("> "))return '<blockquote class="ds"><p>'+inl(b.slice(2).replace(/\n/g," "))+'</p></blockquote>';
    if(b.startsWith("## "))return '<h2 style="margin:28px 0 12px">'+inl(b.slice(3))+'</h2>';
    if(/^[-*] /.test(b))return '<ul class="ds-list">'+b.split("\n").map(l=>'<li>'+inl(l.replace(/^[-*] +/,""))+'</li>').join("")+'</ul>';
    return '<p class="muted" style="line-height:1.8;margin-bottom:18px">'+inl(b)+'</p>';}).join("");}
// Carte d une salle. Partagee par Contact (« Nos gymnases ») et Club
// (« Nos infrastructures ») : une seule definition, les deux pages ne peuvent
// donc plus diverger. Le titre de section reste propre a chaque page.
function salleCard(v){
  const dedans=`
      <div class="ph" style="aspect-ratio:16/10;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${v.photo?`<img src="${v.photo}" alt="${v.nom}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'<span class="mono" style="color:var(--mention)">[ photo à venir ]</span>'}
        ${v.etiquette?`<span class="badge" style="position:absolute;top:12px;left:12px">${v.etiquette}</span>`:''}
      </div>
      <div class="body" style="padding:20px">
        <strong class="display-m" style="font-weight:900;text-transform:uppercase;line-height:1">${v.nom}</strong>
        ${v.adresse?`<span class="muted" style="font-size:13px">${v.adresse}</span>`:''}
        ${v.usage?`<span class="muted" style="font-size:13px">${v.usage}</span>`:''}
        ${v.acces?`<span class="mono" style="font-size:10px">${v.acces}</span>`:''}
      </div>`;
  // Une salle sans slug reste affichee mais n est pas cliquable, exactement
  // comme une equipe sans slug : une saisie incomplete degrade la carte, elle
  // ne fabrique pas de lien mort. Le lien d itineraire ne survit qu a la forme
  // non cliquable — imbriquer un lien dans un lien n est pas du HTML valide,
  // et la fiche porte de toute facon son propre bouton d itineraire.
  if(v.slug)return `<a class="card link shadow" href="${gymnaseUrl(v.slug)}">${dedans}</a>`;
  return `<div class="card shadow">${dedans}
      ${v.itineraire?`<div class="body" style="padding:0 20px 20px"><a href="${v.itineraire}" target="_blank" rel="noopener" class="mono lien" style="align-self:flex-start;font-size:11px;color:var(--encre)">Itinéraire ↗</a></div>`:''}
    </div>`;}
// Remplit la grille et le sous-titre d une section gymnases. Chaque element est
// cherche par identifiant et ignore s il manque : une page peut n avoir que la
// grille. « sites » et non « salles » : le Beach Park n en est pas une.
function renderGymnases(idGrille,idSousTitre,data){
  const salles=data?.items||[];
  const sub=document.getElementById(idSousTitre);
  if(sub)sub.textContent=[salles.length+(salles.length>1?" sites":" site"),data?.secteur].filter(Boolean).join(" · ");
  const grille=document.getElementById(idGrille);
  if(grille)grille.innerHTML=salles.map(salleCard).join("")||'<p class="muted">Les sites seront renseignés prochainement.</p>';
}
// Formulaires (adhésion & contact) — envoi par Web3Forms, message de confirmation inline.
function initForms(){
  document.querySelectorAll("form[data-web3forms]").forEach(form=>{
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const ok=form.querySelector(".ok"),ko=form.querySelector(".ko"),btn=form.querySelector('button[type="submit"]');
      ok.style.display="none";if(ko)ko.style.display="none";btn.disabled=true;
      try{
        const r=await fetch("https://api.web3forms.com/submit",{method:"POST",headers:{accept:"application/json"},body:new FormData(form)});
        const d=await r.json();
        if(!d.success)throw 0;
        ok.style.display="block";form.reset();
      }catch(err){if(ko)ko.style.display="block";}
      btn.disabled=false;
    });
  });
}
document.addEventListener("DOMContentLoaded",()=>{renderChrome();initForms();if(window.__pageInit)window.__pageInit();murPartenaires();revelerSections();});
