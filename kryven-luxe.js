/* KRYVEN ERA — luxe layer: site-wide background video (admin-controlled) + search-icon fallback. */
(()=>{'use strict';
const SB='https://iisezaptudifgwkjxnkh.supabase.co',KEY='sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(path==='admin.html')return;

// 1) Background video — plays behind every page. Source = Admin → Store editor → Website background video.
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData;
function applyVideo(s){
  const url=String(s?.backgroundVideo||'').trim(),on=s?.backgroundVideoEnabled===true&&!!url&&!reduce;
  let bg=document.querySelector('.lx-bg');
  if(!on){bg?.remove();document.body.classList.remove('lx-has-bg');return}
  if(bg&&bg.dataset.src===url)return;
  bg?.remove();
  bg=document.createElement('div');bg.className='lx-bg';bg.dataset.src=url;bg.setAttribute('aria-hidden','true');
  const v=document.createElement('video');v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('muted','');v.preload='auto';
  v.addEventListener('canplay',()=>{v.classList.add('on');v.play().catch(()=>{})},{once:true});
  v.src=url;bg.appendChild(v);
  const veil=document.createElement('div');veil.className='lx-bg-veil';bg.appendChild(veil);
  document.body.prepend(bg);document.body.classList.add('lx-has-bg');
}
function cached(){try{return JSON.parse(localStorage.getItem('kryven-era-state-v3')||'{}').settings||null}catch{return null}}
async function init(){
  applyVideo(cached());
  try{
    const r=await fetch(`${SB}/rest/v1/kryven_store_state?id=eq.1&select=state`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`},cache:'no-store'});
    const rows=await r.json();const s=rows?.[0]?.state?.settings;
    if(r.ok&&s)applyVideo(s);
  }catch{}
}
if(document.body)init();else document.addEventListener('DOMContentLoaded',init);

// 2) Search icon → bar (pages that don't load app.js, e.g. Offers).
if(!window.toggleHeaderSearch){
  window.toggleHeaderSearch=force=>{
    const hd=document.querySelector('.ke-store-header');if(!hd)return;
    const open=typeof force==='boolean'?force:!hd.classList.contains('ke-search-open');
    hd.classList.toggle('ke-search-open',open);
    const t=hd.querySelector('.ke-search-toggle');if(t){t.setAttribute('aria-expanded',String(open));t.setAttribute('aria-label',open?'Close search':'Open search')}
    if(open)setTimeout(()=>hd.querySelector('.ke-global-search input')?.focus(),60);
  };
  document.addEventListener('keydown',e=>{if(e.key==='Escape')window.toggleHeaderSearch(false)});
  document.addEventListener('click',e=>{const hd=document.querySelector('.ke-store-header.ke-search-open');if(hd&&!e.target.closest('.ke-global-search,.ke-search-toggle'))window.toggleHeaderSearch(false)});
}
})();
