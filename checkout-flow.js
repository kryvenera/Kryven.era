(()=>{
'use strict';
const STATE_KEY='kryven-era-state-v3';
const CART_KEY='kryven-era-cart-v2';
const DRAFT_KEY='kryven-era-checkout-draft-v1';
const SUPABASE_URL='https://iisezaptudifgwkjxnkh.supabase.co';
const SUPABASE_KEY='sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
const fallback={products:[
{id:'KE001',name:'Kryven Era Logo Tee',price:1299,mrp:1999,images:['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85'],sizes:{S:true,M:true,L:true,XL:true,XXL:false},colors:['Black','White','Silver']},
{id:'KE002',name:'Kryven Signature Hoodie',price:2499,mrp:3199,images:['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85'],sizes:{S:true,M:true,L:true,XL:false,XXL:true},colors:['Black','Stone']},
{id:'KE003',name:'Kryven Era Cargo Pants',price:1999,mrp:2599,images:['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85'],sizes:{S:false,M:true,L:true,XL:true,XXL:true},colors:['Black','Graphite']}
]};
function readState(){let s={};try{s=JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{};s.products=Array.isArray(s.products)&&s.products.length?s.products:fallback.products;s.cart=Array.isArray(s.cart)?s.cart:[];s.profile=Object.assign({name:'',email:'',phone:'',address:'',landmark:'',houseNumber:'',city:'',state:'',pincode:'',customerId:''},s.profile||{});s.settings=Object.assign({currency:'₹',shipping:0,brand:'KRYVEN ERA',payments:{cod:true}},s.settings||{});s.settings.payments=Object.assign({cod:true,codAdvancePercent:20},s.settings.payments||{});s.orders=Array.isArray(s.orders)?s.orders:[];return s}
let state=readState();
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(CART_KEY,JSON.stringify(state.cart))}catch{}}
function productId(x){return x?.id??x?.productId??x?.product_id??x?.sku??x?.product?.id??x?.product?.productId??''}
function product(id){const key=String(id??'');if(key==='ERA_PASS_90'){const m=state.settings?.membership||{};return{id:'ERA_PASS_90',name:'THE ERA PASS · 90-DAY MEMBERSHIP',category:'Membership',price:Math.max(1,num(m.price??69)),images:['logo-icon.png'],sizes:{},colors:[],description:'90-day KRYVEN ERA membership'}}return state.products.find(p=>String(p?.id??p?.productId??p?.product_id??p?.sku)===key)||fallback.products.find(p=>String(p?.id)===key)||null}
function num(v){if(typeof v==='number'&&Number.isFinite(v))return v;if(v===null||v===undefined)return 0;const n=Number(String(v).replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:0}
function productUnitPrice(p,x={}){const currentCandidates=[p?.price,p?.sellingPrice,p?.salePrice,p?.finalPrice,p?.discountedPrice,p?.unitPrice,p?.amount,p?.pricing?.price,p?.pricing?.sellingPrice];for(const v of currentCandidates){const n=num(v);if(n>0)return n}const snapCandidates=[x?.unitPrice,x?.cartPrice,x?.priceAtAdd,x?.originalUnitPrice,x?.price,x?.salePrice,x?.sellingPrice,x?.finalPrice,x?.discountedPrice,x?.amount,x?.pricing?.price];for(const v of snapCandidates){const n=num(v);if(n>0)return n}return 0}
function productName(p,x={}){return p?.name||x?.name||x?.title||x?.productName||x?.id||'Product'}
function productImage(p,x={}){return p?.images?.[0]||p?.image||x?.image||x?.imageUrl||''}
function money(n){return `${state.settings.currency||'₹'}${num(n).toLocaleString('en-IN',{maximumFractionDigits:2})}`}
function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function getCart(){try{const raw=localStorage.getItem(CART_KEY);if(raw!==null){const x=JSON.parse(raw);if(Array.isArray(x)){state.cart=x;return x}}}catch{};state.cart=Array.isArray(state.cart)?state.cart:[];return state.cart}
function offerActive(p){const o=p?.offer||{}, setting=state.settings?.offers||{};return !!o.enabled&&((o.type==='percent'&&setting.percent50?.enabled!==false)||(o.type==='bogo'&&setting.bogo?.enabled!==false))}
function linePrice(p,q,x={}){q=Math.max(1,num(q)||1);const unit=productUnitPrice(p,x);if(!unit)return 0;if(!offerActive(p))return unit*q;const o=p.offer||{};if(o.type==='percent'){const pct=Math.max(1,Math.min(100,num(o.percent)||50));return Math.round(unit*q*(1-pct/100))}if(o.type==='bogo')return unit*(q-Math.floor(q/2));return unit*q}
function pricing(){const cart=getCart();let subtotal=0,after=0;for(const x of cart){const p=product(x.id);const q=Math.max(1,num(x.qty)||1);const unit=productUnitPrice(p,x);if(!unit)continue;subtotal+=unit*q;after+=linePrice(p,q,x)}const discount=Math.max(0,subtotal-after);const shipping=num(state.settings.shipping);return{subtotal,discount,shipping,total:Math.max(0,after+shipping)}}
function customerId(){let id=state.profile.customerId||localStorage.getItem('kryven-era-customer-id')||'';if(!id){const seed=(state.profile.phone||state.profile.email||state.profile.name||'customer')+'|'+Date.now();let h=0;for(let i=0;i<seed.length;i++)h=((h<<5)-h)+seed.charCodeAt(i)|0;id='KE-C-'+Math.abs(h).toString(36).toUpperCase().slice(-7);localStorage.setItem('kryven-era-customer-id',id)}state.profile.customerId=id;return id}
function loadDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{}}catch{return {}}}
function saveDraft(fromForm=true){const q=loadDraft();if(fromForm){const ids=['coName','coPhone','coEmail','coAddress','coLandmark','coHouse','coCity','coState','coPin'];for(const id of ids){const el=document.getElementById(id);if(el)q[({coName:'name',coPhone:'phone',coEmail:'email',coAddress:'address',coLandmark:'landmark',coHouse:'houseNumber',coCity:'city',coState:'state',coPin:'pincode'})[id]]=el.value.trim()}}state.profile={...state.profile,...q,customerId:customerId()};try{localStorage.setItem(DRAFT_KEY,JSON.stringify(state.profile))}catch{};saveState()}
function normalizeCart(){let carts=[];try{const a=JSON.parse(localStorage.getItem(CART_KEY)||'null');if(Array.isArray(a))carts.push(a)}catch{};if(Array.isArray(state.cart)&&state.cart.length)carts.push(state.cart);const merged=[];for(const c of carts){for(const raw of c||[]){if(!raw)continue;const id=productId(raw);if(!id)continue;const x={...raw,id:String(id),qty:Math.max(1,Number(raw.qty||1))};const pr=product(id);const current=Number(pr?.price||0);if(current>0)x.unitPrice=current;else if(!(num(x.unitPrice)>0)){const inferred=productUnitPrice(pr,x);if(inferred>0)x.unitPrice=inferred}const key=String(id)+'|'+String(x.size||'')+'|'+String(x.color||'');const found=merged.find(y=>y._key===key);if(found){found.qty=Math.max(1,Number(found.qty||1),x.qty);if(!(num(found.unitPrice)>0)&&num(x.unitPrice)>0)found.unitPrice=x.unitPrice}else merged.push({...x,_key:key})}}for(const x of merged)delete x._key;return merged}
function isMembershipOnlyCart(){const cart=normalizeCart();return cart.length>0&&cart.every(x=>String(x.id)==='ERA_PASS_90')}
function validate(){saveDraft(true);const memberOnly=isMembershipOnlyCart();const req=[['coName','Full name'],['coPhone','Mobile number']];if(!memberOnly)req.push(['coAddress','Full address'],['coLandmark','Landmark'],['coCity','City'],['coState','State'],['coPin','Pincode']);let ok=true;for(const [id,label] of req){const el=document.getElementById(id);el?.classList.remove('field-invalid');document.querySelector(`#err-${id}`)?.remove();if(!el?.value.trim()){ok=false;if(el){el.classList.add('field-invalid');const e=document.createElement('div');e.id=`err-${id}`;e.className='checkout-field-error';e.textContent=`${label} is required`;el.parentElement.appendChild(e)}}}const phone=(document.getElementById('coPhone')?.value||'').replace(/\D/g,'');if(phone&&!/^\d{10}$/.test(phone)){ok=false;const el=document.getElementById('coPhone');el.classList.add('field-invalid');const e=document.createElement('div');e.id='err-coPhone-valid';e.className='checkout-field-error';e.textContent='Enter a valid 10-digit mobile number';el.parentElement.appendChild(e)}const pin=document.getElementById('coPin')?.value.trim()||'';if(!memberOnly&&pin&&!/^\d{6}$/.test(pin)){ok=false;const el=document.getElementById('coPin');el.classList.add('field-invalid');const e=document.createElement('div');e.id='err-coPin-valid';e.className='checkout-field-error';e.textContent='Enter a valid 6-digit pincode';el.parentElement.appendChild(e)}return ok}

