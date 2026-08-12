// Site CABC Volley — header/footer partagés + rendu du contenu JSON (Decap)
const NAV=[["index.html","Accueil"],["club.html","Le Club"],["equipes.html","Équipes"],["calendrier.html","Calendrier"],["actualites.html","Actualités"],["boutique.html","Boutique"],["infos.html","Infos"],["contact.html","Contact"]];
// Pages enfants : elles allument l'entree de nav de leur page parente.
const PARENT={"equipe.html":"equipes.html","article.html":"actualites.html"};
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
    <header class="site-header">
      <button class="burger" aria-label="Menu" onclick="document.getElementById('mainnav').classList.toggle('open')"><span></span><span></span><span></span></button>
      <a class="logo" href="index.html"><img src="assets/logo.png" alt="C.A. Brive Corrèze Volley"></a>
      <nav id="mainnav">${links}<a href="adhesion.html" class="btn btn-primary" style="padding:9px 20px">ADHÉRER</a></nav>
    </header>`;
  const footer=document.getElementById("footer");
  if(footer)footer.innerHTML=`
    <footer class="site-footer section" style="border-bottom:none;border-top:2px solid var(--encre)">
      <span class="mono">© ${new Date().getFullYear()} C.A. BRIVE CORRÈZE VOLLEY / Réalisation Nicolas BRESSON</span>
      <nav><a href="https://www.ffvb.org/" target="_blank" rel="noopener">FFVB</a><a href="https://www.instagram.com/cabcvolley/" target="_blank" rel="noopener">Instagram</a><a href="https://www.facebook.com/cabvolley19/" target="_blank" rel="noopener">Facebook</a><a href="contact.html">Contact</a><a href="mentions-legales.html">Mentions légales</a></nav>
    </footer>`;
}
function fmtDate(iso){try{return new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase();}catch(e){return iso;}}
// Ligne d un match a venir. Exactement 3 enfants directs : .match-row est
// une grille a 3 colonnes qui deborde au-dela.
function matchRow(m){const d=new Date(m.date);return `
    <div class="match-row">
      <span class="mono" style="letter-spacing:.06em;color:var(--encre)">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()}<br><span style="color:var(--taupe)">${d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span></span>
      <div><strong style="font-family:'Barlow Condensed';font-size:24px">CAB — ${m.adversaire}</strong><div class="muted" style="font-size:13px">${m.competition} · ${m.lieu}</div></div>
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
