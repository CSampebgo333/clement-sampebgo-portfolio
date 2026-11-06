import {esc} from './content-format.js';
export function mountCVHistory(container,{language,connected,storage,api,onRestore}){
 const fr=language==='fr';
 container.innerHTML=`<section class="cv-history"><h2>${fr?'Historique privé des CV':'Private CV history'}</h2><p>${fr?'Chaque PDF téléversé est conservé, même sans publication. Rétablir une version change le CV public sans effacer les autres.':'Every uploaded PDF is retained, even before publication. Restoring a version changes the public CV without deleting the others.'}</p>${!connected||!storage?`<p class="note">${fr?'L’historique nécessite Cloudflare D1, R2 et l’authentification du propriétaire. Il n’est pas actif dans cet aperçu.':'History needs Cloudflare D1, R2 and owner authentication. It is not active in this preview.'}</p>`:''}<div class="cv-history-columns">${['fr','en'].map(l=>`<section data-history-language="${l}"><h3>CV · ${l==='fr'?'Français':'English'}</h3><p class="status" role="status"></p><ol></ol><button type="button" data-history-more hidden>${fr?'Versions précédentes':'Older versions'}</button></section>`).join('')}</div></section>`;
 if(!connected||!storage)return;
 for(const l of ['fr','en']){
  const panel=container.querySelector(`[data-history-language="${l}"]`),list=panel.querySelector('ol'),status=panel.querySelector('[role="status"]'),more=panel.querySelector('button');let next=null;
  async function load(before){status.textContent=fr?'Chargement…':'Loading…';more.disabled=true;try{
   const data=await api('cv-versions?language='+l+(before?'&before='+before:''));if(!container.isConnected)return;
   if(!before)list.innerHTML='';
   list.insertAdjacentHTML('beforeend',data.versions.map(v=>{const date=new Date(v.createdAt.replace(' ','T')+'Z');const label=Number.isNaN(date.valueOf())?v.createdAt:new Intl.DateTimeFormat(fr?'fr-FR':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(date);return `<li><div><strong>${fr?'Version':'Version'} ${v.id}</strong> ${v.current?`<span class="cv-current">${fr?'Actuelle':'Current'}</span>`:''}<small>${esc(label)} UTC · ${Math.ceil(v.size/1024)} ${fr?'Ko':'KB'}</small></div><div class="cv-history-actions"><a href="/api/admin/cv-versions/${v.id}/file" target="_blank" rel="noopener">${fr?'Aperçu':'Preview'} ↗</a><a href="/api/admin/cv-versions/${v.id}/file?download=1">${fr?'Télécharger':'Download'} ↓</a><button type="button" data-restore-cv="${v.id}" ${v.current?'disabled':''}>${fr?'Rétablir':'Restore'}</button></div></li>`}).join(''));
   next=data.next;more.hidden=!next;status.textContent=list.children.length?'':fr?'Aucune version archivée. Le CV actuel sera conservé au premier remplacement.':'No archived versions yet. The current CV will be retained on the first replacement.';
  }catch(error){status.textContent=error.message}finally{more.disabled=false}}
  more.onclick=()=>load(next);
  list.onclick=async event=>{const button=event.target.closest('[data-restore-cv]');if(!button)return;
   if(!confirm(fr?'Rétablir ce CV ? Il deviendra public. Les autres versions seront conservées. Les modifications non enregistrées du formulaire seront abandonnées.':'Restore this CV? It will become public. Other versions will be retained. Unsaved form changes will be discarded.'))return;
   button.disabled=true;status.textContent=fr?'Restauration…':'Restoring…';try{await onRestore(Number(button.dataset.restoreCv))}catch(error){status.textContent=error.message;button.disabled=false}
  };
  load();
 }
}
