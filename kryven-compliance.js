/* KRYVEN ERA - compliance layer: cookie/third-party consent, legal footer strip, accessibility helpers. */
(function(){
  'use strict';
  var L = window.KRYVEN_LEGAL || {};
  var KEY = 'kryven-era-consent-v1';

  /* ---------- consent ---------- */
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } }
  function write(v){ try{ localStorage.setItem(KEY, JSON.stringify({optional:!!v, ts:new Date().toISOString()})); }catch(e){} }
  var consent = window.keConsent = {
    decided: function(){ return read()!==null; },
    allowed: function(){ var c=read(); return !!(c&&c.optional); },
    set: function(v){ write(v); removeBanner(); document.dispatchEvent(new CustomEvent('ke-consent',{detail:{optional:!!v}})); },
    reopen: function(){ showBanner(true); }
  };

  function removeBanner(){ var b=document.getElementById('keCookieBanner'); if(b) b.remove(); }
  function showBanner(force){
    if(!force && consent.decided()) return;
    if(document.getElementById('keCookieBanner')) return;
    var b=document.createElement('div');
    b.id='keCookieBanner'; b.setAttribute('role','dialog'); b.setAttribute('aria-labelledby','keCookieTitle'); b.setAttribute('aria-describedby','keCookieText');
    b.innerHTML='<strong id="keCookieTitle">Cookies &amp; third-party content</strong>'+
      '<p id="keCookieText">We always use essential storage to run your bag, account and checkout. Optional third-party content (3D product viewer, delivery map) loads only with your consent. We do not use advertising trackers. <a href="cookie-policy.html">Cookie Policy</a></p>'+
      '<div class="ke-cookie-actions"><button type="button" id="keCookieReject">Reject optional</button><button type="button" id="keCookieAccept" class="primary">Accept all</button></div>';
    document.body.appendChild(b);
    document.getElementById('keCookieReject').onclick=function(){ consent.set(false); };
    document.getElementById('keCookieAccept').onclick=function(){ consent.set(true); };
    document.getElementById('keCookieAccept').focus({preventScroll:true});
  }

  /* ---------- legal footer strip ---------- */
  function legalStrip(){
    var d=document.createElement('div'); d.className='ke-legal-strip'; d.setAttribute('data-ke-legal','1');
    var links='<nav aria-label="Legal"><a href="privacy-policy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a><a href="cookie-policy.html">Cookie Policy</a><a href="refund-policy.html">Refund Policy</a><button type="button" class="ke-linkbtn" onclick="keConsent.reopen()">Cookie settings</button></nav>';
    var parts=[];
    if(L.legalName) parts.push(esc(L.legalName)); else parts.push(esc(L.brand||'KRYVEN ERA'));
    if(L.address) parts.push(esc(L.address));
    if(L.gstin) parts.push('GSTIN '+esc(L.gstin));
    if(L.email) parts.push('<a href="mailto:'+esc(L.email)+'">'+esc(L.email)+'</a>');
    if(L.phone) parts.push(esc(L.phone));
    parts.push('DPDP Act, 2023 aligned');
    d.innerHTML=links+'<p class="ke-legal-biz">'+parts.join(' · ')+'</p>';
    return d;
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }

  function ensureFooterStrip(){
    var foot=document.querySelector('footer');
    if(foot){ if(!foot.querySelector('[data-ke-legal]')) foot.appendChild(legalStrip()); return; }
    var main=document.querySelector('main');
    if(main && !document.querySelector('[data-ke-legal]')){
      var f=document.createElement('footer'); f.className='ke-standalone-footer'; f.appendChild(legalStrip()); main.insertAdjacentElement('afterend',f);
    }
  }

  /* ---------- fill [data-legal] placeholders in policy pages ---------- */
  function fillLegal(){
    document.querySelectorAll('[data-legal]').forEach(function(el){
      var k=el.getAttribute('data-legal'), v=L[k];
      if(v===undefined||v===null||v===''){ var row=el.closest('[data-legal-row]'); if(row) row.hidden=true; else el.hidden=true; return; }
      if(k==='email'){ el.innerHTML='<a href="mailto:'+esc(v)+'">'+esc(v)+'</a>'; } else el.textContent=v;
    });
    var wa=document.querySelector('[data-legal-wa]'); if(wa&&L.whatsapp) wa.href='https://wa.me/91'+String(L.whatsapp).replace(/\D/g,'').slice(-10);
  }

  /* ---------- accessibility helpers ---------- */
  var ICON_LABELS={'×':'Close','✕':'Close','−':'Decrease quantity','+':'Increase quantity','♡':'Add to wishlist','♥':'Remove from wishlist','‹':'Previous','›':'Next','⌕':'Search'};
  function a11y(root){
    root=root||document;
    // icon-only buttons need a name
    root.querySelectorAll('button:not([aria-label])').forEach(function(b){
      var t=(b.textContent||'').trim();
      if(ICON_LABELS[t]) b.setAttribute('aria-label',ICON_LABELS[t]);
      else if(!t && !b.querySelector('img[alt]:not([alt=""])') && b.title) b.setAttribute('aria-label',b.title);
    });
    // clickable cards must be reachable with the keyboard
    root.querySelectorAll('article.card[onclick], .card[onclick]').forEach(function(c){
      if(c.hasAttribute('tabindex')) return;
      c.setAttribute('tabindex','0'); c.setAttribute('role','link');
      var h=c.querySelector('h3'); if(h) c.setAttribute('aria-label',h.textContent.trim());
    });
    // link every label to its input
    root.querySelectorAll('.field, .checkout-field, .account-consent').forEach(function(w){
      var lab=w.querySelector('label'), inp=w.querySelector('input,textarea,select');
      if(!lab||!inp||lab.htmlFor||lab.contains(inp)) return;
      if(!inp.id) inp.id='ke-f-'+Math.random().toString(36).slice(2,8);
      lab.htmlFor=inp.id;
    });
    // inputs with only a placeholder get an aria-label
    root.querySelectorAll('input[placeholder]:not([aria-label]):not([id^="ke-f-"])').forEach(function(i){
      if(i.id && document.querySelector('label[for="'+i.id+'"]')) return;
      if(i.closest('label')) return;
      i.setAttribute('aria-label', i.getAttribute('placeholder'));
    });
    // every image needs an alt attribute
    root.querySelectorAll('img:not([alt])').forEach(function(img){
      var card=img.closest('.bag-line,.bag-item,.card,.review,.review-card');
      var n=card&&card.querySelector('h3,b'); img.setAttribute('alt', n? n.textContent.trim() : '');
    });
    root.querySelectorAll('.toast,#toast').forEach(function(t){ if(!t.hasAttribute('aria-live')) t.setAttribute('aria-live','polite'); });
  }
  document.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ') && e.target && e.target.matches && e.target.matches('.card[role="link"]')){ e.preventDefault(); e.target.click(); }
    if(e.key==='Escape'){ var d=document.querySelector('.drawer.open .drawer-close, .modal.open .drawer-close'); if(d) d.click(); }
  });
  function skipLink(){
    if(document.getElementById('keSkip')) return;
    var a=document.createElement('a'); a.id='keSkip'; a.href='#keMain'; a.textContent='Skip to main content'; a.className='ke-skip';
    document.body.insertBefore(a,document.body.firstChild);
    a.addEventListener('click',function(){ var m=document.querySelector('main'); if(m){ if(!m.id) m.id='keMain'; m.setAttribute('tabindex','-1'); m.focus(); } });
  }

  /* ---------- checkout data notice (DPDP: notice at point of collection) ---------- */
  function checkoutNotice(){
    var host=document.getElementById('checkoutApp'); if(!host||host.querySelector('.ke-collect-note')) return;
    var btn=host.querySelector('.btn.primary, button.primary'); var anchor=host.querySelector('.checkout-secure-note')||btn; if(!anchor) return;
    var p=document.createElement('p'); p.className='ke-collect-note';
    p.innerHTML='We collect only what is needed to deliver and support your order. See our <a href="privacy-policy.html">Privacy Policy</a> and <a href="refund-policy.html">Refund Policy</a>.';
    anchor.insertAdjacentElement('beforebegin',p);
  }

  var pending=false;
  function tick(){ if(pending) return; pending=true; requestAnimationFrame(function(){ pending=false; ensureFooterStrip(); fillLegal(); a11y(document); checkoutNotice(); }); }
  function init(){
    document.documentElement.lang=document.documentElement.lang||'en';
    skipLink(); showBanner(false); tick();
    new MutationObserver(tick).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
