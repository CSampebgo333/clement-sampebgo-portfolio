// Measure actual chip rows rather than guessing a number of skills per device.
// Without JavaScript every skill remains readable.
export function setupSkillLists(){
 const fr=document.documentElement.lang==='fr';let disposed=false;
 const lists=[...document.querySelectorAll('.skill-chips')].map(list=>({list,button:list.parentElement.querySelector('[data-skill-toggle]'),expanded:false,width:0})).filter(x=>x.button);
 function measure(state){
  const {list,button}=state,items=[...list.children];
  items.forEach(item=>item.hidden=false);
  const tops=[];const rows=items.map(item=>{const top=item.getBoundingClientRect().top;let row=tops.findIndex(t=>Math.abs(t-top)<2);if(row<0){row=tops.length;tops.push(top)}return row});
  const overflow=tops.length>3;
  if(!overflow)state.expanded=false;
  items.forEach((item,i)=>item.hidden=!state.expanded&&rows[i]>=3);
  button.hidden=!overflow;button.setAttribute('aria-expanded',String(state.expanded));
  const text=state.expanded?(fr?'Voir moins':'Show less'):(fr?'Voir plus':'Show more');
  button.querySelector('span').textContent=text;
  button.setAttribute('aria-label',text+' · '+button.dataset.skillLabel);
 }
 const handlers=lists.map(state=>{const handler=()=>{state.expanded=!state.expanded;measure(state);document.dispatchEvent(new Event('portfolio-layout-changed'))};state.button.addEventListener('click',handler);measure(state);return handler});
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{for(const entry of entries){const state=lists.find(x=>x.list===entry.target);if(state&&Math.abs(state.width-entry.contentRect.width)>.5){state.width=entry.contentRect.width;measure(state)}}}):null;
 lists.forEach(state=>observer?.observe(state.list));
 const resize=()=>lists.forEach(measure);if(!observer)window.addEventListener('resize',resize);
 document.fonts?.ready.then(()=>{if(!disposed)resize()});
 return ()=>{disposed=true;observer?.disconnect();window.removeEventListener('resize',resize);lists.forEach((state,i)=>state.button.removeEventListener('click',handlers[i]))};
}