async function loadLiveCatalogForCheckout(){
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/kryven_store_state?id=eq.1&select=state`,{method:'GET',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:'no-store'});
    if(!res.ok)return false;
    const rows=await res.json();
    const cloud=rows?.[0]?.state;
    if(!cloud||!Array.isArray(cloud.products)||!cloud.products.length)return false;
    state.products=cloud.products;
    state.settings=Object.assign({},state.settings,cloud.settings||{});
    state.settings.payments=Object.assign({cod:true,codAdvancePercent:20},state.settings.payments||{});
    saveState();
    return true;
  }catch{return false}
}
function loadCashfree(){return new Promise((resolve,reject)=>{if(typeof window.Cashfree==='function')return resolve(window.Cashfree);const s=document.createElement('script');s.src='https://sdk.cashfree.com/js/v3/cashfree.js';s.async=true;s.onload=()=>resolve(window.Cashfree);s.onerror=()=>reject(new Error('Cashfree SDK could not be loaded. Please check your connection.'));document.head.appendChild(s)})}

// =====================================================================================
// KRYVEN ERA — minimal checkout.  Every online/COD order is paid through Cashfree and
// is confirmed ONLY after the server has verified the payment with Cashfree.
// Prices shown here are for display; the server recomputes the real amount.
// =====================================================================================
const PENDING_KEY='kryven-era-pending-v4';
const ORDER_ID_RE=/^[A-Za-z0-9_-]{1,50}$/;
const $=id=>document.getElementById(id);
let eraMembershipActive=false, selectedEraCoupon=null, eraCouponError='';
const ERA_COUPON_KEY='kryven-era-selected-coupon';

function advancePct(){const raw=state.settings.payments?.codAdvancePercent;const n=raw===undefined||raw===null||raw===''?20:num(raw);return Math.max(0,Math.min(100,n))}
function quote(){
  const cart=normalizeCart(),membership=state.settings?.membership||{};let subtotal=0,after=0,shirtPosition=0;const lines=[];
  const coupon=selectedEraCoupon;
  for(const x of cart){
    const p=product(x.id),qty=Math.max(1,num(x.qty)||1),unit=productUnitPrice(p,x);if(!unit)continue;
    const line={x,p,qty,unit,line:unit*qty};subtotal+=unit*qty;lines.push(line);
  }
  const couponIds=new Set(Array.isArray(coupon?.productIds)?coupon.productIds.map(String):[]);
  let couponDiscount=0,couponError='';
  if(coupon){
    const eligible=lines.filter(l=>String(l.x.id)!=='ERA_PASS_90'&&(!couponIds.size||couponIds.has(String(l.x.id))));
    const eligibleSubtotal=eligible.reduce((n,l)=>n+l.unit*l.qty,0);
    if(!eligible.length)couponError='This code does not apply to any item in your bag.';
    else if(eligibleSubtotal<(Number(coupon.minCartValue)||0))couponError=`This code needs at least ${money(Number(coupon.minCartValue)||0)} in eligible products.`;
    else{
      const wanted=coupon.type==='fixed'?Math.max(0,Number(coupon.amount)||0):eligibleSubtotal*Math.max(0,Math.min(100,Number(coupon.percent)||0))/100;
      couponDiscount=Math.round(Math.min(eligibleSubtotal,Number(coupon.maxDiscount)>0?Number(coupon.maxDiscount):eligibleSubtotal,wanted)*100)/100;
      let remain=couponDiscount;
      for(let i=eligible.length-1;i>=0;i--){const l=eligible[i],base=l.unit*l.qty;const part=i===0?remain:Math.round(couponDiscount*(base/eligibleSubtotal)*100)/100;const actual=Math.min(l.line,Math.max(0,part));l.line=Math.round(Math.max(0,l.line-actual)*100)/100;remain=Math.round((remain-actual)*100)/100}
    }
    after=lines.reduce((n,l)=>n+l.line,0);
  }else{
    for(const l of lines){
      const {x,p,qty,unit}=l;
      if(String(x.id)==='ERA_PASS_90'){l.line=unit;after+=l.line;continue}
      const eligibleIds=Array.isArray(membership.eligibleProductIds)?membership.eligibleProductIds.map(String):[];
      const isTee=String(p.category||'').toLowerCase().includes('t-shirt')&&(!eligibleIds.length||eligibleIds.includes(String(x.id)));
      if(eraMembershipActive&&isTee){
        const tiers=Array.isArray(membership.tshirtPositionPercents)?membership.tshirtPositionPercents:[60,40,20,0,70];const hasOverride=Object.prototype.hasOwnProperty.call(membership.productMemberPrices||{},x.id)&&membership.productMemberPrices[x.id]!==''&&membership.productMemberPrices[x.id]!==null;const override=Number(membership.productMemberPrices?.[x.id]);let amount=0;
        for(let i=0;i<qty;i++){const tier=shirtPosition<5?shirtPosition:0;const pct=membership.bundleEnabled===false?Math.max(0,Math.min(100,Number(membership.memberPricePercent??60))):Math.max(0,Math.min(100,Number(tiers[tier]??(tier===0?membership.memberPricePercent??60:70))));const explicitPrice=hasOverride&&(membership.bundleEnabled===false||shirtPosition===0);amount+=explicitPrice?Math.min(unit,Math.max(0,Number.isFinite(override)?override:unit)):Math.round(unit*pct)/100;shirtPosition++}
        l.line=Math.round(amount*100)/100;
      }else l.line=linePrice(p,qty,x);
      after+=l.line;
    }
  }
  const membershipOnly=cart.length>0&&cart.every(x=>String(x.id)==='ERA_PASS_90');
  const shipping=membershipOnly?0:num(state.settings.shipping);after=Math.max(0,after);
  const total=Math.max(0,Math.round((after+shipping)*100)/100),advance=Math.min(total,Math.round(total*advancePct()/100));
  const drop=state.settings?.limitedDrops||{};const dropIds=new Set(Array.isArray(drop.productIds)?drop.productIds.map(String):[]);const freebie=drop.enabled!==false&&dropIds.size&&lines.some(l=>String(l.x.id)!=='ERA_PASS_90'&&dropIds.has(String(l.x.id)))?{title:String(drop.title||'LIMITED ERA DROP'),giftText:String(drop.giftText||'Exclusive KRYVEN ERA collectible'),productIds:lines.filter(l=>dropIds.has(String(l.x.id))).map(l=>String(l.x.id))}:null;return {lines,subtotal,discount:Math.max(0,Math.round((subtotal-after)*100)/100),shipping,total,advance,remaining:Math.max(0,total-advance),pct:advancePct(),couponDiscount,couponError,appliedCoupon:coupon?.code||'' ,membershipOnly,freebie};
}

const codAvailable=q=>state.settings.payments?.cod!==false&&q.advance>=1&&q.total>0;

function newOrderId(){
  const r=new Uint32Array(2);crypto.getRandomValues(r);
  return `KE-${new Date().getFullYear()}-${100+r[0]%900}-${String(10000+r[1]%90000)}`;
}
// Same details + same choice => same order id, so a refresh / back button never creates a second order.
function pendingIdFor(signature){
  try{const p=JSON.parse(sessionStorage.getItem(PENDING_KEY)||'null');if(p&&p.sig===signature&&ORDER_ID_RE.test(p.id||''))return p.id}catch{}
  const id=newOrderId();try{sessionStorage.setItem(PENDING_KEY,JSON.stringify({sig:signature,id}))}catch{}
  return id;
}
const resetPending=()=>{try{sessionStorage.removeItem(PENDING_KEY)}catch{}};

function headerHTML(href,label){
  return `<header class="mn-header"><div class="mn-bar"><a class="mn-logo" href="index.html" aria-label="KRYVEN ERA home"><img src="logo-primary.png" alt="KRYVEN ERA"></a><a class="mn-link" href="${href}">${label}</a></div></header>`;
}
function fieldHTML(id,label,kind,value,opts={}){
  const required=opts.required?' required':'';
  const hint=opts.optional?'<span class="ck-opt"> (optional)</span>':'';
  const cls=`ck-field${opts.full?' full':''}`;
  if(kind==='textarea')return `<div class="${cls}"><label for="${id}">${label}${hint}</label><textarea id="${id}" rows="3" autocomplete="street-address" placeholder="${opts.ph||''}">${esc(value||'')}</textarea></div>`;
  const type=kind==='email'?'email':'text';
  const mode=kind==='tel'?' inputmode="tel"':(id==='coPin'?' inputmode="numeric" maxlength="6"':'');
  const ac=({coName:'name',coPhone:'tel',coEmail:'email',coCity:'address-level2',coState:'address-level1',coPin:'postal-code'})[id]||'off';
  return `<div class="${cls}"><label for="${id}">${label}${hint}</label><input id="${id}" type="${type}"${mode} autocomplete="${ac}" placeholder="${opts.ph||''}" value="${esc(value||'')}"${required}></div>`;
}

function checkoutHTML(){
  const q=quote(),d={...state.profile};for(const [k,v] of Object.entries(loadDraft()))if(v!==undefined&&v!==null&&String(v).trim()!=='')d[k]=v;const cod=!q.membershipOnly&&codAvailable(q);
  const items=q.lines.map(({x,p,qty,line})=>`<div class="ck-item"><img src="${esc(productImage(p,x))}" alt=""><div><b>${esc(productName(p,x))}</b><small>${esc(x.color||'')}${x.size?' · '+esc(x.size):''} · Qty ${qty}</small></div><span>${money(line)}</span></div>`).join('');
  const delivery=q.membershipOnly?`<section class="ck-section"><h2>Account details</h2><div class="ck-fields">${fieldHTML('coName','Full name','text',d.name,{full:true,ph:'Your name'})}${fieldHTML('coPhone','Mobile number','tel',d.phone,{ph:'10-digit number'})}${fieldHTML('coEmail','Email','email',d.email,{optional:true,ph:'name@example.com'})}</div><p class="ck-note">ERA PASS is digital and will be linked to your signed-in account. No delivery address is needed.</p></section>`:`<section class="ck-section"><h2>Delivery</h2><div class="ck-fields">${fieldHTML('coName','Full name','text',d.name,{full:true,ph:'Your name'})}${fieldHTML('coPhone','Mobile number','tel',d.phone,{ph:'10-digit number'})}${fieldHTML('coEmail','Email','email',d.email,{optional:true,ph:'name@example.com'})}${fieldHTML('coAddress','Address','textarea',d.address,{full:true,ph:'House, street, area'})}${fieldHTML('coLandmark','Landmark','text',d.landmark,{ph:'Nearby landmark'})}${fieldHTML('coHouse','House / building no.','text',d.houseNumber,{optional:true,ph:'Flat 402'})}${fieldHTML('coCity','City','text',d.city,{ph:'City'})}${fieldHTML('coState','State','text',d.state,{ph:'State'})}${fieldHTML('coPin','Pincode','text',d.pincode,{ph:'6 digits'})}</div></section>`;
  const signed=!!window.KEAuth?.isSignedIn();
  return `${headerHTML('bag.html','Back to bag')}<main class="ck"><h1 class="ck-title">Checkout</h1>
  ${!signed?`<div class="ck-account-prompt"><span>Save your details, membership and one-use rewards to your account.</span><button type="button" onclick="KEAuth.open()">SIGN IN / CREATE ACCOUNT</button></div>`:''}
  <div class="ck-grid"><form class="ck-form" id="ckForm" novalidate>${delivery}
  <section class="ck-section"><h2>Offers & coupon</h2><div class="ck-coupon-row"><input id="ckCouponCode" autocomplete="off" maxlength="40" placeholder="Follower / Spin / next-order code" value="${esc(selectedEraCoupon?.code||(window.KEAuth?.isSignedIn()?localStorage.getItem(ERA_COUPON_KEY):'')||'')}"><button type="button" id="ckCouponApply" onclick="window.applyEraCheckoutCoupon()">APPLY</button></div><div id="ckCouponMessage" class="ck-coupon-message">${esc(q.couponError||eraCouponError||(q.appliedCoupon?`Code ${q.appliedCoupon} ready.`:'One primary coupon per order. Discounts do not stack.'))}</div>${q.appliedCoupon?`<button type="button" class="ck-coupon-remove" onclick="window.removeEraCheckoutCoupon()">REMOVE CODE</button>`:''}</section>
  <section class="ck-section"><h2>Payment</h2><div class="ck-pays" role="radiogroup" aria-label="Payment option"><label class="ck-pay"><input type="radio" name="payMode" value="online" checked><span><b>Pay online</b><small>UPI, card or net banking · ${money(q.total)}</small></span></label>${cod?`<label class="ck-pay"><input type="radio" name="payMode" value="cod"><span><b>Cash on delivery</b><small>Pay ${money(q.advance)} now (${q.pct}%) to confirm · ${money(q.remaining)} on delivery</small></span></label>`:''}</div></section>
  <div id="checkoutError" class="ck-error" role="alert"></div><button class="ck-submit" id="payBtn" type="submit">Pay ${money(q.total)}</button><p class="ck-note">Secured by Cashfree. Your order is confirmed only once the payment succeeds.</p></form>
  <aside class="ck-summary" aria-label="Order summary"><h2>Your order</h2><div class="ck-items">${items}</div>${q.freebie?`<div class="ck-freebie-note"><b>LIMITED DROP GIFT INCLUDED</b><span>${esc(q.freebie.giftText)}</span></div>`:''}<div class="ck-lines"><div><span>Subtotal</span><span>${money(q.subtotal)}</span></div>${q.discount>0?`<div><span>Offer savings</span><span>−${money(q.discount)}</span></div>`:''}<div><span>Shipping</span><span>${q.shipping?money(q.shipping):'Free'}</span></div>${q.appliedCoupon?`<div><span>Applied code</span><span>${esc(q.appliedCoupon)}</span></div>`:''}<div class="total"><span>Total</span><span>${money(q.total)}</span></div><div class="split"><span>Pay now</span><span id="sumNow">${money(q.total)}</span></div><div class="split"><span>Pay on delivery</span><span id="sumLater">${money(0)}</span></div></div></aside></div></main>`;
}

function selectedMode(){return document.querySelector('input[name="payMode"]:checked')?.value==='cod'?'cod':'online'}
function refreshPayUI(){
  const q=quote(),cod=selectedMode()==='cod'&&codAvailable(q);
  const now=cod?q.advance:q.total;
  if($('sumNow'))$('sumNow').textContent=money(now);
  if($('sumLater'))$('sumLater').textContent=money(cod?q.remaining:0);
  const b=$('payBtn');if(b&&!b.dataset.busy)b.textContent=`Pay ${money(now)}`;
}
function showError(msg){const b=$('checkoutError');if(b){b.textContent=msg;b.classList.add('show');b.scrollIntoView({block:'nearest',behavior:'smooth'})}}
function clearError(){const b=$('checkoutError');if(b){b.textContent='';b.classList.remove('show')}}
function setBusy(on,label){
  const b=$('payBtn');if(!b)return;
  if(on){b.dataset.busy='1';b.disabled=true;b.textContent=label||'Please wait…'}
  else{delete b.dataset.busy;b.disabled=false;refreshPayUI()}
}
function validateAll(){
  let ok=validate();
  const email=$('coEmail');
  if(email){
    email.classList.remove('field-invalid');$('err-coEmail')?.remove();
    const v=email.value.trim();
    if(v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ok=false;email.classList.add('field-invalid');const e=document.createElement('div');e.id='err-coEmail';e.className='checkout-field-error';e.textContent='Enter a valid email or leave it blank';email.parentElement.appendChild(e)}
  }
  if(!ok)document.querySelector('.field-invalid')?.focus({preventScroll:false});
  return ok;
}
function buildPayload(mode,q,orderId){
  const c=state.profile;
  return {
    order_id:orderId,mode,client_amount:mode==='cod'?q.advance:q.total,customer_id:customerId(),coupon_code:selectedEraCoupon?.code||'',
    items:q.lines.map(({x,qty})=>({id:String(x.id),qty,size:x.size||'',color:x.color||''})),
    customer:{name:c.name,phone:c.phone,email:c.email,address:c.address,landmark:c.landmark,houseNumber:c.houseNumber,city:c.city,state:c.state,pincode:c.pincode}
  };
}
async function postOrder(payload){
  const headers={'Content-Type':'application/json'};if(window.KEAuth?.accessToken?.())headers.Authorization=`Bearer ${window.KEAuth.accessToken()}`;const resp=await fetch('/api/create-order',{method:'POST',headers,body:JSON.stringify(payload)});
  const data=await resp.json().catch(()=>({}));
  return {resp,data};
}

let submitting=false;
async function submitPayment(ev){
  ev.preventDefault();
  if(submitting)return;
  clearError();
  if(!validateAll())return;
  const q=quote(),mode=selectedMode();
  if(!q.lines.length||!(q.total>0)){showError('We could not calculate your total. Please go back to your bag and try again.');return}
  if(mode==='cod'&&!codAvailable(q)){showError('Cash on delivery is not available. Please pay online.');return}
  if(q.couponError){showError(q.couponError);return}
  if(selectedEraCoupon&&q.couponDiscount<=0){showError('This coupon does not apply to the current bag.');return}
  if(isMembershipOnlyCart()&&!window.KEAuth?.isSignedIn()){showError('Sign in or create an account before purchasing the ERA PASS.');window.KEAuth?.open();return}
  submitting=true;setBusy(true,'Preparing payment…');
  try{
    if(window.KEAuth?.isSignedIn()){const c=state.profile;try{await window.KEAuth.authFetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:c.name,phone:c.phone,address:c.address,landmark:c.landmark,houseNumber:c.houseNumber,city:c.city,state:c.state,pincode:c.pincode})})}catch(e){throw new Error('We could not save your details to your account. Please check your connection and try again.')} }

    const signature=JSON.stringify([mode,q.lines.map(l=>[l.x.id,l.x.size||'',l.x.color||'',l.qty]),['name','phone','email','address','landmark','houseNumber','city','state','pincode'].map(k=>state.profile[k]||''),selectedEraCoupon?.code||'']);
    let orderId=pendingIdFor(signature),result=await postOrder(buildPayload(mode,q,orderId));
    if(result.resp.status===409&&result.data?.code==='RETRY_WITH_NEW_ID'){
      resetPending();orderId=pendingIdFor(signature);result=await postOrder(buildPayload(mode,q,orderId));
    }
    const {resp,data}=result;
    if(resp.status===409&&data?.code==='ALREADY_PAID'){location.href=`payment.html?cashfree_return=1&order_id=${encodeURIComponent(orderId)}`;return}
    if(resp.status===409&&data?.code==='PRICE_CHANGED'){
      await loadLiveCatalogForCheckout();renderCheckout();
      showError('Prices were just updated. Please review your order and pay again.');return;
    }
    if(!resp.ok||!data.payment_session_id)throw new Error(data?.error||'Payment could not be started. Please try again.');
    setBusy(true,'Opening Cashfree…');
    const Factory=await loadCashfree();
    const cf=Factory({mode:data.cashfree_mode||'production'});
    const out=await cf.checkout({paymentSessionId:data.payment_session_id,redirectTarget:'_self'});
    if(out?.error)throw new Error(out.error.message||'Cashfree checkout could not open');
  }catch(e){
    console.error(e);showError(e?.message||'Payment could not be started. Please try again.');
  }finally{
    submitting=false;setBusy(false);
  }
}

function renderCheckout(){
  const root=$('checkoutApp');
  if(!getCart().length){
    root.innerHTML=`${headerHTML('shop.html','Shop')}<main class="ck"><div class="rs"><h1 class="rs-title">Your bag is empty</h1><p class="rs-text">Add something you like and come back to check out.</p><div class="rs-actions"><a class="rs-btn" href="shop.html">Continue shopping</a></div></div></main>`;
    return;
  }
  root.innerHTML=checkoutHTML();
  for(const id of ['coName','coPhone','coEmail','coAddress','coLandmark','coHouse','coCity','coState','coPin'])$(id)?.addEventListener('input',()=>saveDraft(true));
  $('ckCouponCode')?.addEventListener('input',()=>{eraCouponError='';if(selectedEraCoupon&&String($('ckCouponCode').value||'').trim().toUpperCase()!==selectedEraCoupon.code){selectedEraCoupon=null;try{localStorage.removeItem(ERA_COUPON_KEY)}catch{};renderCheckout()}});
  document.querySelectorAll('input[name="payMode"]').forEach(r=>r.addEventListener('change',refreshPayUI));
  $('ckForm').addEventListener('submit',submitPayment);
  refreshPayUI();
}

// ------------------------- Payment result page (Cashfree return) -------------------------
function resultHTML({tone,title,text,id,rows,actions}){
  return `${headerHTML('index.html','Home')}<main class="ck"><div class="rs ${tone||''}"><div class="rs-mark" aria-hidden="true">${tone==='ok'?'✓':tone==='err'?'×':'…'}</div><h1 class="rs-title">${title}</h1><p class="rs-text">${text||''}</p>${id?`<p class="rs-id">Order ID <b>${esc(id)}</b></p>`:''}${rows?`<div class="rs-rows">${rows}</div>`:''}<div class="rs-actions">${actions||''}</div></div></main>`;
}
function storeConfirmedOrder(o){
  try{
    state=readState();
    const local={id:o.id,createdAt:new Date().toISOString(),customerId:customerId(),customer:{...state.profile},
      items:(o.items||[]).map(x=>({...x})),subtotal:num(o.subtotal)||num(o.total),discount:num(o.discount),shipping:num(o.shipping),total:num(o.total),
      payment:o.payment,status:'Placed',paymentVerified:true,paymentStatus:'SUCCESS',advancePaid:num(o.paidNow),remainingDue:num(o.remaining)};
    state.orders=[local,...state.orders.filter(x=>x.id!==o.id)];
    state.cart=[];saveState();
    localStorage.removeItem('kryven-cashfree-pending-order');
    sessionStorage.removeItem('kryven-era-cart-backup-v1'); // app.js would otherwise restore the bag we just paid for
  }catch{}
  resetPending();
}
async function renderPayment(){
  const root=$('paymentApp');
  const url=new URL(location.href);
  const oid=url.searchParams.get('order_id')||'';
  if(!url.searchParams.get('cashfree_return')||!ORDER_ID_RE.test(oid)){
    root.innerHTML=resultHTML({title:'No payment in progress',text:'Start from your bag to place an order.',actions:'<a class="rs-btn" href="bag.html">Go to bag</a>'});
    return;
  }
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const view=(h)=>{root.innerHTML=h};
  view(resultHTML({tone:'wait',title:'Confirming your payment',text:'This takes a few seconds. Please don’t close this page.',id:oid}));
  let last=null,paidUnrecorded=false;
  for(let attempt=0;attempt<30;attempt++){
    try{
      const r=await fetch('/api/status?orderId='+encodeURIComponent(oid),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));last=d;
      if(d.paid&&d.recorded&&d.order){
        storeConfirmedOrder(d.order);
        const o=d.order;
        view(resultHTML({tone:'ok',title:'Order confirmed',text:'Thank you. Your payment was received and your order is placed.',id:o.id,
          rows:`<div><span>Paid now</span><b>${money(o.paidNow)}</b></div>${num(o.remaining)>0?`<div><span>Pay on delivery</span><b>${money(o.remaining)}</b></div>`:''}`,
          actions:`<a class="rs-btn primary" href="tracking.html?order_id=${encodeURIComponent(o.id)}">Track order</a><a class="rs-btn" href="shop.html">Continue shopping</a>`}));
        return;
      }
      if(d.paid&&!d.recorded)paidUnrecorded=true;
      if(d.failed){
        view(resultHTML({tone:'err',title:'Payment not completed',text:'No order was placed. If money was deducted, it is usually returned to your account automatically; contact us with the order ID below if it is not.',id:oid,
          actions:'<a class="rs-btn primary" href="checkout.html">Try again</a><a class="rs-btn" href="help-care.html">Contact support</a>'}));
        return;
      }
      if(d.status==='AMOUNT_MISMATCH'){
        view(resultHTML({tone:'err',title:'We need to check this payment',text:'The amount received does not match your order, so it has not been confirmed. Please contact us with the order ID below.',id:oid,actions:'<a class="rs-btn primary" href="help-care.html">Contact support</a>'}));
        return;
      }
    }catch(e){console.warn('status check failed',e)}
    await sleep(2000);
  }
  view(resultHTML({tone:'wait',title:paidUnrecorded?'Payment received':'Still confirming',
    text:paidUnrecorded?'We received your payment and are finishing your order. It will appear under Track order shortly. Keep the order ID below.':'We have not heard back from the bank yet. If money was deducted, your order is confirmed automatically once the bank responds. Keep the order ID below.',
    id:oid,actions:'<button class="rs-btn primary" type="button" id="recheck">Check again</button><a class="rs-btn" href="help-care.html">Contact support</a>'}));
  $('recheck')?.addEventListener('click',()=>location.reload());
  console.warn('payment status after polling window',last);
}

window.removeEraCheckoutCoupon=()=>{selectedEraCoupon=null;eraCouponError='';try{localStorage.removeItem(ERA_COUPON_KEY)}catch{};renderCheckout()};
window.applyEraCheckoutCoupon=async()=>{const input=$('ckCouponCode'),msg=$('ckCouponMessage');if(!input||!msg)return;const code=input.value.trim().toUpperCase();if(!code){window.removeEraCheckoutCoupon();msg.textContent='Enter a code first.';return}if(!window.KEAuth?.isSignedIn()){eraCouponError='Sign in before using follower and reward codes.';msg.textContent=eraCouponError;window.KEAuth?.open();return}msg.textContent='Checking code…';const b=$('ckCouponApply');if(b)b.disabled=true;try{const r=await window.KEAuth.authFetch('/api/coupon-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Could not verify this code.');selectedEraCoupon=data;eraCouponError='';localStorage.setItem(ERA_COUPON_KEY,data.code);renderCheckout();const m=$('ckCouponMessage');if(m)m.textContent=`${data.code} verified. The saving shown in your order summary will be checked again by the server.`}catch(e){selectedEraCoupon=null;try{localStorage.removeItem(ERA_COUPON_KEY)}catch{};eraCouponError=e.message||'Coupon verification failed.';renderCheckout();const m=$('ckCouponMessage');if(m)m.textContent=eraCouponError}finally{const apply=$('ckCouponApply');if(apply)apply.disabled=false}};
async function loadAccountPricing(){eraMembershipActive=false;selectedEraCoupon=null;eraCouponError='';if(!window.KEAuth?.isSignedIn())return;try{const r=await window.KEAuth.authFetch('/api/rewards',{cache:'no-store'});const d=await r.json().catch(()=>({}));if(r.ok)eraMembershipActive=!!d.membershipActive;}catch(e){console.warn('membership status unavailable',e)}const stored=localStorage.getItem(ERA_COUPON_KEY);if(stored){try{const r=await window.KEAuth.authFetch('/api/coupon-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:stored})});const d=await r.json().catch(()=>({}));if(r.ok)selectedEraCoupon=d;else{localStorage.removeItem(ERA_COUPON_KEY);eraCouponError=d.error||'Your saved code is no longer available.'}}catch(e){eraCouponError='Could not verify your saved coupon. Apply it again at checkout.'}}}
async function initializeCheckout(){saveState();await loadLiveCatalogForCheckout();await loadAccountPricing();renderCheckout()}
if(document.body.dataset.page==='checkout-standalone'){initializeCheckout();window.addEventListener('ke:auth-updated',async()=>{await loadAccountPricing();renderCheckout()});window.addEventListener('ke:auth',async e=>{if(!e.detail?.session){await loadAccountPricing();renderCheckout()}})}
else if(document.body.dataset.page==='payment-standalone'){renderPayment()}
})();
