import {esc} from './content-format.js';
const words={
 en:{title:'Audience statistics',period:'Period',days:'days',day:'Last 24 hours',refresh:'Refresh',loading:'Loading aggregate statistics…',views:'Page views',visits:'Visits',daily:'Daily activity (UTC)',countries:'Countries',sources:'Traffic sources',pages:'Popular pages',devices:'Devices',date:'Date',empty:'No measurements in this period yet. Reports can be delayed, blocked by the browser or excluded by privacy settings.',setup:'Statistics are not connected yet. An owner must configure the read-only Cloudflare analytics secret. No example numbers are shown.',failed:'Cloudflare statistics are unavailable. Check the read-only token, account permissions and dataset availability. No figures have been substituted.',note:'Aggregate Cloudflare RUM measurements, not unique people. Administration traffic, EEA, UK and Swiss visits, unknown locations and privacy opt-outs are excluded from new collection. Bots and blockers can affect counts. Top lists are limited to 10 and may not sum to the total. Values may be estimated. Results are cached for up to five minutes; the most recent incomplete hour is excluded.',direct:'Direct / unavailable',unknown:'Unknown',updated:'Last fetched',from:'From',to:'to'},
 fr:{title:'Statistiques de fréquentation',period:'Période',days:'jours',day:'Dernières 24 heures',refresh:'Actualiser',loading:'Chargement des statistiques agrégées…',views:'Pages vues',visits:'Visites',daily:'Activité quotidienne (UTC)',countries:'Pays',sources:'Sources de trafic',pages:'Pages populaires',devices:'Appareils',date:'Date',empty:'Aucune mesure sur cette période pour le moment. Les rapports peuvent être retardés, bloqués par le navigateur ou exclus par les réglages de confidentialité.',setup:'Les statistiques ne sont pas encore connectées. Le propriétaire doit configurer le secret Cloudflare de lecture seule. Aucun chiffre d’exemple n’est affiché.',failed:'Les statistiques Cloudflare sont indisponibles. Vérifiez le jeton de lecture, les permissions du compte et la disponibilité du jeu de données. Aucun chiffre de remplacement n’est affiché.',note:'Mesures agrégées Cloudflare RUM, pas un décompte de personnes uniques. L’administration, les visites depuis l’EEE, le Royaume-Uni ou la Suisse, les localisations inconnues et les oppositions sont exclues de la nouvelle collecte. Les robots et bloqueurs peuvent affecter les chiffres. Les listes sont limitées à 10 et ne représentent pas nécessairement le total. Les valeurs peuvent être estimées. Les résultats sont conservés en cache cinq minutes ; l’heure en cours est exclue.',direct:'Accès direct / indisponible',unknown:'Inconnu',updated:'Dernière récupération',from:'Du',to:'au'}
};
export function analyticsReport(data,language='en'){
 const t=words[language],n=value=>new Intl.NumberFormat(language).format(value);
 if(!data.configured)return `<p class="note" role="status">${t.setup}</p>`;
 const formatDate=value=>new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value));
 const cards=`<div class="analytics-summary"><article><span>${t.views}</span><strong>${n(data.views)}</strong></article><article><span>${t.visits}</span><strong>${n(data.visits)}</strong></article></div>`;
 const table=(title,rows,first)=>`<section class="analytics-table"><h3>${title}</h3><table><thead><tr><th scope="col">${first}</th><th scope="col">${t.views}</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${esc(row.label||t.unknown)}</th><td>${n(row.views)}</td></tr>`).join('')}</tbody></table></section>`;
 const countryNames=new Intl.DisplayNames([language],{type:'region'});
 const deviceNames=language==='fr'?{desktop:'Ordinateur',mobile:'Mobile',tablet:'Tablette'}:{desktop:'Desktop',mobile:'Mobile',tablet:'Tablet'};
 const lists=[['countries',t.countries],['sources',t.sources],['pages',t.pages],['devices',t.devices]].map(([key,title])=>table(title,data[key].map(row=>{
  let label=row.label||(key==='sources'?t.direct:t.unknown);
  if(key==='countries'&&/^[A-Z]{2}$/.test(label))label=countryNames.of(label)||label;
  if(key==='devices')label=deviceNames[label.toLowerCase()]||label;
  return {...row,label};
 }),title)).join('');
 return `<p class="analytics-range">${t.from} ${formatDate(data.from)} ${t.to} ${formatDate(data.to)} · UTC</p>${cards}${data.views===0?`<p class="note">${t.empty}</p>`:''}<div class="analytics-tables">${table(t.daily,data.daily.map(row=>({label:row.date,views:row.views})),t.date)}${lists}</div><p class="note">${t.note}</p><p><small>${t.updated} : ${formatDate(data.updatedAt)} UTC</small></p>`;
}
export function mountAnalytics(container,{language='en',connected=false}={}){
 const t=words[language];let sequence=0;
 container.innerHTML=`<h2>${t.title}</h2><div class="analytics-controls"><label>${t.period}<select data-analytics-days><option value="1">${t.day}</option><option value="7" selected>7 ${t.days}</option><option value="30">30 ${t.days}</option></select></label><button type="button" data-analytics-refresh>${t.refresh}</button></div><p data-analytics-status role="status" aria-live="polite"></p><div data-analytics-report></div>`;
 const select=container.querySelector('[data-analytics-days]'),button=container.querySelector('[data-analytics-refresh]'),status=container.querySelector('[data-analytics-status]'),report=container.querySelector('[data-analytics-report]');
 async function load(){
  const run=++sequence;
  if(!connected){report.innerHTML=analyticsReport({configured:false},language);return}
  status.textContent=t.loading;report.replaceChildren();report.setAttribute('aria-busy','true');button.disabled=true;
  try{
   const response=await fetch('/api/admin/analytics?days='+select.value,{cache:'no-store'});
   if(!response.ok)throw Error();const data=await response.json();
   if(run!==sequence||!container.isConnected)return;
   report.innerHTML=analyticsReport(data,language);status.textContent='';
  }catch{if(run===sequence)status.textContent=t.failed}
  finally{if(run===sequence){button.disabled=false;report.removeAttribute('aria-busy')}}
 }
 select.onchange=load;button.onclick=load;load();
}
