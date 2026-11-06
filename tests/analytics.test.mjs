import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {measurementAllowed,analyticsSnippet,analyticsQuery,getAnalytics,normalizeAnalytics} from '../worker/analytics.mjs';
import {analyticsReport} from '../assets/analytics-dashboard.js';
import {copyrightText,privacyCopy} from '../assets/public-notices.js';
import {renderMain} from '../assets/cms-render.js';
import initial from '../content/site.json' with {type:'json'};
const token='a'.repeat(32),account='b'.repeat(32);
const env={ANALYTICS_ENABLED:'true',WEB_ANALYTICS_TOKEN:token,SITE_ORIGIN:'https://portfolio.example',CF_ANALYTICS_ACCOUNT_ID:account,CF_ANALYTICS_API_TOKEN:'private-test-secret'};
function request(path='/en/',country='GH',headers={}){const request=new Request('https://portfolio.example'+path,{headers});Object.defineProperty(request,'cf',{value:{country}});return request}
test('measurement is limited to opted-in deployment public pages and allowed known geography',()=>{
 assert.equal(measurementAllowed(request(),env),true);
 for(const country of ['FR','DE','NO','GB','CH','','XX','T1'])assert.equal(measurementAllowed(request('/en/',country),env),false);
 for(const path of ['/','/admin','/admin.html','/api/content','/assets/style.css','/documents/a.pdf'])assert.equal(measurementAllowed(request(path),env),false);
 assert.equal(measurementAllowed(request('/en/','GH',{DNT:'1'}),env),false);
 assert.equal(measurementAllowed(request('/en/','GH',{'Sec-GPC':'1'}),env),false);
 assert.equal(measurementAllowed(request(),{...env,ANALYTICS_ENABLED:'false'}),false);
 assert.equal(measurementAllowed(request(),{...env,WEB_ANALYTICS_TOKEN:'<bad>'}),false);
 assert.equal(analyticsSnippet('<bad>'),'');assert.match(analyticsSnippet(token),/analytics-beacon/);
});
test('analytics query constrains hostname, time and public paths and independent totals',()=>{
 const range=analyticsQuery(account,'portfolio.example',7,new Date('2026-11-06T10:45:00Z'));
 assert.equal(range.from,'2026-10-30T10:00:00.000Z');assert.equal(range.to,'2026-11-06T10:00:00.000Z');
 assert.equal(range.variables.filter.requestHost,'portfolio.example');
 assert.equal(range.variables.filter.OR[0].requestPath_like,'/en/%');
 assert.match(range.query,/total:.*limit:1/);assert.match(range.query,/countries:.*limit:10/);
 assert.throws(()=>analyticsQuery(account,'x',365));
});
const responseData={total:[{count:20,sum:{visits:12}}],daily:[{count:20,sum:{visits:12},dimensions:{date:'2026-11-01'}}],countries:[{count:20,dimensions:{countryName:'GH'}}],sources:[{count:20,dimensions:{refererHost:''}}],pages:[{count:20,dimensions:{requestPath:'/en/'}}],devices:[{count:20,dimensions:{deviceType:'desktop'}}]};
test('read-only proxy never exposes secret or raw upstream errors and differentiates configuration and empty data',async()=>{
 const req=request('/api/admin/analytics?days=7');
 assert.equal((await getAnalytics(req,{})).configured,false);
 await assert.rejects(()=>getAnalytics(request('/api/admin/analytics?days=999'),env),error=>error.status===400);
 await assert.rejects(()=>getAnalytics(req,env,async()=>Response.json({errors:[{message:'private-test-secret'}]})),error=>error.message==='analytics_query_failed');
 await assert.rejects(()=>getAnalytics(req,env,async()=>new Response('',{status:403})),error=>error.message==='analytics_permissions');
 await assert.rejects(()=>getAnalytics(req,env,async()=>Response.json({data:{viewer:{accounts:[{}]}}})),error=>error.message==='analytics_response');
 const data=await getAnalytics(req,env,async(url,options)=>{assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');assert.equal(options.headers.Authorization,'Bearer private-test-secret');assert.equal(JSON.parse(options.body).variables.filter.requestHost,'portfolio.example');return Response.json({data:{viewer:{accounts:[responseData]}}})});
 assert.equal(data.views,20);assert.equal(data.visits,12);assert.ok(!JSON.stringify(data).includes('private-test-secret'));
 const empty=normalizeAnalytics(Object.fromEntries(Object.keys(responseData).map(key=>[key,[]])),{from:data.from,to:data.to});assert.equal(empty.views,0);
 const fr=analyticsReport(empty,'fr');assert.match(fr,/Aucune mesure/);assert.ok(!analyticsReport({configured:false},'en').includes('analytics-summary'));
 const malicious=structuredClone(data);malicious.sources[0].label='<img onerror=alert(1)>';
 assert.ok(analyticsReport(malicious,'en').includes('&lt;img'));
});
test('privacy and rights notices are bilingual and supersede obsolete no-analytics claim',()=>{
 for(const lang of ['fr','en']){
  const html=renderMain(initial,lang,'privacy/');assert.match(html,/Cloudflare Web Analytics/);assert.match(html,/data-analytics-optout/);
  assert.ok(!html.includes(lang==='fr'?'ni outil de suivi analytique':'no analytics tracker'));
  assert.match(copyrightText('Clément Sampebgo',lang),lang==='fr'?/Tous droits réservés/:/All rights reserved/);
 }
 assert.equal(privacyCopy('Custom privacy text','fr'),'Custom privacy text');
});
test('beacon honors browser preferences and loads no external script when blocked',()=>{
 const source=readFileSync(new URL('../assets/analytics-beacon.js',import.meta.url),'utf8');
 function run({optout=false,gpc=false,dnt=false,brokenStorage=false}={}){const loaded=[];vm.runInNewContext(source,{document:{currentScript:{dataset:{analyticsToken:token}},createElement:()=>({dataset:{}}),head:{append(script){loaded.push(script)}}},navigator:{globalPrivacyControl:gpc,doNotTrack:dnt?'1':'0'},window:{},localStorage:{getItem(){if(brokenStorage)throw Error();return optout?'1':null}}});return loaded}
 for(const options of [{optout:true},{gpc:true},{dnt:true},{brokenStorage:true}])assert.equal(run(options).length,0);
 const scripts=run();assert.equal(scripts.length,1);assert.equal(scripts[0].src,'https://static.cloudflareinsights.com/beacon.min.js');
});
