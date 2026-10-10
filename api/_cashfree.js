// Cashfree helpers shared by create-order, status and webhook.
export function cashfreeConfig(){
  const clientId=process.env.CASHFREE_CLIENT_ID||process.env.cashfree_client_id||process.env['cashfree-client-id'];
  const clientSecret=process.env.CASHFREE_CLIENT_SECRET||process.env.cashfree_client_secret||process.env['cashfree-client-secret'];
  const env=String(process.env.CASHFREE_ENV||'production').toLowerCase()==='sandbox'?'sandbox':'production';
  const apiVersion=process.env.CASHFREE_API_VERSION||'2025-01-01';
  return {clientId,clientSecret,env,apiVersion,baseUrl:env==='sandbox'?'https://sandbox.cashfree.com':'https://api.cashfree.com'};
}
export const cfHeaders=cfg=>({'x-client-id':cfg.clientId,'x-client-secret':cfg.clientSecret,'x-api-version':cfg.apiVersion,Accept:'application/json'});

async function cfGet(cfg,path){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const r=await fetch(`${cfg.baseUrl}${path}`,{headers:cfHeaders(cfg),signal:controller.signal});
    const text=await r.text();
    let data=null;try{data=JSON.parse(text)}catch{}
    return {ok:r.ok,status:r.status,data};
  }finally{clearTimeout(timer)}
}
export async function getCashfreeOrder(cfg,orderId){
  const r=await cfGet(cfg,`/pg/orders/${encodeURIComponent(orderId)}`);
  return r.ok?r.data:null;
}

// Asks Cashfree directly (never the browser) what happened to this order.
// paid=true only when a SUCCESS payment exists AND it covers the full amount the server asked Cashfree to collect.
export async function verifyPayment(cfg,orderId){
  const [pr,order]=await Promise.all([cfGet(cfg,`/pg/orders/${encodeURIComponent(orderId)}/payments`),getCashfreeOrder(cfg,orderId)]);
  if(!pr.ok)throw new Error(pr.data?.message||`Cashfree payments error (${pr.status})`);
  if(!order)throw new Error('Cashfree order lookup failed');
  const payments=(Array.isArray(pr.data)?pr.data:[]).map(x=>({...x,payment_status:String(x?.payment_status||'').toUpperCase()}));
  const expected=Number(order.order_amount);
  const success=payments.find(x=>x.payment_status==='SUCCESS'&&Number.isFinite(expected)&&Number(x.payment_amount)+0.01>=expected);
  const partial=!success&&payments.some(x=>x.payment_status==='SUCCESS');
  const pending=!success&&payments.some(x=>x.payment_status==='PENDING');
  const failed=!success&&!pending&&payments.some(x=>['FAILED','USER_DROPPED','CANCELLED','EXPIRED','VOID'].includes(x.payment_status));
  const status=success?'SUCCESS':partial?'AMOUNT_MISMATCH':pending?'PENDING':failed?'FAILED':(String(order.order_status||'').toUpperCase()==='EXPIRED'?'FAILED':'UNKNOWN');
  return {paid:Boolean(success),pending,failed:status==='FAILED',status,payment:success||null,orderAmount:expected};
}
