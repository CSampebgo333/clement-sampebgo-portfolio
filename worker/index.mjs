import {getContent,saveContent,uploadMedia,publicMedia,renderLive,usesURL} from './cms.mjs';
const API='https://api.github.com';
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
export const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:JSON_HEADERS});
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
export function validRepo(repo){return typeof repo==='string'&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)}
export function validPath(path){return typeof path==='string'&&path.length<=300&&!path.split('/').some(s=>s==='..'||s==='.')&&!/[\x00-\x1f\\?#]/.test(path)&&!path.startsWith('/')}
export async function identity(repo,path=''){return 'p_'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(repo.toLowerCase()+'\n'+path)))).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,32)}
export function validateContent(p){
 if(!p||!['software','data','ai','research'].includes(p.category))fail(400,'Invalid category');
 let url;try{url=new URL(p.url)}catch{fail(400,'Evidence URL required')}
 if(url.protocol!=='https:'||url.username||url.password)fail(400,'Use a public HTTPS evidence URL');
 const out={category:p.category,url:url.href};
 for(const l of ['en','fr']){out[l]={};for(const [k,max] of [['title',140],['summary',1000],['role',500]]){const s=p[l]?.[k];if(typeof s!=='string'||!s.trim()||s.length>max)fail(400,`Missing or invalid ${l}.${k}`);out[l][k]=s.trim()}}
 return out;
}
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
let jwksCache={url:'',at:0,keys:[]};
export async function verifyAccess(token,env,keyResolver){
 if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.ADMIN_EMAIL)fail(503,'Private review is not configured');
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))fail(503,'Invalid Access domain');
 try{
  const parts=token.split('.');if(parts.length!==3)throw Error();
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));const claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
  if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error();
  const issuer='https://'+env.ACCESS_TEAM_DOMAIN;const now=Date.now()/1000;
  if(claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUD)||typeof claims.exp!=='number'||claims.exp<=now||typeof claims.iat!=='number'||claims.iat>now+60||claims.nbf&&claims.nbf>now+60||claims.email?.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())throw Error();
  let key;
  if(keyResolver)key=await keyResolver(header.kid);else{
   if(jwksCache.url!==issuer||Date.now()-jwksCache.at>300000){const r=await fetch(issuer+'/cdn-cgi/access/certs');if(!r.ok)throw Error();jwksCache={url:issuer,at:Date.now(),keys:(await r.json()).keys||[]}}
   const jwk=jwksCache.keys.find(k=>k.kid===header.kid);if(!jwk)throw Error();key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  }
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error();return claims.email;
 }catch{fail(401,'Owner authentication required')}
}
async function github(path,env){
 const r=await fetch(API+path,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ClementPortfolioDiscovery',...(env.GITHUB_TOKEN?{Authorization:`Bearer ${env.GITHUB_TOKEN}`}:{})}});
 if(!r.ok)throw Error(`GitHub request failed (${r.status})`);return r.json();
}
async function publicRepo(repo,env){if(!validRepo(repo))fail(400,'Invalid repository');const r=await github('/repos/'+repo,env);if(r.private||r.visibility&&r.visibility!=='public')fail(400,'Only public repositories are supported');return r}
export function publicRecord(row){if(row.status!=='approved'||!row.public_verified||!row.content)return null;const d=validateContent(JSON.parse(row.content));return {id:row.id,featured:!!row.featured,...d}}
export async function discover(env){
 if(!env.DB)throw Error('D1 not configured');
 const username=env.GITHUB_USERNAME||'CSampebgo333';if(!/^[A-Za-z0-9-]+$/.test(username))throw Error('Invalid GitHub username');
 const excluded=new Set((await env.DB.prepare('SELECT repo FROM exclusions').all()).results.map(r=>r.repo.toLowerCase()));
 for(const s of (env.EXCLUDED_REPOS||'').split(',').filter(Boolean))excluded.add(s.trim().toLowerCase());
 const found=new Map();
 for(let page=1;page<=10;page++){const rows=await github(`/users/${username}/repos?type=owner&per_page=100&page=${page}`,env);for(const r of rows)if(!r.private&&r.visibility!=='private'&&!excluded.has(r.full_name.toLowerCase()))found.set(r.full_name.toLowerCase(),{repo:r.full_name,relationship:'owned'});if(rows.length<100)break}
 // GitHub search is capped at 1,000 results and is not a complete contribution ledger.
 for(let page=1;page<=10;page++){const result=await github('/search/issues?q='+encodeURIComponent(`is:pr is:public author:${username}`)+`&per_page=100&page=${page}`,env);for(const pr of result.items||[]){const repo=pr.repository_url?.replace('https://api.github.com/repos/','');if(validRepo(repo)&&repo.split('/')[0].toLowerCase()!==username.toLowerCase()&&!excluded.has(repo.toLowerCase()))found.set(repo.toLowerCase(),{repo,relationship:'contributed'})}if((result.items||[]).length<100)break}
 let added=0;
 for(const {repo,relationship} of found.values()){
  const r=await publicRepo(repo,env);const id=await identity(repo);const snapshot=JSON.stringify({repo:r.full_name,url:r.html_url,description:r.description||'',relationship,seen:new Date().toISOString()});
  const existing=await env.DB.prepare('SELECT id FROM projects WHERE id=?').bind(id).first();
  if(existing){await env.DB.prepare('UPDATE projects SET snapshot=?,public_verified=1,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(snapshot,id).run()}
  else{const out=await env.DB.prepare("INSERT OR IGNORE INTO projects(id,repo,path,relationship,snapshot,public_verified) VALUES(?,?,'',?,?,1)").bind(id,r.full_name.toLowerCase(),relationship,snapshot).run();added+=out.meta?.changes||0}
 }
 // Recheck every approved repository, including manually entered monorepo paths.
 const approved=(await env.DB.prepare("SELECT id,repo FROM projects WHERE status='approved' AND repo IS NOT NULL").all()).results;
 for(const row of approved){try{await publicRepo(row.repo,env)}catch{await env.DB.prepare("UPDATE projects SET status='pending',public_verified=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run()}}
 const pending=(await env.DB.prepare("SELECT id FROM projects WHERE status='pending' AND notified=0").all()).results;
 if(pending.length&&env.RESEND_API_KEY&&env.NOTIFY_FROM&&env.ADMIN_EMAIL){
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.NOTIFY_FROM,to:[env.ADMIN_EMAIL],subject:'Portfolio: projects waiting for review',text:`${pending.length} project suggestions await your review at ${env.SITE_ORIGIN}/admin. No suggestion is published until you approve it.`})});
  if(!r.ok)throw Error('Review email delivery failed');
  await env.DB.batch(pending.map(p=>env.DB.prepare('UPDATE projects SET notified=1 WHERE id=?').bind(p.id)));
 }
 return {added,pending:pending.length,notificationsConfigured:!!(env.RESEND_API_KEY&&env.NOTIFY_FROM)};
}
async function readBody(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'JSON required');
 const reader=request.body?.getReader();if(!reader)fail(400,'Body required');let size=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>262144){await reader.cancel();fail(413,'Request too large')}chunks.push(value)}
 const all=new Uint8Array(size);let i=0;for(const c of chunks){all.set(c,i);i+=c.length}
 try{return JSON.parse(new TextDecoder().decode(all))}catch{fail(400,'Invalid JSON')}
}
async function admin(request,env,url,actor){
 if(!env.DB)fail(503,'D1 is not configured');
 if(request.method==='GET'&&url.pathname==='/api/admin/content'){const content=await getContent(env);return json({...content,uploadsConfigured:!!env.BUCKET,notificationsConfigured:!!(env.RESEND_API_KEY&&env.NOTIFY_FROM)})}
 if(request.method==='GET'&&url.pathname==='/api/admin/projects'){return json((await env.DB.prepare('SELECT * FROM projects ORDER BY discovered_at DESC LIMIT 500').all()).results)}
 if(request.method!=='POST')fail(405,'Method not allowed');
 if(request.headers.get('origin')!==url.origin||request.headers.get('x-portfolio-request')!=='review')fail(403,'Same-origin review request required');
 if(url.pathname==='/api/admin/upload')return json(await uploadMedia(request,env,actor));
 const b=await readBody(request);
 if(url.pathname==='/api/admin/content')return json(await saveContent(env,b,actor));
 if(url.pathname==='/api/admin/sync')return json(await discover(env));
 if(url.pathname==='/api/admin/exclusions'){
  if(!validRepo(b.repo))fail(400,'Invalid repository');const repo=b.repo.toLowerCase();
  if(b.remove){await env.DB.prepare('DELETE FROM exclusions WHERE repo=?').bind(repo).run();return json({ok:true})}
  await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO exclusions(repo) VALUES(?)').bind(repo),env.DB.prepare("UPDATE projects SET status='excluded' WHERE repo=?").bind(repo),env.DB.prepare('INSERT INTO audit(project_id,action,actor) VALUES(?,?,?)').bind(repo,'exclude-repository',actor)]);return json({ok:true});
 }
 if(url.pathname==='/api/admin/manual'){
  const path=b.path||'';if(!validPath(path))fail(400,'Invalid directory path');
  let repo=null,relationship='manual',snapshot={manual:true};
  if(b.repo){const r=await publicRepo(b.repo,env);repo=r.full_name.toLowerCase();relationship=repo.split('/')[0]===(env.GITHUB_USERNAME||'CSampebgo333').toLowerCase()?'owned':'contributed';snapshot={repo,url:r.html_url,path};if(path){await github(`/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(r.default_branch)}`,env)}}
  const id=repo?await identity(repo,path):'m_'+crypto.randomUUID();const content=validateContent(b.content);
  await env.DB.batch([env.DB.prepare("INSERT INTO projects(id,repo,path,relationship,snapshot,content,public_verified) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(id,repo,path,relationship,JSON.stringify(snapshot),JSON.stringify(content),repo?1:0),env.DB.prepare('INSERT INTO audit(project_id,action,actor) VALUES(?,?,?)').bind(id,'manual',actor)]);return json({id});
 }
 if(url.pathname==='/api/admin/decision'){
  if(!['save','approve','reject','reconsider'].includes(b.action)||typeof b.id!=='string')fail(400,'Invalid decision');
  const row=await env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(b.id).first();if(!row)fail(404,'Project not found');
  const content=b.content?JSON.stringify(validateContent(b.content)):row.content;
  let status=row.status,verified=row.public_verified;
  if(b.action==='approve'){
   if(!content)fail(400,'Both languages and evidence are required before approval');validateContent(JSON.parse(content));
   if(row.repo){const excluded=await env.DB.prepare('SELECT repo FROM exclusions WHERE repo=?').bind(row.repo).first();if(excluded||(env.EXCLUDED_REPOS||'').split(',').map(s=>s.trim().toLowerCase()).includes(row.repo))fail(400,'Remove repository exclusion first');await publicRepo(row.repo,env)}
   verified=1;status='approved';
  }
  if(b.action==='reject')status='rejected';if(b.action==='reconsider'){status='pending';verified=0}
  // Editing approved copy returns it to review. Feature changes are explicit approvals.
  if(b.action==='save'&&status==='approved')status='pending';
  const featured=typeof b.featured==='boolean'?Number(b.featured):row.featured;
  await env.DB.batch([env.DB.prepare('UPDATE projects SET content=?,status=?,public_verified=?,featured=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(content,status,verified,featured,b.id),env.DB.prepare('INSERT INTO audit(project_id,action,actor) VALUES(?,?,?)').bind(b.id,b.action,actor)]);return json({ok:true,status});
 }
 fail(404,'Not found');
}
export async function publishedSite(env){const {site}=await getContent(env);if(env.DB){const rows=(await env.DB.prepare("SELECT * FROM projects WHERE status='approved' AND public_verified=1").all()).results;for(const row of rows){try{if(row.repo)await publicRepo(row.repo,env);const p=publicRecord(row);if(p){site.projects.push({id:'github-'+p.id.replaceAll('_','-'),category:p.category,featured:p.featured,visible:true,order:1000,url:p.url,tags:[],en:p.en,fr:p.fr})}}catch{}}}for(const k of ['experiences','education','credentials','documents','socials','projects'])site[k]=site[k].filter(x=>x.visible!==false);for(const k of ['projects','experiences'])site[k]=site[k].map(x=>x.certificatesEnabled===true?x:{...x,certificates:[]});return site}
export default {
 async fetch(request,env){try{
  const url=new URL(request.url);let response;
  if(url.pathname==='/sitemap.xml'){const site=await publishedSite(env);const paths=['',...site.projects.map(p=>'projects/'+p.id+'/'),'privacy/'];return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['en','fr'].flatMap(l=>paths.map(p=>'<url><loc>'+url.origin+'/'+l+'/'+p+'</loc></url>')).join('')+'</urlset>',{headers:{'Content-Type':'application/xml','Cache-Control':'no-store'}})}
  if(url.pathname==='/assets/site-content.json')return json(await publishedSite(env));
  if(url.pathname.startsWith('/documents/')){const {site}=await getContent(env);if(!usesURL(site,url.pathname))return new Response('Not found',{status:404})}
  if(url.pathname==='/api/content'){if(request.method!=='GET')return json({error:'Method not allowed'},405);return json(await publishedSite(env))}
  if(url.pathname.startsWith('/media/'))return await publicMedia(request,env);
  if(url.pathname==='/api/projects'){
   if(request.method!=='GET')return json({error:'Method not allowed'},405);if(!env.DB)return json([]);
   const rows=(await env.DB.prepare("SELECT * FROM projects WHERE status='approved' AND public_verified=1").all()).results;const out=[];
   for(const row of rows){try{if(row.repo)await publicRepo(row.repo,env);const p=publicRecord(row);if(p)out.push(p)}catch{/* Never publish a repository that cannot be verified as public. */}}
   return json(out);
  }
  if(url.pathname.startsWith('/api/admin/')||/^\/admin(?:\/|\.|$)/.test(url.pathname)){
   const actor=await verifyAccess(request.headers.get('cf-access-jwt-assertion')||'',env);
   if(url.pathname.startsWith('/api/admin/'))return await admin(request,env,url,actor);
   response=await env.ASSETS.fetch(new Request(new URL('/admin.html',url),request));
  }else if(url.pathname.startsWith('/api/'))return json({error:'Not found'},404);
  else {response=await env.ASSETS.fetch(request);if(response.status===404&&/^\/(en|fr)\/projects\/[^/]+\/?$/.test(url.pathname)){const l=url.pathname.split('/')[1];response=await env.ASSETS.fetch(new Request(new URL('/'+l+'/',url),request))}if(response.headers.get('content-type')?.includes('text/html')&&/^\/(en|fr)\//.test(url.pathname))response=await renderLive(request,env,response,await publishedSite(env))}
  const headers=new Headers(response.headers);if(headers.get('content-type')?.includes('text/html'))headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if(/^\/admin(?:\/|\.|$)/.test(url.pathname)){headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow')}
  return new Response(response.body,{status:response.status,headers});
 }catch(err){return json({error:err.status?err.message:'Service temporarily unavailable'},err.status||503)}},
 async scheduled(event,env,ctx){ctx.waitUntil(discover(env).catch(err=>{console.error('Discovery failed:',err.message);throw err}))}
};
