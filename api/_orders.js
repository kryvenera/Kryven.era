// Order storage helpers (Supabase REST). Used by create-order, status and webhook.
import {supabaseConfig} from './_security.js';
import {activateMembershipForOrder,settleOrderPromos} from './_era-promos.js';

const {key:SUPABASE_KEY,rest:SUPABASE_REST}=supabaseConfig();
const headers=(extra={})=>Object.assign({apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},extra);

export function orderRow(o,rowId){
  const c=o.customer||{};
  return {
    id:rowId,
    'Customer name':c.name||'',
    'Customer address':`${c.houseNumber?c.houseNumber+', ':''}${c.address||''}${c.landmark?', '+c.landmark:''}, ${c.city||''}, ${c.state||''}, ${c.pincode||''}`,
    'Product name':JSON.stringify(o),
    'Customer number':c.phone||'',
    'Product price':String(o.total??0),
    'Product size':(o.items||[]).map(x=>`${x.name||x.id||''} x${x.qty||1} ${x.size||''}`).join(' | ')
  };
}
const newRowId=()=>Number(`${Date.now()}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`);

// Returns every stored copy of this order (newest first). Normally one; two if the table blocks PATCH
// and a verified copy had to be inserted next to the pending one.
export async function findOrderRows(orderId){
  const k=encodeURIComponent('Product name'),needle=encodeURIComponent(String(orderId));
  const r=await fetch(`${SUPABASE_REST}?select=*&${k}=ilike.*${needle}*&order=id.desc&limit=50`,{headers:headers()});
  if(!r.ok)throw new Error(`order lookup ${r.status}`);
  const rows=await r.json().catch(()=>[]);
  const out=[];
  for(const row of Array.isArray(rows)?rows:[]){
    try{const o=JSON.parse(row['Product name']||'null');if(o&&String(o.id)===String(orderId))out.push({row,o})}catch{}
  }
  return out;
}

export async function insertOrder(o){
  const rowId=newRowId();
  const r=await fetch(SUPABASE_REST,{method:'POST',headers:headers({Prefer:'return=minimal'}),body:JSON.stringify(orderRow(o,rowId))});
  return r.ok?rowId:null;
}

const isConfirmed=o=>o?.paymentVerified===true&&String(o?.paymentStatus||'').toUpperCase()==='SUCCESS';

async function postConfirmationBenefits(o){
  try{await settleOrderPromos(String(o.id||''),true)}catch(e){console.error('PROMO_SETTLEMENT_ERROR',e?.message)}
  if((o.items||[]).some(x=>String(x.id)==='ERA_PASS_90')){try{await activateMembershipForOrder(o)}catch(e){console.error('MEMBERSHIP_ACTIVATION_ERROR',e?.message)}}
}

// Marks the order Placed + paymentVerified. Call ONLY after Cashfree has reported a successful, full-amount payment.
// Returns {recorded:boolean, mode:string}. recorded=false means money was received but we could not write it down yet.
export async function confirmOrder(orderId,payment){
  const copies=await findOrderRows(orderId);
  if(!copies.length)return {recorded:false,mode:'order-not-found'};
  if(copies.some(c=>isConfirmed(c.o))){const confirmed=copies.find(c=>isConfirmed(c.o)).o;await postConfirmationBenefits(confirmed);return {recorded:true,mode:'already-confirmed',order:confirmed};}
  const {row,o}=copies[0];
  o.status='Placed';
  o.paymentVerified=true;
  o.paymentStatus='SUCCESS';
  o.paymentGateway='Cashfree';
  o.paidAt=o.paidAt||new Date().toISOString();
  if(payment?.cf_payment_id)o.cashfreePaymentId=String(payment.cf_payment_id);
  if(payment?.payment_amount!=null)o.paidAmount=Number(payment.payment_amount);
  if(payment?.payment_group)o.paymentMethod=String(payment.payment_group);
  const pr=await fetch(`${SUPABASE_REST}?id=eq.${encodeURIComponent(row.id)}`,{method:'PATCH',headers:headers({Prefer:'return=minimal'}),body:JSON.stringify(orderRow(o,row.id))});
  if(pr.ok){await postConfirmationBenefits(o);return {recorded:true,mode:'patched',order:o};}
  // Some Supabase setups allow public INSERT but block UPDATE: add one verified copy (admin.js prefers the verified copy by order id).
  const newId=await insertOrder(o);
  if(newId){await postConfirmationBenefits(o);return {recorded:true,mode:'inserted-confirmed',order:o};}return {recorded:false,mode:'update-and-insert-failed'};
}

// Customer-safe view of an order (no name/phone/address).
export function publicSummary(o){
  if(!o)return null;
  return {
    id:o.id,payment:o.payment,status:o.status,
    subtotal:o.subtotal,discount:o.discount,shipping:o.shipping,total:o.total,
    paidNow:o.payNow??o.advancePaid??o.total,remaining:o.remainingDue??0,
    items:(o.items||[]).map(x=>({id:x.id,name:x.name,image:x.image,qty:x.qty,size:x.size,color:x.color,lineTotal:x.lineTotal,unitPrice:x.unitPrice})),freebie:o.freebie||null
  };
}
