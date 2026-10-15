/* KRYVEN ERA customer experience layer — Oct 2026
   Keeps the existing storefront and APIs intact. */
(() => {
  'use strict';
  const AUTH_PAGES = new Set(['index.html','shop.html','product.html','bag.html','checkout.html','payment.html','account.html','customer-details.html','tracking.html','wishlist.html','offers.html','membership.html','rewards.html','coupons.html','help-care.html','menu.html','categories.html','search.html']);
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = msg => { const t=document.getElementById('toast'); if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200);} };

  // Mandatory sign-in gate. Recognize either Supabase Auth or the storefront's existing signed-in account state.
  function hasCustomerAccount(){
    if(window.KEAuth?.isSignedIn?.()) return true;
    try{const st=JSON.parse(localStorage.getItem('kryven-era-state-v3')||'{}');const p=st.profile||{};return !!(st.account?.signedIn&&(p.name||p.email||p.phone||p.customerId));}catch{return false;}
  }
  function enforceSignIn() {
    if (!AUTH_PAGES.has(path)) return;
    const gate = () => {
      if (hasCustomerAccount()) return;
      if(!window.KEAuth){return;}
      window.KEAuth.open();
      const lock = () => {
        const overlay=document.getElementById('keAuthOverlay');
        if (!overlay) return;
        overlay.classList.add('show');
        const close=overlay.querySelector('.ke-auth-close');
        if(close) close.style.display='none';
        overlay.style.zIndex='999999';
        overlay.onclick=e=>{ if(e.target===overlay) e.stopPropagation(); };
        document.onkeydown=e=>{ if(e.key==='Escape'&&!hasCustomerAccount()) e.preventDefault(); };
      };
      lock(); setTimeout(lock,80); setTimeout(lock,350);
    };
    gate();
    window.addEventListener('ke:auth',e=>{ if(!e.detail?.session) gate(); });
  }

  // Add a usable in-page map picker to checkout, using OpenStreetMap tiles.
  function addCheckoutMap() {
    if (path!=='checkout.html' || !document.getElementById('checkoutApp') || document.getElementById('keMapPicker')) return;
    const pin=document.getElementById('coPin');
    if(!pin) return;
    const host=document.createElement('section');
    host.id='keMapPicker'; host.className='ke-map-card';
    host.innerHTML=`<div class="ke-map-heading"><div><small>DELIVERY LOCATION</small><h3>Pin your exact address</h3><p>Use your location or move the pin on the map. Confirm the pin before placing your order.</p></div><button type="button" id="keUseLocation" class="ke-map-button">Use my location</button></div><div id="keMap" role="application" aria-label="Choose delivery location on map"></div><div class="ke-map-footer"><span id="keMapStatus">Map loads when you open this section.</span><button type="button" id="keConfirmLocation" class="ke-map-button ke-map-confirm">Use this location</button></div>`;
    pin.closest('.field')?.insertAdjacentElement('afterend',host);
    function loadLeaflet(){const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.onload=initMap;document.head.appendChild(script);}
    if(window.keConsent&&!window.keConsent.allowed()){const m=document.getElementById('keMap');if(m)m.innerHTML='<div class="ke-3d-consent"><p>The map loads content from third-party servers (unpkg.com, OpenStreetMap). You can type your address instead.</p><button type="button" id="keMapAllow">Allow &amp; show map</button></div>';document.getElementById('keMapAllow')?.addEventListener('click',()=>{window.keConsent.set(true);loadLeaflet()});document.addEventListener('ke-consent',ev=>{if(ev.detail.optional&&!window.L)loadLeaflet()},{once:true})}else loadLeaflet();
    let map,marker,chosen=null;
    function status(t){const el=document.getElementById('keMapStatus');if(el)el.textContent=t;}
    async function reverse(lat,lon){
      status('Finding address…');
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,{headers:{'Accept-Language':'en'}});
        if(!r.ok)throw new Error('Address lookup unavailable');
        const d=await r.json(),a=d.address||{};
        const street=[a.house_number,a.road||a.pedestrian||a.residential].filter(Boolean).join(' ');
        const city=a.city||a.town||a.village||a.suburb||'';
        const state=a.state||'';
        const postcode=a.postcode||'';
        if(street)document.getElementById('coAddress').value=street;
        if(a.suburb||a.neighbourhood||a.road)document.getElementById('coLandmark').value=[a.suburb||a.neighbourhood,a.road].filter(Boolean).join(', ');
        if(city)document.getElementById('coCity').value=city;
        if(state)document.getElementById('coState').value=state;
        if(postcode)document.getElementById('coPin').value=postcode;
        ['coAddress','coLandmark','coCity','coState','coPin'].forEach(id=>document.getElementById(id)?.dispatchEvent(new Event('input',{bubbles:true})));
        status(`${lat.toFixed(5)}, ${lon.toFixed(5)} selected. Review your address fields.`);
      }catch(e){status(`${lat.toFixed(5)}, ${lon.toFixed(5)} selected. Enter/confirm the address manually.`);}
    }
    function choose(lat,lon){chosen={lat,lon};if(marker)marker.setLatLng([lat,lon]);status(`${lat.toFixed(5)}, ${lon.toFixed(5)} selected. Tap “Use this location” to fill the address.`);}
    function initMap(){
      if(!window.L||map)return;
      map=L.map('keMap').setView([20.5937,78.9629],5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
      marker=L.marker([20.5937,78.9629],{draggable:true}).addTo(map);
      marker.on('dragend',()=>{const p=marker.getLatLng();choose(p.lat,p.lng);});
      map.on('click',e=>choose(e.latlng.lat,e.latlng.lng));
      host.querySelector('#keMap').style.display='block';
      status('Tap the map or drag the pin to your delivery address.');
      setTimeout(()=>map.invalidateSize(),150);
    }
    document.getElementById('keUseLocation').addEventListener('click',()=>{
      if(!navigator.geolocation){status('Location is not supported by this browser. Move the pin manually.');return;}
      status('Requesting location permission…');
      navigator.geolocation.getCurrentPosition(pos=>{const {latitude:lat,longitude:lon}=pos.coords;if(!map)initMap();map.setView([lat,lon],16);choose(lat,lon);},()=>status('Location permission was unavailable. You can move the map pin manually.'),{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
    });
    document.getElementById('keConfirmLocation').addEventListener('click',()=>{if(!chosen){toast('Choose a location on the map first.');return;}reverse(chosen.lat,chosen.lon);});
  }

  function start(){
    if(path==='checkout.html')addCheckoutMap();
    enforceSignIn();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.addEventListener('ke:auth-ready',()=>{if(!window.KEAuth?.isSignedIn())enforceSignIn();});
})();
