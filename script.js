(() => {
const C=window.KRYVEN_CONFIG||{};
const D=[
{id:"ke001",title:"Kryven Core Black Tee",description:"Premium black streetwear T-shirt.",price:999,oldPrice:1499,discount:"33% OFF",sizes:["S","M","L","XL","XXL"],colours:["Black"],rating:5,images:["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85"]},
{id:"ke002",title:"Silver Era Oversized Tee",description:"Oversized streetwear with a silver-toned identity.",price:1099,oldPrice:1599,discount:"31% OFF",sizes:["S","M","L","XL","XXL"],colours:["Silver"],rating:4,images:["https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85"]},
{id:"ke003",title:"White Signature Tee",description:"Minimal white Kryven Era tee.",price:899,oldPrice:1299,discount:"31% OFF",sizes:["S","M","L","XL","XXL"],colours:["White"],rating:5,images:["https://images.unsplash.com/photo-1583743814966-8936f37f2086?auto=format&fit=crop&w=900&q=85"]}
];
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}}, put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let products=get("ke_products",D), cart=get("ke_cart",[]), wish=get("ke_wish",[]), orders=get("ke_orders",[]), profile=get("ke_profile",{});
const money=n=>(C.currency||"₹")+Number(n||0).toLocaleString("en-IN");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const pic=p=>p.images?.[0]||"https://via.placeholder.com/700x800?text=Kryven+Era";
function toast(x){let e=document.querySelector(".toast");if(e){e.textContent=x;e.style.display="block";setTimeout(()=>e.style.display="none",1800)}}
function card(p){return `<article class="card"><a href="product.html?id=${p.id}"><img src="${esc(pic(p))}" alt="${esc(p.title)}"></a><div class="card-body"><h3>${esc(p.title)}</h3><div class="price">${money(p.price)} <span class="old">${money(p.oldPrice)}</span> <span class="discount">${esc(p.discount||"")}</span></div><div class="rating">★ ${p.rating||5}</div><button class="btn" data-add="${p.id}">ADD TO BAG</button> <button class="btn" data-wish="${p.id}">♡ WISHLIST</button></div></article>`}
function bind(root=document){root.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{let p=products.find(x=>x.id===b.dataset.add);cart.push({id:p.id,size:p.sizes?.[0]||"M",colour:p.colours?.[0]||"Black",qty:1});put("ke_cart",cart);count();toast("Added to bag")});root.querySelectorAll("[data-wish]").forEach(b=>b.onclick=()=>{let id=b.dataset.wish;wish=wish.includes(id)?wish.filter(x=>x!==id):[...wish,id];put("ke_wish",wish);toast("Wishlist updated")})}
function count(){document.querySelectorAll("[data-cart]").forEach(e=>e.textContent=cart.reduce((a,x)=>a+x.qty,0))}
function listing(){
 let root=document.querySelector("[data-listing]")||document.querySelector("[data-products]");if(!root)return;
 let q=new URLSearchParams(location.search).get("q")||"";
 let list=products.filter(p=>(p.title+" "+p.description+" "+(p.colours||[]).join(" ")).toLowerCase().includes(q.toLowerCase()));
 root.innerHTML=list.map(card).join("")||"<div class='panel'>No products found.</div>";bind(root);
}
function productPage(){
 let r=document.getElementById("product-root");if(!r)return;
 let id=new URLSearchParams(location.search).get("id")||products[0]?.id,p=products.find(x=>x.id===id)||products[0];if(!p)return;
 r.innerHTML=`<div class="product-detail"><div><img id="pimg" class="gallery-main" src="${esc(pic(p))}" alt=""><div class="thumbs">${(p.images||[]).map(u=>`<img class="gallery-thumb" data-image="${esc(u)}" src="${esc(u)}" alt="">`).join("")}</div><div class="gallery-swipe-hint">Swipe photos left/right</div></div><div class="product-info"><div class="eyebrow">KRYVEN ERA</div><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p><div class="price">${money(p.price)} <span class="old">${money(p.oldPrice)}</span> <span class="discount">${esc(p.discount||"")}</span></div><label>SIZE</label><div class="sizes">${p.sizes.map((s,i)=>`<button class="size ${i===0?"active":""}" data-size="${s}">${s}</button>`).join("")}</div><label>COLOUR</label><div class="sizes">${p.colours.map((c,i)=>`<button class="size ${i===0?"active":""}" data-colour="${c}">${c}</button>`).join("")}</div><div class="buybar"><button class="btn" id="add">ADD TO BAG</button><button class="btn" id="buy">BUY NOW</button></div></div></div><div class="detail-section panel"><h2>360° View</h2><div class="viewer360"><div class="shirt360"></div></div><div class="viewer-help">Drag with your finger to rotate</div></div><div class="detail-section panel"><h2>Product Details</h2><p>${esc(p.description)}</p></div>`;
 let s=p.sizes[0]||"M",c=p.colours[0]||"Black";
 r.querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>{s=b.dataset.size;r.querySelectorAll("[data-size]").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
 r.querySelectorAll("[data-colour]").forEach(b=>b.onclick=()=>{c=b.dataset.colour;r.querySelectorAll("[data-colour]").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
 r.querySelectorAll("[data-image]").forEach(b=>b.onclick=()=>r.querySelector("#pimg").src=b.dataset.image);
 const add=()=>{cart.push({id:p.id,size:s,colour:c,qty:1});put("ke_cart",cart);count();toast("Added to bag")};
 r.querySelector("#add").onclick=add;r.querySelector("#buy").onclick=()=>{add();location.href="checkout.html"};
}
function checkout(){
 let f=document.getElementById("checkout-form");if(!f)return;
 let box=document.getElementById("checkout-items");box.innerHTML=cart.map(i=>{let p=products.find(x=>x.id===i.id);return `<div class="checkout-item"><img src="${pic(p)}"><div><b>${esc(p.title)}</b><p>Size: ${i.size} · Colour: ${i.colour} · Qty: ${i.qty}</p><b>${money(p.price*i.qty)}</b></div></div>`}).join("");
 f.onsubmit=e=>{e.preventDefault();if(!cart.length)return toast("Bag is empty");let d=Object.fromEntries(new FormData(f));profile={...profile,...d};put("ke_profile",profile);let items=cart.map(i=>{let p=products.find(x=>x.id===i.id);return {...i,title:p.title,price:p.price}}),id="KE"+Date.now().toString().slice(-8),o={id,...d,items,total:items.reduce((a,x)=>a+x.price*x.qty,0),status:"Placed"};orders.push(o);put("ke_orders",orders);cart=[];put("ke_cart",cart);count();let text=`NEW KRYVEN ERA ORDER\nOrder ID: ${id}\nName: ${d.name}\nPhone: ${d.phone}\nAddress: ${d.address}, ${d.city}, ${d.state} - ${d.pincode}\nItems: ${items.map(x=>x.title+" | Size "+x.size+" | "+x.colour+" | Qty "+x.qty).join("; ")}\nTotal: ${money(o.total)}`;let wa=(C.whatsappNumber||"").replace(/\D/g,"");let w=wa?`https://wa.me/${wa}?text=${encodeURIComponent(text)}`:"#";let m=`mailto:${C.supportEmail||""}?subject=${encodeURIComponent("Kryven Era Order "+id)}&body=${encodeURIComponent(text)}`;f.style.display="none";let s=document.getElementById("success");s.style.display="block";document.getElementById("order-no").textContent=id;s.insertAdjacentHTML("beforeend",`<p><a class="btn" target="_blank" href="${w}">SEND ORDER ON WHATSAPP</a> <a class="btn" href="${m}">SEND ORDER BY EMAIL</a></p>`)};
}
function account(){let f=document.getElementById("account-form");if(!f)return;Object.keys(profile).forEach(k=>{if(f.elements[k])f.elements[k].value=profile[k]});window.saveProfile=()=>{profile=Object.fromEntries(new FormData(f));put("ke_profile",profile);toast("Details saved")}}
function admin(){
 if(!location.pathname.endsWith("admin.html"))return;
 const gate=document.getElementById("admin-gate"),app=document.getElementById("admin-app");
 document.getElementById("admin-login").onclick=()=>{if(document.getElementById("admin-pass").value===C.adminPassword){gate.style.display="none";app.style.display="block";draw()}else toast("Wrong password")};
 function draw(){app.innerHTML=`<div class="panel"><h2>Site settings</h2><label>WHATSAPP NUMBER</label><input id="wa" value="${esc(C.whatsappNumber)}"><label>SUPPORT EMAIL</label><input id="em" value="${esc(C.supportEmail)}"><button class="btn" id="save">SAVE SETTINGS</button></div><div class="panel"><h2>Products</h2><div id="plist"></div><button class="btn" id="new">ADD PRODUCT</button></div><div class="panel"><h2>Orders</h2>${orders.slice().reverse().map((o,i)=>`<div class="order-card"><div><b>${o.id}</b><p>${esc(o.name)} · ${esc(o.phone)}</p><p>${esc(o.address)}, ${esc(o.city)}, ${esc(o.state)} - ${esc(o.pincode)}</p></div><b>${esc(o.status)}</b></div>`).join("")||"No orders yet."}</div>`;
 app.querySelector("#save").onclick=()=>{C.whatsappNumber=app.querySelector("#wa").value;C.supportEmail=app.querySelector("#em").value;localStorage.setItem("ke_cfg",JSON.stringify(C));toast("Settings saved")};
 products.forEach((p,i)=>app.querySelector("#plist").insertAdjacentHTML("beforeend",`<div class="panel"><label>TITLE</label><input data-t="${i}" value="${esc(p.title)}"><label>DESCRIPTION</label><textarea data-d="${i}">${esc(p.description)}</textarea><label>PRICE</label><input type="number" data-pr="${i}" value="${p.price}"><label>PHOTO URLS (one per line)</label><textarea data-im="${i}">${esc((p.images||[]).join("\n"))}</textarea><label>SIZES</label><input data-si="${i}" value="${p.sizes.join(", ")}"><label>COLOURS</label><input data-co="${i}" value="${p.colours.join(", ")}"><button class="btn" data-s="${i}">SAVE PRODUCT</button></div>`));
 app.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{let i=+b.dataset.s,p=products[i];p.title=app.querySelector(`[data-t="${i}"]`).value;p.description=app.querySelector(`[data-d="${i}"]`).value;p.price=+app.querySelector(`[data-pr="${i}"]`).value;p.images=app.querySelector(`[data-im="${i}"]`).value.split(/\n/).filter(Boolean);p.sizes=app.querySelector(`[data-si="${i}"]`).value.split(",").map(x=>x.trim()).filter(Boolean);p.colours=app.querySelector(`[data-co="${i}"]`).value.split(",").map(x=>x.trim()).filter(Boolean);put("ke_products",products);toast("Product saved")});
 }
}
try{Object.assign(C,get("ke_cfg",{}))}catch(e){}
document.addEventListener("DOMContentLoaded",()=>{count();listing();productPage();checkout();account();admin()});
})();