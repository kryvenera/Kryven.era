/* KRYVEN ERA upgrade layer — classic script, load AFTER app.js (defer order) */
(function(){'use strict';
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches,loaded={};
function S(){try{return state.settings||{}}catch(e){return {}}}
function font(n){if(!n||loaded[n])return;loaded[n]=1;var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(n).replace(/%20/g,'+')+':wght@400;500;600;700&display=swap';document.head.appendChild(l)}
/* Admin-controlled theme: settings.theme = {accent,bg,ink,surface,pista,fontHead,fontBody} arrives via live sync */
function theme(){var t=S().theme||{},r=document.documentElement.style,m={accent:'--gold',bg:'--paper',ink:'--ink',surface:'--card',pista:'--pista'};
 Object.keys(m).forEach(function(k){t[k]?r.setProperty(m[k],t[k]):r.removeProperty(m[k])});
 if(t.fontHead){font(t.fontHead);r.setProperty('--kf-head','"'+t.fontHead+'",serif')}else r.removeProperty('--kf-head');
 if(t.fontBody){font(t.fontBody);r.setProperty('--kf-body','"'+t.fontBody+'",sans-serif')}else r.removeProperty('--kf-body')}
function phone(){var s=document.querySelector('.tracking-search');
 if(s&&!document.getElementById('trackPhone')){var i=document.createElement('input');i.id='trackPhone';i.type='tel';i.inputMode='numeric';i.placeholder='Mobile number used at checkout';var b=s.querySelector('button');s.insertBefore(i,b)}
 var h=document.querySelector('.tracking-hero');
 if(h&&!h.querySelector('.ke-wa')&&S().whatsapp){var a=document.createElement('a');a.className='btn ke-wa';a.target='_blank';a.rel='noopener';a.href='https://wa.me/'+String(S().whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent('Hello Kryven Era, I need help with my order.');a.textContent='Help on WhatsApp';h.appendChild(a)}}
var io=('IntersectionObserver'in window)&&!RM?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('ke-in');io.unobserve(e.target)}})},{threshold:.12}):null;
function reveal(){document.querySelectorAll('.product-grid .card').forEach(function(c,i){c.style.setProperty('--i',i%8)});
 if(!io)return;document.querySelectorAll('.section,.trust-card,.cat,.product-section,.tracking-card').forEach(function(el){if(el.dataset.keSeen)return;el.dataset.keSeen=1;el.classList.add('ke-rv');io.observe(el)})}
function after(){theme();phone();reveal()}

/* 3D tilt (mouse devices only) */
if(!RM&&matchMedia('(hover:hover) and (pointer:fine)').matches){
 document.addEventListener('pointermove',function(e){var c=e.target.closest&&e.target.closest('.card');if(!c)return;var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  c.style.setProperty('--ry',((x-.5)*12).toFixed(2)+'deg');c.style.setProperty('--rx',((.5-y)*10).toFixed(2)+'deg');c.style.setProperty('--gx',(x*100).toFixed(0)+'%');c.style.setProperty('--gy',(y*100).toFixed(0)+'%');c.classList.add('ke-tilt')},{passive:true});
 document.addEventListener('pointerout',function(e){var c=e.target.closest&&e.target.closest('.card');if(c&&!c.contains(e.relatedTarget))c.classList.remove('ke-tilt')},true)}

/* Add-to-bag: product flips and arcs into the bag, ring burst + bounce */
var last=null;document.addEventListener('pointerdown',function(e){last=e.target},true);
function bag(){return document.querySelector('.nav-actions .icon-btn[title="Bag"]')}
function pop(){var b=bag();if(!b)return;b.classList.remove('ke-pop');void b.offsetWidth;b.classList.add('ke-pop');var r=document.createElement('span');r.className='ke-ring';b.appendChild(r);setTimeout(function(){r.remove()},750)}
function fly(){if(RM)return pop();var box=last&&last.closest&&(last.closest('.card')||last.closest('.product-layout')),img=box&&(box.querySelector('#productPageMain')||box.querySelector('img')),b=bag();
 if(!img||!b)return pop();var a=img.getBoundingClientRect(),t=b.getBoundingClientRect(),c=document.createElement('img');c.src=img.currentSrc||img.src;c.className='ke-fly';
 var w=Math.min(a.width,220),h=Math.min(a.height,260);c.style.cssText='left:'+(a.left+a.width/2-w/2)+'px;top:'+(a.top+a.height/2-h/2)+'px;width:'+w+'px;height:'+h+'px;border-radius:18px';
 document.documentElement.appendChild(c);var dx=t.left+t.width/2-(a.left+a.width/2),dy=t.top+t.height/2-(a.top+a.height/2);
 var an=c.animate([{transform:'translate(0,0) scale(1) rotateY(0)',opacity:1},{transform:'translate('+dx*.5+'px,'+(dy*.5-110)+'px) scale(.42) rotateY(180deg)',opacity:.95,offset:.55,borderRadius:'50%'},{transform:'translate('+dx+'px,'+dy+'px) scale(.04) rotateY(360deg)',opacity:0,borderRadius:'50%'}],{duration:850,easing:'cubic-bezier(.5,0,.2,1)'});
 an.onfinish=function(){c.remove();pop()}}

/* Hooks into app.js globals (safe: each guarded) */
var oa=window.addToBag;if(typeof oa==='function')window.addToBag=function(){try{fly()}catch(e){}return oa.apply(this,arguments)};
var or=window.render;if(typeof or==='function')window.render=function(){var r=or.apply(this,arguments);try{after()}catch(e){console.warn(e)}return r};
/* BUG FIX: original poll re-rendered the whole page every 10s (wiped typed input, restarted animations). Now only when the catalog really changed. */
var ol=window.loadLiveCatalog;if(typeof ol==='function')window.loadLiveCatalog=async function(){var before=__liveCatalogHash,ok=await ol.apply(this,arguments);return ok&&__liveCatalogHash!==before};
/* PRIVACY FIX: tracking no longer downloads every customer's order. Needs Order ID + the mobile number used at checkout. */
window.fetchCloudOrderById=async function(id){var d=String((document.getElementById('trackPhone')||{}).value||'').replace(/\D/g,'').slice(-10);if(d.length<10)return null;
 try{var rows=await supabaseRequest(SUPABASE_REST+'?select=*&'+encodeURIComponent('Customer number')+'=ilike.'+encodeURIComponent('*'+d));
  for(var i=0;i<(rows||[]).length;i++){var o=null;try{o=JSON.parse(rows[i]['Product name'])}catch(e){}if(o&&o.id===id){o.cloudRowId=rows[i].id;ensureOrderTracking(o);return o}}}catch(e){console.warn(e)}return null};
after();
})();
