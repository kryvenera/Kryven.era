// Direct REST connection to Supabase. No SDK/global `supabase` variable is required.
const SUPABASE_URL = 'https://iisezaptudifgwkjxnkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
const SUPABASE_TABLE = 'Allow public order insert';
const SUPABASE_REST = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`;
function supabaseHeaders(extra={}){return Object.assign({'apikey':SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${SUPABASE_PUBLISHABLE_KEY}`,'Content-Type':'application/json'},extra)}
async function supabaseRequest(url=SUPABASE_REST,options={}){
  const res=await fetch(url,{...options,headers:supabaseHeaders(options.headers||{})});
  const text=await res.text();
  let data=null;
  try{data=text?JSON.parse(text):null}catch{}
  if(!res.ok){const msg=data?.message||data?.error_description||text||`HTTP ${res.status}`;throw new Error(msg)}
  return data;
}

const IMG = {
  hero: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=85',
  tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85',
  hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85',
  pants: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85',
  cap: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=85'
};

const defaultState = {
  settings: {
    brand:'KRYVEN ERA', tagline:'WEAR YOUR ERA', heroTitle:'OWN THE NIGHT.', heroText:'Luxury streetwear engineered for presence. Black, silver and gold details with a premium 3D experience.', heroVideo:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    whatsapp:'7036421785', upi:'kryvenera@upi', adminPin:'KRYVEN26', currency:'₹', shipping:0,
    payments:{cod:false,upi:false,card:false,bank:false,codAdvancePercent:20,paymentSettingsVersion:3},
    deliveryNote:'Free shipping on eligible orders', supportText:'Mon–Sat · 10 AM–7 PM'
  },
  products:[
    {id:'KE001',name:'Kryven Era Logo Tee',category:'T-Shirts',price:1299,mrp:1999,discount:'35% OFF',rating:4.8,reviews:124,barcode:'890100000001',images:[IMG.tshirt,IMG.hero,IMG.jacket],sizes:{S:true,M:true,L:true,XL:true,XXL:false},colors:['Black','White','Silver'],description:'Oversized premium-cotton tee with a minimal metallic K mark. Designed for a clean, heavyweight silhouette.',features:['100% premium cotton','Oversized fit','Breathable & soft','Machine washable'],stock:18},
    {id:'KE002',name:'Kryven Signature Hoodie',category:'Hoodies',price:2499,mrp:3199,discount:'22% OFF',rating:4.7,reviews:88,barcode:'890100000002',images:[IMG.hoodie,IMG.hero,IMG.jacket],sizes:{S:true,M:true,L:true,XL:false,XXL:true},colors:['Black','Stone'],description:'Premium fleece hoodie with structured shoulders, brushed interior and a subtle front signature.',features:['480 GSM fleece','Drop shoulder','Soft brushed inside','Relaxed fit'],stock:9},
    {id:'KE003',name:'Kryven Era Cargo Pants',category:'Pants',price:1999,mrp:2599,discount:'23% OFF',rating:4.6,reviews:67,barcode:'890100000003',images:[IMG.pants,IMG.hero,IMG.jacket],sizes:{S:false,M:true,L:true,XL:true,XXL:true},colors:['Black','Graphite'],description:'Tapered cargo pants with utility pockets, articulated knees and a refined matte finish.',features:['Utility pocket system','Tapered leg','Stretch comfort','Everyday streetwear'],stock:14},
    {id:'KE004',name:'Kryven Windcheater Jacket',category:'Jackets',price:2799,mrp:4299,discount:'35% OFF',rating:4.5,reviews:49,barcode:'890100000004',images:[IMG.jacket,IMG.hero,IMG.hoodie],sizes:{S:true,M:true,L:true,XL:true,XXL:true},colors:['Black','Silver'],description:'Lightweight shell jacket with reflective details and a sleek monochrome finish.',features:['Lightweight shell','Reflective trims','Water resistant','Zip pockets'],stock:22},
    {id:'KE005',name:'Kryven Era Cap',category:'Accessories',price:999,mrp:1299,discount:'23% OFF',rating:4.4,reviews:31,barcode:'890100000005',images:[IMG.cap,IMG.tshirt,IMG.hero],sizes:{S:true,M:true,L:false,XL:false,XXL:false},colors:['Black','Gold'],description:'Structured 6-panel cap with embroidered K mark and metal adjuster.',features:['Cotton twill','Structured crown','Metal adjuster','Embroidered mark'],stock:30}
  ],
  cart:[], wishlist:[], profile:{name:'',email:'',phone:'',address:'',landmark:'',houseNumber:'',city:'',state:'',pincode:''}, account:{signedIn:false,consent:false,signedInAt:''}, orders:[], searches:{}, reviews:[],
  heroSlides:[IMG.hero,IMG.tshirt,IMG.jacket]
};

const KEY='kryven-era-state-v3';
const DEFAULT_HERO_VIDEO='kryven-era-hero-temp.mp4';
function loadState(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(defaultState)}catch{return structuredClone(defaultState)}}
let state=loadState();
function hydrateState(){
  state.settings=state.settings||{};
  state.account=state.account||{};
  state.account=Object.assign({signedIn:Boolean(state.profile?.name||state.profile?.phone||state.profile?.email),consent:false,signedInAt:''},state.account);
  const paymentDefaults={cod:false,upi:false,card:false,bank:false,codAdvancePercent:20,paymentSettingsVersion:3};
  const savedPayments=state.settings.payments||{};
  if(savedPayments.paymentSettingsVersion!==3){
    savedPayments.cod=false;
    savedPayments.upi=false;
    savedPayments.card=false;
    savedPayments.bank=false;
    savedPayments.codAdvancePercent=20;
    savedPayments.paymentSettingsVersion=3;
  }
  state.settings.payments=Object.assign(paymentDefaults,savedPayments);
  if(state.settings.heroVideoSeeded!==true && !state.settings.heroVideo){state.settings.heroVideo=DEFAULT_HERO_VIDEO;state.settings.heroVideoSeeded=true;}
  if(String(state.settings.heroVideo||'').includes('interactive-examples.mdn.mozilla.net')){state.settings.heroVideo=DEFAULT_HERO_VIDEO;state.settings.heroVideoSeeded=true;}
  state.settings.adminLogo=state.settings.adminLogo||'favicon.png';
  state.settings.backgroundVideo=state.settings.backgroundVideo||'';
  state.settings.backgroundVideoEnabled=Boolean(state.settings.backgroundVideoEnabled);
  state.orders=Array.isArray(state.orders)?state.orders:[];
  state.products=Array.isArray(state.products)?state.products:[];
  const tee=state.products.find(p=>p.id==='KE001');
  if(tee){
    tee.colors=Array.from(new Set([...(tee.colors||[]),'Black','White','Red']));
    tee.variantVisuals=Object.assign({Black:{filter:'brightness(.32) contrast(1.1)'},White:{filter:'none'},Red:{filter:'hue-rotate(310deg) saturate(2.2) brightness(.9)'},Silver:{filter:'grayscale(.8) brightness(1.25) contrast(.9)'}},tee.variantVisuals||{});
  }
}
hydrateState();
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function money(n){return `${state.settings.currency}${Number(n).toLocaleString('en-IN')}`}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function imgFallback(){event?.target?.style && (event.target.style.opacity='.35')}
function product(id){return state.products.find(p=>p.id===id)}
function totalItems(){return state.cart.reduce((a,x)=>a+x.qty,0)}
function toggleWishlist(id){state.wishlist=state.wishlist.includes(id)?state.wishlist.filter(x=>x!==id):[...state.wishlist,id];save();render();toast(state.wishlist.includes(id)?'Added to wishlist':'Removed from wishlist')}
function addToBag(id,size,color='Black'){const p=product(id); if(!p)return; const line=state.cart.find(x=>x.id===id&&x.size===size&&x.color===color); if(line)line.qty++; else state.cart.push({id,size,color,qty:1}); save(); toast('✓ Added to bag'); render();}
function changeQty(i,d){state.cart[i].qty+=d;if(state.cart[i].qty<=0)state.cart.splice(i,1);save();render()}
function getDiscountCode(){return document.querySelector('#coupon')?.value?.trim().toUpperCase()||''}
function discountAmount(sub,c){return c==='KRYVEN10'?Math.round(sub*.10):0}
function search(q){q=q.trim().toLowerCase(); if(!q)return renderSearchOverlay(''); state.searches[q]=(state.searches[q]||0)+1;save(); const matches=state.products.filter(p=>(p.name+p.category+p.barcode).toLowerCase().includes(q)); renderSearchOverlay(q,matches)}
function trending(){return Object.entries(state.searches).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0])}
function renderSearchOverlay(q,matches){let ov=document.getElementById('searchOverlay');if(!ov){ov=document.createElement('div');ov.id='searchOverlay';ov.className='search-overlay';document.body.appendChild(ov)}
  const sug=trending();ov.innerHTML=`<div class="search-panel"><div class="search-panel-head"><b>Search</b><button class="drawer-close" onclick="document.getElementById('searchOverlay').remove()">×</button></div>
  <div class="chips">${sug.map(s=>`<button class="chip gold" onclick="document.querySelector('#topSearch').value='${esc(s)}';search('${esc(s)}')">${esc(s)}</button>`).join('')}</div>
  <div class="search-results">${q? (matches.length?matches.map(p=>`<button class="search-result" onclick="openProduct('${p.id}')"><img src="${p.images[0]}"/><span><b>${esc(p.name)}</b><small>${esc(p.category)} · ${money(p.price)}</small></span></button>`).join(''):`<div class="muted">No products found.</div>`):`<div class="muted">Type a product, category or barcode.</div>`}</div></div>`;}

function logo(){return `<a class="logo" href="index.html"><span class="logo-mark"></span><span class="logo-text">${esc(state.settings.brand)}<small>/${esc(state.settings.tagline)}</small></span></a>`}
function header(){return `<header class="header"><div class="container nav">${logo()}<nav class="nav-links"><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="categories.html">Categories</a><a href="wishlist.html">♡ Wishlist</a><a href="tracking.html">Track Order</a></nav><div class="search-wrap"><input id="topSearch" class="search" placeholder="Search products, brands..." onfocus="renderSearchOverlay('')" oninput="search(this.value)"/><span class="search-icon">⌕</span><button class="scan-btn" title="Scan barcode" onclick="startBarcodeScan()">▥</button></div><div class="nav-actions"><button class="icon-btn" title="Help & Care" aria-label="Help & Care" onclick="openSupport(event)">❔</button><button class="icon-btn" title="Customer details" onclick="openProfile()">◉</button><button class="icon-btn" title="Wishlist" onclick="openWishlist(event)">♡<span class="badge">${state.wishlist.length||''}</span></button><button class="icon-btn" title="Bag" onclick="openBag()">👜<span class="badge">${totalItems()||''}</span></button></div></div></header>`}
function hero(){return `<section id="home" class="hero"><div class="hero-media"><video autoplay muted loop playsinline src="${esc(state.settings.heroVideo)}"></video></div><div class="container hero-grid"><div><span class="kicker">Kryven Era · 3D Luxury Store</span><h1>${esc(state.settings.heroTitle)}<span>${esc(state.settings.tagline)}.</span></h1><p>${esc(state.settings.heroText)}</p><div class="hero-cta"><a class="btn primary" href="#shop">Shop collection →</a><button class="btn ghost" onclick="openCategory('T-Shirts')">Explore essentials</button></div></div><div class="hero-stats"><div class="stat"><b>3D</b><span>Interactive product view</span></div><div class="stat"><b>${state.products.length}+</b><span>Curated products</span></div><div class="stat"><b>COD</b><span>Flexible checkout</span></div></div></div></section>`}
function categories(){const cats=['T-Shirts','Hoodies','Pants','Jackets','Accessories'];return `<section id="categories" class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">Explore by category</div><h2>THE ERA, YOUR WAY.</h2></div><p class="muted">Minimal forms, metallic accents and everyday silhouettes. Tap a category to filter the collection.</p></div><div class="categories">${cats.map((c,i)=>{const p=state.products.find(x=>x.category===c)||state.products[i%state.products.length];return `<button class="cat" onclick="openCategory('${c}')"><img src="${p.images[0]}" onerror="imgFallback()"/><div class="cat-info"><b>${c}</b><span>${state.products.filter(x=>x.category===c).length} pieces · View collection →</span></div></button>`}).join('')}</div></div></section>`}
function productCard(p){const wished=state.wishlist.includes(p.id);return `<article class="card" onclick="openProduct('${p.id}')"><div class="card-media"><img src="${p.images[0]}" onerror="imgFallback()"/><span class="pill">${p.discount}</span><button class="like ${wished?'active':''}" onclick="event.stopPropagation();toggleWishlist('${p.id}')">${wished?'♥':'♡'}</button></div><div class="card-body"><h3>${esc(p.name)}</h3><div class="meta">${esc(p.category)} · ★ ${p.rating} (${p.reviews})</div><div class="price-row"><div class="price">${money(p.price)}</div><div class="mrp">${money(p.mrp)}</div><div class="discount">${p.discount}</div></div><div class="size-row">${Object.entries(p.sizes).map(([s,on])=>`<span class="size ${on?'':'off'}">${s}</span>`).join('')}</div></div></article>`}
function shop(){return `<section id="shop" class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">Curated drop</div><h2>FEATURED PRODUCTS</h2></div><div class="chips"><button class="chip gold" onclick="openCategory('All')">View all</button>${['T-Shirts','Hoodies','Pants','Jackets','Accessories'].map(c=>`<button class="chip" onclick="openCategory('${c}')">${c}</button>`).join('')}</div></div><div class="chips" style="margin-bottom:18px"><span class="chip gold">Trending searches</span>${(trending().length?trending():['oversized t-shirt','black hoodie','cargo pants','kryven era']).map(x=>`<button class="chip" onclick="document.querySelector('#topSearch').value='${esc(x)}';search('${esc(x)}')">${esc(x)}</button>`).join('')}</div><div class="product-grid">${state.products.map(productCard).join('')}</div></div></section>`}
function trust(){return `<section class="section" style="padding-top:10px"><div class="container trust"><div class="trust-card">✦<b>Luxury 3D UI</b><span>Rotate products, explore details and experience a premium storefront.</span></div><div class="trust-card">◈<b>Flexible payments</b><span>COD, UPI, card and bank methods can be enabled or disabled from admin.</span></div><div class="trust-card">✓<b>Size aware</b><span>Unavailable sizes are visibly disabled and cannot be selected.</span></div><div class="trust-card">◉<b>Customer reviews</b><span>Customers can submit ratings and photos after a delivered order.</span></div></div></section>`}
function footer(){return `<footer class="footer" id="support"><div class="container footer-grid"><div><div>${logo()}</div><p class="muted" style="line-height:1.7;max-width:360px">Kryven Era — premium streetwear with a dark luxury identity. The hero media and store content are editable from the admin panel.</p></div><div><b>Shop</b><a href="shop.html">All products</a><a href="categories.html">Categories</a><a href="wishlist.html">Wishlist</a></div><div><b>Support</b><a href="help-care.html">Help & Care</a><a href="customer-details.html">Customer details</a><a href="tracking.html">Track order</a></div><div><b>Admin</b><a href="admin.html">Open admin panel</a><a href="${'https://wa.me/'+state.settings.whatsapp+'?text='+encodeURIComponent('Hello Kryven Era, I need help with an order.')}" target="_blank">WhatsApp support</a></div></div><div class="container footer-note">© 2026 Kryven Era · Front-end store template. For production multi-device order persistence, connect a database/backend.</div></footer>`}

