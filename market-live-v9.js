(()=>{
'use strict';
const boot=()=>fetch(`./market-live-v8.js?fresh=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('market engine unavailable');return r.text()}).then(code=>Function(code)()).catch(err=>{console.error('[CryptoPool] market engine failed',err)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
