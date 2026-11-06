import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const binding=source.slice(source.indexOf('function bindFilters(){'),source.indexOf('bindFilters();document.addEventListener'));
test('browser starts with featured projects, expands within that selection and allows all/category filters',()=>{
 const cards=Array.from({length:7},(_,index)=>({dataset:{featured:String(index!==0),category:index%2?'data':'software'},hidden:false,querySelector(){return {focus(){}}}}));
 const filters=['featured','all','data'].map(filter=>({dataset:{filter},setAttribute(){},addEventListener(event,fn){this.click=fn}}));
 const more={hidden:true,addEventListener(event,fn){this.click=fn}},empty={},status={};
 const grid={classList:{add(){}}};
 const document={querySelector(selector){return {'#project-grid':grid,'#view-more-projects':more,'#projects-empty':empty,'#filter-status':status}[selector]},querySelectorAll(selector){return selector==='[data-project]'?cards:filters},dispatchEvent(){}};
 vm.runInNewContext(binding+'\nbindFilters();',{document,fr:false,transitionProjects(grid,update){update()},matchMedia(){return {matches:true}},Event});
 assert.deepEqual(cards.map((card,index)=>!card.hidden?index:null).filter(index=>index!==null),[1,2,3,4]);
 assert.equal(more.hidden,false);more.click();assert.equal(cards.filter(card=>!card.hidden).length,6);
 filters[1].click();assert.equal(cards[0].hidden,false);assert.equal(cards.filter(card=>!card.hidden).length,4);
 filters[2].click();assert.deepEqual(cards.map((card,index)=>!card.hidden?index:null).filter(index=>index!==null),[1,3,5]);
});