function productDetail(p){
  const selected=p.sizes?.S?'S':Object.keys(p.sizes||{}).find(s=>p.sizes[s])||Object.keys(p.sizes||{})[0]||'S';
  const color=p.colors?.[0]||'Black';
  const vf=(p.variantVisuals&&p.variantVisuals[color]?.filter)||'none';
  return `<div class="product-detail-full">
    <div class="product-layout">
      <div class="gallery product-gallery-swipe">
        <div class="thumbs product-swipe-thumbs">${(p.images||[]).map((im,i)=>`<button class="thumb product-swipe-thumb ${i===0?'active':''}" type="button" onclick="setProductPageGalleryImage('${esc(p.id)}',${i})"><img src="${esc(im)}" alt="${esc(p.name)} photo ${i+1}"></button>`).join('')}</div>
        <div class="main-shot swipe-stage product-page-swipe-stage" data-product="${esc(p.id)}" data-index="0">
          <button class="swipe-arrow swipe-arrow-left" type="button" aria-label="Previous photo" onclick="productPageSwipePrev('${esc(p.id)}')">‹</button>
          <img id="productPageMain" src="${esc(p.images?.[0]||'')}" style="filter:${vf}" alt="${esc(p.name)}">
          <button class="swipe-arrow swipe-arrow-right" type="button" aria-label="Next photo" onclick="productPageSwipeNext('${esc(p.id)}')">›</button>
          <div class="swipe-dots">${(p.images||[]).map((_,i)=>`<button class="product-swipe-dot ${i===0?'active':''}" type="button" onclick="setProductPageGalleryImage('${esc(p.id)}',${i})" aria-label="Photo ${i+1}"></button>`).join('')}</div>
          <div class="swipe-hint">SWIPE LEFT / RIGHT</div>
        </div>
      </div>
      <div class="product-info">
        <div class="eyebrow">${esc(p.category)} · ${esc(p.id)}</div>
        <h1>${esc(p.name)}</h1>
        <div class="price-row"><div class="price">${money(p.price)}</div><div class="mrp">${money(p.mrp)}</div><div class="discount">${esc(p.discount)}</div></div>
        <p class="desc">${esc(p.description)}</p>
        <div class="detail-label">Colour</div>
        <div class="opt-row product-page-colours" id="pageColorOptions">${(p.colors||[]).map((c,i)=>`<button class="opt ${i===0?'selected':''}" type="button" onclick="selectProductPageColor('${esc(c)}')">${esc(c)}</button>`).join('')}</div>
        <div class="detail-label">Size · availability</div>
        <div class="opt-row" id="pageSizeOptions">${Object.entries(p.sizes||{}).map(([sz,on])=>`<button class="opt ${on?(sz===selected?'selected':''):'disabled'}" type="button" ${on?`onclick="selectProductPageSize('${esc(sz)}')"`:'disabled'}>${esc(sz)}${on?'':' · Out'}</button>`).join('')}</div>
        <div class="product-actions"><button class="btn primary" type="button" onclick="confirmPageAdd('${esc(p.id)}')">Add to Bag</button><button class="btn" type="button" onclick="buyNowFromPage('${esc(p.id)}')">Buy Now</button></div>
      </div>
    </div>
    <section class="product-section"><div class="eyebrow">Description</div><h2>THE DETAILS.</h2><p class="long-copy">${esc(p.description)}</p><div class="features">${(p.features||[]).map(f=>`<div class="feature">✓ ${esc(f)}</div>`).join('')}</div></section>
    <section class="product-section"><div class="eyebrow">3D view</div><h2>ROTATE THE PIECE.</h2><div class="three-wrap" id="page-three-${esc(p.id)}"><div class="three-help">Drag to rotate · Pinch to zoom · 3D product</div></div></section>
    <section class="product-section"><div class="eyebrow">Recommendation</div><h2>YOU MAY ALSO LIKE.</h2><div class="product-grid">${state.products.filter(x=>x.id!==p.id).slice(0,4).map(productCard).join('')}</div></section>
    <section class="product-section rating-last"><div class="eyebrow">Reviews</div><h2>RATING & CUSTOMER REVIEWS.</h2><div class="rating-big">★★★★★ <span>${p.rating} · ${p.reviews} reviews</span></div><div class="review-grid">${state.reviews.filter(r=>r.productId===p.id).map(reviewHTML).join('')||`<div class="muted">No customer reviews yet. Verified customer reviews appear here after delivery.</div>`}</div><button class="btn" style="margin-top:14px" onclick="openReviewForm('${esc(p.id)}')">Write a review</button></section>
  </div>`;
}
function pageShell(title,content){return `${header()}<main class="container page-main"><div class="page-title"><div class="eyebrow">KRYVEN ERA</div><h1>${esc(title)}</h1></div>${content}</main>${footer()}${drawDrawer()}${drawModal()}`}

function bagPage(){
  if(!state.cart.length) return `<div class="empty-state bag-empty"><div class="eyebrow">YOUR BAG</div><h2>EMPTY FOR NOW.</h2><p class="muted">The next piece of your era is waiting.</p><a class="btn primary" href="shop.html">EXPLORE COLLECTION →</a></div>`;
  const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0);
  return `<div class="bag-layout"><div class="bag-list">${state.cart.map((x,i)=>{const p=product(x.id);return `<div class="bag-line"><img src="${p.images[0]}"><div class="bag-line-main"><div class="eyebrow">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p class="muted">${esc(x.color||'Black')} · Size ${esc(x.size||'—')}</p><div class="qty"><button onclick="changeQty(${i},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${i},1)">+</button></div></div><b>${money(p.price*x.qty)}</b></div>`}).join('')}</div><aside class="summary-card bag-summary"><div class="eyebrow">ORDER SUMMARY</div><h3>READY FOR CHECKOUT.</h3><div class="summary-row"><span>Subtotal</span><span>${money(sub)}</span></div><div class="summary-row"><span>Shipping</span><span>${money(state.settings.shipping)}</span></div><div class="summary-row total"><b>Total</b><b>${money(sub+state.settings.shipping)}</b></div><button class="btn primary" style="width:100%;margin-top:14px" onclick="openCheckout()">PROCEED TO CHECKOUT →</button></aside></div>`;
}

function renderPage(){const page=document.body.dataset.page||'home'; if(page==='home') return `${header()}${hero()}${categories()}${shop()}${trust()}${footer()}${drawDrawer()}${drawModal()}`;
 if(page==='shop') return pageShell('Shop Collection',shop());
 if(page==='categories') return pageShell('Categories',categories());
 if(page==='product'){const p=product(new URLSearchParams(location.search).get('id')||state.products[0]?.id); return pageShell('Product Details',p?productDetail(p):'<div class="empty-state">Product not found.</div>');}
 if(page==='wishlist'){const items=state.products.filter(p=>state.wishlist.includes(p.id)); return pageShell('Wishlist',`<div class="product-grid">${items.length?items.map(productCard).join(''):'<div class="empty-state">Your wishlist is empty. Tap ♡ on any product to save it.</div>'}</div>`);}
 if(page==='bag'){const rows=state.cart.map((x,i)=>{const p=product(x.id);return `<div class="bag-item"><img src="${p.images[0]}"/><div><b>${esc(p.name)}</b><div class="muted">${x.color} · ${x.size}</div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${i},1)">+</button></div></div><b>${money(p.price*x.qty)}</b></div>`}).join(''); return pageShell('Your Bag',`<div class="bag-page">${rows||'<div class="empty-state">Your bag is empty.</div>'}${state.cart.length?`<button class="btn primary" onclick="openCheckout()">Proceed to Checkout →</button>`:''}</div>`);}
 if(page==='checkout') return pageShell('Checkout',state.cart.length?checkoutMarkup():'<div class="empty-state">Your bag is empty.</div>');
 if(page==='customer') return pageShell('Customer Details',customerPage());
 if(page==='tracking') return pageShell('Track Order',trackingPage());
 if(page==='support') return pageShell('Help & Care',supportPage());
 if(page==='reviews') return pageShell('Customer Reviews',reviewsPage());
 if(page==='search') return pageShell('Search',searchPage());
 return `${header()}${hero()}${categories()}${shop()}${trust()}${footer()}${drawDrawer()}${drawModal()}`}
function siteBackground(){const s=state.settings||{};if(!s.backgroundVideoEnabled||!s.backgroundVideo)return '';return `<div id="siteBackgroundVideo" aria-hidden="true" style="position:fixed;inset:0;z-index:-2;overflow:hidden;background:#050505;pointer-events:none"><video autoplay muted loop playsinline preload="auto" src="${esc(s.backgroundVideo)}" style="width:100%;height:100%;object-fit:cover;opacity:.22;filter:saturate(.75) contrast(1.15) brightness(.55)"></video></div><div style="position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(rgba(5,5,5,.62),rgba(5,5,5,.82))"></div>`}
function bindMobileSearchAutoHide(){
  const header=document.querySelector('.header');
  if(!header)return;
  if(window.__keHeaderScroll)window.removeEventListener('scroll',window.__keHeaderScroll);
  if(window.__keHeaderTouchStart)window.removeEventListener('touchstart',window.__keHeaderTouchStart);
  if(window.__keHeaderTouchEnd)window.removeEventListener('touchend',window.__keHeaderTouchEnd);
  let last=window.scrollY||0;
  let touchStartY=0;
  const setHidden=(hidden)=>{
    if(window.innerWidth<=980) header.classList.toggle('header-hidden',hidden);
    else header.classList.remove('header-hidden');
  };
  window.__keHeaderScroll=()=>{
    if(window.innerWidth>980){setHidden(false);last=window.scrollY||0;return;}
    const y=window.scrollY||0;
    if(y>last+4 && y>12) setHidden(true);
    else if(y<last-2 || y<=8) setHidden(false);
    last=y;
  };
  window.__keHeaderTouchStart=(e)=>{
    if(window.innerWidth<=980 && e.touches?.length) touchStartY=e.touches[0].clientY;
  };
  window.__keHeaderTouchEnd=(e)=>{
    if(window.innerWidth>980 || !e.changedTouches?.length)return;
    const dy=e.changedTouches[0].clientY-touchStartY;
    if(dy<-10) setHidden(true);
    else if(dy>5) setHidden(false);
  };
  window.addEventListener('scroll',window.__keHeaderScroll,{passive:true});
  window.addEventListener('touchstart',window.__keHeaderTouchStart,{passive:true});
  window.addEventListener('touchend',window.__keHeaderTouchEnd,{passive:true});
  window.__keHeaderScroll();
}


