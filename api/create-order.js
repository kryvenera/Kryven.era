import {rateLimit,ORDER_ID_RE,cleanText,validEmail} from './_security.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'create-order',10,60*1000)) return;
  try{
    const {order_id,order_amount,customer}=req.body||{};
    const amount=Number(order_amount);
    const normalizedAmount=Number.isFinite(amount)?Number(amount.toFixed(2)):NaN;
    if(!ORDER_ID_RE.test(String(order_id||''))||!Number.isFinite(normalizedAmount)||normalizedAmount<1||normalizedAmount>500000) return res.status(400).json({error:'Invalid order details'});
    const debug=process.env.DEBUG_PAYMENTS==='1';
    const clientId=process.env.CASHFREE_CLIENT_ID||process.env.cashfree_client_id||process.env['cashfree-client-id'];
    const clientSecret=process.env.CASHFREE_CLIENT_SECRET||process.env.cashfree_client_secret||process.env['cashfree-client-secret'];
    const env=String(process.env.CASHFREE_ENV||'production').toLowerCase()==='sandbox'?'sandbox':'production';
    const apiVersion=process.env.CASHFREE_API_VERSION||'2025-01-01';
    const diagnostic={environment:env,api_version:apiVersion,client_id_present:Boolean(clientId),client_secret_present:Boolean(clientSecret),request_method:req.method};
    if(!clientId||!clientSecret) return res.status(500).json({error:'Cashfree environment variables are missing',...(debug?{diagnostic}:{})});
    const baseUrl=env==='sandbox'?'https://sandbox.cashfree.com':'https://api.cashfree.com';
    const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
    const host=req.headers['x-forwarded-host']||req.headers.host;
    if(!host) return res.status(500).json({error:'Unable to determine website URL'});
    const origin=`${proto}://${host}`;
    const customerPhone=String(customer?.customer_phone||'').replace(/\D/g,'');
    if(!/^\d{10}$/.test(customerPhone)) return res.status(400).json({error:'A valid 10-digit customer phone number is required'});
    const body={
      order_id:String(order_id),
      order_amount:normalizedAmount,
      order_currency:'INR',
      customer_details:{
        customer_id:cleanText(customer?.customer_id||order_id,50).replace(/[^A-Za-z0-9_-]/g,'')||String(order_id),
        customer_name:cleanText(customer?.customer_name,100)||'Kryven Customer',
        customer_email:validEmail(customer?.customer_email)||'customer@kryvenera.in',
        customer_phone:customerPhone
      },
      order_meta:{
        return_url:`${origin}/payment.html?cashfree_return=1&order_id={order_id}`,
        notify_url:`${origin}/api/webhook`
      }
    };
    let r,data,raw='';
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);r=await fetch(`${baseUrl}/pg/orders`,{method:'POST',headers:{'x-client-id':clientId,'x-client-secret':clientSecret,'x-api-version':apiVersion,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});clearTimeout(timer);
      raw=await r.text();
      try{data=JSON.parse(raw)}catch{data={raw:raw.slice(0,1000)}}
    }catch(fetchErr){
      console.error('CASHFREE_CONNECT_ERROR',fetchErr?.message);return res.status(502).json({error:'Could not connect to Cashfree API',...(debug?{diagnostic:{...diagnostic,base_url:baseUrl},details:{message:fetchErr?.message||String(fetchErr)}}:{})});
    }
    if(!r.ok){console.error('CASHFREE_ORDER_ERROR',r.status,data);return res.status(r.status>=500?502:400).json({error:data?.message||data?.error_description||'Cashfree order creation failed',cashfree_status:r.status,...(debug?{diagnostic:{...diagnostic,base_url:baseUrl,order_id,order_amount:normalizedAmount,customer_phone_present:Boolean(customerPhone)},details:data}:{})});}
    if(!data?.payment_session_id){console.error('CASHFREE_NO_SESSION',data);return res.status(502).json({error:'Cashfree responded without payment_session_id',...(debug?{details:data}:{})});}
    return res.status(200).json({order_id:data.order_id||order_id,order_amount:normalizedAmount,payment_session_id:data.payment_session_id,cashfree_mode:env});
  }catch(e){console.error('CREATE_ORDER_ERROR',e);return res.status(500).json({error:'Server error'});}
}
