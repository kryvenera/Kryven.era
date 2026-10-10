// KRYVEN ERA COMMAND CENTER
// IMPORTANT: Supabase table name + column contract is intentionally unchanged.
const SUPABASE_URL = 'https://iisezaptudifgwkjxnkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
const SUPABASE_TABLE = 'Allow public order insert';
const SUPABASE_REST = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`;
const KEY = 'kryven-era-state-v3';
// Cloudinary unsigned image upload
const CLOUDINARY_CLOUD_NAME = 'w4lo5vi9';
const CLOUDINARY_UPLOAD_PRESET = 'kryven_product';

async function uploadToCloudinary(file){
  if(!file) throw new Error('No image selected');
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {method:'POST',body:form});
  const data = await res.json().catch(()=>null);
  if(!res.ok) throw new Error(data?.error?.message || `Cloudinary upload failed (${res.status})`);
  if(!data?.secure_url) throw new Error('Cloudinary did not return an image URL');
  return data.secure_url;
}

window.uploadProductImages = async (input)=>{
  const files = Array.from(input?.files || []);
  if(!files.length) return;
  const textarea = document.getElementById('pImages');
  const status = document.getElementById('cloudinaryUploadStatus');
  if(!textarea) return;
  if(status) status.textContent = `Uploading ${files.length} image${files.length===1?'':'s'}…`;
  const urls = textarea.value.split('\n').map(x=>x.trim()).filter(Boolean);
  try{
    for(let i=0;i<files.length;i++){
      if(status) status.textContent = `Uploading ${i+1}/${files.length}…`;
      const url = await uploadToCloudinary(files[i]);
      urls.push(url);
      textarea.value = urls.join('\n');
    }
    if(status) status.textContent = `${files.length} image${files.length===1?'':'s'} uploaded ✓`;
    toast('Images uploaded to Cloudinary');
  }catch(e){
    if(status) status.textContent = `Upload failed: ${e.message||'error'}`;
    toast(`Cloudinary upload failed: ${e.message||'error'}`);
  }finally{ if(input) input.value = ''; }
};


const IMG = {
  tshirt:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85',
  hoodie:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85',
  pants:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85',
  jacket:'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85',
  cap:'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=85'
};
const STATUS_FLOW = ['Placed','Processing','Shipped','Out for Delivery','Delivered'];
const STATUS_COPY = {Placed:'Order received',Processing:'Preparing order',Shipped:'In transit','Out for Delivery':'Courier is delivering today',Delivered:'Delivered',Cancelled:'Order cancelled'};

const fallback = {
  settings:{brand:'KRYVEN ERA',tagline:'THE ERA OF UNCOMPROMISING STYLE',heroTitle:'WEAR YOUR ERA',heroText:'Premium streetwear engineered for presence.',heroVideo:'kryven-era-hero-temp.mp4',heroVideoSeeded:true,adminLogo:'logo-icon.png',backgroundVideo:'kryven-era-hero-temp.mp4',backgroundVideoEnabled:true,cashfreeQrImage:'',paymentVerifyEndpoint:'/api/upi/verify',whatsapp:'7036421785',upi:'kryvenera@upi',currency:'₹',shipping:0,payments:{cod:true,upi:false,card:false,bank:false,codAdvancePercent:20,paymentSettingsVersion:3},supportText:'Mon–Sat · 10 AM–7 PM',searchSuggestions:['oversized t-shirt','black hoodie','cargo pants','kryven era']},
  products:[
    {id:'KE001',name:'Kryven Era Logo Tee',category:'T-Shirts',price:1299,mrp:1999,discount:'35% OFF',rating:4.8,reviews:124,barcode:'890100000001',images:[IMG.tshirt],sizes:{S:true,M:true,L:true,XL:true,XXL:false},colors:['Black','White','Silver'],description:'Oversized premium-cotton tee.',features:['Premium cotton','Oversized fit'],stock:18},
    {id:'KE002',name:'Kryven Signature Hoodie',category:'Hoodies',price:2499,mrp:3199,discount:'22% OFF',rating:4.7,reviews:88,barcode:'890100000002',images:[IMG.hoodie],sizes:{S:true,M:true,L:true,XL:false,XXL:true},colors:['Black'],description:'Premium fleece hoodie.',features:['480 GSM fleece','Drop shoulder'],stock:9},
    {id:'KE003',name:'Kryven Era Cargo Pants',category:'Pants',price:1999,mrp:2599,discount:'23% OFF',rating:4.6,reviews:67,barcode:'890100000003',images:[IMG.pants],sizes:{S:false,M:true,L:true,XL:true,XXL:true},colors:['Black'],description:'Tapered cargo pants.',features:['Utility pockets','Stretch comfort'],stock:14},
    {id:'KE004',name:'Kryven Windcheater Jacket',category:'Jackets',price:2799,mrp:4299,discount:'35% OFF',rating:4.5,reviews:49,barcode:'890100000004',images:[IMG.jacket],sizes:{S:true,M:true,L:true,XL:true,XXL:true},colors:['Black','Silver'],description:'Lightweight shell jacket.',features:['Reflective trims','Water resistant'],stock:22},
    {id:'KE005',name:'Kryven Era Cap',category:'Accessories',price:999,mrp:1299,discount:'23% OFF',rating:4.4,reviews:31,barcode:'890100000005',images:[IMG.cap],sizes:{S:true,M:true,L:false,XL:false,XXL:false},colors:['Black','Gold'],description:'Structured 6-panel cap.',features:['Cotton twill','Embroidered mark'],stock:30}
  ],
  cart:[],wishlist:[],profile:{},orders:[],searches:{},reviews:[]
};

const CATEGORY_DEFAULTS = ['T-Shirts','Hoodies','Pants','Jackets','Accessories'];
const OFFER_DEFAULTS = {
  grandOpening:{enabled:true,title:'GRAND OPENING',subtitle:'LIMITED-TIME OFFERS ARE LIVE',note:'Shop the launch offers before they end.'},
  percent50:{enabled:true,label:'50% OFF',subtitle:'FLAT 50% OFF',note:'Apply to selected products from the Products editor.',defaultPercent:50},
  bogo:{enabled:true,label:'BUY 1 GET 1 FREE',subtitle:'BUY 1 GET 1 FREE',note:'Same product: add 2 to bag and 1 is free.'}
};
function ensureMerchandisingSettings(s){
  s=s||{};
  s.categories=Array.isArray(s.categories)&&s.categories.length
    ? s.categories.map(x=>typeof x==='string'?{name:x,enabled:true}:Object.assign({name:'Untitled',enabled:true},x)).filter(x=>x.name)
    : CATEGORY_DEFAULTS.map(name=>({name,enabled:true}));
  s.offers=Object.assign({},structuredClone(OFFER_DEFAULTS),s.offers||{});
  s.offers.grandOpening=Object.assign({},OFFER_DEFAULTS.grandOpening,s.offers.grandOpening||{});
  s.offers.percent50=Object.assign({},OFFER_DEFAULTS.percent50,s.offers.percent50||{});
  s.offers.bogo=Object.assign({},OFFER_DEFAULTS.bogo,s.offers.bogo||{});
  s.membership=Object.assign({enabled:true,price:69,durationDays:90,memberPricingEnabled:true,memberPricePercent:60,bundleEnabled:true,tshirtPositionPercents:[60,40,20,0,70],eligibleProductIds:[],productMemberPrices:{}},s.membership||{});
  if(!Array.isArray(s.membership.tshirtPositionPercents)||s.membership.tshirtPositionPercents.length!==5)s.membership.tshirtPositionPercents=[60,40,20,0,70];
  s.membership.productMemberPrices=Object.assign({},s.membership.productMemberPrices||{});
  s.rewards=Object.assign({},s.rewards||{});
  s.rewards.wheel=Object.assign({enabled:true,campaignKey:'era-wheel-2026',couponValidityDays:14,prizes:[
    {id:'off25',type:'discount',percent:25,label:'25% OFF',weight:30,productIds:[]},
    {id:'off30',type:'discount',percent:30,label:'30% OFF',weight:25,productIds:[]},
    {id:'off35',type:'discount',percent:35,label:'35% OFF',weight:20,productIds:[]},
    {id:'off40',type:'discount',percent:40,label:'40% OFF',weight:15,productIds:[]},
    {id:'off50',type:'discount',percent:50,label:'50% OFF',weight:9.5,productIds:[]},
    {id:'eraPass',type:'membership',label:'ERA PASS',weight:0.5,productIds:[]}
  ]},s.rewards.wheel||{});
  s.rewards.wheel.prizes=Array.isArray(s.rewards.wheel.prizes)?s.rewards.wheel.prizes:[];
  s.creatorCoupons=Array.isArray(s.creatorCoupons)?s.creatorCoupons:[];
  s.limitedDrops=Object.assign({enabled:true,title:'LIMITED ERA DROP',giftText:'Exclusive KRYVEN ERA collectible',productIds:[]},s.limitedDrops||{});
  s.nextOrderOffer=Object.assign({enabled:true,percent:30,validityDays:14,productIds:[],minCartValue:0,maxDiscount:0,requireDelivered:true},s.nextOrderOffer||{});
  return s;
}

function supabaseHeaders(extra={}){return Object.assign({'apikey':SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${SUPABASE_PUBLISHABLE_KEY}`,'Content-Type':'application/json'},extra)}
async function supabaseRequest(url=SUPABASE_REST,options={}){
  const res=await fetch(url,{...options,headers:supabaseHeaders(options.headers||{})});
  const text=await res.text(); let data=null; try{data=text?JSON.parse(text):null}catch{}
  if(!res.ok)throw new Error(data?.message||data?.error_description||text||`HTTP ${res.status}`);
  return data;
}
function load(){
  let data;
  try{data=JSON.parse(localStorage.getItem(KEY))||structuredClone(fallback)}catch{data=structuredClone(fallback)}
  // Admin PIN is verified server-side (ADMIN_PIN env var); never keep it in browser storage.
  if(data.settings&&'adminPin' in data.settings){delete data.settings.adminPin;try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
  return data;
}
let state=load(); state.settings=ensureMerchandisingSettings(state.settings); let active='dashboard'; let selectedOrder=null; let editingCreatorCouponIndex=null;
let __cloudSaveTimer=null;
const LIVE_STATE_REST = `${SUPABASE_URL}/rest/v1/kryven_store_state`;
function cloudPayload(){
  const settings=structuredClone(state.settings||{});
  // Keep the Admin PIN local. The public catalog row is readable by the storefront.
  delete settings.adminPin;
  return {settings,products:structuredClone(state.products||[]),reviews:structuredClone(state.reviews||[]),searches:structuredClone(state.searches||{}),heroSlides:structuredClone(state.heroSlides||[])};
}
async function saveCloudNow(){
  try{
    const body={id:1,state:cloudPayload(),updated_at:new Date().toISOString()};
    const res=await fetch(LIVE_STATE_REST,{method:'POST',headers:supabaseHeaders({'Prefer':'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(body)});
    if(!res.ok){const t=await res.text();throw new Error(t||`HTTP ${res.status}`)}
    return true;
  }catch(e){console.warn('KRYVEN cloud save failed',e);toast('Cloud sync failed — check the Supabase live-sync table/policies');return false}
}
function queueCloudSave(){clearTimeout(__cloudSaveTimer);__cloudSaveTimer=setTimeout(saveCloudNow,350)}
function save(){localStorage.setItem(KEY,JSON.stringify(state));queueCloudSave();toast('Saved — syncing live website')}
async function verifyCloudPin(pin){return false}
async function loadCloudAdminState(){
  try{
    const res=await fetch(`${LIVE_STATE_REST}?id=eq.1&select=state,updated_at`,{method:'GET',headers:supabaseHeaders()});
    if(!res.ok)return false;
    const rows=await res.json(); const cloud=rows?.[0]?.state;
    if(cloud&&Array.isArray(cloud.products)){
      state.settings=ensureMerchandisingSettings(Object.assign({},state.settings,cloud.settings||{}));
      state.products=cloud.products;
      state.reviews=Array.isArray(cloud.reviews)?cloud.reviews:state.reviews;
      state.searches=cloud.searches||state.searches;
      state.heroSlides=Array.isArray(cloud.heroSlides)?cloud.heroSlides:state.heroSlides;
      localStorage.setItem(KEY,JSON.stringify(state));
    }
    return true;
  }catch(e){console.warn('KRYVEN cloud catalog load failed',e);return false}
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(n){return `${state.settings?.currency||'₹'}${Number(n||0).toLocaleString('en-IN')}`}
function toast(t){const el=document.getElementById('toast');if(!el)return;el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function fmtDate(v){try{return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return '—'}}
function fmtDay(v){try{return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v))}catch{return '—'}}
function addDaysISO(base,days){const d=new Date(base||Date.now());d.setDate(d.getDate()+days);return d.toISOString()}
function statusClass(s){return String(s||'Placed').toLowerCase().replace(/\s+/g,'-')}
function ensureOrderTracking(o){
  if(!o)return o;
  o.status=o.status||'Placed';
  o.createdAt=o.createdAt||new Date().toISOString();
  o.expectedDeliveryDate=o.expectedDeliveryDate||addDaysISO(o.createdAt,5);
  o.deliveryWindow=o.deliveryWindow||'10 AM – 9 PM';
  o.trackingNumber=o.trackingNumber||'';
  o.courier=o.courier||'';
  o.customerNote=o.customerNote||'';
  o.lastUpdatedAt=o.lastUpdatedAt||o.createdAt;
  o.timeline=Array.isArray(o.timeline)?o.timeline:[];
  if(!o.timeline.some(x=>x.status==='Placed'))o.timeline.unshift({status:'Placed',at:o.createdAt,note:'Order received'});
  return o;
}
function syncTimeline(o,status,note=''){
  ensureOrderTracking(o); o.status=status; o.lastUpdatedAt=new Date().toISOString();
  if(status==='Shipped'&&!o.shippedAt)o.shippedAt=o.lastUpdatedAt;
  if(status==='Out for Delivery'&&!o.outForDeliveryAt)o.outForDeliveryAt=o.lastUpdatedAt;
  if(status==='Delivered'&&!o.deliveredAt)o.deliveredAt=o.lastUpdatedAt;
  if(status==='Cancelled'&&!o.cancelledAt)o.cancelledAt=o.lastUpdatedAt;
  const item={status,at:o.lastUpdatedAt,note:note||STATUS_COPY[status]||status};
  const ix=o.timeline.findIndex(x=>x.status===status); if(ix>=0)o.timeline[ix]=item; else o.timeline.push(item);
}
state.orders=(state.orders||[]).map(ensureOrderTracking);
state.settings=state.settings||fallback.settings;
const savedPayments=state.settings.payments||{};
if(savedPayments.paymentSettingsVersion!==3){
  savedPayments.cod=false;
  savedPayments.upi=false;
  savedPayments.card=false;
  savedPayments.bank=false;
  savedPayments.codAdvancePercent=20;
  savedPayments.paymentSettingsVersion=3;
}
state.settings.payments=Object.assign(fallback.settings.payments,savedPayments);
state.products=Array.isArray(state.products)&&state.products.length?state.products:fallback.products;

async function loadCloudOrders(){
  try{
    const data=await supabaseRequest(`${SUPABASE_REST}?select=*&order=id.desc`);
    const cloudOrders=(data||[]).map(row=>{
      let o=null; try{o=JSON.parse(row['Product name'])}catch{}
      if(!o)o={id:`KE-${new Date().getFullYear()}-${row.id}`,createdAt:new Date(Number(row.id)||Date.now()).toISOString()};
      o.cloudRowId=row.id;
      o.customer=o.customer||{};
      o.customer.name=o.customer.name||row['Customer name']||'';
      o.customer.phone=o.customer.phone||row['Customer number']||'';
      o.customer.address=o.customer.address||row['Customer address']||'';
      if(o.total==null)o.total=Number(row['Product price']||0);
      ensureOrderTracking(o); return o;
    });
    const localById=new Map((state.orders||[]).map(o=>[o.id,o]));
    for(const o of cloudOrders){
      const prev=localById.get(o.id);
      const oVerified=o.paymentVerified===true && String(o.paymentStatus||'').toUpperCase()==='SUCCESS';
      const pVerified=prev?.paymentVerified===true && String(prev?.paymentStatus||'').toUpperCase()==='SUCCESS';
      if(!prev || (oVerified && !pVerified) || (!pVerified && new Date(o.createdAt||0)>=new Date(prev.createdAt||0))) localById.set(o.id,o);
    }
    state.orders=[...localById.values()].map(ensureOrderTracking).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    localStorage.setItem(KEY,JSON.stringify(state));
  }catch(e){console.warn('Supabase order load failed:',e); if(isAuthed())toast('Cloud orders unavailable')}
}
function watchCloudOrders(){setInterval(()=>loadCloudOrders().then(()=>{if(isAuthed()&&(active==='orders'||active==='dashboard'))renderBody()}),5000)}
async function updateCloudOrder(o){
  if(!o.cloudRowId)return true;
  const row={id:Number(o.cloudRowId),'Customer name':o.customer?.name||'','Customer address':`${o.customer?.houseNumber?o.customer.houseNumber+', ':''}${o.customer?.address||''}${o.customer?.landmark?', '+o.customer.landmark:''}, ${o.customer?.city||''}, ${o.customer?.state||''}, ${o.customer?.pincode||''}`,'Product name':JSON.stringify(o),'Customer number':o.customer?.phone||'','Product price':String(o.total??0),'Product size':(o.items||[]).map(x=>`${x.name||x.id||''} x${x.qty||1} ${x.size||''}`).join(' | ')};
  try{await supabaseRequest(`${SUPABASE_REST}?id=eq.${encodeURIComponent(o.cloudRowId)}`,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify(row)});return true}catch(e){toast(`Cloud update failed: ${e.message||'error'}`);return false}
}
async function deleteCloudOrder(o){if(!o?.cloudRowId)return true;try{await supabaseRequest(`${SUPABASE_REST}?id=eq.${encodeURIComponent(o.cloudRowId)}`,{method:'DELETE'});return true}catch(e){toast(`Cloud delete failed: ${e.message||'error'}`);return false}}

function app(){document.getElementById('adminApp').innerHTML=`<div class="admin-shell"><div class="admin-top"><div class="container admin-nav"><div class="logo premium-admin-logo"><img class="admin-logo-image admin-primary-logo" src="logo-primary.png" alt="KRYVEN ERA" onerror="this.style.display='none'"><span class="logo-text">COMMAND CENTER<small>/ KRYVEN ERA</small></span></div><div class="admin-actions"><span class="admin-live"><i></i> LIVE ORDERS</span><a class="btn ghost" href="index.html">VIEW STORE</a><button class="btn" onclick="exportData()">EXPORT</button></div></div></div><div id="adminBody" class="container"></div></div>`;renderBody()}
function isAuthed(){return sessionStorage.getItem('ke-admin-auth')==='1'}
function login(){document.getElementById('adminBody').innerHTML=`<div class="locked"><div class="locked-card premium-login"><div class="login-mark"><img src="${esc(state.settings.adminLogo||'logo-icon.png')}" alt="Admin logo" onerror="this.style.display='none'"></div><div class="eyebrow">KRYVEN ERA / PRIVATE ACCESS</div><h2>Command Center</h2><p class="muted">Owner access only. Manage customers, orders and delivery from here.</p><div class="field"><label>ADMIN PIN</label><div style="display:flex;gap:8px"><input id="pin" type="password" inputmode="text" placeholder="Enter PIN" onkeydown="if(event.key==='Enter')auth()" style="flex:1"><button class="btn" type="button" onclick="toggleLoginPin(this)">SHOW</button></div></div><button class="btn primary" style="width:100%;margin-top:12px" onclick="auth()">UNLOCK PANEL →</button></div></div>`}
window.toggleLoginPin=(btn)=>{const el=document.getElementById('pin');if(!el)return;el.type=el.type==='password'?'text':'password';btn.textContent=el.type==='password'?'SHOW':'HIDE'}
window.auth=async()=>{const entered=String(document.getElementById('pin')?.value||'').trim();if(!entered){toast('Enter your Admin PIN');return}
  try{const r=await fetch('/api/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:entered})});const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok){toast(d.error||'Incorrect admin PIN');return}
    sessionStorage.setItem('ke-admin-token',d.token||'');await loadCloudAdminState();sessionStorage.setItem('ke-admin-auth','1');renderBody();
  }catch(e){toast('Could not reach the server — try again')}}
function renderBody(){
  if(!isAuthed()){login();return}
  const delivered=(state.orders||[]).filter(o=>o.status==='Delivered').length;
  document.getElementById('adminBody').innerHTML=`<div class="admin-layout"><aside class="side premium-side"><div class="side-title">CONTROL</div>${[['dashboard','Dashboard'],['orders','Orders'],['products','Products'],['customers','Customers'],['membership','ERA Pass'],['rewards','Spin Wheel'],['coupons','Follower Coupons'],['drops','Limited Drops'],['settings','Store editor'],['payments','Payments'],['reviews','Reviews'],['search','Search & barcode']].map(([id,t])=>`<button class="${active===id?'active':''}" onclick="go('${id}')"><span>${t}</span>${id==='orders'?`<em>${state.orders.length}</em>`:''}</button>`).join('')}<div class="side-divider"></div><div class="side-mini"><span>DELIVERED</span><b>${delivered}</b></div><button onclick="sessionStorage.removeItem('ke-admin-auth');renderBody()">Logout</button></aside><section class="admin-main">${section()}</section></div>`;
}
window.go=id=>{active=id;renderBody()}
function section(){switch(active){case'orders':return orders();case'order-detail':return orderDetailPage(selectedOrder);case'products':return products();case'membership':return membershipSettings();case'rewards':return rewardsSettings();case'coupons':return couponSettings();case'drops':return limitedDropSettings();case'settings':return settings();case'payments':return payments();case'customers':return customers();case'reviews':return reviews();case'search':return searchPanel();default:return dashboard()}}

function dashboard(){
  const total=state.orders.reduce((n,o)=>n+Number(o.total||0),0);
  const counts={Placed:0,Processing:0,Shipped:0,'Out for Delivery':0,Delivered:0,Cancelled:0}; state.orders.forEach(o=>counts[o.status||'Placed']++);
  const upcoming=state.orders.filter(o=>!['Delivered','Cancelled'].includes(o.status)).sort((a,b)=>new Date(a.expectedDeliveryDate)-new Date(b.expectedDeliveryDate)).slice(0,5);
  return `<div class="section-head"><div><div class="eyebrow">OWNER / OVERVIEW</div><h2>Command Center.</h2><p class="muted">Every order, customer and delivery milestone in one place.</p></div><span class="chip gold">SUPABASE SYNCED</span></div><div class="dashboard-grid premium-dash-grid"><div class="dash hero-dash"><span>TOTAL ORDERS</span><b>${state.orders.length}</b><small>All channels</small></div><div class="dash"><span>REVENUE</span><b>${money(total)}</b><small>Visible orders</small></div><div class="dash"><span>ACTIVE DELIVERIES</span><b>${counts.Placed+counts.Processing+counts.Shipped+counts['Out for Delivery']}</b><small>Not yet delivered</small></div><div class="dash"><span>PRODUCTS</span><b>${state.products.length}</b><small>Catalog items</small></div></div><div class="status-board">${[['Placed','ORDERED'],['Processing','PREPARING'],['Shipped','SHIPPED'],['Out for Delivery','OUT FOR DELIVERY'],['Delivered','DELIVERED']].map(([s,l])=>`<div><span>${l}</span><b>${counts[s]||0}</b></div>`).join('')}</div><div class="form-section premium-panel"><div class="section-head compact"><div><div class="eyebrow">DELIVERY RADAR</div><h3>Next customer arrivals</h3></div><button class="btn" onclick="go('orders')">OPEN ALL →</button></div>${upcoming.length?`<div class="arrival-grid">${upcoming.map(o=>`<button class="arrival-card" onclick="openOrder(${state.orders.indexOf(o)})"><div><span class="status ${statusClass(o.status)}">${esc(o.status)}</span><h4>${esc(o.customer?.name||'Customer')}</h4><p>${esc(o.id)} · ${esc(o.items?.[0]?.name||'Order')}</p></div><div class="arrival-date"><span>ETA</span><b>${fmtDay(o.expectedDeliveryDate)}</b><small>${esc(o.deliveryWindow)}</small></div></button>`).join('')}</div>`:'<div class="empty-state">No active deliveries.</div>'}</div><div class="form-section premium-panel"><div class="section-head compact"><div><div class="eyebrow">CUSTOMER VISIBILITY</div><h3>Everything you can control</h3></div></div><div class="feature-admin-grid"><div><b>Customer</b><span>Name, number, email, full address, city and PIN.</span></div><div><b>Arrival</b><span>ETA, delivery window, courier and tracking number.</span></div><div><b>Order</b><span>Products, size, colour, quantity, images and totals.</span></div><div><b>Status</b><span>Placed → Processing → Shipped → Out for Delivery → Delivered.</span></div></div></div>`;
}
function orderItemPhoto(item){const p=state.products.find(x=>x.id===item.id);return item.image||p?.images?.[0]||''}
function orders(){return `<div class="section-head"><div><div class="eyebrow">FULFILLMENT</div><h2>Orders.</h2><p class="muted">Open any order to edit the complete customer file.</p></div><button class="btn" onclick="exportOrders()">EXPORT CSV</button></div>${state.orders.length?`<div class="form-section premium-panel"><div style="overflow:auto"><table class="table premium-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TOTAL</th><th>PAYMENT</th><th>ETA</th><th>STATUS</th><th></th></tr></thead><tbody>${state.orders.map((o,i)=>{ensureOrderTracking(o);return `<tr onclick="openOrder(${i})"><td><b>${esc(o.id)}</b><br><span class="muted">${fmtDate(o.createdAt)}</span></td><td><b>${esc(o.customer?.name||'')}</b><br><span class="muted">${esc(o.customer?.phone||'')}</span></td><td>${(o.items||[]).reduce((n,x)=>n+Number(x.qty||0),0)}</td><td><b>${money(o.total)}</b></td><td>${esc(String(o.payment||'COD').toUpperCase())}</td><td><b>${fmtDay(o.expectedDeliveryDate)}</b><br><span class="muted">${esc(o.courier||'Courier pending')}</span></td><td><span class="status ${statusClass(o.status)}">${esc(o.status)}</span></td><td><button class="btn" onclick="event.stopPropagation();openOrder(${i})">VIEW →</button></td></tr>`}).join('')}</tbody></table></div></div>`:`<div class="form-section premium-panel"><div class="empty-state">No orders yet.</div></div>`}`}
function timelineHTML(o){return `<div class="timeline">${STATUS_FLOW.map((s,i)=>{const evt=o.timeline.find(x=>x.status===s);const done=!!evt;return `<div class="timeline-item ${done?'done':''} ${o.status===s?'current':''}"><span class="timeline-dot">${done?'✓':String(i+1).padStart(2,'0')}</span><div><b>${s}</b><small>${evt?fmtDate(evt.at):'Pending'}</small><p>${evt?esc(evt.note||STATUS_COPY[s]||s):'Not reached yet'}</p></div></div>`}).join('')}</div>`}
function orderDetailPage(i){const o=state.orders[i];if(!o)return '<div class="form-section premium-panel"><p class="muted">Order not found.</p></div>';ensureOrderTracking(o);return `<div class="section-head"><div><div class="eyebrow">CUSTOMER ORDER FILE / LIVE</div><h2>${esc(o.id)}</h2><p class="muted">Customer, product, payment and delivery controls.</p></div><div class="admin-actions"><button class="btn" onclick="closeOrderEditor()">← ORDERS</button><button class="btn primary" onclick="saveOrderEdit(${i})">SAVE CHANGES</button></div></div>${orderEditor(i)}`}
function orderEditor(i){
  const o=state.orders[i]; o.customer=o.customer||{}; o.items=o.items||[]; ensureOrderTracking(o);
  const eta=new Date(o.expectedDeliveryDate).toISOString().slice(0,10);
  const itemHtml=o.items.length?o.items.map((it,j)=>{const p=state.products.find(x=>x.id===it.id);return `<div class="admin-item"><img src="${esc(orderItemPhoto(it))}"><div><b>${esc(p?.name||it.name||it.id)}</b><span>${esc(it.color||'Black')} · Size ${esc(it.size||'—')}</span><div class="field inline-field"><label>PHOTO URL</label><input id="oeImg_${j}" value="${esc(it.image||orderItemPhoto(it))}"></div></div><div class="field qty-field"><label>QTY</label><input id="oeQty_${j}" type="number" min="1" value="${Number(it.qty||1)}"></div></div>`}).join(''):'<div class="muted">No items recorded.</div>';
  const statusButtons=['Placed','Processing','Shipped','Out for Delivery','Delivered','Cancelled'].map(s=>`<button class="${o.status===s?'active':''}" onclick="quickStatus(${i},'${s}')">${s}</button>`).join('');
  return `<div class="order-command-grid"><div><div class="form-section premium-panel"><div class="panel-head"><div><div class="eyebrow">01 / CUSTOMER</div><h3>Customer details</h3></div><span class="chip">${esc(String(o.payment||'COD').toUpperCase())}</span></div><div class="form-grid"><div class="field"><label>NAME</label><input id="oeName" value="${esc(o.customer.name||'')}"></div><div class="field"><label>PHONE / NUMBER</label><input id="oePhone" value="${esc(o.customer.phone||'')}"></div><div class="field"><label>EMAIL</label><input id="oeEmail" value="${esc(o.customer.email||'')}"></div><div class="field"><label>CITY / LOCATION</label><input id="oeCity" value="${esc(o.customer.city||'')}"></div><div class="field" style="grid-column:1/-1"><label>FULL ADDRESS</label><textarea id="oeAddress">${esc(o.customer.address||'')}</textarea></div><div class="field"><label>LANDMARK</label><input id="oeLandmark" value="${esc(o.customer.landmark||'')}"></div><div class="field"><label>HOUSE / BUILDING NO.</label><input id="oeHouse" value="${esc(o.customer.houseNumber||'')}"></div><div class="field"><label>STATE</label><input id="oeState" value="${esc(o.customer.state||'')}"></div><div class="field"><label>PINCODE</label><input id="oePin" value="${esc(o.customer.pincode||'')}"></div></div></div><div class="form-section premium-panel"><div class="panel-head"><div><div class="eyebrow">02 / ORDER</div><h3>What was ordered</h3></div><span class="chip gold">${o.items.length} LINE(S)</span></div><div class="admin-items">${itemHtml}</div>${o.freebie?`<div class="admin-note"><b>LIMITED DROP GIFT:</b> ${esc(o.freebie.giftText||o.freebie.title||'Gift included')} · Eligible product IDs: ${esc((o.freebie.productIds||[]).join(', '))}</div>`:''}</div><div class="form-section premium-panel"><div class="panel-head"><div><div class="eyebrow">03 / PAYMENT</div><h3>Money & settlement</h3></div></div><div class="form-grid"><div class="field"><label>PAYMENT METHOD</label><select id="oePayment">${['cod','upi','card','bank'].map(x=>`<option value="${x}" ${o.payment===x?'selected':''}>${x.toUpperCase()}</option>`).join('')}</select></div><div class="field"><label>ORDER ID</label><input id="oeId" value="${esc(o.id)}"></div><div class="field"><label>SUBTOTAL</label><input id="oeSubtotal" type="number" value="${Number(o.subtotal||0)}"></div><div class="field"><label>DISCOUNT</label><input id="oeDiscount" type="number" value="${Number(o.discount||0)}"></div><div class="field"><label>TOTAL</label><input id="oeTotal" type="number" value="${Number(o.total||0)}"></div><div class="field"><label>ADVANCE PAID</label><input id="oeAdvance" type="number" value="${Number(o.advancePaid||0)}"></div><div class="field"><label>REMAINING / COD DUE</label><input id="oeRemaining" type="number" value="${Number(o.remainingDue??Math.max(0,Number(o.total||0)-Number(o.advancePaid||0)))}"></div><div class="field"><label>FOUND VIA</label><input id="oeReferral" value="${esc(o.referralSource||'')}"></div></div></div></div><div><div class="form-section premium-panel sticky-card"><div class="panel-head"><div><div class="eyebrow">04 / DELIVERY CONTROL</div><h3>Arrival & courier</h3></div><span class="status ${statusClass(o.status)}">${esc(o.status)}</span></div><div class="quick-status">${statusButtons}</div><div class="form-grid"><div class="field"><label>EXPECTED ARRIVAL</label><input id="oeEta" type="date" value="${eta}"></div><div class="field"><label>DELIVERY WINDOW</label><input id="oeWindow" value="${esc(o.deliveryWindow)}"></div><div class="field"><label>COURIER / PARTNER</label><input id="oeCourier" value="${esc(o.courier)}" placeholder="e.g. Delhivery"></div><div class="field"><label>TRACKING NUMBER</label><input id="oeTracking" value="${esc(o.trackingNumber)}"></div><div class="field" style="grid-column:1/-1"><label>NOTE TO CUSTOMER</label><textarea id="oeNote" placeholder="Example: Your parcel will arrive between 4–7 PM.">${esc(o.customerNote)}</textarea></div></div><div class="delivery-preview"><div><span>EXPECTED</span><b>${fmtDay(o.expectedDeliveryDate)}</b></div><div><span>COURIER</span><b>${esc(o.courier||'—')}</b></div><div><span>TRACKING</span><b>${esc(o.trackingNumber||'—')}</b></div></div></div><div class="form-section premium-panel"><div class="panel-head"><div><div class="eyebrow">05 / CUSTOMER VIEW</div><h3>Delivery timeline</h3></div><span class="muted">Visible on Track Order</span></div>${timelineHTML(o)}</div><div class="admin-actions"><button class="btn danger" onclick="deleteOrder(${i})">DELETE ORDER</button><button class="btn primary" onclick="saveOrderEdit(${i})">SAVE ALL CHANGES →</button></div></div></div>`;
}
window.openOrder=i=>{if(!state.orders[i])return;selectedOrder=i;active='order-detail';renderBody();window.scrollTo({top:0,behavior:'smooth'})}
window.closeOrderEditor=()=>{active='orders';selectedOrder=null;renderBody()}
window.quickStatus=async(i,status)=>{const o=state.orders[i];if(!o)return;syncTimeline(o,status);if(!(await updateCloudOrder(o)))return;save();renderBody()}
window.saveOrderEdit=async i=>{
  const o=state.orders[i]; if(!o)return;
  o.id=document.getElementById('oeId').value.trim()||o.id;
  o.customer={...o.customer,name:document.getElementById('oeName').value.trim(),phone:document.getElementById('oePhone').value.trim(),email:document.getElementById('oeEmail').value.trim(),city:document.getElementById('oeCity').value.trim(),address:document.getElementById('oeAddress').value.trim(),landmark:document.getElementById('oeLandmark')?.value.trim()||'',houseNumber:document.getElementById('oeHouse')?.value.trim()||'',state:document.getElementById('oeState')?.value.trim()||'',pincode:document.getElementById('oePin').value.trim()};
  o.payment=document.getElementById('oePayment').value; o.referralSource=document.getElementById('oeReferral').value.trim();
  o.subtotal=Number(document.getElementById('oeSubtotal').value||0); o.discount=Number(document.getElementById('oeDiscount').value||0); o.total=Number(document.getElementById('oeTotal').value||0); o.advancePaid=Number(document.getElementById('oeAdvance').value||0); o.remainingDue=Number(document.getElementById('oeRemaining').value||0);
  const etaInput=document.getElementById('oeEta').value; if(etaInput)o.expectedDeliveryDate=new Date(`${etaInput}T12:00:00`).toISOString();
  o.deliveryWindow=document.getElementById('oeWindow').value.trim(); o.courier=document.getElementById('oeCourier').value.trim(); o.trackingNumber=document.getElementById('oeTracking').value.trim(); o.customerNote=document.getElementById('oeNote').value.trim();
  o.items=(o.items||[]).map((it,j)=>({...it,qty:Math.max(1,Number(document.getElementById(`oeQty_${j}`).value||1)),image:document.getElementById(`oeImg_${j}`).value.trim()}));
  syncTimeline(o,o.status||'Placed');
  if(!(await updateCloudOrder(o)))return; save(); active='orders'; selectedOrder=null; toast('Order + delivery saved'); renderBody();
}
window.deleteOrder=async i=>{if(!confirm('Delete this order permanently?'))return;const o=state.orders[i];if(!(await deleteCloudOrder(o)))return;state.orders.splice(i,1);save();active='orders';selectedOrder=null;renderBody()}

function productOfferLabel(p){
  const o=p?.offer||{};
  if(!o.enabled||o.type==='none')return '';
  if(o.type==='percent')return `${Math.max(1,Number(o.percent||50))}% OFF`;
  if(o.type==='bogo')return 'BUY 1 GET 1 FREE';
  return '';
}
function products(){
  const s=ensureMerchandisingSettings(state.settings);
  return `<div class="section-head"><div><div class="eyebrow">CATALOG</div><h2>Products.</h2><p class="muted">Add one product normally, or create multiple products together with multiple gallery images.</p></div><div class="admin-actions"><button class="btn" onclick="bulkAddProducts()">+ BULK ADD</button><button class="btn primary" onclick="newProduct()">+ ADD PRODUCT</button></div></div>
  <div class="form-section premium-panel">
    <div class="panel-head"><div><div class="eyebrow">OFFER CONTROLS</div><h3>Apply offers quickly</h3></div><span class="chip red-offer-chip">RED OFFERS</span></div>
    <div class="offer-bulk-grid">
      <button class="offer-bulk-btn" onclick="applyOfferToCategory('T-Shirts','percent')">Apply ${esc(s.offers.percent50.label)} to all T-Shirts</button>
      <button class="offer-bulk-btn" onclick="applyOfferToCategory('T-Shirts','bogo')">Apply ${esc(s.offers.bogo.label)} to all T-Shirts</button>
      <button class="offer-bulk-btn" onclick="removeOfferFromCategory('T-Shirts')">Remove offer from all T-Shirts</button>
    </div>
    <p class="admin-note">You can also choose 50% OFF, BUY 1 GET 1 FREE, or None separately inside every product.</p>
  </div>
  <div style="display:grid;gap:10px">${state.products.map((p,i)=>`<div class="product-admin ${p.offer?.enabled?'has-red-offer':''}">
    <img class="preview-img" src="${esc(p.images?.[0]||'')}">
    <div><b>${esc(p.name)}</b><div class="muted">${esc(p.category)} · ${money(p.price)} · SKU ${esc(p.barcode||'—')} · ${p.images?.length||0} photos</div>
      ${productOfferLabel(p)?`<div class="admin-offer-tag">${esc(productOfferLabel(p))}</div>`:''}
    </div>
    <div class="admin-actions"><button class="btn" onclick="editProduct(${i})">EDIT</button><button class="btn danger" onclick="deleteProduct(${i})">DELETE</button></div>
  </div>`).join('')}</div>`
}
window.deleteProduct=i=>{if(confirm('Delete this product?')){state.products.splice(i,1);save();renderBody()}}
function productForm(i=null){
  const p=i===null
    ? {id:'KE'+Date.now().toString().slice(-6),name:'New Kryven Product',category:'T-Shirts',price:999,mrp:1499,discount:'33% OFF',rating:5,reviews:0,barcode:'',images:[IMG.tshirt],sizes:{S:true,M:true,L:true,XL:true,XXL:true},colors:['Black','White'],description:'',features:['Premium quality'],stock:10,offer:{enabled:false,type:'none',percent:50}}
    : state.products[i];
  const merch=ensureMerchandisingSettings(state.settings);const o=Object.assign({enabled:false,type:'none',percent:merch.offers.percent50.defaultPercent||50},p.offer||{});
  const cats=ensureMerchandisingSettings(state.settings).categories;
  return `<div class="form-section premium-panel"><div class="section-head compact"><div><div class="eyebrow">CATALOG EDITOR</div><h3>${i===null?'Add':'Edit'} product</h3></div></div>
  <div class="form-grid">
    <div class="field"><label>TITLE</label><input id="pName" value="${esc(p.name)}"></div>
    <div class="field"><label>CATEGORY</label><input id="pCat" list="productCategories" value="${esc(p.category)}"><datalist id="productCategories">${cats.map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist></div>
    <div class="field"><label>PRICE</label><input id="pPrice" type="number" value="${p.price}"></div>
    <div class="field"><label>MRP</label><input id="pMrp" type="number" value="${p.mrp}"></div>
    <div class="field"><label>DISCOUNT</label><input id="pDisc" value="${esc(p.discount)}"></div>
    <div class="field"><label>BARCODE / SKU</label><input id="pBarcode" value="${esc(p.barcode||'')}"></div>
    <div class="field"><label>STOCK</label><input id="pStock" type="number" value="${p.stock}"></div>
    <div class="field"><label>COLOURS</label><input id="pColors" value="${esc((p.colors||[]).join(', '))}"></div>
    <div class="field" style="grid-column:1/-1"><label>PRODUCT IMAGES</label><input id="pImageFiles" type="file" accept="image/*" multiple onchange="uploadProductImages(this)"><small id="cloudinaryUploadStatus" class="field-help">Select one or more images. They will upload directly to Cloudinary.</small></div>
    <div class="field" style="grid-column:1/-1"><label>IMAGE URLS (ONE PER LINE)</label><textarea id="pImages">${esc((p.images||[]).join('\n'))}</textarea></div>
    <div class="field" style="grid-column:1/-1"><label>COLOUR IMAGE MAP (Color | URL, ONE PER LINE)</label><textarea id="pVariantImages" placeholder="Black | https://...\nWhite | https://...\nRed | https://...">${esc(Object.entries(p.variantVisuals||{}).filter(([,v])=>v?.src).map(([c,v])=>`${c} | ${v.src}`).join('\n'))}</textarea><small class="field-help">Admin can replace the temporary colour photos with exact product photos later.</small></div>
    <div class="field" style="grid-column:1/-1"><label>DESCRIPTION</label><textarea id="pDesc">${esc(p.description||'')}</textarea></div>
    <div class="field" style="grid-column:1/-1"><label>FEATURES (ONE PER LINE)</label><textarea id="pFeatures">${esc((p.features||[]).join('\n'))}</textarea></div>
  </div>
  <div class="form-section offer-editor-panel">
    <div class="panel-head"><div><div class="eyebrow">PRODUCT OFFER</div><h3>Promotion on this product</h3></div><span class="red-offer-chip">RED</span></div>
    <div class="form-grid">
      <div class="field"><label>OFFER</label><select id="pOfferType">
        <option value="none" ${o.type==='none'?'selected':''}>No offer</option>
        <option value="percent" ${o.type==='percent'?'selected':''}>50% OFF / percentage offer</option>
        <option value="bogo" ${o.type==='bogo'?'selected':''}>BUY 1 GET 1 FREE</option>
      </select></div>
      <div class="field"><label>PERCENT OFF</label><input id="pOfferPercent" type="number" min="1" max="100" value="${Math.max(1,Number(o.percent||merch.offers.percent50.defaultPercent||50))}"><small class="field-help">Used when Percentage Offer is selected.</small></div>
      <div class="field" style="display:flex;align-items:center;gap:10px;padding-top:24px"><label class="switch"><input id="pOfferEnabled" type="checkbox" ${o.enabled?'checked':''}><span class="slider"></span></label><b>Offer is active</b></div>
    </div>
    <p class="admin-note">Every product can have its own offer. Red offer badges are shown on the customer storefront.</p>
  </div>
  <div class="chips">${['S','M','L','XL','XXL'].map(s=>`<label class="chip"><input id="size_${s}" type="checkbox" ${p.sizes?.[s]?'checked':''}> ${s}</label>`).join('')}</div>
  <div class="admin-actions" style="margin-top:15px"><button class="btn primary" onclick="saveProduct(${i===null?'null':i})">SAVE PRODUCT →</button><button class="btn" onclick="go('products')">CANCEL</button></div></div>
`}
window.newProduct=()=>{document.querySelector('.admin-main').innerHTML=productForm();active='products'}

function bulkProductCard(index){return `<div class="form-section premium-panel bulk-product-card" data-bulk-index="${index}" style="margin-bottom:14px"><div class="panel-head"><div><div class="eyebrow">BULK PRODUCT ${index+1}</div><h3>New product</h3></div><button class="btn danger" type="button" onclick="removeBulkProduct(${index})">REMOVE</button></div><div class="form-grid"><div class="field"><label>TITLE</label><input id="bpName_${index}" placeholder="Product title"></div><div class="field"><label>CATEGORY</label><input id="bpCat_${index}" value="T-Shirts" placeholder="T-Shirts"></div><div class="field"><label>PRICE</label><input id="bpPrice_${index}" type="number" value="999"></div><div class="field"><label>MRP</label><input id="bpMrp_${index}" type="number" value="1499"></div><div class="field"><label>DISCOUNT</label><input id="bpDisc_${index}" value="33% OFF"></div><div class="field"><label>BARCODE / SKU</label><input id="bpBarcode_${index}" placeholder="Optional"></div><div class="field"><label>STOCK</label><input id="bpStock_${index}" type="number" value="10"></div><div class="field"><label>COLOURS</label><input id="bpColors_${index}" value="Black, White"></div><div class="field" style="grid-column:1/-1"><label>GALLERY IMAGES — SELECT MULTIPLE</label><input id="bpFiles_${index}" type="file" accept="image/*" multiple><small id="bpStatus_${index}" class="field-help">Select all photos for this product at once. They will upload to Cloudinary when you click CREATE PRODUCTS.</small></div><div class="field" style="grid-column:1/-1"><label>DESCRIPTION</label><textarea id="bpDesc_${index}" placeholder="Product description"></textarea></div><div class="field" style="grid-column:1/-1"><label>FEATURES — ONE PER LINE</label><textarea id="bpFeatures_${index}" placeholder="Premium quality\nOversized fit"></textarea></div></div><div class="chips">${['S','M','L','XL','XXL'].map(sz=>`<label class="chip"><input id="bpSize_${sz}_${index}" type="checkbox" checked> ${sz}</label>`).join('')}</div></div>`}
window.bulkAddProducts=()=>{document.querySelector('.admin-main').innerHTML=`<div class="section-head"><div><div class="eyebrow">CATALOG / BULK CREATOR</div><h2>Add multiple products.</h2><p class="muted">For each product, select all gallery photos, then enter title, description, price and other details. Everything is saved in one go.</p></div><div class="admin-actions"><button class="btn" onclick="go('products')">CANCEL</button><button class="btn primary" onclick="saveBulkProducts()">CREATE ALL PRODUCTS →</button></div></div><div id="bulkProductList">${bulkProductCard(0)}</div><button class="btn" type="button" onclick="addBulkProductCard()">+ ADD ANOTHER PRODUCT</button><div id="bulkGlobalStatus" class="admin-note" style="margin-top:14px">Cloudinary: ${esc(CLOUDINARY_CLOUD_NAME)} / ${esc(CLOUDINARY_UPLOAD_PRESET)}</div>`;active='products'}
window.addBulkProductCard=()=>{const list=document.getElementById('bulkProductList');if(!list)return;const count=list.querySelectorAll('.bulk-product-card').length;list.insertAdjacentHTML('beforeend',bulkProductCard(count))}
window.removeBulkProduct=(index)=>{const card=document.querySelector(`.bulk-product-card[data-bulk-index="${index}"]`);if(!card)return;const cards=[...document.querySelectorAll('.bulk-product-card')];if(cards.length<=1){toast('Keep at least one product');return}card.remove();document.querySelectorAll('.bulk-product-card').forEach((el,i)=>{el.dataset.bulkIndex=i;const title=el.querySelector('.eyebrow');if(title)title.textContent=`BULK PRODUCT ${i+1}`;});}
window.saveBulkProducts=async()=>{const cards=[...document.querySelectorAll('.bulk-product-card')];if(!cards.length)return;const global=document.getElementById('bulkGlobalStatus');let created=0;try{for(let i=0;i<cards.length;i++){const card=cards[i], name=document.getElementById(`bpName_${i}`)?.value.trim();if(!name){toast(`Product ${i+1}: title is required`);return}const files=[...(document.getElementById(`bpFiles_${i}`)?.files||[])];const status=document.getElementById(`bpStatus_${i}`);if(status)status.textContent=files.length?`Uploading 0/${files.length}…`:'No gallery images selected — using empty gallery';const urls=[];for(let j=0;j<files.length;j++){if(status)status.textContent=`Uploading ${j+1}/${files.length}…`;urls.push(await uploadToCloudinary(files[j]))}const sizes=Object.fromEntries(['S','M','L','XL','XXL'].map(sz=>[sz,!!document.getElementById(`bpSize_${sz}_${i}`)?.checked]));const p={id:`KE${Date.now().toString().slice(-6)}${String(i).padStart(2,'0')}`,name,category:document.getElementById(`bpCat_${i}`).value.trim()||'T-Shirts',price:Number(document.getElementById(`bpPrice_${i}`).value||0),mrp:Number(document.getElementById(`bpMrp_${i}`).value||0),discount:document.getElementById(`bpDisc_${i}`).value.trim(),barcode:document.getElementById(`bpBarcode_${i}`).value.trim(),stock:Number(document.getElementById(`bpStock_${i}`).value||0),colors:document.getElementById(`bpColors_${i}`).value.split(',').map(x=>x.trim()).filter(Boolean),images:urls,description:document.getElementById(`bpDesc_${i}`).value.trim(),features:document.getElementById(`bpFeatures_${i}`).value.split('\n').map(x=>x.trim()).filter(Boolean),rating:5,reviews:0,sizes};state.products.unshift(p);created++;if(status)status.textContent=`${urls.length} image${urls.length===1?'':'s'} uploaded ✓`;}save();if(global)global.textContent=`${created} product${created===1?'':'s'} created successfully ✓`;toast(`${created} product${created===1?'':'s'} created`);setTimeout(()=>renderBody(),700)}catch(e){if(global)global.textContent=`Upload failed: ${e.message||'error'}`;toast(`Bulk upload failed: ${e.message||'error'}`)}}
window.editProduct=i=>{document.querySelector('.admin-main').innerHTML=productForm(i);active='products'}
window.saveProduct=i=>{
  const offerType=document.getElementById('pOfferType')?.value||'none';
  const offerEnabled=!!document.getElementById('pOfferEnabled')?.checked && offerType!=='none';
  const offer={enabled:offerEnabled,type:offerType,percent:Math.max(1,Math.min(100,Number(document.getElementById('pOfferPercent')?.value||50)))};
  const p={id:i===null?`KE${Date.now().toString().slice(-6)}`:state.products[i].id,
    name:document.getElementById('pName').value.trim(),category:document.getElementById('pCat').value.trim(),
    price:Number(document.getElementById('pPrice').value),mrp:Number(document.getElementById('pMrp').value),
    discount:document.getElementById('pDisc').value.trim(),barcode:document.getElementById('pBarcode').value.trim(),stock:Number(document.getElementById('pStock').value),
    colors:document.getElementById('pColors').value.split(',').map(x=>x.trim()).filter(Boolean),
    images:document.getElementById('pImages').value.split('\n').map(x=>x.trim()).filter(Boolean),
    description:document.getElementById('pDesc').value.trim(),
    variantVisuals:Object.fromEntries((document.getElementById('pVariantImages')?.value||'').split('\n').map(line=>line.split('|').map(x=>x.trim())).filter(x=>x.length>=2&&x[0]&&x[1]).map(x=>[x[0],{src:x[1]}])),
    features:document.getElementById('pFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean),
    rating:i===null?5:state.products[i].rating,reviews:i===null?0:state.products[i].reviews,
    sizes:Object.fromEntries(['S','M','L','XL','XXL'].map(s=>[s,document.getElementById(`size_${s}`).checked])),
    offer
  };
  if(i===null)state.products.unshift(p);else state.products[i]=p;
  save();toast('Product saved');renderBody();
}

function settings(){
  const s=ensureMerchandisingSettings(state.settings);
  return `<div class="section-head"><div><div class="eyebrow">STOREFRONT / DARK LUXURY</div><h2>Store editor.</h2></div><button class="btn primary" onclick="saveSettings()">SAVE WEBSITE</button></div>
  <div class="form-section premium-panel"><h4>Brand & landing page</h4><div class="form-grid">
    <div class="field"><label>BRAND</label><input id="sBrand" value="${esc(s.brand)}"></div><div class="field"><label>TAGLINE</label><input id="sTag" value="${esc(s.tagline)}"></div>
    <div class="field"><label>HERO TITLE</label><input id="sHeroTitle" value="${esc(s.heroTitle)}"></div>
    <div class="field"><label>ADMIN PANEL LOGO URL / FILE</label><input id="sAdminLogo" value="${esc(s.adminLogo||'logo-icon.png')}"><small class="field-help">Used on the admin login and command-center header.</small></div>
    <div class="field" style="grid-column:1/-1"><label>SEARCH RECOMMENDATIONS</label><input id="sSearchSuggestions" value="${esc((s.searchSuggestions||[]).join(', '))}" placeholder="oversized t-shirt, black hoodie, cargo pants"><small class="field-help">Comma-separated suggestions shown when the customer taps the search bar.</small></div>
    <div class="field" style="grid-column:1/-1"><label>HERO TEXT</label><textarea id="sHeroText">${esc(s.heroText)}</textarea></div>
  </div></div>
  <div class="form-section premium-panel offer-settings-panel"><div class="section-head compact"><div><div class="eyebrow">GRAND OPENING / OFFERS</div><h3>Offer manager</h3><p class="muted">These offer cards are editable from Admin and appear in red on the store.</p></div><span class="red-offer-chip">LIVE OFFERS</span></div>
    <div class="form-grid">
      <div class="field"><label>GRAND OPENING</label><select id="oGrandEnabled"><option value="1" ${s.offers.grandOpening.enabled?'selected':''}>ON</option><option value="0" ${s.offers.grandOpening.enabled?'':'selected'}>OFF</option></select></div>
      <div class="field"><label>GRAND OPENING TITLE</label><input id="oGrandTitle" value="${esc(s.offers.grandOpening.title)}"></div>
      <div class="field"><label>GRAND OPENING SUBTITLE</label><input id="oGrandSubtitle" value="${esc(s.offers.grandOpening.subtitle)}"></div>
      <div class="field"><label>GRAND OPENING NOTE</label><input id="oGrandNote" value="${esc(s.offers.grandOpening.note)}"></div>

      <div class="field"><label>50% OFFER</label><select id="o50Enabled"><option value="1" ${s.offers.percent50.enabled?'selected':''}>ON</option><option value="0" ${s.offers.percent50.enabled?'':'selected'}>OFF</option></select></div>
      <div class="field"><label>50% OFFER LABEL</label><input id="o50Label" value="${esc(s.offers.percent50.label)}"></div>
      <div class="field"><label>50% OFFER SUBTITLE</label><input id="o50Subtitle" value="${esc(s.offers.percent50.subtitle)}"></div><div class="field"><label>50% VALUE</label><input id="o50Percent" type="number" min="1" max="100" value="${Math.max(1,Math.min(100,Number(s.offers.percent50.defaultPercent||50)))}"></div>
      <div class="field"><label>50% OFFER NOTE</label><input id="o50Note" value="${esc(s.offers.percent50.note)}"></div>

      <div class="field"><label>BOGO OFFER</label><select id="oBogoEnabled"><option value="1" ${s.offers.bogo.enabled?'selected':''}>ON</option><option value="0" ${s.offers.bogo.enabled?'':'selected'}>OFF</option></select></div>
      <div class="field"><label>BOGO LABEL</label><input id="oBogoLabel" value="${esc(s.offers.bogo.label)}"></div>
      <div class="field"><label>BOGO SUBTITLE</label><input id="oBogoSubtitle" value="${esc(s.offers.bogo.subtitle)}"></div>
      <div class="field"><label>BOGO NOTE</label><input id="oBogoNote" value="${esc(s.offers.bogo.note)}"></div>
    </div>
    <div class="admin-actions" style="margin-top:14px"><button class="btn primary" onclick="saveOfferSettings()">SAVE OFFERS →</button></div>
  </div>
  <div class="form-section premium-panel"><div class="section-head compact"><div><div class="eyebrow">CATEGORY SECTIONS</div><h3>Add / hide storefront sections</h3><p class="muted">Add any category such as Hoodies, Oversized Tees or New Drops. Hiding a section does not delete products.</p></div></div>
    <div class="category-manager">
      <div class="category-add-row"><input id="newCategoryName" placeholder="New section name e.g. Oversized Tees"><button class="btn primary" onclick="addCategory()">+ ADD SECTION</button></div>
      ${s.categories.map((c,i)=>`<div class="category-admin-row"><div><b>${esc(c.name)}</b><span>${state.products.filter(p=>p.category===c.name).length} product(s)</span></div><div class="admin-actions">
        <button class="btn ${c.enabled?'':'primary'}" onclick="toggleCategory(${i})">${c.enabled?'HIDE':'SHOW'}</button>
        <button class="btn danger" onclick="removeCategory(${i})">REMOVE</button>
      </div></div>`).join('')}
    </div>
  </div>
  <div class="form-section premium-panel"><h4>Support & contact</h4><div class="form-grid">
    <div class="field"><label>WHATSAPP</label><input id="sWa" value="${esc(s.whatsapp||'')}"></div><div class="field"><label>UPI ID</label><input id="sUpi" value="${esc(s.upi||'')}"></div>
    <div class="field"><label>CASHFREE QR IMAGE URL</label><input id="sCashfreeQr" value="${esc(s.cashfreeQrImage||'')}" placeholder="Paste your Cashfree QR image URL"><small class="field-help">Optional. When set, this QR is shown at checkout.</small></div>
    <div class="field"><label>PAYMENT VERIFY ENDPOINT</label><input id="sPaymentVerify" value="${esc(s.paymentVerifyEndpoint||'/api/upi/verify')}" placeholder="/api/upi/verify"><small class="field-help">Backend endpoint that returns paid=true only after the gateway confirms payment.</small></div>
    <div class="field"><label>SHIPPING</label><input id="sShip" type="number" value="${Number(s.shipping||0)}"></div><div class="field"><label>SUPPORT HOURS</label><input id="sHours" value="${esc(s.supportText||'')}"></div>
  </div></div>
  <div class="form-section premium-panel"><h4>Admin security</h4><div class="form-grid"><div class="field"><label>ADMIN PIN</label><small class="field-help">The Admin PIN is now stored securely on the server. To change it, update the ADMIN_PIN variable in Vercel and redeploy.</small></div></div></div>`
}
window.toggleAdminPin=(id,btn)=>{const el=document.getElementById(id);if(!el)return;el.type=el.type==='password'?'text':'password';btn.textContent=el.type==='password'?'SHOW':'HIDE'}
window.saveSettings=()=>{
  const s=ensureMerchandisingSettings(state.settings);
  s.brand=document.getElementById('sBrand').value.trim();s.tagline=document.getElementById('sTag').value.trim();s.heroTitle=document.getElementById('sHeroTitle').value.trim();
  s.heroVideo='';s.heroVideoSeeded=true;s.backgroundVideo='';s.backgroundVideoEnabled=false;s.adminLogo=document.getElementById('sAdminLogo').value.trim()||'logo-icon.png';
  s.cashfreeQrImage=document.getElementById('sCashfreeQr')?.value.trim()||'';s.paymentVerifyEndpoint=document.getElementById('sPaymentVerify')?.value.trim()||'/api/upi/verify';s.heroText=document.getElementById('sHeroText').value.trim();
  s.whatsapp=document.getElementById('sWa').value.trim();s.upi=document.getElementById('sUpi').value.trim();s.shipping=Number(document.getElementById('sShip').value||0);s.supportText=document.getElementById('sHours').value.trim();
  s.searchSuggestions=(document.getElementById('sSearchSuggestions')?.value||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);
    state.settings=s;save();toast('Website settings saved');renderBody();
};
window.saveOfferSettings=()=>{
  const s=ensureMerchandisingSettings(state.settings);
  s.offers.grandOpening={enabled:document.getElementById('oGrandEnabled').value==='1',title:document.getElementById('oGrandTitle').value.trim()||OFFER_DEFAULTS.grandOpening.title,subtitle:document.getElementById('oGrandSubtitle').value.trim(),note:document.getElementById('oGrandNote').value.trim()};
  s.offers.percent50={enabled:document.getElementById('o50Enabled').value==='1',label:document.getElementById('o50Label').value.trim()||OFFER_DEFAULTS.percent50.label,subtitle:document.getElementById('o50Subtitle').value.trim(),note:document.getElementById('o50Note').value.trim(),defaultPercent:Math.max(1,Math.min(100,Number(document.getElementById('o50Percent')?.value||50)))};
  s.offers.bogo={enabled:document.getElementById('oBogoEnabled').value==='1',label:document.getElementById('oBogoLabel').value.trim()||OFFER_DEFAULTS.bogo.label,subtitle:document.getElementById('oBogoSubtitle').value.trim(),note:document.getElementById('oBogoNote').value.trim()};
  state.settings=s;save();toast('Offers saved — storefront updated');renderBody();
};
window.applyOfferToCategory=(category,type)=>{
  state.products.forEach(p=>{if(String(p.category||'').toLowerCase()===String(category).toLowerCase())p.offer={enabled:true,type,percent:type==='percent'?Math.max(1,Math.min(100,Number(ensureMerchandisingSettings(state.settings).offers.percent50.defaultPercent||50))):0}});
  save();toast(`${type==='percent'?'50% OFF':'BUY 1 GET 1 FREE'} applied to all ${category}`);renderBody();
};
window.removeOfferFromCategory=(category)=>{
  state.products.forEach(p=>{if(String(p.category||'').toLowerCase()===String(category).toLowerCase())p.offer={enabled:false,type:'none',percent:50}});
  save();toast(`Offers removed from all ${category}`);renderBody();
};
window.addCategory=()=>{
  const input=document.getElementById('newCategoryName');const name=input?.value.trim();if(!name){toast('Enter a section name');return}
  const s=ensureMerchandisingSettings(state.settings);if(s.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){toast('That section already exists');return}
  s.categories.push({name,enabled:true});state.settings=s;save();toast('Section added');renderBody();
};
window.toggleCategory=i=>{const s=ensureMerchandisingSettings(state.settings);if(!s.categories[i])return;s.categories[i].enabled=!s.categories[i].enabled;state.settings=s;save();renderBody()};
window.removeCategory=i=>{
  const s=ensureMerchandisingSettings(state.settings);if(!s.categories[i])return;
  const name=s.categories[i].name;const used=state.products.filter(p=>String(p.category||'').toLowerCase()===String(name).toLowerCase()).length;
  if(used&& !confirm(`${name} contains ${used} product(s). Remove the storefront section? Products will stay in the catalog.`))return;
  s.categories.splice(i,1);state.settings=s;save();toast('Section removed');renderBody();
};
function productIdChoices(){return state.products.map(p=>({id:String(p.id),name:String(p.name||p.id),category:String(p.category||'')}))}
function membershipSettings(){
 const m=ensureMerchandisingSettings(state.settings).membership;
 const tiers=m.tshirtPositionPercents;
 const rows=state.products.filter(p=>String(p.category||'').toLowerCase().includes('t-shirt')).map(p=>`<tr><td><b>${esc(p.name)}</b><small class="field-help">${esc(p.id)} · Regular ${money(p.price)}</small></td><td><input class="member-price-input" id="memberPrice_${esc(p.id)}" type="number" min="0" step="1" placeholder="Auto: ${money(Number(p.price)*Number(m.memberPricePercent||60)/100)}" value="${m.productMemberPrices[p.id]??''}"></td></tr>`).join('');
 return `<div class="section-head"><div><div class="eyebrow">MEMBERSHIP / PRICING</div><h2>THE ERA PASS.</h2><p class="muted">Prices here are real values from the product's current listed price. The member price ladder only applies to active members and selected T-shirts.</p></div><button class="btn primary" onclick="saveMembershipSettings()">SAVE MEMBERSHIP</button></div>
 <div class="form-section premium-panel"><h4>Membership controls</h4><div class="form-grid"><div class="field"><label>MEMBERSHIP ENABLED</label><select id="memEnabled"><option value="1" ${m.enabled!==false?'selected':''}>ENABLED</option><option value="0" ${m.enabled===false?'selected':''}>PAUSED</option></select></div><div class="field"><label>PRICE (₹)</label><input id="memPrice" type="number" min="1" step="1" value="${Number(m.price||69)}"></div><div class="field"><label>DURATION (DAYS)</label><input id="memDays" type="number" min="1" max="3650" value="${Number(m.durationDays||90)}"></div><div class="field"><label>DEFAULT MEMBER PRICE (% OF REGULAR)</label><input id="memPercent" type="number" min="0" max="100" value="${Number(m.memberPricePercent??60)}"></div><div class="field" style="grid-column:1/-1"><label>ELIGIBLE T-SHIRT PRODUCT IDs (COMMA SEPARATED)</label><input id="memEligibleIds" value="${esc((m.eligibleProductIds||[]).join(', '))}" placeholder="Blank = all T-shirts"></div></div><div class="toggle-row"><span>Enable member bundle ladder</span><label class="switch"><input id="memBundleEnabled" type="checkbox" ${m.bundleEnabled!==false?'checked':''}><span class="slider"></span></label></div><div class="toggle-row"><span>Show membership price on product cards</span><label class="switch"><input id="memShowPrice" type="checkbox" ${m.memberPricingEnabled!==false?'checked':''}><span class="slider"></span></label></div></div>
 <div class="form-section premium-panel"><h4>Member T-shirt bundle ladder</h4><p class="muted">Each number is a percentage of that T-shirt's listed selling price. 0 means free. The sixth and later eligible T-shirts go back to the first tier. Keep your product cost in mind.</p><div class="form-grid">${['First T-shirt (%)','Second T-shirt (%)','Third T-shirt (%)','Fourth T-shirt (%)','Fifth T-shirt (%)'].map((lab,i)=>`<div class="field"><label>${lab.toUpperCase()}</label><input id="memTier${i+1}" type="number" min="0" max="100" value="${Number(tiers[i]??[60,40,20,0,70][i])}"></div>`).join('')}</div><div class="admin-note">The example ladder defaults to 60%, 40%, 20%, free, and 70% of listed price. Prices aren't hard-coded in rupees.</div></div>
 <div class="form-section premium-panel"><h4>Per-product member price overrides</h4><p class="muted">Leave blank to use the default percentage above. These overrides are displayed as the member price; the bundle ladder still applies to quantity-based T-shirt tiers.</p><div style="overflow:auto"><table class="table premium-table"><thead><tr><th>PRODUCT</th><th>MEMBER PRICE (₹)</th></tr></thead><tbody>${rows||'<tr><td colspan="2">Add T-shirt products to configure member prices.</td></tr>'}</tbody></table></div></div>`;
}
window.saveMembershipSettings=()=>{
 const m=ensureMerchandisingSettings(state.settings).membership;
 m.enabled=document.getElementById('memEnabled').value==='1';m.price=Math.max(1,Math.min(100000,Number(document.getElementById('memPrice').value||69)));m.durationDays=Math.max(1,Math.min(3650,Number(document.getElementById('memDays').value||90)));m.memberPricePercent=Math.max(0,Math.min(100,Number(document.getElementById('memPercent').value===''?60:document.getElementById('memPercent').value)));m.bundleEnabled=document.getElementById('memBundleEnabled').checked;m.memberPricingEnabled=document.getElementById('memShowPrice').checked;m.eligibleProductIds=(document.getElementById('memEligibleIds').value||'').split(',').map(x=>x.trim()).filter(Boolean);m.tshirtPositionPercents=[1,2,3,4,5].map(i=>Math.max(0,Math.min(100,Number(document.getElementById('memTier'+i).value||0))));m.productMemberPrices={};state.products.filter(p=>String(p.category||'').toLowerCase().includes('t-shirt')).forEach(p=>{const v=document.getElementById('memberPrice_'+p.id)?.value;if(v!==undefined&&v!==''&&Number(v)>=0)m.productMemberPrices[p.id]=Math.round(Number(v)*100)/100});state.settings.membership=m;save();toast('ERA Pass settings saved');renderBody()
};
function rewardsSettings(){
 const w=ensureMerchandisingSettings(state.settings).rewards.wheel;const prizes=w.prizes;const fields=prizes.map((p,i)=>`<div class="form-section premium-panel"><div class="section-head compact"><div><div class="eyebrow">PRIZE ${i+1}</div><h4>${esc(p.label||p.type)}</h4></div><span class="chip gold">${esc(p.id)}</span></div><div class="form-grid"><div class="field"><label>PRIZE WEIGHT (%)</label><input id="wheelWeight_${i}" type="number" min="0" max="100" step="0.1" value="${Number(p.weight||0)}"></div>${p.type==='discount'?`<div class="field"><label>DISCOUNT (%)</label><input id="wheelPercent_${i}" type="number" min="25" max="50" step="1" value="${Number(p.percent||25)}"></div><div class="field"><label>ELIGIBLE PRODUCT IDs (COMMA SEPARATED)</label><input id="wheelProducts_${i}" value="${esc((p.productIds||[]).join(', '))}" placeholder="Required: selected product IDs"></div>`:`<div class="field"><label>REWARD TYPE</label><input value="90-day ERA Pass membership" disabled></div>`}</div></div>`).join('');
 const total=prizes.reduce((n,p)=>n+Number(p.weight||0),0);
 return `<div class="section-head"><div><div class="eyebrow">REWARD LAB / FAIR PRIZES</div><h2>SPIN THE ERA.</h2><p class="muted">No jackpot, no fake 100% OFF. The backend chooses from the same weights shown here, and one account can spin once per campaign.</p></div><button class="btn primary" onclick="saveWheelSettings()">SAVE WHEEL</button></div><div class="form-section premium-panel"><div class="form-grid"><div class="field"><label>WHEEL STATUS</label><select id="wheelEnabled"><option value="1" ${w.enabled!==false?'selected':''}>LIVE</option><option value="0" ${w.enabled===false?'selected':''}>PAUSED</option></select></div><div class="field"><label>CAMPAIGN KEY</label><input id="wheelCampaign" value="${esc(w.campaignKey||'era-wheel-2026')}" maxlength="60"><small class="field-help">Changing the key starts a new campaign. Use carefully; customers can spin again in the new campaign.</small></div><div class="field"><label>COUPON VALIDITY (DAYS)</label><input id="wheelValidity" type="number" min="1" max="365" value="${Number(w.couponValidityDays||14)}"></div></div><div class="admin-note">Current total weight: <b>${total.toFixed(2)}%</b> ${Math.abs(total-100)>.02?'<span style="color:#ff8d83">— must equal 100%</span>':'— valid'}. Keep the ERA Pass reward at 0.50% if that is your intended chance.</div></div>${fields}`;
}
window.saveWheelSettings=()=>{
 const s=ensureMerchandisingSettings(state.settings);const w=s.rewards.wheel;
 w.enabled=document.getElementById('wheelEnabled').value==='1';w.campaignKey=document.getElementById('wheelCampaign').value.trim().replace(/[^A-Za-z0-9_-]/g,'').slice(0,60)||'era-wheel-2026';w.couponValidityDays=Math.max(1,Math.min(365,Number(document.getElementById('wheelValidity').value||14)));
 w.prizes=w.prizes.map((p,i)=>({...p,weight:Math.max(0,Math.min(100,Number(document.getElementById('wheelWeight_'+i).value||0))),...(p.type==='discount'?{percent:Math.max(25,Math.min(50,Number(document.getElementById('wheelPercent_'+i).value||25))),productIds:(document.getElementById('wheelProducts_'+i).value||'').split(',').map(x=>x.trim()).filter(Boolean)}:{})}));
 const total=w.prizes.reduce((n,p)=>n+p.weight,0);if(Math.abs(total-100)>.02){toast('Wheel weights must total exactly 100%. Settings not saved.');return}const passes=w.prizes.filter(p=>p.type==='membership');if(passes.length!==1||Math.abs(Number(passes[0].weight)-.5)>.0001){toast('Keep exactly one ERA PASS reward at 0.50%. Settings not saved.');return}const ids=new Set(state.products.map(p=>String(p.id)));for(const p of w.prizes.filter(p=>p.type==='discount')){if(!p.productIds.length||p.productIds.some(id=>!ids.has(String(id)))){toast('Each discount prize needs one or more valid existing product IDs. Settings not saved.');return}}state.settings=s;save();toast('Spin wheel settings saved');renderBody()
};
function couponSettings(){const s=ensureMerchandisingSettings(state.settings);const list=s.creatorCoupons.map((c,i)=>`<tr><td><b>${esc(c.code)}</b><br><small>${esc(c.label||'Follower coupon')}</small></td><td>${c.type==='fixed'?money(c.amount):Number(c.percent||0)+'%'}</td><td>${esc((c.productIds||[]).join(', ')||'All current products')}</td><td>${Number(c.maxUses||0)||'Unlimited'}</td><td>${c.expiresAt?esc(new Date(c.expiresAt).toLocaleDateString('en-IN')):'No expiry'}</td><td><button class="btn" onclick="editCreatorCoupon(${i})">EDIT</button> <button class="btn" onclick="toggleCreatorCoupon(${i})">${c.enabled===false?'ENABLE':'PAUSE'}</button> <button class="btn danger" onclick="deleteCreatorCoupon(${i})">DELETE</button></td></tr>`).join('');
 return `<div class="section-head"><div><div class="eyebrow">FOLLOWER / CREATOR COUPONS</div><h2>Codes you control.</h2><p class="muted">Codes appear on the public Follower Codes page. Redemption requires sign-in, applies once per account, and cannot stack with member pricing.</p></div></div><div class="form-section premium-panel"><h4>Create a follower code</h4><div class="form-grid"><div class="field"><label>CODE</label><input id="newCouponCode" maxlength="40" placeholder="ERA-FOLLOWER30"></div><div class="field"><label>PUBLIC LABEL</label><input id="newCouponLabel" maxlength="70" placeholder="Instagram follower reward"></div><div class="field"><label>DISCOUNT TYPE</label><select id="newCouponType"><option value="percent">Percentage off</option><option value="fixed">Fixed amount off</option></select></div><div class="field"><label>PERCENT (%)</label><input id="newCouponPercent" type="number" min="1" max="50" value="30"></div><div class="field"><label>FIXED AMOUNT (₹)</label><input id="newCouponAmount" type="number" min="1" value="100"></div><div class="field"><label>MINIMUM CART VALUE (₹)</label><input id="newCouponMin" type="number" min="0" value="0"></div><div class="field"><label>MAX DISCOUNT (₹, 0 = NO CAP)</label><input id="newCouponCap" type="number" min="0" value="0"></div><div class="field"><label>MAX REDEMPTIONS (0 = UNLIMITED)</label><input id="newCouponUses" type="number" min="0" value="100"></div><div class="field"><label>EXPIRY DATE (OPTIONAL)</label><input id="newCouponExpiry" type="date"></div><div class="field" style="grid-column:1/-1"><label>ELIGIBLE PRODUCT IDs (COMMA SEPARATED; BLANK = ALL PRODUCTS)</label><input id="newCouponProducts" placeholder="KE001, KE004"></div></div><div class="admin-actions" style="margin-top:14px"><button class="btn primary" onclick="saveCreatorCoupon()">${editingCreatorCouponIndex===null?'SAVE COUPON →':'UPDATE COUPON →'}</button>${editingCreatorCouponIndex!==null?'<button class="btn" onclick="cancelCouponEdit()">CANCEL EDIT</button>':''}</div></div><div class="form-section premium-panel"><h4>Current follower codes</h4><div style="overflow:auto"><table class="table premium-table"><thead><tr><th>CODE</th><th>DISCOUNT</th><th>PRODUCTS</th><th>MAX USES</th><th>EXPIRY</th><th>CONTROL</th></tr></thead><tbody>${list||'<tr><td colspan="6">No follower coupons configured.</td></tr>'}</tbody></table></div></div><div class="form-section premium-panel"><h4>Next-order reward</h4><p class="muted">Customers can request a unique reward after their order is marked Delivered by entering that order ID and signing in. They can redeem the resulting code once.</p><div class="form-grid"><div class="field"><label>NEXT-ORDER REWARD ENABLED</label><select id="nextOfferEnabled"><option value="1" ${s.nextOrderOffer.enabled!==false?'selected':''}>ENABLED</option><option value="0" ${s.nextOrderOffer.enabled===false?'selected':''}>PAUSED</option></select></div><div class="field"><label>DISCOUNT (%)</label><input id="nextOfferPercent" type="number" min="1" max="50" value="${Number(s.nextOrderOffer.percent||30)}"></div><div class="field"><label>VALIDITY (DAYS)</label><input id="nextOfferDays" type="number" min="1" max="365" value="${Number(s.nextOrderOffer.validityDays||14)}"></div><div class="field"><label>MINIMUM CART VALUE (₹)</label><input id="nextOfferMin" type="number" min="0" value="${Number(s.nextOrderOffer.minCartValue||0)}"></div><div class="field"><label>MAX DISCOUNT (₹, 0 = NO CAP)</label><input id="nextOfferMax" type="number" min="0" value="${Number(s.nextOrderOffer.maxDiscount||0)}"></div><div class="field" style="grid-column:1/-1"><label>ELIGIBLE PRODUCT IDs (COMMA SEPARATED; BLANK = ALL PRODUCTS)</label><input id="nextOfferProducts" value="${esc((s.nextOrderOffer.productIds||[]).join(', '))}" placeholder="KE001, KE004"></div></div><button class="btn primary" style="margin-top:14px" onclick="saveNextOrderOffer()">SAVE NEXT-ORDER OFFER</button></div>`;
}
window.editCreatorCoupon=i=>{const s=ensureMerchandisingSettings(state.settings),c=s.creatorCoupons[i];if(!c)return;editingCreatorCouponIndex=i;renderBody();const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??''};set('newCouponCode',c.code);set('newCouponLabel',c.label);set('newCouponType',c.type||'percent');set('newCouponPercent',c.percent??30);set('newCouponAmount',c.amount??100);set('newCouponMin',c.minCartValue??0);set('newCouponCap',c.maxDiscount??0);set('newCouponUses',c.maxUses??0);set('newCouponExpiry',c.expiresAt?String(c.expiresAt).slice(0,10):'');set('newCouponProducts',(c.productIds||[]).join(', '));document.getElementById('newCouponCode')?.scrollIntoView({behavior:'smooth',block:'center'});toast('Editing coupon '+c.code)};
window.cancelCouponEdit=()=>{editingCreatorCouponIndex=null;renderBody();toast('Coupon edit cancelled')};
window.saveCreatorCoupon=()=>{const s=ensureMerchandisingSettings(state.settings);const code=(document.getElementById('newCouponCode').value||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'');if(!code){toast('Enter a coupon code');return}if(s.creatorCoupons.some((c,i)=>i!==editingCreatorCouponIndex&&String(c.code).toUpperCase()===code)){toast('This code already exists');return}const type=document.getElementById('newCouponType').value;const expiry=document.getElementById('newCouponExpiry').value;const c={code,label:document.getElementById('newCouponLabel').value.trim()||code,type,percent:Math.max(1,Math.min(50,Number(document.getElementById('newCouponPercent').value||30))),amount:Math.max(1,Number(document.getElementById('newCouponAmount').value||100)),minCartValue:Math.max(0,Number(document.getElementById('newCouponMin').value||0)),maxDiscount:Math.max(0,Number(document.getElementById('newCouponCap').value||0)),maxUses:Math.max(0,Number(document.getElementById('newCouponUses').value===''?100:document.getElementById('newCouponUses').value)),expiresAt:expiry?new Date(expiry+'T23:59:59').toISOString():'',productIds:(document.getElementById('newCouponProducts').value||'').split(',').map(x=>x.trim()).filter(Boolean),enabled:editingCreatorCouponIndex!==null?(s.creatorCoupons[editingCreatorCouponIndex]?.enabled!==false):true,singleUse:true};if(editingCreatorCouponIndex!==null&&s.creatorCoupons[editingCreatorCouponIndex]){s.creatorCoupons[editingCreatorCouponIndex]=c;toast('Follower coupon updated')}else{s.creatorCoupons.push(c);toast('Follower coupon created')}editingCreatorCouponIndex=null;state.settings=s;save();renderBody()};
window.toggleCreatorCoupon=i=>{const s=ensureMerchandisingSettings(state.settings);if(s.creatorCoupons[i])s.creatorCoupons[i].enabled=s.creatorCoupons[i].enabled===false;state.settings=s;save();renderBody()};
window.deleteCreatorCoupon=i=>{const s=ensureMerchandisingSettings(state.settings);if(!s.creatorCoupons[i])return;if(!confirm('Delete this coupon from the public page? Existing used-coupon records remain.'))return;s.creatorCoupons.splice(i,1);if(editingCreatorCouponIndex===i)editingCreatorCouponIndex=null;else if(editingCreatorCouponIndex!==null&&editingCreatorCouponIndex>i)editingCreatorCouponIndex--;state.settings=s;save();renderBody()};
window.saveNextOrderOffer=()=>{const s=ensureMerchandisingSettings(state.settings);s.nextOrderOffer={...s.nextOrderOffer,enabled:document.getElementById('nextOfferEnabled').value==='1',percent:Math.max(1,Math.min(50,Number(document.getElementById('nextOfferPercent').value||30))),validityDays:Math.max(1,Math.min(365,Number(document.getElementById('nextOfferDays').value||14))),minCartValue:Math.max(0,Number(document.getElementById('nextOfferMin').value||0)),maxDiscount:Math.max(0,Number(document.getElementById('nextOfferMax').value||0)),productIds:(document.getElementById('nextOfferProducts').value||'').split(',').map(x=>x.trim()).filter(Boolean)};state.settings=s;save();toast('Next-order reward settings saved');renderBody()};
function limitedDropSettings(){const d=ensureMerchandisingSettings(state.settings).limitedDrops;return `<div class="section-head"><div><div class="eyebrow">LIMITED DROPS / FREEBIES</div><h2>Limited Edition rewards.</h2><p class="muted">Select the products that qualify. The gift is recorded on the order and does not add a customer charge.</p></div><button class="btn primary" onclick="saveLimitedDrops()">SAVE LIMITED DROP</button></div><div class="form-section premium-panel"><div class="form-grid"><div class="field"><label>LIMITED DROP ENABLED</label><select id="dropEnabled"><option value="1" ${d.enabled!==false?'selected':''}>ENABLED</option><option value="0" ${d.enabled===false?'selected':''}>PAUSED</option></select></div><div class="field"><label>SECTION TITLE</label><input id="dropTitle" value="${esc(d.title||'LIMITED ERA DROP')}"></div><div class="field" style="grid-column:1/-1"><label>FREEBIE DESCRIPTION</label><input id="dropGiftText" value="${esc(d.giftText||'Exclusive KRYVEN ERA collectible')}"></div><div class="field" style="grid-column:1/-1"><label>ELIGIBLE PRODUCT IDs (COMMA SEPARATED)</label><input id="dropProductIds" value="${esc((d.productIds||[]).join(', '))}" placeholder="KE001, KE007"></div></div><button class="btn primary" style="margin-top:14px" onclick="saveLimitedDrops()">SAVE LIMITED DROP</button></div>`}
window.saveLimitedDrops=()=>{const s=ensureMerchandisingSettings(state.settings);s.limitedDrops={enabled:document.getElementById('dropEnabled').value==='1',title:document.getElementById('dropTitle').value.trim()||'LIMITED ERA DROP',giftText:document.getElementById('dropGiftText').value.trim(),productIds:(document.getElementById('dropProductIds').value||'').split(',').map(x=>x.trim()).filter(Boolean)};state.settings=s;save();toast('Limited drop settings saved');renderBody()};

function payments(){const p=state.settings.payments;const adv=Math.max(0,Math.min(100,Number(p.codAdvancePercent??20)));return `<div class="section-head"><div><div class="eyebrow">CHECKOUT</div><h2>Payments.</h2></div><button class="btn primary" onclick="savePayments()">SAVE PAYMENT SETTINGS</button></div><div class="form-section premium-panel"><h4>Enable / disable methods</h4>${[['cod','Cash on Delivery'],['upi','UPI payment'],['card','Credit / Debit Card'],['bank','Net Banking']].map(([k,t])=>`<div class="toggle-row"><span>${t}</span><label class="switch"><input id="pay_${k}" type="checkbox" ${p[k]?'checked':''}><span class="slider"></span></label></div>`).join('')}<div class="form-grid" style="margin-top:14px"><div class="field"><label>COD ADVANCE % NOW</label><input id="pay_codAdvance" type="number" min="0" max="100" value="${adv}"></div><div class="field"><label>COD REMAINING % AFTER DELIVERY</label><input value="${100-adv}" disabled></div></div><p class="admin-note">Checkout shows the exact COD split configured here. UPI and card remain disabled until you enable them.</p></div>`}
window.savePayments=()=>{for(const k of ['cod','upi','card','bank'])state.settings.payments[k]=document.getElementById('pay_'+k).checked;state.settings.payments.codAdvancePercent=Math.max(0,Math.min(100,Number(document.getElementById('pay_codAdvance').value||20)));state.settings.payments.paymentSettingsVersion=3;save();renderBody()}
function customers(){
  const map={};
  state.orders.forEach(o=>{
    const key=o.customerId||o.customer?.id||o.customer?.phone||o.customer?.email||o.customer?.name||o.id;
    map[key]=Object.assign({},o.customer,{id:o.customerId||o.customer?.id||key,orders:(map[key]?.orders||0)+1,lastOrder:o.id,status:o.status});
  });
  const vals=Object.values(map);
  return `<div class="section-head"><div><div class="eyebrow">CUSTOMER DATA</div><h2>Customers.</h2><p class="muted">Every customer gets a unique ID. Use the ID to open the complete customer file.</p></div></div>
  <div class="form-section premium-panel"><div class="field" style="max-width:520px"><label>FIND CUSTOMER BY ID</label><div style="display:flex;gap:8px"><input id="customerLookup" placeholder="KE-C-XXXXXXX"><button class="btn primary" onclick="lookupCustomerById()">OPEN</button></div></div><div id="customerLookupResult"></div></div>
  <div class="form-section premium-panel"><div style="overflow:auto"><table class="table premium-table"><thead><tr><th>CUSTOMER ID</th><th>NAME</th><th>PHONE</th><th>CITY</th><th>ORDERS</th><th>LAST STATUS</th><th>ADDRESS</th></tr></thead><tbody>${vals.map(c=>`<tr><td><b>${esc(c.id||'')}</b></td><td>${esc(c.name||'')}</td><td>${esc(c.phone||'')}</td><td>${esc(c.city||'')}</td><td>${c.orders}</td><td><span class="status ${statusClass(c.status)}">${esc(c.status||'—')}</span></td><td>${esc(c.address||'')}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">No customer orders yet.</td></tr>'}</tbody></table></div></div>`;
}
window.lookupCustomerById=()=>{
  const id=(document.getElementById('customerLookup')?.value||'').trim().toUpperCase();
  const orders=state.orders.filter(o=>(o.customerId||o.customer?.id||'').toUpperCase()===id);
  const box=document.getElementById('customerLookupResult');
  if(!box)return;
  if(!orders.length){box.innerHTML='<div class="empty-state" style="margin-top:14px">Customer ID not found.</div>';return}
  const c=orders[0].customer||{};
  box.innerHTML=`<div class="customer-file" style="margin-top:16px"><div class="panel-head"><div><div class="eyebrow">${esc(id)}</div><h3>${esc(c.name||'Customer')}</h3></div><span class="chip gold">${orders.length} ORDER${orders.length===1?'':'S'}</span></div><div class="form-grid"><div><b>Phone</b><p>${esc(c.phone||'')}</p></div><div><b>Email</b><p>${esc(c.email||'')}</p></div><div><b>Address</b><p>${esc(c.address||'')}</p></div><div><b>Landmark</b><p>${esc(c.landmark||'')}</p></div><div><b>City / State</b><p>${esc(c.city||'')} / ${esc(c.state||'')}</p></div><div><b>Pincode</b><p>${esc(c.pincode||'')}</p></div></div><h4 style="margin-top:18px">Orders</h4>${orders.map(o=>`<button class="arrival-card" style="width:100%;margin-top:8px" onclick="openOrder(${state.orders.indexOf(o)})"><div><b>${esc(o.id)}</b><p>${esc(o.items?.map(x=>x.name||x.id).join(', ')||'Order')}</p></div><div><span class="status ${statusClass(o.status)}">${esc(o.status)}</span><b>${money(o.total||0)}</b></div></button>`).join('')}</div>`;
};
function reviews(){return `<div class="section-head"><div><div class="eyebrow">SOCIAL PROOF</div><h2>Reviews.</h2></div></div><div style="display:grid;gap:10px">${state.reviews.map((r,i)=>{const p=state.products.find(x=>x.id===r.productId);return `<div class="review premium-panel"><div class="review-head"><div><b>${esc(r.name)}</b><div class="muted">${esc(p?.name||r.productId)} · ${'★'.repeat(r.rating)}</div></div><button class="btn danger" onclick="deleteReview(${i})">DELETE</button></div><p>${esc(r.text)}</p></div>`}).join('')||'<div class="form-section premium-panel"><div class="muted">No reviews yet.</div></div>'}</div>`}
window.deleteReview=i=>{state.reviews.splice(i,1);save();renderBody()}
function searchPanel(){const entries=Object.entries(state.searches||{}).sort((a,b)=>b[1]-a[1]);return `<div class="section-head"><div><div class="eyebrow">DISCOVERY</div><h2>Search & barcode.</h2></div></div><div class="form-section premium-panel"><h4>Top searches</h4>${entries.length?`<div class="chips">${entries.slice(0,20).map(([q,n])=>`<span class="chip gold">${esc(q)} · ${n}</span>`).join('')}</div>`:'<p class="muted">Search analytics will appear here.</p>'}</div><div class="form-section premium-panel"><h4>Barcode catalog</h4><div style="overflow:auto"><table class="table premium-table"><thead><tr><th>BARCODE</th><th>PRODUCT</th><th>STOCK</th></tr></thead><tbody>${state.products.map(p=>`<tr><td>${esc(p.barcode||'—')}</td><td>${esc(p.name)}</td><td>${p.stock}</td></tr>`).join('')}</tbody></table></div></div>`}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kryven-era-data.json';a.click()}
function exportOrders(){const head=['Order ID','Created','Customer','Phone','Address','Expected arrival','Courier','Tracking','Total','Advance paid','Remaining due','Payment','Status'];const rows=state.orders.map(o=>[o.id,o.createdAt,o.customer?.name||'',o.customer?.phone||'',`${o.customer?.houseNumber?o.customer.houseNumber+', ':''}${o.customer?.address||''}${o.customer?.landmark?', '+o.customer.landmark:''}, ${o.customer?.city||''}, ${o.customer?.state||''}, ${o.customer?.pincode||''}`,o.expectedDeliveryDate,o.courier||'',o.trackingNumber||'',o.total||0,o.advancePaid||0,o.remainingDue??Math.max(0,(o.total||0)-(o.advancePaid||0)),o.payment||'',o.status||'']);const csv=[head,...rows].map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kryven-era-orders.csv';a.click()}
window.exportData=exportData;window.exportOrders=exportOrders;
loadCloudOrders().finally(()=>{app();watchCloudOrders()});