function render(){
  document.getElementById('app').innerHTML=siteBackground()+renderPage();
  if(document.body.dataset.page==='product'){
    const p=product(new URLSearchParams(location.search).get('id')||state.products[0]?.id);
    if(p){
      window.__pageSelected={id:p.id,size:p.sizes?.S?'S':Object.keys(p.sizes||{}).find(s=>p.sizes[s])||'S',color:p.colors?.[0]||'Black'};
      setTimeout(()=>{bindProductPageSwipe(p.id);init3D(`page-three-${p.id}`,p)},80);
    }
  }
  setTimeout(bindMobileSearchAutoHide,40);
}
function drawDrawer(){return `<div id="drawer" class="drawer"><div class="drawer-panel" id="drawerPanel"></div></div>`}
function drawModal(){return `<div id="modal" class="modal"><div class="modal-card" id="modalCard"></div></div>`}
function openDrawer(content){const d=document.getElementById('drawer');d.classList.add('show');document.getElementById('drawerPanel').innerHTML=content;d.onclick=e=>{if(e.target===d)d.classList.remove('show')}}
function closeDrawer(){document.getElementById('drawer')?.classList.remove('show')}
function openModal(content){const m=document.getElementById('modal');m.classList.add('show');document.getElementById('modalCard').innerHTML=content;m.onclick=e=>{if(e.target===m)m.classList.remove('show')}}
function closeModal(){document.getElementById('modal')?.classList.remove('show')}

window.openCategory=(cat)=>{const items=cat==='All'?state.products:state.products.filter(p=>p.category===cat);if(cat==='T-Shirts'&&items.length){openProduct(items[0].id);return;}if(cat!=='All'&&items.length===1){openProduct(items[0].id);return;}openModal(`<div class="modal-top"><div><div class="eyebrow">Collection</div><h3 style="margin:0;font-family:'Playfair Display',Georgia,serif">${esc(cat)}</h3></div><button class="drawer-close" onclick="closeModal()">×</button></div><div style="padding:22px"><div class="product-grid">${items.map(productCard).join('')}</div></div>`)};
window.openProduct=(id)=>{if(id)location.href='product.html?id='+encodeURIComponent(id)};
function reviewHTML(r){return `<div class="review"><div class="review-head"><div><b>${esc(r.name||'Kryven Customer')}</b><div class="muted">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div></div><span class="muted">Verified purchase</span></div><p style="color:#ccc;font-size:12px;line-height:1.7">${esc(r.text)}</p>${r.photos?.length?`<div class="review-photo">${r.photos.map(x=>`<img src="${x}"/>`).join('')}</div>`:''}</div>`}
function setProductPageGalleryImage(productId,index){
  const p=product(productId); if(!p||!p.images?.length)return;
  const i=((Number(index)||0)%p.images.length+p.images.length)%p.images.length;
  const stage=document.querySelector(`.product-page-swipe-stage[data-product="${CSS.escape(productId)}"]`);
  const img=document.getElementById('productPageMain');
  if(stage)stage.dataset.index=i;
  if(img)img.src=p.images[i];
  document.querySelectorAll('#pageColorOptions .opt').forEach(b=>b.classList.toggle('selected',false));
  document.querySelectorAll('.product-swipe-thumb').forEach((b,n)=>b.classList.toggle('active',n===i));
  document.querySelectorAll('.product-swipe-dot').forEach((b,n)=>b.classList.toggle('active',n===i));
}
window.setProductPageGalleryImage=setProductPageGalleryImage;
function bindProductPageSwipe(productId){
  const stage=document.querySelector(`.product-page-swipe-stage[data-product="${CSS.escape(productId)}"]`); if(!stage)return;
  if(stage.dataset.bound==='1')return; stage.dataset.bound='1';
  let startX=0,startY=0;
  stage.addEventListener('touchstart',e=>{const t=e.touches?.[0];if(!t)return;startX=t.clientX;startY=t.clientY},{passive:true});
  stage.addEventListener('touchend',e=>{const t=e.changedTouches?.[0];if(!t)return;const dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)<45||Math.abs(dx)<=Math.abs(dy))return;const p=product(productId);if(!p?.images?.length)return;const current=Number(stage.dataset.index||0);const next=dx>0?current+1:current-1;setProductPageGalleryImage(productId,next)},{passive:true});
}
window.productPageSwipeNext=id=>{const stage=document.querySelector(`.product-page-swipe-stage[data-product="${CSS.escape(id)}"]`);if(!stage)return;setProductPageGalleryImage(id,Number(stage.dataset.index||0)+1)};
window.productPageSwipePrev=id=>{const stage=document.querySelector(`.product-page-swipe-stage[data-product="${CSS.escape(id)}"]`);if(!stage)return;setProductPageGalleryImage(id,Number(stage.dataset.index||0)-1)};
window.setMainImage=(i,id)=>setProductPageGalleryImage(id,i);
window.selectProductPageSize=(s)=>{if(window.__pageSelected)window.__pageSelected.size=s;document.querySelectorAll('#pageSizeOptions .opt').forEach(b=>b.classList.toggle('selected',b.textContent.trim()===s));};
window.selectProductPageColor=(c)=>{if(window.__pageSelected)window.__pageSelected.color=c;const p=product(window.__pageSelected?.id||new URLSearchParams(location.search).get('id'));const img=document.getElementById('productPageMain');if(p&&img)img.style.filter=(p.variantVisuals&&p.variantVisuals[c]?.filter)||'none';document.querySelectorAll('#pageColorOptions .opt').forEach(b=>b.classList.toggle('selected',b.textContent.trim()===c));};
window.selectProductSize=window.selectProductPageSize;
window.selectProductColor=window.selectProductPageColor;
window.confirmPageAdd=(id)=>{const sel=window.__pageSelected||{};const p=product(id);const size=sel.size||Object.keys(p?.sizes||{}).find(k=>p.sizes[k]);const color=sel.color||p?.colors?.[0]||'Black';if(!size){toast('Please select an available size');return}addToBag(id,size,color);};
window.buyNowFromPage=(id)=>{window.confirmPageAdd(id);setTimeout(()=>{if(state.cart.length)window.openCheckout()},80)};

function openBag(){const rows=state.cart.map((x,i)=>{const p=product(x.id);return `<div class="bag-item"><img src="${p.images[0]}"/><div><b>${esc(p.name)}</b><div class="muted" style="margin-top:4px">${x.color} · ${x.size}</div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${i},1)">+</button></div></div><b>${money(p.price*x.qty)}</b></div>`}).join('');const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0);openDrawer(`<div class="drawer-head"><h3>Your Bag (${totalItems()})</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div>${rows||`<div class="muted" style="padding:40px 0;text-align:center">Your bag is waiting for its first piece.</div>`}<div class="drawer-foot">${state.cart.length?`<div class="totals"><div><span>Subtotal</span><span>${money(sub)}</span></div><div><span>Shipping</span><span>${money(state.settings.shipping)}</span></div><div><span>Total</span><span>${money(sub+state.settings.shipping)}</span></div></div><button class="btn primary" style="width:100%" onclick="closeDrawer();openCheckout()">Proceed to Checkout →</button>`:''}</div>`)}
window.openBag=openBag; window.changeQty=changeQty;

