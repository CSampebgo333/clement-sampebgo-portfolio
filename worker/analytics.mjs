// No visitor identifiers or analytics secrets are returned by this module.
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const HEX=/^[a-f0-9]{32}$/i;
const EXCLUDED=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH'.split(' '));
export function measurementAllowed(request,env){
 const url=new URL(request.url),country=request.cf?.country;
 return env.ANALYTICS_ENABLED==='true'&&HEX.test(env.WEB_ANALYTICS_TOKEN||'')&&
  request.method==='GET'&&!!country&&/^[A-Z]{2}$/.test(country)&&country!=='XX'&&country!=='T1'&&!EXCLUDED.has(country)&&
  request.headers.get('DNT')!=='1'&&request.headers.get('Sec-GPC')!=='1'&&
  url.hostname===new URL(env.SITE_ORIGIN||url.origin).hostname&&/^\/(en|fr)\//.test(url.pathname);
}
export function analyticsSnippet(token){
 if(!HEX.test(token||''))return '';
 return '<script defer src="/assets/analytics-beacon.js" data-analytics-token="'+token+'"></script>';
}
export function analyticsQuery(account,hostname,days,now=new Date()){
 if(!HEX.test(account||''))fail(503,'analytics_configuration');
 if(![1,7,30].includes(days))fail(400,'analytics_period');
 const end=new Date(now);end.setUTCMinutes(0,0,0);
 const start=new Date(end.getTime()-days*86400000);
 const filter={datetime_geq:start.toISOString(),datetime_lt:end.toISOString(),requestHost:hostname,
  OR:[{requestPath_like:'/en/%'},{requestPath_like:'/fr/%'}]};
 const selections=[
  'total: rumPageloadEventsAdaptiveGroups(limit:1, filter:$filter){count sum{visits}}',
  'daily: rumPageloadEventsAdaptiveGroups(limit:32, filter:$filter, orderBy:[date_ASC]){count sum{visits} dimensions{date}}',
  ...[['countries','countryName'],['sources','refererHost'],['pages','requestPath'],['devices','deviceType']].map(([alias,dimension])=>
   `${alias}: rumPageloadEventsAdaptiveGroups(limit:10, filter:$filter, orderBy:[count_DESC]){count dimensions{${dimension}}}`)
 ];
 return {query:'query PortfolioAnalytics($account:string!, $filter:AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!){viewer{accounts(filter:{accountTag:$account}){'+selections.join('\n')+'}}}',variables:{account,filter},from:start.toISOString(),to:end.toISOString()};
}
const metric=value=>{if(!Number.isFinite(value)||value<0)fail(502,'analytics_response');return value};
export function normalizeAnalytics(account,range){
 for(const key of ['total','daily','countries','sources','pages','devices'])if(!Array.isArray(account?.[key]))fail(502,'analytics_response');
 const first=account.total[0];
 const breakdown=(key,dimension)=>account[key].slice(0,10).map(row=>({label:String(row.dimensions?.[dimension]||'').slice(0,300),views:metric(row.count)}));
 return {configured:true,from:range.from,to:range.to,updatedAt:new Date().toISOString(),
  views:first?metric(first.count):0,visits:first?metric(first.sum?.visits):0,
  daily:account.daily.map(row=>({date:String(row.dimensions?.date||''),views:metric(row.count),visits:metric(row.sum?.visits)})),
  countries:breakdown('countries','countryName'),sources:breakdown('sources','refererHost'),pages:breakdown('pages','requestPath'),devices:breakdown('devices','deviceType')};
}
// Cache aggregate responses in this isolate for five minutes; never cache tokens in a response.
const cache=new Map();
export async function getAnalytics(request,env,fetcher=fetch){
 const raw=new URL(request.url).searchParams.get('days')||'7';
 if(!['1','7','30'].includes(raw))fail(400,'analytics_period');
 if(!env.CF_ANALYTICS_API_TOKEN||!env.CF_ANALYTICS_ACCOUNT_ID)return {configured:false,reason:'analytics_configuration'};
 let origin;try{origin=new URL(env.SITE_ORIGIN);if(origin.protocol!=='https:')throw Error()}catch{fail(503,'analytics_configuration')}
 const range=analyticsQuery(env.CF_ANALYTICS_ACCOUNT_ID,origin.hostname,Number(raw));
 const key=JSON.stringify([env.CF_ANALYTICS_ACCOUNT_ID,origin.hostname,raw,range.to]);
 const existing=cache.get(key);if(existing&&Date.now()-existing.at<300000)return existing.value;
 let response,body;
 try{
  response=await fetcher('https://api.cloudflare.com/client/v4/graphql',{method:'POST',headers:{Authorization:'Bearer '+env.CF_ANALYTICS_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query:range.query,variables:range.variables}),signal:AbortSignal.timeout(15000)});
  if(response.status===401||response.status===403)fail(502,'analytics_permissions');
  if(!response.ok)fail(502,'analytics_unavailable');
  body=await response.json();
 }catch(error){if(error.status)throw error;fail(502,'analytics_unavailable')}
 if(body.errors?.length)fail(502,'analytics_query_failed');
 const account=body.data?.viewer?.accounts?.[0];if(!account)fail(502,'analytics_permissions');
 const value=normalizeAnalytics(account,range);
 if(cache.size>=12)cache.delete(cache.keys().next().value);
 cache.set(key,{at:Date.now(),value});return value;
}
