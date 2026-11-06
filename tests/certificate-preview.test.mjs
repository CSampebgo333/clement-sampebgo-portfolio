import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCertificate,certificatePreview} from '../assets/certificate-preview.js';
test('certificate PDF creates both private uploads and returns their references together',async()=>{
 const pdf={name:'certificate.pdf'},image={name:'preview.png'},calls=[];
 const result=await prepareCertificate(pdf,{preview:async file=>{assert.equal(file,pdf);return image},upload:async(file,purpose)=>{calls.push([file,purpose]);return {url:purpose==='certificate'?'/media/document.pdf':'/media/preview.png'}}});
 assert.deepEqual(calls,[[pdf,'certificate'],[image,'project-image']]);
 assert.deepEqual(result,{document:'/media/document.pdf',preview:'/media/preview.png'});
});
test('invalid preview or failed uploads never return partially publishable references',async()=>{
 let calls=0;
 await assert.rejects(()=>prepareCertificate({}, {preview:async()=>{throw Error('invalid')},upload:async()=>{calls++}}));
 assert.equal(calls,0);
 await assert.rejects(()=>prepareCertificate({}, {preview:async()=>({}),upload:async()=>{if(++calls===2)throw Error('storage unavailable');return {url:'/media/new.pdf'}}}));
 assert.equal(calls,2);
});
test('empty, excessive and non-PDF bytes are rejected before loading the renderer',async()=>{
 for(const file of [{size:0},{size:9*1024*1024},new File(['not a PDF'],'fake.pdf',{type:'application/pdf'})])await assert.rejects(()=>certificatePreview(file));
});
