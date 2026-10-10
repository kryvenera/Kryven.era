// Server-side pricing. The browser only SENDS what the customer picked (product id, size, colour, qty);
// every rupee amount is recomputed here from the live catalog, so a customer can never change what they pay.
import {supabaseConfig} from './_security.js';

// Mirrors the fallback catalog in checkout-flow.js (used only if the store has no cloud catalog yet).
const FALLBACK_PRODUCTS=[
  {id:'KE001',name:'Kryven Era Logo Tee',price:1299,images:['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85'],sizes:{S:true,M:true,L:true,XL:true,XXL:false},colors:['Black','White','Silver']},
  {id:'KE002',name:'Kryven Signature Hoodie',price:2499,images:['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85'],sizes:{S:true,M:true,L:true,XL:false,XXL:true},colors:['Black','Stone']},
  {id:'KE003',name:'Kryven Era Cargo Pants',price:1999,images:['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85'],sizes:{S:false,M:true,L:true,XL:true,XXL:true},colors:['Black','Graphite']}
];

export class OrderError extends Error{
  constructor(message,status=400){super(message);this.status=status}
}

const num=v=>{
  if(typeof v==='number'&&Number.isFinite(v))return v;
  if(v===null||v===undefined)return 0;
  const n=Number(String(v).replace(/[^0-9.\-]/g,''));
  return Number.isFinite(n)?n:0;
};
const round2=n=>Math.round((n+Number.EPSILON)*100)/100;
const pid=p=>p?.id??p?.productId??p?.product_id??p?.sku;

export async function loadCatalog(){
  const {url,key}=supabaseConfig();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  try{
    const r=await fetch(`${url}/rest/v1/kryven_store_state?id=eq.1&select=state`,{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:controller.signal});
    if(!r.ok)throw new Error(`catalog ${r.status}`);
    const rows=await r.json();
    const st=rows?.[0]?.state;
    if(st&&Array.isArray(st.products)&&st.products.length)return {products:st.products,settings:st.settings||{}};
    return {products:FALLBACK_PRODUCTS,settings:{}};
  }catch(e){
    throw new OrderError('Could not verify prices right now. Please try again in a moment.',503);
  }finally{clearTimeout(timer)}
}

function unitPrice(p){
  for(const v of [p?.price,p?.sellingPrice,p?.salePrice,p?.finalPrice,p?.discountedPrice,p?.unitPrice,p?.amount,p?.pricing?.price,p?.pricing?.sellingPrice]){
    const n=num(v);if(n>0)return n;
  }
  return 0;
}
function offerActive(p,settings){
  const o=p?.offer||{},s=settings?.offers||{};
  return !!o.enabled&&((o.type==='percent'&&s.percent50?.enabled!==false)||(o.type==='bogo'&&s.bogo?.enabled!==false));
}
function linePrice(p,qty,unit,settings){
  if(!offerActive(p,settings))return unit*qty;
  const o=p.offer||{};
  if(o.type==='percent'){const pct=Math.max(1,Math.min(100,num(o.percent)||50));return Math.round(unit*qty*(1-pct/100))}
  if(o.type==='bogo')return unit*(qty-Math.floor(qty/2));
  return unit*qty;
}

export function codAdvancePercent(settings){
  const raw=settings?.payments?.codAdvancePercent;
  const n=raw===undefined||raw===null||raw===''?20:num(raw);
  return Math.max(0,Math.min(100,n));
}

