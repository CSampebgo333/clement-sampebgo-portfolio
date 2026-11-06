export function setupPrivacyControls(){
 const button=document.querySelector('[data-analytics-optout]');if(!button||button.dataset.bound)return;button.dataset.bound='true';
 const fr=document.documentElement.lang==='fr',status=document.querySelector('[data-analytics-optout-status]');
 function update(){let off=false;try{off=localStorage.getItem('portfolio-analytics-optout')==='1'}catch{}
 button.setAttribute('aria-pressed',String(off));button.textContent=off?(fr?'Réactiver les statistiques sur ce navigateur':'Re-enable analytics in this browser'):(fr?'Désactiver les statistiques sur ce navigateur':'Disable analytics in this browser');return off}
 update();button.onclick=()=>{try{const off=update();if(off)localStorage.removeItem('portfolio-analytics-optout');else localStorage.setItem('portfolio-analytics-optout','1');update();if(off){status.textContent=fr?'Préférence enregistrée pour les prochaines pages. Les restrictions géographiques et du navigateur restent appliquées.':'Preference saved for future pages. Geographic and browser restrictions still apply.'}else{location.reload()}}catch{status.textContent=fr?'Le navigateur ne permet pas d’enregistrer ce choix. Vous pouvez utiliser Do Not Track ou Global Privacy Control.':'Your browser could not store this preference. You can use Do Not Track or Global Privacy Control.'}};
}
setupPrivacyControls();document.addEventListener('portfolio-content-updated',setupPrivacyControls);
