import {loadContent} from './cms-public.js';
const fr=document.documentElement.lang==='fr';
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const theme=document.querySelector('#theme');
function themeLabel(){if(theme)theme.setAttribute('aria-label',fr?`Activer le thème ${document.documentElement.dataset.theme==='dark'?'clair':'sombre'}`:`Switch to ${document.documentElement.dataset.theme==='dark'?'light':'dark'} mode`)}
themeLabel();theme?.addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;storage.set('portfolio-theme',t);themeLabel()});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>{if(!storage.get('portfolio-theme')){document.documentElement.dataset.theme=e.matches?'dark':'light';themeLabel()}});
document.querySelector('#menu')?.addEventListener('click',e=>{const open=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(open));document.querySelector('#navlinks').classList.toggle('open',open)});
document.querySelectorAll('#navlinks a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#navlinks').classList.remove('open');document.querySelector('#menu')?.setAttribute('aria-expanded','false')}));
const lang=document.querySelector('#language');lang?.addEventListener('click',e=>{e.preventDefault();storage.set('portfolio-language',fr?'en':'fr');location.href=lang.getAttribute('href')+location.hash});
function bindFilters(){
 document.querySelector('#project-grid')?.classList.add('projects-ready');let selected='all',limit=4;const more=document.querySelector('#view-more-projects');
 function filter(){const matches=Array.from(document.querySelectorAll('[data-project]')).filter(p=>selected==='all'||selected==='featured'&&p.dataset.featured==='true'||p.dataset.category===selected);document.querySelectorAll('[data-project]').forEach(p=>p.hidden=true);matches.slice(0,limit).forEach(p=>p.hidden=false);const shown=Math.min(limit,matches.length),s=document.querySelector('#filter-status');if(s)s.textContent=fr?`${shown} projets affichés sur ${matches.length}`:`${shown} of ${matches.length} projects shown`;if(more){more.hidden=shown>=matches.length;more.textContent=fr?'Voir plus de projets ↓':'View more projects ↓'}}
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.filter;limit=4;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()}));more?.addEventListener('click',()=>{const before=limit;limit+=4;filter();const shown=Array.from(document.querySelectorAll('[data-project]')).filter(p=>!p.hidden);shown[before]?.querySelector('a')?.focus()});filter();
}
bindFilters();document.addEventListener('portfolio-content-updated',bindFilters);loadContent();
