// Progressive enhancement: content is visible before and without this module.
const revealed=new WeakSet();
const pathsDrawn=new WeakSet();
const running=new Set();
const gridAnimations=new WeakMap();
const easing='cubic-bezier(.22,.61,.36,1)';
function animate(element,frames,options){if(typeof element.animate!=='function')return null;const animation=element.animate(frames,{duration:360,easing,...options});running.add(animation);animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));return animation}
export function readingRatio(scroll,start,end){if(end<=start)return scroll>=start?1:0;return Math.max(0,Math.min(1,(scroll-start)/(end-start)))}
export function transitionProjects(grid,update,{reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??true}={}){if(!grid){update();return}for(const animation of gridAnimations.get(grid)||[])animation.cancel();const cards=Array.from(grid.querySelectorAll('[data-project]'));const before=new Map(cards.filter(card=>!card.hidden).map(card=>[card,card.getBoundingClientRect()]));update();if(reduced)return;const animations=[];for(const card of cards){if(card.hidden)continue;const old=before.get(card),now=card.getBoundingClientRect();let animation;if(old){const x=old.left-now.left,y=old.top-now.top;if(Math.abs(x)+Math.abs(y)>1)animation=animate(card,[{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:320})}else animation=animate(card,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:280});if(animation)animations.push(animation)}gridAnimations.set(grid,animations)}
export function setupEffects(){const main=document.querySelector('#main');if(!main)return ()=>{};const preference=matchMedia('(prefers-reduced-motion: reduce)');const observers=[];let frame=0,disposed=false;const header=document.querySelector('.topbar'),links=Array.from(document.querySelectorAll('#navlinks a'));const detail=/\/(projects|experiences)\//.test(location.pathname)?main.querySelector('.detail'):null;let progress=null;if(detail&&header){progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<span></span>';header.append(progress)}
 const caseLinks=Array.from(main.querySelectorAll('.case-index nav a[href^="#case-"]'));
 const chapters=caseLinks.map(link=>({link,section:document.getElementById(link.hash.slice(1))})).filter(x=>x.section);
 function updateCaseIndex(){
  if(!chapters.length)return;
  const threshold=(header?.getBoundingClientRect().height||0)+Math.min(120,innerHeight*.2);
  let active=chapters[0].section.getBoundingClientRect().top<innerHeight?chapters[0]:null;
  for(const chapter of chapters)if(chapter.section.getBoundingClientRect().top<=threshold)active=chapter;
  // The last chapter can be shorter than the viewport and unable to reach the threshold.
  const last=chapters.at(-1);if(active&&last.section.getBoundingClientRect().bottom<=innerHeight&&last.section.getBoundingClientRect().top<innerHeight)active=last;
  for(const chapter of chapters){if(chapter===active)chapter.link.setAttribute('aria-current','location');else chapter.link.removeAttribute('aria-current')}
 }
 const sections=Array.from(main.querySelectorAll('section[id]')).filter(section=>['work','experience','skills','about','credentials','contact'].includes(section.id));
 function update(){frame=0;if(disposed)return;updateCaseIndex();const top=(header?.getBoundingClientRect().height||0)+70;let current=/\/experiences\//.test(location.pathname)?'experience':/\/projects\//.test(location.pathname)?'work':null;for(const section of sections)if(section.getBoundingClientRect().top<=top)current=section.id==='skills'?'experience':section.id;if(sections.length&&scrollY+innerHeight>=document.documentElement.scrollHeight-3)current=sections.at(-1).id;for(const link of links){if(link.hash==='#'+current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')}if(progress){const box=detail.getBoundingClientRect(),start=box.top+scrollY-(header?.getBoundingClientRect().height||0),end=box.bottom+scrollY-innerHeight;progress.firstElementChild.style.transform=`scaleX(${readingRatio(scrollY,start,end)})`}}
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 function cancelMotion(){for(const animation of running)animation.cancel();running.clear()}
 function preferenceChanged(){if(preference.matches)cancelMotion();schedule()}
 function focusChanged(event){for(const animation of running){const target=animation.effect?.target;if(target?.contains(event.target))animation.cancel()}}
 if('IntersectionObserver' in globalThis){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const element=entry.target;observer.unobserve(element);if(!revealed.has(element)){revealed.add(element);element.dataset.revealed='true';if(!preference.matches&&!element.contains(document.activeElement))animate(element,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:440})}if(element.classList.contains('academic-journey')&&!pathsDrawn.has(element)){pathsDrawn.add(element);if(!preference.matches)element.classList.add('academic-path-drawn')}}},{threshold:.08});observers.push(observer);main.querySelectorAll('.section-head,.experience-story,.academic-journey,.timeline>article,.skill-group,.research-band,.credential-group').forEach(element=>observer.observe(element))}
 let resizeObserver;if('ResizeObserver' in globalThis){resizeObserver=new ResizeObserver(schedule);resizeObserver.observe(main)}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);document.addEventListener('portfolio-layout-changed',schedule);document.addEventListener('focusin',focusChanged);preference.addEventListener('change',preferenceChanged);update();
 return ()=>{disposed=true;if(frame)cancelAnimationFrame(frame);observers.forEach(observer=>observer.disconnect());resizeObserver?.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);document.removeEventListener('portfolio-layout-changed',schedule);document.removeEventListener('focusin',focusChanged);preference.removeEventListener('change',preferenceChanged);progress?.remove();cancelMotion()}
}
