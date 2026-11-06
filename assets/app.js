import './privacy-controls.js';
import {setupSkillLists} from './skill-lists.js';
import {setupEffects,transitionProjects} from './effects.js';
import {loadContent} from './cms-public.js';
const fr=document.documentElement.lang==='fr';
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const theme=document.querySelector('#theme');
function themeLabel(){if(theme)theme.setAttribute('aria-label',fr?`Activer le thème ${document.documentElement.dataset.theme==='dark'?'clair':'sombre'}`:`Switch to ${document.documentElement.dataset.theme==='dark'?'light':'dark'} mode`)}
themeLabel();theme?.addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;storage.set('portfolio-theme',t);themeLabel()});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>{if(!storage.get('portfolio-theme')){document.documentElement.dataset.theme=e.matches?'dark':'light';themeLabel()}});
document.querySelector('#menu')?.addEventListener('click',e=>{const open=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(open));document.querySelector('#navlinks').classList.toggle('open',open)});
document.querySelectorAll('#navlinks a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#navlinks').classList.remove('open');document.querySelector('#menu')?.setAttribute('aria-expanded','false')}));
const lang=document.querySelector('#language');
const positionKey='portfolio-language-position';
lang?.addEventListener('click',e=>{
 if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 e.preventDefault();storage.set('portfolio-language',fr?'en':'fr');
 const target=new URL(lang.getAttribute('href'),location.href);
 const edge=(document.querySelector('.topbar')?.getBoundingClientRect().height||0)+20;
 const sections=[...document.querySelectorAll('#main>section[id],#main>.detail')];
 const hashSection=sections.find(x=>x.id&&'#'+x.id===location.hash);
 const hashRect=hashSection?.getBoundingClientRect();
 const section=hashRect&&hashRect.bottom>edge&&hashRect.top<innerHeight?hashSection:sections.reduce((best,x)=>{const r=x.getBoundingClientRect(),visible=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(edge,r.top));return visible>best.visible?{element:x,visible}:best},{element:null,visible:0}).element;
 const rect=section?.getBoundingClientRect();
 const position={path:target.pathname,time:Date.now(),id:section?.id||null,detail:section?.classList.contains('detail')||false,ratio:rect?Math.max(0,Math.min(1,(edge-rect.top)/rect.height)):0};
 try{sessionStorage.setItem(positionKey,JSON.stringify(position))}catch{}
 target.hash=section?.id||location.hash;
 location.assign(target.href);
});
function bindFilters(){
 document.querySelector('#project-grid')?.classList.add('projects-ready');let selected='featured',limit=4;const more=document.querySelector('#view-more-projects');
 function filter(animated=true){const grid=document.querySelector('#project-grid');transitionProjects(grid,()=>{const matches=Array.from(document.querySelectorAll('[data-project]')).filter(p=>selected==='all'||selected==='featured'&&p.dataset.featured==='true'||p.dataset.category===selected);document.querySelectorAll('[data-project]').forEach(p=>p.hidden=true);matches.slice(0,limit).forEach(p=>p.hidden=false);const empty=document.querySelector('#projects-empty');if(empty){empty.hidden=matches.length!==0;empty.textContent=fr?'Aucun projet dans cette sélection. Consultez « Tous les projets » pour explorer les autres travaux.':'No projects in this selection. Choose “All projects” to explore the other work.'}const shown=Math.min(limit,matches.length),s=document.querySelector('#filter-status');if(s)s.textContent=fr?`${shown} projets affichés sur ${matches.length}`:`${shown} of ${matches.length} projects shown`;if(more){more.hidden=shown>=matches.length;more.textContent=fr?'Voir plus de projets ↓':'View more projects ↓'}},{reduced:!animated||matchMedia('(prefers-reduced-motion: reduce)').matches});document.dispatchEvent(new Event('portfolio-layout-changed'))}
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.filter;limit=4;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()}));more?.addEventListener('click',()=>{const before=limit;limit+=4;filter();const shown=Array.from(document.querySelectorAll('[data-project]')).filter(p=>!p.hidden);shown[before]?.querySelector('a')?.focus()});filter(false);
}
bindFilters();document.addEventListener('portfolio-content-updated',bindFilters);const contentReady=loadContent();

function bindCredentialRails(){document.querySelectorAll('[data-slide]').forEach(button=>{button.onclick=()=>{const track=document.getElementById(button.getAttribute('aria-controls'));if(track)track.scrollBy({left:Number(button.dataset.slide)*(track.querySelector('.cert')?.getBoundingClientRect().width+24||320),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}})}
bindCredentialRails();document.addEventListener('portfolio-content-updated',bindCredentialRails);

let disposeEffects=()=>{};function bindEffects(){disposeEffects();disposeEffects=setupEffects()}bindEffects();document.addEventListener('portfolio-content-updated',bindEffects);

// Restore only a deliberate language switch, after content and image layout settle.
const pageReady=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
Promise.all([contentReady,pageReady]).then(()=>{
 let position;try{position=JSON.parse(sessionStorage.getItem(positionKey));sessionStorage.removeItem(positionKey)}catch{return}
 if(!position||position.path!==location.pathname||Date.now()-position.time>120000)return;
 const section=position.id?document.getElementById(position.id):position.detail?document.querySelector('#main>.detail'):null;
 const edge=(document.querySelector('.topbar')?.getBoundingClientRect().height||0)+20;
 const rect=section?.getBoundingClientRect();
 window.scrollTo({top:rect?window.scrollY+rect.top+rect.height*position.ratio-edge:0,behavior:'instant'});
 document.dispatchEvent(new Event('portfolio-layout-changed'));
});

// A single page-level live notification avoids layout shifts and duplicate toasts.
const copyToast=document.createElement('div');copyToast.className='copy-toast';
copyToast.setAttribute('role','status');copyToast.setAttribute('aria-live','polite');copyToast.setAttribute('aria-atomic','true');document.body.append(copyToast);
let copyToastTimer;
function hideCopyToast(){clearTimeout(copyToastTimer);copyToast.classList.remove('is-visible');copyToast.textContent=''}
function showCopyToast(){
 hideCopyToast();
 const icon=document.createElement('span');icon.className='copy-toast-icon';icon.setAttribute('aria-hidden','true');icon.textContent='✓';
 copyToast.append(icon,document.createTextNode(fr?'Lien copié':'Link copied'));copyToast.classList.add('is-visible');
 copyToastTimer=setTimeout(hideCopyToast,4000);
}

// Delegation keeps CV actions working after content updates, without duplicate handlers.
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-copy-cv]');if(!button)return;
 const tools=button.closest('.cv-tools'),status=tools.querySelector('.cv-copy-status'),fallback=tools.querySelector('.cv-copy-fallback');
 const url=new URL(button.dataset.copyCv,location.origin).href;
 button.disabled=true;status.textContent='';hideCopyToast();
 try{
  if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(url);fallback.hidden=true;
  showCopyToast();
 }catch{
  fallback.value=url;fallback.hidden=false;fallback.focus();fallback.select();
  status.textContent=fr?'Copie automatique indisponible. Copiez le lien sélectionné.':'Automatic copying is unavailable. Copy the selected link.';
 }finally{button.disabled=false}
});

let disposeSkillLists=()=>{};function bindSkillLists(){disposeSkillLists();disposeSkillLists=setupSkillLists()}bindSkillLists();document.addEventListener('portfolio-content-updated',bindSkillLists);