function getCustomerId(){
  const key='kryven-era-customer-id';
  let id=localStorage.getItem(key);
  if(!id){
    const seed=(state.profile?.phone||state.profile?.email||state.profile?.name||'customer')+'|'+Date.now()+'|'+Math.random();
    let h=0; for(let i=0;i<seed.length;i++) h=((h<<5)-h)+seed.charCodeAt(i)|0;
    id='KE-'+Math.abs(h).toString(36).toUpperCase().padStart(6,'0').slice(-6);
    localStorage.setItem(key,id);
  }
  return id;
}
function openMenu(){
  const cid=getCustomerId(), signed=Boolean(state.account?.signedIn);
  openDrawer(`<div class="drawer-head"><div><div class="eyebrow">KRYVEN ERA</div><h3>Menu</h3></div><button class="drawer-close" onclick="closeDrawer()">×</button></div>
  <div class="menu-profile-card"><div class="menu-avatar">${esc((state.profile?.name||'K').trim().charAt(0).toUpperCase())}</div><div><b>${esc(state.profile?.name||'Kryven Customer')}</b><small>${signed?'Customer ID · '+esc(cid):'Not signed in'}</small></div></div>
  <div class="menu-list">
    <button class="menu-item-btn" onclick="${signed?'openAccountPanel()':'openAccountSignIn()'}"><span class="menu-list-icon">◎</span><span><b>${signed?'Edit Account':'Sign in / Create account'}</b><small>${signed?'Edit your details & account settings':'Sign in to manage your details'}</small></span><em>›</em></button>
    <button class="menu-item-btn" onclick="openMenuCustomerId()"><span class="menu-list-icon">#</span><span><b>Customer ID</b><small>${esc(cid)}</small></span><em>›</em></button>
    <a href="wishlist.html"><span class="menu-list-icon pink">♥</span><span><b>Wishlist</b><small>${state.wishlist.length?state.wishlist.length+' saved item'+(state.wishlist.length===1?'':'s'):'Your saved items'}</small></span><em>›</em></a>
    <a href="tracking.html"><span class="menu-list-icon">↗</span><span><b>My Orders</b><small>${state.orders.length?state.orders.length+' order'+(state.orders.length===1?'':'s'):'Track your orders'}</small></span><em>›</em></a>
    <a href="shop.html"><span class="menu-list-icon">＋</span><span><b>Shop All</b><small>Explore the latest drop</small></span><em>›</em></a>
    <a href="help-care.html"><span class="menu-list-icon">?</span><span><b>Help & Care</b><small>Support & order help</small></span><em>›</em></a>
    ${signed?`<button class="menu-item-btn menu-danger-item" onclick="openLogoutConfirm()"><span class="menu-list-icon danger-icon">↪</span><span><b>Log out</b><small>Sign out on this browser</small></span><em>›</em></button><button class="menu-item-btn menu-delete-item" onclick="openDeleteConfirm()"><span class="menu-list-icon delete-icon">!</span><span><b>Delete account</b><small>Remove your local account data</small></span><em>›</em></button>`:''}
  </div>
  <div class="menu-id-note">${signed?'You can edit, log out or delete your account from the menu.':'Sign in to unlock account details, Customer ID and account controls.'}</div>`);
}
function openMenuCustomerId(){const cid=getCustomerId();openDrawer(`<div class="drawer-head"><h3>Customer ID</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div class="customer-id-big"><span>YOUR KRYVEN ERA ID</span><b>${esc(cid)}</b><button class="btn primary" style="width:100%;margin-top:14px" onclick="navigator.clipboard?.writeText('${esc(cid)}');toast('Customer ID copied')">COPY CUSTOMER ID</button></div>`)}
window.openMenu=openMenu;window.openMenuCustomerId=openMenuCustomerId;
function accountPolicyText(){return `<div class="account-policy">
  <div class="account-policy-title">KRYVEN ERA — Privacy & Customer Policy</div>
  <p><b>Welcome to KRYVEN ERA.</b> Your trust matters to us. Please read this policy before creating or continuing with your customer account.</p>
  <p><b>1. Your Account</b><br>We may collect your name, mobile number, email address (if provided), and other necessary account information to create and manage your KRYVEN ERA customer account and provide a smoother shopping experience.</p>
  <p><b>2. Verification & Account Security</b><br>Your mobile number or email may be used for verification, account security, and important account-related communication. Never share an OTP, password, UPI PIN, ATM PIN, or card PIN with anyone.</p>
  <p><b>3. Orders & Delivery</b><br>When you place an order, we may collect your name, phone number, address, landmark, city, state, pincode, and other delivery information needed to process and deliver your order and provide order support.</p>
  <p><b>4. Payments</b><br>Online payments may be processed through secure third-party payment providers. KRYVEN ERA does not ask you to share your UPI PIN, ATM PIN, or card PIN with us. Payment details may be handled by the applicable payment provider according to its own terms and privacy practices.</p>
  <p><b>5. Wishlist & Shopping Activity</b><br>Your wishlist, cart information, and order history may be stored to help you manage saved products, shopping activity, and previous orders.</p>
  <p><b>6. Customer Support</b><br>We may use the contact information you provide to respond to support requests, delivery issues, order questions, and other service-related communication.</p>
  <p><b>7. Account Control</b><br>You can edit your available account details, view your Customer ID, log out, and request deletion of your account using the account controls available in the menu.</p>
  <p><b>8. Account Deletion</b><br>If you choose to delete your account, customer information stored by this website for the account may be removed from the applicable account storage. Certain records may need to be retained where required for legal, accounting, security, fraud-prevention, or completed-order purposes.</p>
  <p><b>9. Information Security</b><br>We take reasonable measures intended to protect customer information from unauthorized access, misuse, alteration, or loss. However, no online service can guarantee absolute security.</p>
  <p><b>10. Information Sharing</b><br>Information may be shared with service providers only when reasonably necessary to operate the store, such as payment processing, delivery, authentication, hosting, analytics, or customer support. We do not ask customers to provide unnecessary sensitive credentials.</p>
  <p><b>11. Policy Updates</b><br>KRYVEN ERA may update this policy when our services, technology, or legal requirements change. The updated version may be displayed on the website.</p>
  <p><b>12. Contact</b><br>If you have a question about your account, personal information, an order, or this policy, please contact KRYVEN ERA through the support option provided on the website.</p>
  <div class="account-policy-note">Please review this policy before continuing. By selecting the confirmation checkbox, you confirm that you have read and understood this policy and agree to continue using the KRYVEN ERA customer account features.</div>
</div>`}
function openAccountSignIn(){
  const p=state.profile||{};
  openDrawer(`<div class="drawer-head"><div><div class="eyebrow">KRYVEN ERA</div><h3>Sign in / Create account</h3></div><button class="drawer-close" onclick="closeDrawer()">×</button></div>
    <div class="account-auth-card">
      <div class="account-auth-mark">K</div>
      <h4>Welcome to your ERA.</h4>
      <p class="muted">Enter your basic details to continue.</p>
      ${accountPolicyText()}
      <div class="form-section" style="margin-top:16px">
        <div class="field"><label>FULL NAME <span class="required-mark">*</span></label><input id="signinName" autocomplete="name" value="${esc(p.name||'')}" placeholder="Your name"></div>
        <div class="field" style="margin-top:10px"><label>MOBILE NUMBER <span class="required-mark">*</span></label><input id="signinPhone" inputmode="tel" autocomplete="tel" value="${esc(p.phone||'')}" placeholder="10-digit mobile number"></div>
        <div class="field" style="margin-top:10px"><label>EMAIL ID <span class="optional-mark">(Optional)</span></label><input id="signinEmail" type="email" autocomplete="email" value="${esc(p.email||'')}" placeholder="name@example.com"></div>
        <label class="account-consent"><input id="accountConsent" type="checkbox" ${state.account?.consent?'checked':''}><span>I confirm that I have read and agree to the KRYVEN ERA privacy & data-use policy above.</span></label>
        <button class="btn primary" style="width:100%;margin-top:16px" onclick="completeAccountSignIn()">CONTINUE →</button>
      </div>
    </div>`)
}
window.completeAccountSignIn=(openPanel=true)=>{
  const name=document.getElementById('signinName')?.value?.trim()||'';
  const phone=document.getElementById('signinPhone')?.value?.trim()||'';
  const email=document.getElementById('signinEmail')?.value?.trim()||'';
  const consent=Boolean(document.getElementById('accountConsent')?.checked);
  if(!name){toast('Please enter your full name');return}
  if(!/\d{10}/.test(phone.replace(/\D/g,''))){toast('Please enter a valid 10-digit mobile number');return}
  if(!consent){toast('Please confirm the privacy & data-use policy');return}
  state.profile={...state.profile,name,phone,email};
  state.account={...(state.account||{}),signedIn:true,consent:true,signedInAt:new Date().toISOString()};
  save();toast('Account signed in successfully');if(openPanel)openAccountPanel();
}
function openAccountPanel(){
  const p=state.profile||{}, cid=getCustomerId();
  openDrawer(`<div class="drawer-head"><div><div class="eyebrow">CUSTOMER ACCOUNT</div><h3>Account details</h3></div><button class="drawer-close" onclick="closeDrawer()">×</button></div>
    <div class="account-id-card"><span>CUSTOMER ID</span><b>${esc(cid)}</b><button class="mini-btn" onclick="navigator.clipboard?.writeText('${esc(cid)}');toast('Customer ID copied')">COPY</button></div>
    <div class="form-section" style="margin-top:15px"><div class="form-grid">
      <div class="field"><label>Full name</label><input id="pfName" value="${esc(p.name)}"></div>
      <div class="field"><label>Email</label><input id="pfEmail" value="${esc(p.email)}" type="email"></div>
      <div class="field"><label>Phone</label><input id="pfPhone" value="${esc(p.phone)}" inputmode="tel"></div>
      <div class="field"><label>Address</label><input id="pfAddress" value="${esc(p.address)}"></div>
      <div class="field"><label>Landmark</label><input id="pfLandmark" value="${esc(p.landmark||'')}"></div>
      <div class="field"><label>House / Building No.</label><input id="pfHouse" value="${esc(p.houseNumber||'')}"></div>
      <div class="field"><label>City</label><input id="pfCity" value="${esc(p.city)}"></div>
      <div class="field"><label>State</label><input id="pfState" value="${esc(p.state||'')}"></div>
      <div class="field"><label>Pincode</label><input id="pfPin" value="${esc(p.pincode)}"></div>
    </div><button class="btn primary" style="margin-top:15px;width:100%" onclick="saveProfile()">SAVE CHANGES</button></div>
    <div class="account-actions-block">
      <button class="account-action danger-outline" onclick="openLogoutConfirm()">LOG OUT</button>
      <button class="account-action danger-solid" onclick="openDeleteConfirm()">DELETE ACCOUNT</button>
    </div>`)
}
function openProfile(){state.account?.signedIn?openAccountPanel():openAccountSignIn()}
window.saveProfile=()=>{
  const name=document.getElementById('pfName')?.value?.trim()||'';
  const phone=document.getElementById('pfPhone')?.value?.trim()||'';
  if(!name){toast('Full name is required');return}
  if(!/\d{10}/.test(phone.replace(/\D/g,''))){toast('Enter a valid 10-digit mobile number');return}
  state.profile={...state.profile,name,email:document.getElementById('pfEmail')?.value?.trim()||'',phone,address:document.getElementById('pfAddress')?.value?.trim()||'',landmark:document.getElementById('pfLandmark')?.value?.trim()||'',houseNumber:document.getElementById('pfHouse')?.value?.trim()||'',city:document.getElementById('pfCity')?.value?.trim()||'',state:document.getElementById('pfState')?.value?.trim()||'',pincode:document.getElementById('pfPin')?.value?.trim()||''};
  save();toast('Customer details updated');closeDrawer();render();
}
function openLogoutConfirm(){openDrawer(`<div class="drawer-head"><h3>Log out</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div class="account-confirm"><div class="confirm-icon">↪</div><h4>Do you want to log out?</h4><p class="muted">Your saved customer details will remain on this browser. You can sign in again later.</p><div class="confirm-actions"><button class="confirm-btn yes-red" onclick="performLogout()">YES</button><button class="confirm-btn no-green" onclick="openAccountPanel()">NO</button></div></div>`)}
function performLogout(){state.account={...(state.account||{}),signedIn:false};save();closeDrawer();toast('You have been logged out');render()}
function openDeleteConfirm(){openDrawer(`<div class="drawer-head"><h3>Delete account</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div class="account-confirm"><div class="confirm-icon delete">!</div><h4 class="confirm-danger-text">Do you want to delete your account?</h4><p class="muted">This will remove your customer profile, saved wishlist, local orders and customer ID from this browser. Store catalogue and admin settings will stay untouched.</p><div class="confirm-actions"><button class="confirm-btn yes-red" onclick="performDeleteAccount()">YES, DELETE</button><button class="confirm-btn no-green" onclick="openAccountPanel()">NO</button></div></div>`)}
function performDeleteAccount(){
  state.profile={name:'',email:'',phone:'',address:'',landmark:'',houseNumber:'',city:'',state:'',pincode:''};
  state.account={signedIn:false,consent:false,signedInAt:''}; state.cart=[]; state.wishlist=[]; state.orders=[]; state.reviews=[]; state.searches={};
  localStorage.removeItem('kryven-era-customer-id'); save(); closeDrawer(); toast('Account deleted'); render();
}
window.openLogoutConfirm=openLogoutConfirm;window.performLogout=performLogout;window.openDeleteConfirm=openDeleteConfirm;window.performDeleteAccount=performDeleteAccount;
function openWishlist(e){e?.preventDefault();const items=state.products.filter(p=>state.wishlist.includes(p.id));openDrawer(`<div class="drawer-head"><h3>Wishlist</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div style="padding-top:15px">${items.length?`<div class="product-grid">${items.map(productCard).join('')}</div>`:`<div class="muted" style="padding:40px 0;text-align:center">Tap ♡ on a product to save it here.</div>`}</div>`)}
window.openWishlist=openWishlist;
function openTracking(e){e?.preventDefault();openDrawer(`<div class="drawer-head"><h3>Track Order</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div class="form-section" style="margin-top:15px"><div class="field"><label>Order ID</label><input id="trackId" placeholder="e.g. KE-2026-001"/></div><button class="btn primary" style="margin-top:12px" onclick="trackOrder()">Track</button><div id="trackResult" style="margin-top:18px"></div></div>`)}
window.trackOrder=()=>{const id=document.getElementById('trackId').value.trim();const o=state.orders.find(x=>x.id===id);document.getElementById('trackResult').innerHTML=o?`<div class="summary-card"><b>${esc(o.id)}</b><p>${esc(o.status)} · ${new Date(o.createdAt).toLocaleString('en-IN')}</p><div class="muted">Total ${money(o.total)}</div></div>`:`<div class="muted">Order not found on this browser. Admin backend is required for cross-device order lookup.</div>`}
function openSupport(e){e?.preventDefault();openDrawer(`<div class="drawer-head"><h3>Help & Care</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div class="form-section" style="margin-top:15px"><h4>Need help?</h4><p class="muted">${esc(state.settings.supportText)}</p><a class="btn success" href="https://wa.me/${esc(state.settings.whatsapp)}?text=${encodeURIComponent('Hello Kryven Era, I need help with my order.') }" target="_blank" style="display:inline-block;margin-top:8px">Chat on WhatsApp</a><p class="muted" style="margin-top:16px">Support number: +${esc(state.settings.whatsapp)}</p></div>`)}
window.openSupport=openSupport;

