
/* KRYVEN ERA — FINAL PREMIUM MICRO-INTERACTIONS */
(function(){
  const addEntryShine=()=>{
    if(document.querySelector('.ke-entry-shine')) return;
    const el=document.createElement('div');
    el.className='ke-entry-shine';
    document.body.appendChild(el);
    document.body.classList.add('ke-enter-glow');
    setTimeout(()=>el.remove(),1250);
    setTimeout(()=>document.body.classList.remove('ke-enter-glow'),1100);
  };
  const setupSearch=()=>{
    const input=document.querySelector('#topSearch');
    if(!input || input.dataset.keSearchBound==='1') return;
    input.dataset.keSearchBound='1';
    const words=(window.__kryvenSearchWords||['oversized t-shirt','black hoodie','cargo pants','new arrivals','sneakers']).slice(0,8);
    let i=0,timer=null;
    const rotate=()=>{
      if(document.activeElement===input || input.value.trim()) return;
      input.style.transition='opacity .16s ease'; input.style.opacity='.35';
      setTimeout(()=>{if(document.activeElement!==input&&!input.value.trim()){input.placeholder='Search '+words[i%words.length]+'…';i++;} input.style.opacity='1';},160);
    };
    input.placeholder='Search products, brands…';
    timer=setInterval(rotate,2200);
    input.addEventListener('focus',()=>{if(timer)clearInterval(timer); if(typeof window.renderSearchOverlay==='function')window.renderSearchOverlay('');});
    input.addEventListener('blur',()=>{if(!input.value.trim()&&!timer)timer=setInterval(rotate,2200);});
    window.addEventListener('keydown',e=>{if(e.key==='Escape'){window.closeSearchOverlay?.();input.blur();}});
  };
  const addLogoFallback=()=>{
    document.querySelectorAll('img.logo-image,img.admin-logo-image,img.account-auth-logo').forEach(img=>{
      img.addEventListener('error',()=>{
        const fallback=img.classList.contains('logo-image')?'logo-primary.png':'logo-icon.png';
        if(img.getAttribute('src')!==fallback){img.src=fallback;}
      });
    });
  };
  const boot=()=>{addEntryShine();setupSearch();addLogoFallback();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
