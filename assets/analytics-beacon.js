// Public-page measurement only. No persistent visitor identifier is created here.
(()=>{
 const token=document.currentScript?.dataset.analyticsToken;
 if(!/^[a-f0-9]{32}$/i.test(token||''))return;
 try{if(localStorage.getItem('portfolio-analytics-optout')==='1')return}catch{return}
 if(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
 const script=document.createElement('script');script.defer=true;
 script.src='https://static.cloudflareinsights.com/beacon.min.js';
 script.dataset.cfBeacon=JSON.stringify({token});document.head.append(script);
})();