function openCheckout(){if(!state.cart.length){toast('Your bag is empty');return}location.href='checkout.html'}
window.applyCheckoutCoupon=()=>{const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0),d=discountAmount(sub,getDiscountCode());document.getElementById('couponMsg').textContent=d?'Coupon KRYVEN10 applied.': 'Use KRYVEN10 for 10% off in this demo.';document.getElementById('sumDisc').textContent='−'+money(d);document.getElementById('sumTotal').textContent=money(sub-d+state.settings.shipping)}
window.placeOrder=async()=>{
  if(window.__orderSubmitting)return;
  window.__orderSubmitting=true;
  try{
    const name=document.getElementById('coName').value.trim(),phone=document.getElementById('coPhone').value.trim(),address=document.getElementById('coAddress').value.trim(),city=document.getElementById('coCity').value.trim(),pincode=document.getElementById('coPin').value.trim();
    if(!name||!phone||!address||!city||!pincode){toast('Please fill all shipping details');return}
    const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0),discount=discountAmount(sub,getDiscountCode()),payment=document.querySelector('input[name=pay]:checked')?.value||'cod',source=localStorage.getItem('kryven-era-referral-source')||'',id='KE-'+new Date().getFullYear()+'-'+String(Math.floor(Math.random()*900)+100);
    const order={id,createdAt:new Date().toISOString(),customer:{name,email:state.profile.email||'',phone,address,city,pincode},items:structuredClone(state.cart).map(x=>({...x,image:product(x.id)?.images?.[0]||''})),subtotal:sub,discount,total:sub-discount+state.settings.shipping,payment,status:'Placed',referralSource:source};
    const saved=await finalizeOrder(order,payment==='upi');
    if(saved && payment==='upi')setTimeout(()=>showUPIPayment(order),50);
  }finally{
    window.__orderSubmitting=false;
  }
};
async function saveOrderToSupabase(order){
  try{
    const dbId=Number(`${Date.now()}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`);
    order.cloudRowId=dbId;
    const row={
      id:dbId,
      'Customer name':order.customer.name||'',
      'Customer address':`${order.customer.houseNumber?order.customer.houseNumber+', ':''}${order.customer.address||''}${order.customer.landmark?', '+order.customer.landmark:''}, ${order.customer.city||''}, ${order.customer.state||''}, ${order.customer.pincode||''}`,
      'Product name':JSON.stringify(order),
      'Customer number':order.customer.phone||'',
      'Product price':String(order.total??0),
      'Product size':(order.items||[]).map(x=>`${x.name||x.id||product(x.id)?.name||''} x${x.qty||1} ${x.size||''}`).join(' | ')
    };
    await supabaseRequest(SUPABASE_REST,{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify(row)});
    return true;
  }catch(error){
    console.error('SUPABASE ORDER ERROR:',error);
    toast(`Order save failed: ${error.message||'Supabase error'}`);
    return false;
  }
}
function applyLocalOrder(order){
  state.orders.unshift(order);
  state.profile={...state.profile,name:order.customer.name,email:order.customer.email,phone:order.customer.phone,address:order.customer.address,landmark:order.customer.landmark||'',houseNumber:order.customer.houseNumber||'',city:order.customer.city,state:order.customer.state||'',pincode:order.customer.pincode};
  state.cart=[];
  save();
}
async function finalizeOrder(order,skipSuccess=false){
  const cloudSaved=await saveOrderToSupabase(order);
  if(!cloudSaved)return false;
  applyLocalOrder(order);
  if(!skipSuccess)showPaymentSuccess(order.id,order.payment);
  return true;
}
function showUPIPayment(order){
  const amount=order.total.toFixed(2),upi=encodeURIComponent(state.settings.upi||'kryvenera@upi'),brand=encodeURIComponent(state.settings.brand||'Kryven Era'),upiLink=`upi://pay?pa=${upi}&pn=${brand}&am=${amount}&cu=INR&tn=${encodeURIComponent('Kryven Era Order '+order.id)}`;
  openModal(`<div class="phonepe-checkout"><div class="upi-head"><div><span class="eyebrow">Secure UPI checkout</span><h2>Scan QR & Pay</h2></div><button class="drawer-close" onclick="closeModal()">×</button></div><div class="upi-card"><div class="upi-brand">UPI</div><div class="upi-amount">${money(order.total)}</div><div class="upi-id">To: <b>${esc(state.settings.upi||'kryvenera@upi')}</b></div><div id="upiQr" style="width:220px;height:220px;margin:18px auto;background:#fff;border-radius:14px;padding:10px;display:flex;align-items:center;justify-content:center"><span style="color:#111;font-size:12px">Loading QR…</span></div><a class="btn upi-pay" href="${upiLink}">Open PhonePe / UPI App →</a><div id="upiStatus" class="muted" style="font-size:12px;margin-top:14px;text-align:center">Order placed. Complete the UPI payment using the button or QR.</div><p class="muted" style="font-size:11px;margin-top:10px;text-align:center">Confirmation is automatic when your connected UPI gateway/backend reports the transaction as paid.</p></div></div>`);
  window.__pendingOrder=order;
  renderUPIQR(upiLink);
}
async function renderUPIQR(text){const el=document.getElementById('upiQr');if(!el)return;try{if(!window.QRCode){await new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';sc.onload=resolve;sc.onerror=reject;document.head.appendChild(sc)})}const canvas=document.createElement('canvas');await QRCode.toCanvas(canvas,text,{width:200,margin:1});el.innerHTML='';el.appendChild(canvas)}catch{el.innerHTML='<span style="color:#111;font-size:12px;text-align:center">QR unavailable. Use the UPI button below.</span>'}}
function startUPIPaymentPolling(orderId){clearInterval(window.__upiPoll);const endpoint=window.KRYVEN_UPI_VERIFY_ENDPOINT||'/api/upi/verify';let attempts=0;window.__upiPoll=setInterval(async()=>{attempts++;if(attempts>120){clearInterval(window.__upiPoll);return}try{const res=await fetch(`${endpoint}?orderId=${encodeURIComponent(orderId)}`,{cache:'no-store'});if(!res.ok)return;const data=await res.json();if(data?.paid===true){clearInterval(window.__upiPoll);const o=window.__pendingOrder;if(o&&o.id===orderId){o.status='Placed';finalizeOrder(o);window.__pendingOrder=null}}}catch{}},3000)}
function playSuccess(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(660,c.currentTime);o.frequency.exponentialRampToValueAtTime(990,c.currentTime+.18);g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.2,c.currentTime+.03);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.55);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.55)}catch{}}
function showPaymentSuccess(id,payment){closeModal();const box=document.createElement('div');box.className='payment-success-toast';box.innerHTML=`<div class="success-icon">✓</div><div><strong>Payment successful</strong><span>Order ${esc(id)} confirmed${payment==='upi'?' · UPI paid':''}</span></div>`;document.body.appendChild(box);playSuccess();setTimeout(()=>{box.classList.add('hide');setTimeout(()=>box.remove(),500)},4200);setTimeout(()=>render(),450)}
function openReviewForm(pid){const delivered=state.orders.some(o=>o.status==='Delivered'&&o.items.some(i=>i.id===pid)); if(!delivered){toast('Reviews unlock after your order is marked Delivered');return} openModal(`<div class="modal-top"><div><div class="eyebrow">Customer review</div><h3 style="margin:0;font-family:'Playfair Display',Georgia,serif">Review this product</h3></div><button class="drawer-close" onclick="closeModal()">×</button></div><div style="padding:20px"><div class="form-grid"><div class="field"><label>Your name</label><input id="rvName" value="${esc(state.profile.name)}"></div><div class="field"><label>Rating</label><select id="rvRating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div><div class="field" style="grid-column:1/-1"><label>Review</label><textarea id="rvText" placeholder="Tell us about fit, quality and feel..."></textarea></div><div class="field" style="grid-column:1/-1"><label>Customer photos</label><input id="rvFiles" type="file" accept="image/*" multiple></div></div><button class="btn primary" style="margin-top:15px" onclick="submitReview('${pid}')">Post review</button></div>`)}
window.openReviewForm=openReviewForm;
window.submitReview=async(pid)=>{const files=[...(document.getElementById('rvFiles')?.files||[])];const photos=[];for(const f of files.slice(0,4)) photos.push(await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(f)}));state.reviews.unshift({productId:pid,name:document.getElementById('rvName').value||'Kryven Customer',rating:Number(document.getElementById('rvRating').value),text:document.getElementById('rvText').value,photos});save();closeModal();toast('Review submitted');setTimeout(()=>openProduct(pid),100)};

async function init3D(elId,p){const el=document.getElementById(elId); if(!el)return; let THREE,OrbitControls; try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'); ({OrbitControls}=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js'));}catch(e){el.innerHTML='<div class="muted" style="padding:40px;text-align:center">3D preview could not load. Product photos are still available.</div>';return} const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,el.clientWidth/el.clientHeight,.1,100);camera.position.set(0,1.1,4.3);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);el.prepend(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=6;const a=new THREE.AmbientLight(0xffffff,1.3);scene.add(a);const l1=new THREE.DirectionalLight(0xffdf9a,2.4);l1.position.set(3,4,4);scene.add(l1);const l2=new THREE.DirectionalLight(0x9aa4b2,1.4);l2.position.set(-3,2,-2);scene.add(l2);const group=new THREE.Group();scene.add(group);const black=new THREE.MeshStandardMaterial({color:0x101112,metalness:.35,roughness:.34});const gold=new THREE.MeshStandardMaterial({color:0xd7ac56,metalness:.75,roughness:.22});const torso=new THREE.Mesh(new THREE.BoxGeometry(2.25,2.3,.55),black);torso.position.y=.35;group.add(torso);const left=new THREE.Mesh(new THREE.BoxGeometry(.85,1.15,.55),black);left.position.set(-1.38,.72,0);left.rotation.z=-.42;group.add(left);const right=left.clone();right.position.x=1.38;right.rotation.z=.42;group.add(right);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.38,.42,.24,48),black);neck.position.y=1.55;group.add(neck);const mark=new THREE.Mesh(new THREE.BoxGeometry(.32,.58,.025),gold);mark.position.set(0,.45,.3);mark.rotation.z=-.15;group.add(mark);const mark2=new THREE.Mesh(new THREE.BoxGeometry(.48,.12,.025),gold);mark2.position.set(.11,.62,.3);mark2.rotation.z=.4;group.add(mark2);const floor=new THREE.Mesh(new THREE.CircleGeometry(2.1,64),new THREE.MeshStandardMaterial({color:0x222629,metalness:.6,roughness:.28,transparent:true,opacity:.75}));floor.rotation.x=-Math.PI/2;floor.position.y=-.85;group.add(floor);function resize(){const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}window.addEventListener('resize',resize);function tick(){controls.update();renderer.render(scene,camera);requestAnimationFrame(tick)}tick()}


window.startBarcodeScan=async()=>{try{if(!('BarcodeDetector' in window)){toast('Barcode scanning is not supported here. Type the barcode instead.');return}const detector=new BarcodeDetector({formats:['ean_13','ean_8','code_128','code_39','upc_a','upc_e']});const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.style.position='fixed';video.style.zIndex='100';video.style.inset='50% auto auto 50%';video.style.transform='translate(-50%,-50%)';video.style.width='min(520px,92vw)';video.style.border='2px solid #d8ab58';video.style.borderRadius='18px';video.style.background='#000';document.body.appendChild(video);video.srcObject=stream;await video.play();const scan=async()=>{try{const codes=await detector.detect(video);if(codes.length){const value=codes[0].rawValue;stream.getTracks().forEach(t=>t.stop());video.remove();document.querySelector('#topSearch').value=value;search(value);toast('Barcode found');return}}catch{}requestAnimationFrame(scan)};scan()}catch(e){toast('Camera permission denied. Enter the barcode manually.')}};

function checkoutMarkup(){const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0);return `<div class="checkout-grid"><div class="checkout-card"><div class="form-section"><h4>Shipping details</h4><div class="form-grid"><div class="field"><label>Name</label><input id="coName" value="${esc(state.profile.name)}"></div><div class="field"><label>Phone</label><input id="coPhone" value="${esc(state.profile.phone)}"></div><div class="field" style="grid-column:1/-1"><label>Address</label><input id="coAddress" value="${esc(state.profile.address)}"></div><div class="field"><label>City</label><input id="coCity" value="${esc(state.profile.city)}"></div><div class="field"><label>Pincode</label><input id="coPin" value="${esc(state.profile.pincode)}"></div></div></div><div class="form-section"><h4>Discount code <span class="muted">optional</span></h4><div style="display:flex;gap:8px"><input id="coupon" style="flex:1" placeholder="Enter code"><button class="btn" onclick="applyCheckoutCoupon()">Apply</button></div><div id="couponMsg" class="muted"></div></div><div class="form-section"><h4>Payment method</h4><div class="payment-list">${state.settings.payments.cod?'<label class="toggle-row"><span>Cash on Delivery</span><input name="pay" type="radio" value="cod" checked></label>':''}${state.settings.payments.upi?'<label class="toggle-row"><span>UPI Payment</span><input name="pay" type="radio" value="upi"></label>':''}${state.settings.payments.card?'<label class="toggle-row"><span>Credit / Debit Card</span><input name="pay" type="radio" value="card"></label>':''}</div></div></div><div class="summary-card"><h4>Order summary</h4><div class="summary-row"><span>Subtotal</span><span>${money(sub)}</span></div><div class="summary-row"><span>Shipping</span><span>${money(state.settings.shipping)}</span></div><div class="summary-row"><b>Total</b><b id="sumTotal">${money(sub+state.settings.shipping)}</b></div><button class="btn primary" style="width:100%;margin-top:16px" onclick="placeOrder()">Place order →</button></div></div>`}
function customerPage(){
  const p=state.profile;
  if(!state.account?.signedIn){
    return `<div class="account-page-card"><div class="account-auth-card"><div class="account-auth-mark">K</div><div class="eyebrow">CUSTOMER ACCOUNT</div><h2>Sign in to your ERA.</h2><p class="muted">Create or access your customer account, then edit your details anytime.</p>${accountPolicyText()}<div class="form-section" style="margin-top:16px"><div class="field"><label>FULL NAME <span class="required-mark">*</span></label><input id="signinName" value="${esc(p.name||'')}" placeholder="Your name"></div><div class="field" style="margin-top:10px"><label>MOBILE NUMBER <span class="required-mark">*</span></label><input id="signinPhone" value="${esc(p.phone||'')}" inputmode="tel" placeholder="10-digit mobile number"></div><div class="field" style="margin-top:10px"><label>EMAIL ID <span class="optional-mark">(Optional)</span></label><input id="signinEmail" value="${esc(p.email||'')}" type="email" placeholder="name@example.com"></div><label class="account-consent"><input id="accountConsent" type="checkbox"><span>I confirm that I have read and agree to the KRYVEN ERA privacy & data-use policy above.</span></label><button class="btn primary" style="margin-top:16px" onclick="completeAccountSignIn(false);render()">CONTINUE →</button></div></div></div>`;
  }
  return `<div class="account-page-card"><div class="account-page-top"><div><div class="eyebrow">CUSTOMER ACCOUNT</div><h2>Manage your details.</h2><p class="muted">Edit your profile, review your Customer ID or manage your account.</p></div><div class="account-id-mini"><span>CUSTOMER ID</span><b>${esc(getCustomerId())}</b></div></div><div class="checkout-card"><div class="form-grid"><div class="field"><label>Full name</label><input id="pfName" value="${esc(p.name)}"></div><div class="field"><label>Email</label><input id="pfEmail" value="${esc(p.email)}" type="email"></div><div class="field"><label>Phone</label><input id="pfPhone" value="${esc(p.phone)}"></div><div class="field"><label>Address</label><input id="pfAddress" value="${esc(p.address)}"></div><div class="field"><label>Landmark</label><input id="pfLandmark" value="${esc(p.landmark||'')}"></div><div class="field"><label>House / Building No.</label><input id="pfHouse" value="${esc(p.houseNumber||'')}"></div><div class="field"><label>City</label><input id="pfCity" value="${esc(p.city)}"></div><div class="field"><label>State</label><input id="pfState" value="${esc(p.state||'')}"></div><div class="field"><label>Pincode</label><input id="pfPin" value="${esc(p.pincode)}"></div></div><button class="btn primary" style="margin-top:18px" onclick="saveProfile();render()">SAVE CUSTOMER DETAILS</button><div class="account-page-actions"><button class="account-action danger-outline" onclick="openLogoutConfirm()">LOG OUT</button><button class="account-action danger-solid" onclick="openDeleteConfirm()">DELETE ACCOUNT</button></div></div></div>`;
}
function reviewsPage(){const rs=state.reviews;return `<div class="review-grid">${rs.length?rs.map(r=>`<article class="review-card"><b>${esc(r.name)}</b><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div><p>${esc(r.text)}</p>${r.photos?.length?`<div class="review-photos">${r.photos.map(x=>`<img src="${x}">`).join('')}</div>`:''}</article>`).join(''):'<div class="empty-state">Customer reviews will appear here after verified purchases.</div>'}</div>`}
function searchPage(){const q=new URLSearchParams(location.search).get('q')||'';const matches=state.products.filter(p=>(p.name+p.category+p.barcode).toLowerCase().includes(q.toLowerCase()));return `<div class="search-page"><div class="search-wrap large"><input class="search" value="${esc(q)}" placeholder="Search products, category or barcode" oninput="location.href='search.html?q='+encodeURIComponent(this.value)"></div><div class="product-grid" style="margin-top:20px">${matches.map(productCard).join('')||'<div class="empty-state">No matching products found.</div>'}</div></div>`}