// items: [{id,qty,size,color}], mode: 'online' (pay everything now) | 'cod' (pay advance now, rest on delivery)
export function priceOrder(catalog,rawItems,mode,context={}){
  if(mode!=='online'&&mode!=='cod')throw new OrderError('Invalid payment option');
  if(!Array.isArray(rawItems)||!rawItems.length||rawItems.length>30)throw new OrderError('Your bag is empty');
  const settings=catalog.settings||{};
  if(mode==='cod'&&settings.payments?.cod===false)throw new OrderError('Cash on delivery is not available right now');
  const memberCfg=settings.membership||{};
  const membershipActive=!!context.membershipActive&&memberCfg.enabled!==false;
  const coupon=context.coupon||null;
  const membershipId='ERA_PASS_90';
  const merged=new Map();
  for(const raw of rawItems){
    const id=String(raw?.id??'').trim();
    const qty=Number(raw?.qty);
    if(!id||!Number.isInteger(qty)||qty<1||qty>20)throw new OrderError('Invalid item in your bag');
    const size=String(raw?.size??'').trim().slice(0,12);
    const color=String(raw?.color??'').trim().slice(0,40);
    if(id===membershipId){
      if(qty!==1)throw new OrderError('Only one ERA PASS can be purchased per checkout');
      if(mode!=='online')throw new OrderError('Membership passes must be purchased with online payment');
      if(!context.userId)throw new OrderError('Sign in before purchasing an ERA PASS');
      if(memberCfg.enabled===false)throw new OrderError('Membership is currently unavailable');
      if(membershipActive)throw new OrderError('Your ERA PASS is already active');
    }
    const key=`${id}|${size}|${color}`;const found=merged.get(key);
    if(found)found.qty+=qty;else merged.set(key,{id,qty,size,color});
  }

  const membershipRequested=[...merged.values()].some(x=>x.id===membershipId);if(membershipRequested&&merged.size>1)throw new OrderError('Please purchase the ERA PASS in a separate checkout from physical products.');
  const perProduct=new Map();const items=[];let subtotal=0,after=0,shirtPosition=0;
  const tiers=Array.isArray(memberCfg.tshirtPositionPercents)?memberCfg.tshirtPositionPercents:[60,40,20,0,70];
  const defaultMemberPercent=Math.max(0,Math.min(100,num(memberCfg.memberPricePercent??60)));
  const memberIds=new Set(Array.isArray(memberCfg.eligibleProductIds)?memberCfg.eligibleProductIds.map(String):[]);
  const couponIds=new Set(Array.isArray(coupon?.productIds)?coupon.productIds.map(String):[]);
  const couponMin=Math.max(0,num(coupon?.minCartValue));
  for(const line of merged.values()){
    if(line.id===membershipId){
      const price=Math.max(1,num(memberCfg.price??69));
      subtotal+=price;after+=price;
      items.push({id:membershipId,name:'THE ERA PASS · 90-DAY MEMBERSHIP',image:'logo-icon.png',size:'',color:'Digital membership',qty:1,unitPrice:price,originalUnitPrice:price,lineTotal:price,isMembership:true});
      continue;
    }
    const p=catalog.products.find(x=>String(pid(x))===line.id);
    if(!p)throw new OrderError('A product in your bag is no longer available');
    const unit=unitPrice(p);if(!unit)throw new OrderError('A product in your bag has no price. Please remove it and try again.');
    const sizes=p.sizes&&typeof p.sizes==='object'?p.sizes:null;
    if(sizes&&Object.keys(sizes).length&&(!line.size||sizes[line.size]!==true))throw new OrderError(`Please choose an available size for ${p.name||line.id}`);
    let color=line.color;
    if(Array.isArray(p.colors)&&p.colors.length){if(!color)color=String(p.colors[0]);else if(!p.colors.map(String).includes(color))throw new OrderError(`Please choose an available colour for ${p.name||line.id}`)}
    perProduct.set(line.id,(perProduct.get(line.id)||0)+line.qty);
    const stockRaw=p.stock;
    if(stockRaw!==undefined&&stockRaw!==null&&stockRaw!==''&&Number.isFinite(Number(stockRaw))&&Number(stockRaw)>=0&&perProduct.get(line.id)>Number(stockRaw))throw new OrderError(`${p.name||line.id} has only ${Number(stockRaw)} in stock`);
    subtotal+=unit*line.qty;
    let lineTotal=0;
    const isTee=String(p.category||'').toLowerCase().includes('t-shirt')&&(!memberIds.size||memberIds.has(line.id));
    if(membershipActive&&isTee&&!coupon){
      const hasOverride=Object.prototype.hasOwnProperty.call(memberCfg.productMemberPrices||{},line.id)&&memberCfg.productMemberPrices[line.id]!==''&&memberCfg.productMemberPrices[line.id]!==null;
      const productMemberPrice=num(memberCfg.productMemberPrices?.[line.id]);
      for(let i=0;i<line.qty;i++){
        const tierIndex=shirtPosition<5?shirtPosition:0;
        const pct=memberCfg.bundleEnabled===false?defaultMemberPercent:Math.max(0,Math.min(100,num(tiers[tierIndex]??(tierIndex===0?defaultMemberPercent:70))));
        // Explicit per-product member price is used when the bundle is off; with the ladder on it controls only the first tee.
        const explicitPrice=hasOverride&&(memberCfg.bundleEnabled===false||shirtPosition===0);
        lineTotal+=round2(explicitPrice?Math.min(unit,Math.max(0,productMemberPrice)):unit*pct/100);
        shirtPosition++;
      }
    }else if(coupon){
      // A coupon is the one primary promotion on this order; it does not stack with product offers or member tiers.
      lineTotal+=unit*line.qty;
    }else{
      lineTotal+=linePrice(p,line.qty,unit,settings);
    }
    items.push({id:line.id,name:p.name||line.id,image:p.images?.[0]||p.image||'',size:line.size,color,qty:line.qty,unitPrice:unit,originalUnitPrice:unit,lineTotal:round2(lineTotal)});
  }
  let discountBeforeCoupon=Math.max(0,subtotal-after);
  // Calculate regular/legacy offers when no membership tier or coupon has already set totals.
  if(!coupon){
    after=items.reduce((sum,it)=>sum+num(it.lineTotal),0);
  }else{
    after=items.reduce((sum,it)=>sum+num(it.lineTotal),0);
    const eligible=items.filter(it=>!it.isMembership&&(!couponIds.size||couponIds.has(String(it.id))));
    const eligibleSubtotal=eligible.reduce((n,it)=>n+num(it.unitPrice)*num(it.qty),0);
    if(eligibleSubtotal<couponMin)throw new OrderError(`This code needs a minimum eligible cart value of ₹${couponMin}`);
    let wanted=0;
    if(coupon.type==='fixed')wanted=Math.max(0,num(coupon.amount));
    else wanted=eligibleSubtotal*Math.max(0,Math.min(100,num(coupon.percent)))/100;
    const cap=num(coupon.maxDiscount)>0?num(coupon.maxDiscount):eligibleSubtotal;
    const couponDiscount=round2(Math.min(eligibleSubtotal,cap,wanted));
    if(couponDiscount<=0)throw new OrderError('This coupon does not apply to the items in your bag');
    after=Math.max(0,after-couponDiscount);
    // Allocate the coupon saving across eligible line totals for transparent order records.
    let remaining=couponDiscount;
    for(let i=eligible.length-1;i>=0;i--){const it=eligible[i];const base=num(it.unitPrice)*num(it.qty);const part=i===0?remaining:round2(couponDiscount*(base/eligibleSubtotal));const actual=Math.min(num(it.lineTotal),Math.max(0,part));it.lineTotal=round2(Math.max(0,num(it.lineTotal)-actual));remaining=round2(remaining-actual)}
    after=items.reduce((sum,it)=>sum+num(it.lineTotal),0);
    discountBeforeCoupon=couponDiscount;
  }
  const membershipOnly=items.length===1&&items[0].isMembership;
  const shipping=membershipOnly?0:Math.max(0,num(settings.shipping));
  const total=round2(Math.max(0,after+shipping));
  if(total<1)throw new OrderError('Order total is too low to process');
  const discount=round2(Math.max(0,subtotal-after));
  const pct=codAdvancePercent(settings);let payNow=total;
  if(mode==='cod'){payNow=Math.min(total,Math.round(total*pct/100));if(payNow<1)throw new OrderError('Cash on delivery needs an advance payment, which is not configured. Please pay online.')}
  return {items,subtotal:round2(subtotal),discount,shipping,total,payNow:round2(payNow),remaining:round2(total-payNow),codAdvancePercent:mode==='cod'?pct:null,membershipOnly,appliedCoupon:coupon?.code||null};
}
