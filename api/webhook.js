// KRYVEN ERA / VERIFIED CASHFREE WEBHOOK
import crypto from 'crypto';
import {rateLimit,ORDER_ID_RE,supabaseConfig} from './_security.js';

const {key:SUPABASE_KEY,rest:SUPABASE_REST}=supabaseConfig();
export const config = { api: { bodyParser: false } };

function supabaseHeaders(extra={}){return Object.assign({apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},extra)}
function secret(){return process.env.CASHFREE_CLIENT_SECRET||process.env.cashfree_client_secret||process.env['cashfree-client-secret']||''}

async function readRawBody(req){
  if(Buffer.isBuffer(req.rawBody)) return req.rawBody.toString('utf8');
  if(typeof req.rawBody==='string') return req.rawBody;
  if(typeof req.body==='string') return req.body;
  return await new Promise((resolve,reject)=>{const chunks=[];req.on('data',c=>chunks.push(Buffer.from(c)));req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));req.on('error',reject)});
}
function verifySignature(raw,signature,timestamp){
  if(!raw||!signature||!timestamp||!secret())return false;
  const expected=crypto.createHmac('sha256',secret()).update(`${timestamp}${raw}`).digest('base64');
  try{return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(String(signature)))}catch{return false}
}
function orderRow(o,rowId){return {id:rowId,'Customer name':o.customer?.name||'','Customer address':`${o.customer?.houseNumber?o.customer.houseNumber+', ':''}${o.customer?.address||''}${o.customer?.landmark?', '+o.customer.landmark:''}, ${o.customer?.city||''}, ${o.customer?.state||''}, ${o.customer?.pincode||''}`,'Product name':JSON.stringify(o),'Customer number':o.customer?.phone||'','Product price':String(o.total??0),'Product size':(o.items||[]).map(x=>`${x.name||x.id||''} x${x.qty||1} ${x.size||''}`).join(' | ')}}
async function confirmCloud(orderId,payment){
  const key=encodeURIComponent('Product name'),needle=encodeURIComponent(orderId);
  const rr=await fetch(`${SUPABASE_REST}?select=*&${key}=ilike.*${needle}*&order=id.desc&limit=50`,{headers:supabaseHeaders()});
  if(!rr.ok)return {updated:false,reason:`lookup ${rr.status}`};
  const rows=await rr.json().catch(()=>[]);
  let found=null;
  for(const row of rows||[]){try{const o=JSON.parse(row['Product name']||'null');if(o&&String(o.id)===String(orderId)){found={row,o};break}}catch{}}
  if(!found)return {updated:false,reason:'order row not found'};
  const o=found.o;o.status='Placed';o.paymentVerified=true;o.paymentStatus='SUCCESS';o.paidAt=o.paidAt||new Date().toISOString();o.paymentGateway='Cashfree';if(payment?.cf_payment_id)o.cashfreePaymentId=String(payment.cf_payment_id);if(payment?.payment_amount!=null)o.paidAmount=Number(payment.payment_amount);if(payment?.payment_group)o.paymentMethod=String(payment.payment_group);
  const pr=await fetch(`${SUPABASE_REST}?id=eq.${encodeURIComponent(found.row.id)}`,{method:'PATCH',headers:supabaseHeaders({Prefer:'return=minimal'}),body:JSON.stringify(orderRow(o,found.row.id))});
  if(pr.ok)return {updated:true,mode:'patched',rowId:found.row.id};
  const newId=Number(`${Date.now()}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`);
  const ir=await fetch(SUPABASE_REST,{method:'POST',headers:supabaseHeaders({Prefer:'return=minimal'}),body:JSON.stringify(orderRow(o,newId))});
  return {updated:ir.ok,mode:ir.ok?'inserted-confirmed':'update-and-insert-failed',rowId:ir.ok?newId:null};
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'webhook',120,60*1000)) return;
  try{
    const raw=await readRawBody(req);
    if(!verifySignature(raw,req.headers['x-webhook-signature'],req.headers['x-webhook-timestamp'])) return res.status(401).json({error:'Invalid Cashfree webhook signature'});
    const payload=JSON.parse(raw||'{}');
    const type=String(payload?.type||'').toUpperCase();
    const payment=payload?.data?.payment||{};
    const orderId=String(payload?.data?.order?.order_id||payment?.order_id||payload?.order_id||'').trim();
    const status=String(payment?.payment_status||payload?.data?.payment_status||'').toUpperCase();
    if(orderId&&!ORDER_ID_RE.test(orderId))return res.status(400).json({error:'Invalid order id'});
    if(orderId&&(status==='SUCCESS'||type.includes('SUCCESS'))){const cloud=await confirmCloud(orderId,payment);return res.status(200).json({ok:true,order_id:orderId,cloud})}
    return res.status(200).json({ok:true,ignored:true,order_id:orderId,status});
  }catch(e){console.error('CASHFREE_WEBHOOK_ERROR',e);return res.status(400).json({error:'Invalid webhook payload'});}
}