window.render=render; window.openModal=openModal; window.closeModal=closeModal; window.closeDrawer=closeDrawer; window.search=search; window.imgFallback=imgFallback; window.openProfile=openProfile; window.openCheckout=openCheckout; window.toggleWishlist=toggleWishlist; window.openCategory=openCategory;


function showReferralOnce(){if(localStorage.getItem('kryven-era-referral-seen')==='1')return;setTimeout(()=>openModal(`<div class="modal-top"><div><div class="eyebrow">Welcome to KRYVEN ERA</div><h3 style="margin:0;font-family:'Playfair Display',Georgia,serif">How did you find us?</h3></div></div><div style="padding:22px"><p class="muted" style="margin-top:0">Choose once. We won't ask again at checkout.</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><button class="btn" onclick="chooseReferral('Google')">Google</button><button class="btn" onclick="chooseReferral('Facebook')">Facebook</button><button class="btn" onclick="chooseReferral('Instagram')">Instagram</button><button class="btn" onclick="chooseReferral('YouTube')">YouTube</button></div></div>`),200)}
window.chooseReferral=(source)=>{localStorage.setItem('kryven-era-referral-source',source);localStorage.setItem('kryven-era-referral-seen','1');closeModal();toast(`${source} selected`)};



/* =========================
   KRYVEN ERA — VISUAL UPGRADE
   Front-end only: Supabase table/columns/REST contract remain unchanged.
   ========================= */
const STATUS_FLOW = ['Placed','Processing','Shipped','Out for Delivery','Delivered'];
const STATUS_COPY = {
  Placed:'Order received', Processing:'Preparing your order', Shipped:'Handed to courier',
  'Out for Delivery':'Courier is delivering today', Delivered:'Delivered successfully', Cancelled:'Order cancelled'
};
function fmtDate(v, opts={dateStyle:'medium', timeStyle:'short'}){try{return new Intl.DateTimeFormat('en-IN',opts).format(new Date(v))}catch{return '—'}}
function fmtDay(v){try{return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v))}catch{return '—'}}
function addDaysISO(base,days){const d=new Date(base||Date.now());d.setDate(d.getDate()+days);return d.toISOString()}
function ensureOrderTracking(o){
  o=o||{}; o.status=o.status||'Placed'; o.createdAt=o.createdAt||new Date().toISOString();
  const target=typeof o.expectedDeliveryDate==='string'?o.expectedDeliveryDate:addDaysISO(o.createdAt,5);
  o.expectedDeliveryDate=target;
  o.deliveryWindow=o.deliveryWindow||'10 AM – 9 PM';
  o.trackingNumber=o.trackingNumber||'';
  o.courier=o.courier||'';
  o.customerNote=o.customerNote||'';
  o.lastUpdatedAt=o.lastUpdatedAt||o.createdAt;
  o.timeline=Array.isArray(o.timeline)?o.timeline:[];
  const seen=new Set(o.timeline.map(x=>x.status));
  if(!seen.has('Placed')) o.timeline.unshift({status:'Placed',at:o.createdAt,note:'Order received'});
  return o;
}
function setTrackingForStatus(o,status,note=''){
  ensureOrderTracking(o); o.status=status; o.lastUpdatedAt=new Date().toISOString();
  if(status==='Shipped'&&!o.shippedAt)o.shippedAt=o.lastUpdatedAt;
  if(status==='Out for Delivery'&&!o.outForDeliveryAt)o.outForDeliveryAt=o.lastUpdatedAt;
  if(status==='Delivered'&&!o.deliveredAt)o.deliveredAt=o.lastUpdatedAt;
  if(status==='Cancelled'&&!o.cancelledAt)o.cancelledAt=o.lastUpdatedAt;
  const ix=o.timeline.findIndex(x=>x.status===status);
  const item={status,at:o.lastUpdatedAt,note:note||STATUS_COPY[status]||status};
  if(ix>=0)o.timeline[ix]=item;else o.timeline.push(item);
}
state.orders.forEach(ensureOrderTracking);

