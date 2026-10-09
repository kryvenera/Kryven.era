// KRYVEN ERA / CASHFREE SERVER-SIDE PAYMENT VERIFICATION
import {rateLimit,ORDER_ID_RE,supabaseConfig} from './_security.js';
const {key:SUPABASE_KEY,rest:SUPABASE_REST}=supabaseConfig();

function cashfreeConfig(){
  const clientId=process.env.CASHFREE_CLIENT_ID||process.env.cashfree_client_id||process.env['cashfree-client-id'];
  const clientSecret=process.env.CASHFREE_CLIENT_SECRET||process.env.cashfree_client_secret||process.env['cashfree-client-secret'];
  const env=String(process.env.CASHFREE_ENV||'production').toLowerCase()==='sandbox'?'sandbox':'production';
  const apiVersion=process.env.CASHFREE_API_VERSION||'2025-01-01';
  return {clientId,clientSecret,env,apiVersion,baseUrl:env==='sandbox'?'https://sandbox.cashfree.com':'https://api.cashfree.com'};
}

function supabaseHeaders(extra={}){return Object.assign({apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},extra)}

async function findCloudOrder(orderId){
  const key=encodeURIComponent('Product name');
  const needle=encodeURIComponent(String(orderId));
  const url=`${SUPABASE_REST}?select=*&${key}=ilike.*${needle}*&order=id.desc&limit=50`;
  const r=await fetch(url,{headers:supabaseHeaders()});
  if(!r.ok) return {row:null,o:null,error:`lookup ${r.status}`};
  const rows=await r.json().catch(()=>[]);
  for(const row of (Array.isArray(rows)?rows:[])){
    try{
      const o=JSON.parse(row['Product name']||'null');
      if(o&&String(o.id)===String(orderId)) return {row,o,error:null};
    }catch{}
  }
  return {row:null,o:null,error:null};
}

function orderRow(o,rowId){
  return {
    id:rowId,
    'Customer name':o.customer?.name||'',
    'Customer address':`${o.customer?.houseNumber?o.customer.houseNumber+', ':''}${o.customer?.address||''}${o.customer?.landmark?', '+o.customer.landmark:''}, ${o.customer?.city||''}, ${o.customer?.state||''}, ${o.customer?.pincode||''}`,
    'Product name':JSON.stringify(o),
    'Customer number':o.customer?.phone||'',
    'Product price':String(o.total??0),
    'Product size':(o.items||[]).map(x=>`${x.name||x.id||''} x${x.qty||1} ${x.size||''}`).join(' | ')
  };
}

async function confirmCloudOrder(orderId,payment){
  const found=await findCloudOrder(orderId);
  if(found.row&&found.o){
    const o=found.o;
    o.status='Placed';
    o.paymentVerified=true;
    o.paymentStatus='SUCCESS';
    o.paidAt=o.paidAt||new Date().toISOString();
    o.paymentGateway='Cashfree';
    if(payment?.cf_payment_id)o.cashfreePaymentId=String(payment.cf_payment_id);
    if(payment?.payment_amount!=null)o.paidAmount=Number(payment.payment_amount);
    if(payment?.payment_group)o.paymentMethod=String(payment.payment_group);
    const patchUrl=`${SUPABASE_REST}?id=eq.${encodeURIComponent(found.row.id)}`;
    const pr=await fetch(patchUrl,{method:'PATCH',headers:supabaseHeaders({Prefer:'return=minimal'}),body:JSON.stringify(orderRow(o,found.row.id))});
    if(pr.ok) return {updated:true,mode:'patched',rowId:found.row.id};

    // Some Supabase setups allow public INSERT but not UPDATE. In that case,
    // create one verified copy; admin.js deduplicates by order ID and prefers it.
    const existingConfirmed=JSON.stringify(found.o||{}).includes('"paymentVerified":true') && String(found.o?.paymentStatus||'').toUpperCase()==='SUCCESS';
    if(existingConfirmed) return {updated:false,mode:'already-confirmed',rowId:found.row.id};
    const newId=Number(`${Date.now()}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`);
    const ir=await fetch(SUPABASE_REST,{method:'POST',headers:supabaseHeaders({Prefer:'return=minimal'}),body:JSON.stringify(orderRow(o,newId))});
    return {updated:ir.ok,mode:ir.ok?'inserted-confirmed':'update-and-insert-failed',rowId:ir.ok?newId:found.row.id};
  }
  return {updated:false,mode:'order-row-not-found'};
}

async function getPayments(cfg,orderId){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const r=await fetch(`${cfg.baseUrl}/pg/orders/${encodeURIComponent(orderId)}/payments`,{headers:{'x-client-id':cfg.clientId,'x-client-secret':cfg.clientSecret,'x-api-version':cfg.apiVersion,Accept:'application/json'},signal:controller.signal});
    const text=await r.text();let data=[];try{data=JSON.parse(text)}catch{data=[]}
    if(!r.ok) throw new Error(data?.message||data?.error||`Cashfree status error (${r.status})`);
    return Array.isArray(data)?data:[];
  }finally{clearTimeout(timer)}
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'status',60,60*1000)) return;
  try{
    const orderId=String(req.query?.orderId||'').trim();
    if(!ORDER_ID_RE.test(orderId)) return res.status(400).json({error:'Invalid orderId'});
    const cfg=cashfreeConfig();
    if(!cfg.clientId||!cfg.clientSecret) return res.status(500).json({error:'Cashfree environment variables are missing'});

    const payments=await getPayments(cfg,orderId);
    const normalized=payments.map(x=>({...x,payment_status:String(x?.payment_status||'').toUpperCase()}));
    const success=normalized.find(x=>x.payment_status==='SUCCESS');
    const pending=normalized.some(x=>x.payment_status==='PENDING');
    const failed=normalized.some(x=>['FAILED','USER_DROPPED','CANCELLED','EXPIRED'].includes(x.payment_status));

    let cloud=null;
    if(success) cloud=await confirmCloudOrder(orderId,success);

    return res.status(200).json({
      paid:Boolean(success),
      pending:!success&&pending,
      failed:!success&&!pending&&failed,
      status:success?'SUCCESS':pending?'PENDING':failed?'FAILED':'UNKNOWN',
      amount:success?.payment_amount!=null?Number(success.payment_amount):null,
      paymentId:success?.cf_payment_id||null,
      cloud,
      payments:normalized
    });
  }catch(e){
    console.error('STATUS_ERROR',e);return res.status(500).json({error:'Unable to verify payment status'});
  }
}
