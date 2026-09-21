
const KEY='kryvenEraStoreV1';
const defaultProducts=[
{id:1,name:'Obsidian Signature Tee',price:1499,old:1999,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Obsidian Black',desc:'Heavyweight premium cotton silhouette with a quiet luxury finish.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:2,name:'Crown Crest Tee',price:1599,old:2199,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Midnight Black',desc:'Structured everyday tee with a minimal crest identity.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:3,name:'Noir Essential Tee',price:1299,old:1699,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Jet Black',desc:'Clean oversized proportions for an understated street-luxury look.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:4,name:'Silver Line Oversized',price:1799,old:2399,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Black / Silver',desc:'Statement oversized fit with reflective silver detailing.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:5,name:'Era Heavyweight Tee',price:1399,old:1899,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Carbon',desc:'Dense cotton jersey made for a premium drape.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:6,name:'K Mark Essential',price:1199,old:1599,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Black',desc:'The signature K mark in a restrained monochrome treatment.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:7,name:'After Dark Tee',price:1499,old:1999,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Onyx',desc:'A darker take on the daily essential.',img:'assets/product-placeholder.svg',rating:0,reviews:0},
{id:8,name:'Chrome Era Tee',price:1699,old:2299,category:'T-Shirts',sizes:['S','M','L','XL','XXL'],colour:'Black / Chrome',desc:'Minimal monochrome branding with a refined finish.',img:'assets/product-placeholder.svg',rating:0,reviews:0}
];

function store(){return JSON.parse(localStorage.getItem(KEY)||'{}')}
function saveStore(s){localStorage.setItem(KEY,JSON.stringify(s))}
function init(){
 let s=store();
 if(!s.products)s.products=defaultProducts;
 if(!s.cart)s.cart=[];
 if(!s.wishlist)s.wishlist=[];
 if(!s.orders)s.orders=[];
 if(!s.customer)s.customer={};
 if(!s.settings)s.settings={brand:'KRYVEN ERA',tagline:'The Era of Uncompromising Style'};
 saveStore(s);
}
init();
function products(){return store().products||defaultProducts}
function money(n){return '₹'+Number(n).toLocaleString('en-IN')}
function toast(msg){let t=document.querySelector('.toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function card(p){
 return `<article class="card"><a href="product.html?id=${p.id}"><div class="card-media"><img src="${p.img}" alt="${p.name}">${p.old>p.price?'<span class="badge">LIMITED</span>':''}</div><div class="card-info"><h3>${p.name}</h3><div class="meta"><span class="price">${money(p.price)}</span><span>${p.colour}</span></div></div></a></article>`
}
function renderHome(){
 let el=document.querySelector('#featured'); if(el)el.innerHTML=products().slice(0,4).map(card).join('');
}
function renderShop(){
 let el=document.querySelector('#productGrid');if(!el)return;
 const cat=document.querySelector('#category')?.value||'All';
 const q=(document.querySelector('#search')?.value||'').toLowerCase();
 let list=products().filter(p=>(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(q));
 el.innerHTML=list.length?list.map(card).join(''):`<div class="empty" style="grid-column:1/-1"><h3>No pieces found</h3><p>Try another search.</p></div>`;
}
function getProduct(){return products().find(p=>p.id==new URLSearchParams(location.search).get('id'))||products()[0]}
function renderProduct(){
 let p=getProduct(), root=document.querySelector('#productRoot');if(!root)return;
 root.innerHTML=`<div class="gallery"><div class="thumbs"><button class="thumb"><img src="${p.img}"></button><button class="thumb"><img src="${p.img}"></button><button class="thumb"><img src="${p.img}"></button></div><div class="main-product"><img src="${p.img}" alt="${p.name}"></div></div>
 <div class="product-info"><div class="kicker">${p.category} / KRYVEN ERA</div><h1>${p.name}</h1><p class="product-desc">${p.desc}</p><div class="product-price">${money(p.price)} ${p.old>p.price?`<span class="strike">${money(p.old)}</span>`:''}</div>
 <div class="option-label">Colour</div><div style="color:#ddd;font-size:12px">${p.colour}</div>
 <div class="option-label">Size</div><div class="sizes">${['S','M','L','XL','XXL'].map(s=>`<button class="size" data-size="${s}" ${p.sizes.includes(s)?'':'disabled'}>${s}</button>`).join('')}</div>
 <div class="option-label">Quantity</div><div class="qty"><button onclick="changeQty(-1)">−</button><span id="qty">1</span><button onclick="changeQty(1)">+</button></div>
 <button class="btn wide" onclick="addCurrentToCart()">Add to bag</button><button class="btn alt wide" onclick="toggleWishlist(${p.id})">♡ Save to wishlist</button>
 <div class="info-box"><div class="info-row"><span>Delivery</span><strong>Calculated at checkout</strong></div><div class="info-row"><span>Available sizes</span><strong>${p.sizes.join(' / ')}</strong></div><div class="info-row"><span>Returns</span><strong>Check policy at checkout</strong></div></div></div>`;
 document.querySelectorAll('.size').forEach(b=>b.onclick=()=>{document.querySelectorAll('.size').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 document.querySelector('.size:not(:disabled)')?.click();
}
let currentQty=1;
function changeQty(n){currentQty=Math.max(1,currentQty+n);let q=document.querySelector('#qty');if(q)q.textContent=currentQty}
function addCurrentToCart(){
 let p=getProduct(), size=document.querySelector('.size.selected')?.dataset.size||p.sizes[0], s=store();
 let item=s.cart.find(x=>x.id===p.id&&x.size===size);
 if(item)item.qty+=currentQty;else s.cart.push({id:p.id,size,qty:currentQty});
 saveStore(s);toast('Added to bag');currentQty=1;renderHeaderCount();
}
function toggleWishlist(id){let s=store();if(s.wishlist.includes(id)){s.wishlist=s.wishlist.filter(x=>x!==id);toast('Removed from wishlist')}else{s.wishlist.push(id);toast('Saved to wishlist')}saveStore(s)}
function renderCart(){
 let root=document.querySelector('#cartRoot');if(!root)return;let s=store();
 if(!s.cart.length){root.innerHTML=`<div class="empty"><h3>Your bag is empty</h3><p>Explore the collection and add a piece.</p><a class="btn" href="shop.html">Shop collection</a></div>`;return}
 let total=0;
 let rows=s.cart.map((i,idx)=>{let p=products().find(x=>x.id===i.id);let sub=p.price*i.qty;total+=sub;return `<div class="order"><div class="order-head"><div><strong>${p.name}</strong><div style="color:#777;font-size:11px;margin-top:6px">Size ${i.size} · Qty ${i.qty}</div></div><strong>${money(sub)}</strong></div><div style="margin-top:14px"><button class="filter" onclick="removeCart(${idx})">Remove</button></div></div>`}).join('');
 root.innerHTML=`<div class="checkout-layout"><div>${rows}</div><div class="panel"><div class="summary-row"><span>Subtotal</span><strong>${money(total)}</strong></div><div class="summary-row"><span>Delivery</span><strong>Calculated</strong></div><div class="summary-row total"><span>Total</span><strong>${money(total)}</strong></div><a class="btn wide" href="checkout.html">Proceed to checkout</a></div></div>`;
}
function removeCart(i){let s=store();s.cart.splice(i,1);saveStore(s);renderCart();renderHeaderCount()}
function renderHeaderCount(){let s=store();document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=s.cart.reduce((a,x)=>a+x.qty,0));document.querySelectorAll('[data-wish-count]').forEach(e=>e.textContent=s.wishlist.length)}
function renderCheckout(){
 let root=document.querySelector('#checkoutRoot');if(!root)return;let s=store();let total=s.cart.reduce((a,i)=>{let p=products().find(x=>x.id===i.id);return a+p.price*i.qty},0);
 root.innerHTML=`<div class="checkout-layout"><form class="panel" id="orderForm"><div class="kicker">01 / Customer</div><h2 style="font-family:'Playfair Display';font-weight:500">Delivery details</h2><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required value="${s.customer.name||''}"></div><div class="field"><label>Phone</label><input name="phone" required value="${s.customer.phone||''}"></div><div class="field full"><label>Email</label><input type="email" name="email" required value="${s.customer.email||''}"></div><div class="field full"><label>Address</label><textarea name="address" required>${s.customer.address||''}</textarea></div><div class="field"><label>City</label><input name="city" required value="${s.customer.city||''}"></div><div class="field"><label>PIN code</label><input name="pin" required value="${s.customer.pin||''}"></div></div><div class="kicker" style="margin-top:35px">02 / Payment</div><p style="color:#888;font-size:12px">Payment method can be connected later. For now, this checkout creates a local order record for testing.</p><button class="btn wide">Place order</button></form><div class="panel"><div class="kicker">Order summary</div>${s.cart.map(i=>{let p=products().find(x=>x.id===i.id);return `<div class="summary-row"><span>${p.name}<br><small>${i.size} × ${i.qty}</small></span><strong>${money(p.price*i.qty)}</strong></div>`}).join('')}<div class="summary-row total"><span>Total</span><strong>${money(total)}</strong></div></div></div>`;
 document.querySelector('#orderForm').onsubmit=e=>{e.preventDefault();let fd=new FormData(e.target);let s=store();s.customer=Object.fromEntries(fd.entries());let id='KE'+Date.now().toString().slice(-8);s.orders.unshift({id,date:new Date().toLocaleString('en-IN'),items:s.cart,status:'Confirmed',total});s.cart=[];saveStore(s);location.href='orders.html'};
}
function renderCustomer(){
 let s=store(), root=document.querySelector('#customerRoot');if(!root)return;
 root.innerHTML=`<form class="panel" id="customerForm"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" value="${s.customer.name||''}"></div><div class="field"><label>Phone</label><input name="phone" value="${s.customer.phone||''}"></div><div class="field full"><label>Email</label><input name="email" value="${s.customer.email||''}"></div><div class="field full"><label>Address</label><textarea name="address">${s.customer.address||''}</textarea></div><div class="field"><label>City</label><input name="city" value="${s.customer.city||''}"></div><div class="field"><label>PIN</label><input name="pin" value="${s.customer.pin||''}"></div></div><button class="btn" style="margin-top:20px">Save details</button></form>`;
 document.querySelector('#customerForm').onsubmit=e=>{e.preventDefault();let s=store();s.customer=Object.fromEntries(new FormData(e.target).entries());saveStore(s);toast('Customer details saved')}
}
function renderWishlist(){
 let root=document.querySelector('#wishlistRoot');if(!root)return;let s=store();let list=products().filter(p=>s.wishlist.includes(p.id));root.innerHTML=list.length?`<div class="grid">${list.map(card).join('')}</div>`:`<div class="empty"><h3>No saved pieces</h3><p>Tap the heart on a product to save it.</p></div>`;
}
function renderOrders(){
 let root=document.querySelector('#ordersRoot');if(!root)return;let s=store();root.innerHTML=s.orders.length?s.orders.map(o=>`<div class="order"><div class="order-head"><div><strong>Order ${o.id}</strong><div style="color:#777;font-size:11px;margin-top:6px">${o.date}</div></div><span class="status">${o.status}</span></div><div class="timeline">${['Confirmed','Packed','Shipped','Delivered'].map(x=>`<div class="step ${['Confirmed','Packed','Shipped','Delivered'].indexOf(x)<=['Confirmed','Packed','Shipped','Delivered'].indexOf(o.status)?'done':''}">${x}</div>`).join('')}</div>${o.status==='Delivered'?`<div style="margin-top:20px"><button class="filter" onclick="rateOrder('${o.id}')">Rate order</button></div>`:''}</div>`).join(''):`<div class="empty"><h3>No orders yet</h3><p>Your confirmed orders will appear here.</p></div>`;
}
function rateOrder(id){let r=prompt('Rate this delivered order (1–5 stars):');let n=Number(r);if(n>=1&&n<=5){let s=store(),o=s.orders.find(x=>x.id===id);o.rating=n;saveStore(s);toast('Rating saved')}}
function renderAdmin(){
 let root=document.querySelector('#adminRoot');if(!root)return;let s=store();
 root.innerHTML=`<div class="admin-grid"><aside class="admin-nav"><button class="active">Dashboard</button><button onclick="adminProducts()">Products</button><button onclick="adminOrders()">Orders</button><button onclick="adminSettings()">Brand settings</button></aside><section id="adminPanel"><div class="notice">Demo admin panel: data is stored in this browser using localStorage. Connect a real database/authentication before production use.</div><div class="grid"><div class="panel"><div class="kicker">Products</div><h2>${s.products.length}</h2></div><div class="panel"><div class="kicker">Orders</div><h2>${s.orders.length}</h2></div><div class="panel"><div class="kicker">Wishlist saves</div><h2>${s.wishlist.length}</h2></div><div class="panel"><div class="kicker">Customer</div><h2>${s.customer.name?'Saved':'Empty'}</h2></div></div></section></div>`;
}
function adminProducts(){
 let p=products();document.querySelector('#adminPanel').innerHTML=`<div class="panel"><div class="section-head"><div><div class="kicker">Catalog</div><h2 style="font-family:'Playfair Display';font-weight:500">Edit products</h2></div><button class="btn" onclick="addProduct()">Add product</button></div>${p.map(x=>`<div class="order"><div class="order-head"><strong>${x.name}</strong><span>${money(x.price)}</span></div><div class="form-grid" style="margin-top:15px"><div class="field"><label>Name</label><input data-p="${x.id}" data-k="name" value="${x.name}"></div><div class="field"><label>Price</label><input data-p="${x.id}" data-k="price" value="${x.price}"></div><div class="field full"><label>Image path or URL</label><input data-p="${x.id}" data-k="img" value="${x.img}"></div></div><button class="filter" style="margin-top:10px" onclick="saveProduct(${x.id})">Save product</button></div>`).join('')}</div>`;
}
function saveProduct(id){let s=store();document.querySelectorAll(`[data-p="${id}"]`).forEach(i=>{let p=s.products.find(x=>x.id==id);p[i.dataset.k]=i.dataset.k==='price'?Number(i.value):i.value});saveStore(s);toast('Product updated')}
function addProduct(){let s=store(),id=Date.now();s.products.push({id,name:'New Kryven Product',price:999,old:1299,category:'Products',sizes:['S','M','L','XL','XXL'],colour:'Black',desc:'Add your product description.',img:'assets/product-placeholder.svg',rating:0,reviews:0});saveStore(s);adminProducts()}
function adminOrders(){
 let s=store();document.querySelector('#adminPanel').innerHTML=`<div class="panel"><div class="kicker">Fulfillment</div><h2 style="font-family:'Playfair Display';font-weight:500">Orders</h2>${s.orders.length?s.orders.map(o=>`<div class="order"><div class="order-head"><strong>${o.id}</strong><select onchange="updateOrder('${o.id}',this.value)">${['Confirmed','Packed','Shipped','Delivered'].map(x=>`<option ${x===o.status?'selected':''}>${x}</option>`).join('')}</select></div><div style="color:#777;font-size:11px;margin-top:7px">${o.date} · ${money(o.total)}</div></div>`).join(''):'<p style="color:#777">No orders.</p>'}</div>`;
}
function updateOrder(id,status){let s=store(),o=s.orders.find(x=>x.id===id);if(o){o.status=status;saveStore(s);toast('Order status updated')}}
function adminSettings(){
 let s=store();document.querySelector('#adminPanel').innerHTML=`<form class="panel" id="settingsForm"><div class="kicker">Identity</div><h2 style="font-family:'Playfair Display';font-weight:500">Brand settings</h2><div class="form-grid"><div class="field"><label>Brand</label><input name="brand" value="${s.settings.brand}"></div><div class="field"><label>Tagline</label><input name="tagline" value="${s.settings.tagline}"></div></div><button class="btn" style="margin-top:20px">Save</button></form>`;
 document.querySelector('#settingsForm').onsubmit=e=>{e.preventDefault();let s=store();s.settings=Object.fromEntries(new FormData(e.target).entries());saveStore(s);toast('Brand settings saved')}
}
document.addEventListener('DOMContentLoaded',()=>{
 renderHome();renderShop();renderProduct();renderCart();renderCheckout();renderCustomer();renderWishlist();renderOrders();renderAdmin();renderHeaderCount();
 document.querySelector('#search')?.addEventListener('input',renderShop);document.querySelector('#category')?.addEventListener('change',renderShop);
});