function header(){const home=document.body.dataset.page==='home';return `<header class="header hero-header ${home?'floating-header':''}"><div class="container nav">
  <a class="logo premium-logo" href="index.html" aria-label="KRYVEN ERA home"><img class="logo-image" src="favicon.png" alt="KRYVEN ERA logo"><span class="logo-text">${esc(state.settings.brand)}<small>${esc(state.settings.tagline||'THE ERA OF UNCOMPROMISING STYLE')}</small></span></a>
  <nav class="nav-links"><a href="index.html">HOME</a><a href="shop.html">SHOP</a><a href="categories.html">CATEGORIES</a><a href="tracking.html">TRACK ORDER</a><a href="help-care.html">CONTACT</a></nav>
  <div class="search-wrap"><input id="topSearch" class="search" placeholder="Search the era…" onfocus="renderSearchOverlay('')" oninput="search(this.value)"/><span class="search-icon">⌕</span><button class="scan-btn" title="Scan barcode" onclick="startBarcodeScan()">▥</button></div>
  <div class="nav-actions"><button class="icon-btn menu-btn" title="Menu" aria-label="Open menu" onclick="openMenu()"><span class="menu-lines"><i></i><i></i><i></i></span></button><button class="icon-btn customer-btn" title="Customer account" aria-label="Customer account" onclick="openProfile()">◉</button><button class="icon-btn wishlist-btn ${state.wishlist.length?'has-wishlist':''}" title="Wishlist" onclick="openWishlist(event)">♡<span class="badge">${state.wishlist.length||''}</span></button><button class="icon-btn bag-btn" title="Bag" onclick="openBag()">👜<span class="badge">${totalItems()||''}</span></button></div>
</div></header>`}
function hero(){return `<section id="home" class="hero premium-hero"><div class="hero-media"><div class="hero-image" style="background-image:url('${IMG.hero}')"></div>${state.settings.heroVideo?`<video autoplay muted loop playsinline src="${esc(state.settings.heroVideo)}"></video>`:''}<div class="hero-vignette"></div></div><div class="container hero-grid premium-hero-grid"><div class="hero-copy"><div class="kicker">KRYVEN ERA / 2026 COLLECTION</div><h1>WEAR<br><span>YOUR ERA.</span></h1><p>Not just clothing. A mindset. Premium streetwear engineered for presence, detail and movement.</p><div class="hero-cta"><a class="btn primary" href="shop.html">EXPLORE COLLECTION →</a><button class="btn ghost" onclick="openCategory('T-Shirts')">VIEW THE DROP</button></div><div class="hero-mini-meta"><span>01 / PREMIUM FABRICS</span><span>02 / LIMITED DROPS</span><span>03 / SECURE CHECKOUT</span></div></div><div class="hero-side-note"><div class="hero-side-line"></div><div>SCROLL TO ENTER THE ERA</div></div></div></section>`}
function categories(){const cats=['T-Shirts','Hoodies','Pants','Jackets','Accessories'];return `<section id="categories" class="section editorial-section"><div class="container"><div class="section-head"><div><div class="eyebrow">01 / CATEGORIES</div><h2>THE ERA, YOUR WAY.</h2></div><p class="muted">Explore signature silhouettes, monochrome layers and statement pieces.</p></div><div class="categories premium-categories">${cats.map((c,i)=>{const p=state.products.find(x=>x.category===c)||state.products[i%Math.max(state.products.length,1)];return p?`<button class="cat premium-cat" onclick="openCategory('${c}')"><img src="${p.images[0]}" onerror="imgFallback()"/><div class="cat-shade"></div><div class="cat-index">0${i+1}</div><div class="cat-info"><b>${c}</b><span>${state.products.filter(x=>x.category===c).length||1} pieces · EXPLORE →</span></div></button>`:''}).join('')}</div></div></section>`}
function productCard(p){const wished=state.wishlist.includes(p.id);return `<article class="card premium-card" onclick="openProduct('${p.id}')"><div class="card-media"><img src="${p.images[0]}" onerror="imgFallback()"/><span class="pill">${esc(p.discount||'LIMITED')}</span><button class="like ${wished?'active':''}" onclick="event.stopPropagation();toggleWishlist('${p.id}')">${wished?'♥':'♡'}</button><span class="quick-label">QUICK VIEW</span></div><div class="card-body"><div class="eyebrow">${esc(p.category)} / ${esc(p.id)}</div><h3>${esc(p.name)}</h3><div class="meta">★ ${p.rating} · ${p.reviews} reviews</div><div class="price-row"><div class="price">${money(p.price)}</div><div class="mrp">${money(p.mrp)}</div><div class="discount">${esc(p.discount)}</div></div><div class="size-row">${Object.entries(p.sizes||{}).map(([s,on])=>`<span class="size ${on?'':'off'}">${s}</span>`).join('')}</div></div></article>`}
function shop(){return `<section id="shop" class="section editorial-section"><div class="container"><div class="drop-banner"><div><div class="eyebrow">02 / FEATURED COLLECTION</div><h2>THE DROP.</h2><p class="muted">Curated essentials built around the Kryven silhouette.</p></div><a class="text-link" href="shop.html">VIEW ALL →</a></div><div class="limited-strip"><span>LIMITED DROP</span><b>THE ERA OF UNCOMPROMISING STYLE</b><em>FREE SHIPPING ON ELIGIBLE ORDERS</em></div><div class="product-grid premium-grid">${state.products.map(productCard).join('')}</div></div></section>`}
function trust(){return `<section class="section trust-section"><div class="container trust premium-trust"><div class="trust-card"><span>01</span><b>Premium Quality</b><small>Heavyweight fabrics & refined finishing.</small></div><div class="trust-card"><span>02</span><b>Fast Dispatch</b><small>Order updates from packing to delivery.</small></div><div class="trust-card"><span>03</span><b>Secure Payments</b><small>UPI, cards and COD flows.</small></div><div class="trust-card"><span>04</span><b>3D Product View</b><small>Rotate, zoom and inspect every piece.</small></div></div></section>`}
function footer(){return `<footer class="footer premium-footer"><div class="container footer-grid"><div><div>${logo()}</div><p class="muted" style="line-height:1.8;max-width:390px">KRYVEN ERA — premium streetwear for people who move different. THE ERA OF UNCOMPROMISING STYLE.</p></div><div><b>COLLECTION</b><a href="shop.html">Shop all</a><a href="categories.html">Categories</a><a href="wishlist.html">Wishlist</a></div><div><b>ORDER</b><a href="tracking.html">Track order</a><a href="checkout.html">Checkout</a><a href="customer-details.html">Customer details</a></div><div><b>CONTACT</b><a href="help-care.html">Help & Care</a><a href="admin.html">Admin Panel</a><a href="https://wa.me/${esc(state.settings.whatsapp||'')}" target="_blank">WhatsApp</a></div></div><div class="container footer-note">© 2026 KRYVEN ERA · THE ERA OF UNCOMPROMISING STYLE.</div></footer>`}
function productDetail(p){
  const selected=p.sizes?.S?'S':Object.keys(p.sizes||{}).find(s=>p.sizes[s])||Object.keys(p.sizes||{})[0]||'S';
  const color=p.colors?.[0]||'Black';
  const vf=(p.variantVisuals&&p.variantVisuals[color]?.filter)||'none';
  return `<div class="product-detail-full premium-product-detail">
    <div class="product-layout">
      <div class="gallery product-gallery-swipe">
        <div class="thumbs product-swipe-thumbs">${(p.images||[]).map((im,i)=>`<button class="thumb product-swipe-thumb ${i===0?'active':''}" type="button" onclick="setProductPageGalleryImage('${esc(p.id)}',${i})"><img src="${esc(im)}" alt="${esc(p.name)} photo ${i+1}"></button>`).join('')}</div>
        <div class="main-shot premium-shot swipe-stage product-page-swipe-stage" data-product="${esc(p.id)}" data-index="0">
          <button class="swipe-arrow swipe-arrow-left" type="button" aria-label="Previous photo" onclick="productPageSwipePrev('${esc(p.id)}')">‹</button>
          <img id="productPageMain" src="${esc(p.images?.[0]||'')}" style="filter:${vf}" alt="${esc(p.name)}">
          <button class="swipe-arrow swipe-arrow-right" type="button" aria-label="Next photo" onclick="productPageSwipeNext('${esc(p.id)}')">›</button>
          <div class="swipe-dots">${(p.images||[]).map((_,i)=>`<button class="product-swipe-dot ${i===0?'active':''}" type="button" onclick="setProductPageGalleryImage('${esc(p.id)}',${i})" aria-label="Photo ${i+1}"></button>`).join('')}</div>
          <div class="swipe-hint">SWIPE LEFT / RIGHT</div>
        </div>
      </div>
      <div class="product-info premium-product-info">
        <div class="eyebrow">${esc(p.category)} / ${esc(p.id)}</div><h1>${esc(p.name)}</h1>
        <div class="price-row"><div class="price">${money(p.price)}</div><div class="mrp">${money(p.mrp)}</div><div class="discount">${esc(p.discount)}</div></div>
        <div class="rating-big">★★★★★ <span>${p.rating} · ${p.reviews} reviews</span></div>
        <p class="desc">${esc(p.description)}</p>
        <div class="detail-label">COLOUR</div>
        <div class="opt-row product-page-colours" id="pageColorOptions">${(p.colors||[]).map((c,i)=>`<button class="opt ${i===0?'selected':''}" type="button" onclick="selectProductPageColor('${esc(c)}')">${esc(c)}</button>`).join('')}</div>
        <div class="detail-label">SIZE / AVAILABILITY</div>
        <div class="opt-row" id="pageSizeOptions">${Object.entries(p.sizes||{}).map(([sz,on])=>`<button class="opt ${on?(sz===selected?'selected':''):'disabled'}" type="button" ${on?`onclick="selectProductPageSize('${esc(sz)}')"`:'disabled'}>${esc(sz)}${on?'':' · OUT'}</button>`).join('')}</div>
        <div class="product-actions"><button class="btn primary" type="button" onclick="confirmPageAdd('${esc(p.id)}')">ADD TO BAG →</button><button class="btn" type="button" onclick="buyNowFromPage('${esc(p.id)}')">BUY NOW</button></div>
        <div class="detail-trust"><span>✓ PREMIUM FABRIC</span><span>✓ SECURE CHECKOUT</span><span>✓ TRACKED DELIVERY</span></div>
      </div>
    </div>
    <section class="product-section"><div class="eyebrow">03 / THE DETAILS</div><h2>BUILT TO BE SEEN.</h2><p class="long-copy">${esc(p.description)}</p><div class="features">${(p.features||[]).map(f=>`<div class="feature">✓ ${esc(f)}</div>`).join('')}</div></section>
    <section class="product-section"><div class="eyebrow">04 / 3D EXPERIENCE</div><h2>ROTATE THE PIECE.</h2><div class="three-wrap premium-three" id="page-three-${esc(p.id)}"><div class="three-help">DRAG TO ROTATE · PINCH TO ZOOM · EXPLORE EVERY DETAIL</div></div></section>
    <section class="product-section"><div class="eyebrow">05 / RECOMMENDED</div><h2>COMPLETE THE ERA.</h2><div class="product-grid premium-grid">${state.products.filter(x=>x.id!==p.id).slice(0,4).map(productCard).join('')}</div></section>
    <section class="product-section rating-last"><div class="eyebrow">06 / COMMUNITY</div><h2>WHAT THE ERA SAYS.</h2><div class="review-grid">${state.reviews.filter(r=>r.productId===p.id).map(reviewHTML).join('')||`<div class="muted">Verified customer reviews appear here after delivery.</div>`}</div><button class="btn" style="margin-top:14px" onclick="openReviewForm('${esc(p.id)}')">WRITE A REVIEW</button></section>
  </div>`;
}
function trackingPage(){return `<div class="tracking-page"><div class="tracking-hero"><div class="eyebrow">ORDER CONTROL</div><h1>TRACK YOUR ERA.</h1><p class="muted">Enter your order ID to see status, expected arrival, courier and delivery milestones.</p><div class="tracking-search"><input id="trackId" placeholder="KE-2026-001"/><button class="btn primary" onclick="trackOrder()">TRACK ORDER →</button></div></div><div id="trackResult" class="tracking-result"><div class="empty-state">Your live tracking details will appear here.</div></div></div>`}
async function fetchCloudOrderById(id){try{const url=`${SUPABASE_REST}?select=*&order=id.desc`;const data=await supabaseRequest(url);for(const row of (data||[])){let o=null;try{o=JSON.parse(row['Product name'])}catch{};if(o&&o.id===id){o.cloudRowId=row.id;ensureOrderTracking(o);return o}}}catch(e){console.warn(e)}return null}
window.trackOrder=async()=>{const id=(document.getElementById('trackId')?.value||'').trim();const box=document.getElementById('trackResult');if(!id){box.innerHTML='<div class="empty-state">Enter your order ID first.</div>';return}box.innerHTML='<div class="tracking-loading">Checking live order status…</div>';let o=state.orders.find(x=>x.id===id)||await fetchCloudOrderById(id);if(!o){box.innerHTML='<div class="empty-state">Order not found. Check the order ID and try again.</div>';return}ensureOrderTracking(o);if(!state.orders.find(x=>x.id===o.id)){state.orders.unshift(o);save()}const idx=STATUS_FLOW.indexOf(o.status);box.innerHTML=`<div class="tracking-card"><div class="tracking-card-top"><div><div class="eyebrow">${esc(o.id)}</div><h3>${esc(STATUS_COPY[o.status]||o.status)}</h3><p class="muted">Last updated ${fmtDate(o.lastUpdatedAt)}</p></div><div class="eta-box"><span>EXPECTED ARRIVAL</span><b>${fmtDay(o.expectedDeliveryDate)}</b><small>${esc(o.deliveryWindow)}</small></div></div><div class="tracking-progress">${STATUS_FLOW.map((s,i)=>`<div class="track-step ${i<=idx?'done':''} ${s===o.status?'current':''}"><span>${i<idx?'✓':i===idx?'●':'○'}</span><b>${s}</b><small>${fmtDate((o.timeline.find(t=>t.status===s)||{}).at||o.createdAt,{dateStyle:'medium'})}</small></div>`).join('')}</div><div class="tracking-meta"><div><span>Courier</span><b>${esc(o.courier||'Assigned after dispatch')}</b></div><div><span>Tracking No.</span><b>${esc(o.trackingNumber||'Will appear after shipment')}</b></div><div><span>Payment</span><b>${esc(String(o.payment||'COD').toUpperCase())}</b></div><div><span>Total</span><b>${money(o.total)}</b></div></div>${o.customerNote?`<div class="customer-note"><b>NOTE FROM KRYVEN ERA</b><p>${esc(o.customerNote)}</p></div>`:''}</div>`}
function openTracking(e){e?.preventDefault();openDrawer(`<div class="drawer-head"><h3>Track Order</h3><button class="drawer-close" onclick="closeDrawer()">×</button></div><div class="form-section" style="margin-top:15px"><div class="field"><label>Order ID</label><input id="trackId" placeholder="KE-2026-001"/></div><button class="btn primary" style="margin-top:12px" onclick="trackOrder()">Track →</button><div id="trackResult" style="margin-top:18px"></div></div>`)}
function openProduct(id){location.href=`product.html?id=${encodeURIComponent(id)}`}

function bagPage(){
  if(!state.cart.length) return `<div class="empty-state bag-empty"><div class="eyebrow">YOUR BAG</div><h2>EMPTY FOR NOW.</h2><p class="muted">The next piece of your era is waiting.</p><a class="btn primary" href="shop.html">EXPLORE COLLECTION →</a></div>`;
  const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0);
  return `<div class="bag-layout"><div class="bag-list">${state.cart.map((x,i)=>{const p=product(x.id);return `<div class="bag-line"><img src="${p.images[0]}"><div class="bag-line-main"><div class="eyebrow">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p class="muted">${esc(x.color||'Black')} · Size ${esc(x.size||'—')}</p><div class="qty"><button onclick="changeQty(${i},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${i},1)">+</button></div></div><b>${money(p.price*x.qty)}</b></div>`}).join('')}</div><aside class="summary-card bag-summary"><div class="eyebrow">ORDER SUMMARY</div><h3>READY FOR CHECKOUT.</h3><div class="summary-row"><span>Subtotal</span><span>${money(sub)}</span></div><div class="summary-row"><span>Shipping</span><span>${money(state.settings.shipping)}</span></div><div class="summary-row total"><b>Total</b><b>${money(sub+state.settings.shipping)}</b></div><button class="btn primary" style="width:100%;margin-top:14px" onclick="openCheckout()">PROCEED TO CHECKOUT →</button></aside></div>`;
}

function renderPage(){const page=document.body.dataset.page||'home';
  if(page==='home') return `${header()}${hero()}${categories()}${shop()}${trust()}${footer()}${drawDrawer()}${drawModal()}`;
  if(page==='shop') return pageShell('Shop Collection',shop());
  if(page==='categories') return pageShell('Categories',categories());
  if(page==='product'){const p=product(new URLSearchParams(location.search).get('id')||state.products[0]?.id);return pageShell('Product Details',p?productDetail(p):'<div class="empty-state">Product not found.</div>');}
  if(page==='wishlist'){const items=state.products.filter(p=>state.wishlist.includes(p.id));return pageShell('Wishlist',`<div class="product-grid premium-grid">${items.length?items.map(productCard).join(''):'<div class="empty-state">Your wishlist is empty.</div>'}</div>`)}
  if(page==='bag'){return pageShell('Your Bag',bagPage())}
  if(page==='checkout'){return pageShell('Checkout',checkoutMarkup());}
  if(page==='customer'){return pageShell('Customer Details',customerPage());}
  if(page==='tracking'){return pageShell('Track Order',trackingPage());}
  if(page==='help'){return pageShell('Help & Care',supportPage());}
  if(page==='reviews'){return pageShell('Customer Reviews',reviewsPage());}
  if(page==='search'){return pageShell('Search',searchPage());}
  return `${header()}${hero()}${shop()}${footer()}${drawDrawer()}${drawModal()}`;
}

/* =========================
   KRYVEN ERA — CHECKOUT + SWIPE REDESIGN
   Keeps existing store/catalog/tracking/Admin contracts intact.
   ========================= */
