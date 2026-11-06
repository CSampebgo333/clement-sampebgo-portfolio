import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/admin.js',import.meta.url),'utf8');
async function dashboard(){
 const nodes=new Map(),requests=[],focused=[];let validity=0;
 function element(){return {value:'',disabled:false,children:[],textContent:'',append(...xs){this.children.push(...xs)},replaceChildren(){this.children=[]},before(){},setAttribute(){},addEventListener(){},scrollIntoView(){},focus(){focused.push(this.id)},reportValidity(){validity++;return false},set id(value){this._id=value;nodes.set(value,this)},get id(){return this._id}}}
 const row={id:'repo-1',repo:'owner/project',status:'pending',relationship:'owned',content:null};
 const context=vm.createContext({console,localStorage:{getItem(){return 'fr'}},document:{documentElement:{},createElement:element,getElementById(id){if(!nodes.has(id)){const node=element();node.id=id}return nodes.get(id)},querySelectorAll(){return []}},fetch:async(url,options)=>{const body=options?.body?JSON.parse(options.body):null;requests.push({url,body});if(body?.action)row.status=body.action==='reject'?'rejected':body.action==='reconsider'?'pending':'approved';return {ok:true,json:async()=>body?{ok:true}:[structuredClone(row)]}}});
 vm.runInContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 vm.runInContext('edit(rows[0])',context);
 return {nodes,requests,focused,validity:()=>validity,row};
}
test('reject and reconsider need no evidence fields and do not focus the URL',async()=>{
 const app=await dashboard();app.focused.length=0;
 await app.nodes.get('reject').onclick({preventDefault(){}});
 assert.equal(app.row.status,'rejected');assert.equal(app.validity(),0);
 const decision=app.requests.find(request=>request.body?.action==='reject');
 assert.deepEqual(decision.body,{id:'repo-1',action:'reject'});
 assert.match(app.nodes.get('review-editor-status').textContent,/rejeté/);
 assert.ok(!app.focused.includes('url'));assert.equal(app.nodes.get('reject').disabled,true);
 await app.nodes.get('reconsider').onclick({preventDefault(){}});
 assert.equal(app.row.status,'pending');assert.equal(app.validity(),0);
 assert.ok(!app.focused.includes('url'));
});
test('approval still requires valid evidence and bilingual fields',async()=>{
 const app=await dashboard();await app.nodes.get('approve').onclick({preventDefault(){}});
 assert.equal(app.validity(),1);
 assert.ok(!app.requests.some(request=>request.body?.action==='approve'));
 assert.equal(app.row.status,'pending');
});
