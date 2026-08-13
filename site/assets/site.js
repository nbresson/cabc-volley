// Site CABC Volley — header/footer partagés + rendu du contenu JSON (Decap)
const NAV=[["index.html","Accueil"],["club.html","Le Club"],["equipes.html","Équipes"],["calendrier.html","Calendrier"],["actualites.html","Actualités"],["boutique.html","Boutique"],["infos.html","Infos"],["contact.html","Contact"]];
// Pages enfants : elles allument l'entree de nav de leur page parente.
const PARENT={"equipe.html":"equipes.html","article.html":"actualites.html"};
// Reseaux du club. Seule source des deux adresses : le bandeau, le pied de
// page et tout <div id="reseaux"> pose dans une page lisent cette liste.
const RESEAUX=[
  ["Instagram","https://www.instagram.com/cabcvolley/",'<rect class="frame" x="2" y="2" width="20" height="20"/><circle cx="12" cy="12" r="4.6"/><rect x="16.3" y="5.7" width="2.5" height="2.5" fill="currentColor" stroke="none"/>'],
  ["Facebook","https://www.facebook.com/cabvolley19/",'<rect class="frame" x="2" y="2" width="20" height="20"/><path d="M14.5 6.5H12.2V17.5M9.5 11H14.5"/>']
];
// Bandeau reseaux : bloc autonome sur fond encre. Pose par defaut sous la
// topbar, mais deplacable — un seul appel a bouger — et utilisable dans une
// page en y ecrivant <div id="reseaux"></div>.
function barreReseaux(){return `<div class="socialbar">${RESEAUX.map(([nom,url,glyphe])=>
  `<a class="social" href="${url}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${glyphe}</svg><span class="lbl">${nom} ↗</span></a>`).join("")}</div>`;}
// Seul endroit du code qui construit l'URL d'une page equipe.
// Passer a des URLs propres plus tard ne touchera que cette fonction.
function teamUrl(slug){return "equipe.html?e="+encodeURIComponent(slug);}
async function getJSON(p){try{const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw 0;return await r.json();}catch(e){return null;}}
function here(){const p=location.pathname.split("/").pop();return p||"index.html";}
function renderChrome(){
  const cur=PARENT[here()]||here();
  const links=NAV.map(([h,t])=>`<a href="${h}" class="${h===cur?'active':''}">${t}</a>`).join("");
  const header=document.getElementById("header");
  if(header)header.innerHTML=`
    <div class="topbar">CLUB ATHLÉTIQUE DE BRIVE — SECTION VOLLEY-BALL — DEPUIS 1946</div>
    ${barreReseaux()}
    <header class="site-header">
      <button class="burger" aria-label="Menu" onclick="document.getElementById('mainnav').classList.toggle('open')"><span></span><span></span><span></span></button>
      <a class="logo" href="index.html"><img src="assets/logo.png" alt="C.A. Brive Corrèze Volley"></a>
      <nav id="mainnav">${links}<a href="adhesion.html" class="btn btn-primary" style="padding:9px 20px">ADHÉRER</a></nav>
    </header>`;
  const footer=document.getElementById("footer");
  if(footer)footer.innerHTML=`
    <footer class="site-footer section" style="border-bottom:none;border-top:2px solid var(--encre)">
      <span class="mono">© ${new Date().getFullYear()} C.A. BRIVE CORRÈZE VOLLEY / Réalisation Nicolas BRESSON</span>
      <nav><a href="https://www.ffvb.org/" target="_blank" rel="noopener">FFVB</a>${RESEAUX.map(([nom,url])=>`<a href="${url}" target="_blank" rel="noopener">${nom}</a>`).join("")}<a href="contact.html">Contact</a><a href="mentions-legales.html">Mentions légales</a></nav>
    </footer>`;
  const reseaux=document.getElementById("reseaux");
  if(reseaux)reseaux.innerHTML=barreReseaux();
}
function fmtDate(iso){try{return new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase();}catch(e){return iso;}}
// Ligne d un match a venir. Exactement 3 enfants directs : .match-row est
// une grille a 3 colonnes qui deborde au-dela.
function matchRow(m){const d=new Date(m.date);return `
    <div class="match-row">
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()}<br><span style="color:var(--taupe)">${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span></span>
      <div><strong class="display-m">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition} · ${m.lieu}</div></div>
      <span class="${m.domicile?'badge':'badge-outline'}">${m.domicile?"Domicile":"Extérieur"}</span></div>`;}
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
function salleCard(v){return `
    <div class="card shadow">
      <div class="ph" style="aspect-ratio:16/10;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${v.photo?`<img src="${v.photo}" alt="${v.nom}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'<span class="mono" style="color:var(--mention)">[ photo à venir ]</span>'}
        ${v.etiquette?`<span class="badge" style="position:absolute;top:12px;left:12px">${v.etiquette}</span>`:''}
      </div>
      <div class="body" style="padding:20px">
        <strong class="display-m" style="font-weight:900;text-transform:uppercase;line-height:1">${v.nom}</strong>
        ${v.adresse?`<span class="muted" style="font-size:13px">${v.adresse}</span>`:''}
        ${v.usage?`<span class="muted" style="font-size:13px">${v.usage}</span>`:''}
        ${v.acces?`<span class="mono" style="font-size:10px">${v.acces}</span>`:''}
        ${v.itineraire?`<a href="${v.itineraire}" target="_blank" rel="noopener" class="mono lien" style="align-self:flex-start;margin-top:6px;font-size:11px;color:var(--encre)">Itinéraire ↗</a>`:''}
      </div>
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
document.addEventListener("DOMContentLoaded",()=>{renderChrome();initForms();if(window.__pageInit)window.__pageInit();});