function checkoutCustomerFields(){
  const p=Object.assign({name:'',phone:'',email:'',address:'',landmark:'',houseNumber:'',city:'',state:'',pincode:''},state.profile||{});
  return `<div class="checkout-fields-grid">
    <div class="checkout-field full"><label>FULL NAME <span class="required-mark">*</span></label><input id="coName" autocomplete="name" value="${esc(p.name)}" placeholder="Enter your full name"></div>
    <div class="checkout-field"><label>MOBILE NUMBER <span class="required-mark">*</span></label><input id="coPhone" inputmode="tel" autocomplete="tel" value="${esc(p.phone)}" placeholder="10-digit mobile number"></div>
    <div class="checkout-field"><label>EMAIL ID <span class="optional-mark">(Optional)</span></label><input id="coEmail" type="email" autocomplete="email" value="${esc(p.email)}" placeholder="name@example.com"></div>
    <div class="checkout-field full"><label>FULL ADDRESS <span class="required-mark">*</span></label><textarea id="coAddress" rows="3" autocomplete="street-address" placeholder="House / street / area / locality">${esc(p.address)}</textarea></div>
    <div class="checkout-field"><label>LANDMARK <span class="required-mark">*</span></label><input id="coLandmark" value="${esc(p.landmark||'')}" placeholder="Nearby landmark"></div>
    <div class="checkout-field"><label>HOUSE / BUILDING NUMBER <span class="optional-mark">(Optional)</span></label><input id="coHouse" value="${esc(p.houseNumber||'')}" placeholder="Flat 402 / Building 7"></div>
    <div class="checkout-field"><label>CITY <span class="required-mark">*</span></label><input id="coCity" value="${esc(p.city)}" placeholder="City"></div>
    <div class="checkout-field"><label>STATE <span class="required-mark">*</span></label><input id="coState" value="${esc(p.state||'')}" placeholder="State"></div>
    <div class="checkout-field"><label>PINCODE <span class="required-mark">*</span></label><input id="coPin" inputmode="numeric" maxlength="6" value="${esc(p.pincode)}" placeholder="6-digit PIN"></div>
  </div>`;
}
function checkoutPaymentMethods(){
  const pay=state.settings.payments||{};
  const methods=[
    {key:'cod',title:'Cash on Delivery',sub:`${Number(pay.codAdvancePercent??20)}% now · ${Math.max(0,100-Number(pay.codAdvancePercent??20))}% after delivery`,icon:'COD'},
    {key:'upi',title:'UPI',sub:'Instant online payment',icon:'UPI'},
    {key:'card',title:'Credit / Debit Card',sub:'Secure card payment',icon:'CARD'}
  ];
  const enabled=methods.filter(m=>pay[m.key]);
  return `<div class="checkout-payments" data-enabled-count="${enabled.length}">${methods.map((m,i)=>{
    const on=!!pay[m.key];
    return `<label class="checkout-payment ${on?'is-enabled':'is-disabled'}">
      <span class="payment-icon">${m.icon}</span><span class="payment-copy"><b>${esc(m.title)}</b><small>${esc(on?m.sub:'Disabled in Admin Panel')}</small></span>
      <input name="pay" type="radio" value="${m.key}" ${on&&i===0&&enabled[0]?.key===m.key?'checked':''} ${on?'':'disabled'}>
      <span class="payment-status">${on?'ENABLED':'DISABLED'}</span>
    </label>`;
  }).join('')}
  ${enabled.length?'<div class="checkout-payment-note">Payment availability is controlled from the Admin Panel.</div>':'<div class="checkout-payment-note warning">No payment method is enabled right now. Enable COD, UPI or Card from Admin → Payments.</div>'}
  </div>`;
}
function checkoutMarkup(){
  if(!state.cart.length)return '<div class="empty-state">Your bag is empty.</div>';
  const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0);
  const shipping=Number(state.settings.shipping||0);
  const total=sub+shipping;
  const codPct=Math.max(0,Math.min(100,Number(state.settings.payments?.codAdvancePercent??20)));
  const codAdvance=Math.round(total*codPct/100);
  const remaining=Math.max(0,total-codAdvance);
  return `<div class="checkout-redesign">
    <div class="checkout-intro"><div><div class="eyebrow">KRYVEN ERA / SECURE CHECKOUT</div><h2>Complete your order.</h2><p class="muted">Fast, clean and built for mobile. Your details stay with this order and can be reused later.</p></div><div class="checkout-step-badge"><span>STEP 01</span><b>DELIVERY DETAILS</b></div></div>
    <form class="checkout-layout" id="checkoutForm" onsubmit="event.preventDefault();placeOrder();" novalidate>
      <div class="checkout-main">
        <section class="checkout-panel"><div class="checkout-panel-head"><div><span>01</span><h3>Customer details</h3></div><small>Required fields are marked *</small></div>${checkoutCustomerFields()}</section>
        <section class="checkout-panel"><div class="checkout-panel-head"><div><span>02</span><h3>Payment method</h3></div><small>Choose an enabled method</small></div>${checkoutPaymentMethods()}</section>
        <section class="checkout-panel"><div class="checkout-panel-head"><div><span>03</span><h3>Offer code</h3></div><small>Optional</small></div><div class="checkout-coupon"><input id="coupon" placeholder="Enter KRYVEN10"><button type="button" class="btn" onclick="applyCheckoutCoupon()">APPLY</button></div><div id="couponMsg" class="checkout-help"></div></section>
      </div>
      <aside class="checkout-summary-card">
        <div class="summary-kicker">ORDER SUMMARY</div>
        <div class="checkout-items">${state.cart.map(x=>{const p=product(x.id);return `<div class="checkout-item"><img src="${esc(p.images?.[0]||'')}" alt=""><div><b>${esc(p.name)}</b><small>${esc(x.color||'Black')} · Size ${esc(x.size||'—')} · Qty ${x.qty}</small></div><strong>${money(p.price*x.qty)}</strong></div>`}).join('')}</div>
        <div class="checkout-total-lines"><div><span>Subtotal</span><b id="sumSub">${money(sub)}</b></div><div><span>Discount</span><b id="sumDisc">${money(0)}</b></div><div><span>Shipping</span><b>${shipping?money(shipping):'FREE'}</b></div><div class="grand"><span>Total</span><b id="sumTotal">${money(total)}</b></div></div>
        <div class="cod-split-card"><div><span>COD PAYMENT SPLIT</span><b>${codPct}% now</b></div><div class="cod-amounts"><strong>${money(codAdvance)}</strong><span>now</span><strong>${money(remaining)}</strong><span>after delivery</span></div><small>This split follows the COD percentage set by Admin.</small></div>
        <button class="btn primary checkout-submit" type="submit" ${state.settings.payments?.cod||state.settings.payments?.upi||state.settings.payments?.card?'':'disabled'}>PLACE ORDER SECURELY →</button>
        <div class="checkout-secure-note">✓ Admin controls COD / UPI / Card availability<br>✓ Email is optional<br>✓ Landmark is required · House/building number is optional</div>
      </aside>
    </form>
  </div>`;
}
function clearCheckoutError(id){const el=document.getElementById(id);if(!el)return;el.classList.remove('field-invalid');const msg=el.parentElement?.querySelector('.checkout-field-error');if(msg)msg.remove()}
function setCheckoutError(id,msg){const el=document.getElementById(id);if(!el)return;el.classList.add('field-invalid');const wrap=el.parentElement;if(wrap&&!wrap.querySelector('.checkout-field-error')){const e=document.createElement('div');e.className='checkout-field-error';e.textContent=msg;wrap.appendChild(e)}}
function validateCheckoutForm(){
  const required=[['coName','Full name is required'],['coPhone','Mobile number is required'],['coAddress','Full address is required'],['coLandmark','Landmark is required'],['coCity','City is required'],['coState','State is required'],['coPin','6-digit pincode is required']];
  let ok=true;
  required.forEach(([id,msg])=>{const el=document.getElementById(id);clearCheckoutError(id);if(!el?.value?.trim()){setCheckoutError(id,msg);ok=false}});
  const phone=document.getElementById('coPhone')?.value.trim()||'';if(phone && !/[0-9]{10}/.test(phone.replace(/\D/g,''))){setCheckoutError('coPhone','Enter a valid 10-digit mobile number');ok=false}
  const pin=document.getElementById('coPin')?.value.trim()||'';if(pin && !/^\d{6}$/.test(pin)){setCheckoutError('coPin','Enter a valid 6-digit pincode');ok=false}
  const email=document.getElementById('coEmail')?.value.trim()||'';if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setCheckoutError('coEmail','Enter a valid email or leave it blank');ok=false}
  const enabled=[...document.querySelectorAll('input[name="pay"]:not(:disabled)')];if(!enabled.length){toast('Please enable a payment method from Admin → Payments');ok=false}else if(!document.querySelector('input[name="pay"]:checked')){setCheckoutError('coName','Select a payment method below');ok=false}
  return ok;
}
function syncCheckoutProfile(){state.profile={...state.profile,name:document.getElementById('coName')?.value.trim()||'',phone:document.getElementById('coPhone')?.value.trim()||'',email:document.getElementById('coEmail')?.value.trim()||'',address:document.getElementById('coAddress')?.value.trim()||'',landmark:document.getElementById('coLandmark')?.value.trim()||'',houseNumber:document.getElementById('coHouse')?.value.trim()||'',city:document.getElementById('coCity')?.value.trim()||'',state:document.getElementById('coState')?.value.trim()||'',pincode:document.getElementById('coPin')?.value.trim()||''};save()}
window.openCheckout=()=>{if(!state.cart.length){toast('Your bag is empty');return}location.href='checkout.html'};
window.applyCheckoutCoupon=()=>{const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0),d=discountAmount(sub,getDiscountCode());const total=sub-d+Number(state.settings.shipping||0);const a=document.getElementById('sumSub'),b=document.getElementById('sumDisc'),c=document.getElementById('sumTotal'),m=document.getElementById('couponMsg');if(a)a.textContent=money(sub);if(b)b.textContent=d?`−${money(d)}`:money(0);if(c)c.textContent=money(total);if(m)m.textContent=d?'Coupon KRYVEN10 applied — 10% off.':'Use KRYVEN10 for 10% off.';}
window.placeOrder=async()=>{
  if(window.__orderSubmitting)return;
  window.__orderSubmitting=true;
  try{
    if(!validateCheckoutForm()){window.scrollTo({top:120,behavior:'smooth'});return}
    syncCheckoutProfile();
    const name=state.profile.name,phone=state.profile.phone,email=state.profile.email,address=state.profile.address,landmark=state.profile.landmark||'',houseNumber=state.profile.houseNumber||'',city=state.profile.city,stateName=state.profile.state,pincode=state.profile.pincode;
    const sub=state.cart.reduce((a,x)=>a+product(x.id).price*x.qty,0);
    const discount=discountAmount(sub,getDiscountCode());
    const total=sub-discount+Number(state.settings.shipping||0);
    const payment=document.querySelector('input[name="pay"]:checked')?.value;
    if(!payment){toast('Select a payment method');return}
    const source=localStorage.getItem('kryven-era-referral-source')||'';
    const id='KE-'+new Date().getFullYear()+'-'+String(Math.floor(Math.random()*900)+100);
    const codPct=Math.max(0,Math.min(100,Number(state.settings.payments?.codAdvancePercent??20)));
    const advancePaid=payment==='cod'?Math.round(total*codPct/100):total;
    const order={id,createdAt:new Date().toISOString(),customer:{name,email,phone,address,landmark,houseNumber,city,state:stateName,pincode},items:structuredClone(state.cart).map(x=>({...x,image:product(x.id)?.images?.[0]||'',name:product(x.id)?.name||x.id})),subtotal:sub,discount,total,payment,status:'Placed',referralSource:source,advancePaid,remainingDue:Math.max(0,total-advancePaid),codAdvancePercent:payment==='cod'?codPct:null};
    const saved=await finalizeOrder(order,payment!=='cod');
    if(saved&&payment==='upi'){setTimeout(()=>showUPIPayment(order),50)}
    if(saved&&payment==='card'){toast('Card order recorded. Connect your live card gateway in the payment backend before production.')}
    if(saved&&payment==='cod'){toast(`Order confirmed · ${codPct}% payable now`)}
  }finally{window.__orderSubmitting=false}
};
window.openProduct=(id)=>{if(id)location.href='product.html?id='+encodeURIComponent(id)};

function render(){
  document.getElementById('app').innerHTML=siteBackground()+renderPage();
  if(document.body.dataset.page==='product'){
    const p=product(new URLSearchParams(location.search).get('id')||state.products[0]?.id);
    if(p){
      window.__pageSelected={id:p.id,size:p.sizes?.S?'S':Object.keys(p.sizes||{}).find(s=>p.sizes[s])||'S',color:p.colors?.[0]||'Black'};
      setTimeout(()=>{bindProductPageSwipe(p.id);init3D(`page-three-${p.id}`,p)},80);
    }
  }
  setTimeout(bindMobileSearchAutoHide,40);
}

render();
setTimeout(()=>showReferralOnce(),700);
