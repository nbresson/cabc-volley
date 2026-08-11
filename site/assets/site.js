// Site CABC Volley — header/footer partagés + rendu du contenu JSON (Decap)
const NAV=[["index.html","Accueil"],["club.html","Le Club"],["equipes.html","Équipes"],["calendrier.html","Calendrier"],["actualites.html","Actualités"],["boutique.html","Boutique"]];
async function getJSON(p){try{const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw 0;return await r.json();}catch(e){return null;}}
function here(){const p=location.pathname.split("/").pop();return p||"index.html";}
function renderChrome(){
  const cur=here();
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
      <span class="mono">© ${new Date().getFullYear()} C.A. BRIVE CORRÈZE VOLLEY</span>
      <nav><a href="#">Instagram</a><a href="#">Facebook</a><a href="contact.html">Contact</a><a href="#">Mentions légales</a></nav>
    </footer>`;
}
function fmtDate(iso){try{return new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase();}catch(e){return iso;}}
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
