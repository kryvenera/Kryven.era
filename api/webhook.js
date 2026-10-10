// KRYVEN ERA / VERIFIED CASHFREE WEBHOOK
// Signature-checked. The payload is never trusted for amounts: on a success event we ask Cashfree directly
// (same check as status.js) and only then confirm the order.
import crypto from 'crypto';
import {rateLimit,ORDER_ID_RE} from './_security.js';
import {cashfreeConfig,verifyPayment} from './_cashfree.js';
import {confirmOrder} from './_orders.js';

export const config={api:{bodyParser:false}};

async function readRawBody(req){
  if(Buffer.isBuffer(req.rawBody))return req.rawBody.toString('utf8');
  if(typeof req.rawBody==='string')return req.rawBody;
  if(typeof req.body==='string')return req.body;
  return await new Promise((resolve,reject)=>{const chunks=[];req.on('data',c=>chunks.push(Buffer.from(c)));req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));req.on('error',reject)});
}
function verifySignature(raw,signature,timestamp,secret){
  if(!raw||!signature||!timestamp||!secret)return false;
  const expected=crypto.createHmac('sha256',secret).update(`${timestamp}${raw}`).digest('base64');
  try{return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(String(signature)))}catch{return false}
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'webhook',120,60*1000))return;
  try{
    const cfg=cashfreeConfig();
    const raw=await readRawBody(req);
    if(!verifySignature(raw,req.headers['x-webhook-signature'],req.headers['x-webhook-timestamp'],cfg.clientSecret))return res.status(401).json({error:'Invalid Cashfree webhook signature'});
    const payload=JSON.parse(raw||'{}');
    const type=String(payload?.type||'').toUpperCase();
    const payment=payload?.data?.payment||{};
    const orderId=String(payload?.data?.order?.order_id||payment?.order_id||payload?.order_id||'').trim();
    const status=String(payment?.payment_status||payload?.data?.payment_status||'').toUpperCase();
    if(!orderId)return res.status(200).json({ok:true,ignored:true});
    if(!ORDER_ID_RE.test(orderId))return res.status(400).json({error:'Invalid order id'});
    if(status==='SUCCESS'||type.includes('SUCCESS')){
      const v=await verifyPayment(cfg,orderId);
      if(!v.paid)return res.status(200).json({ok:true,order_id:orderId,confirmed:false,status:v.status});
      const c=await confirmOrder(orderId,v.payment);
      // Non-2xx makes Cashfree retry the webhook if we could not record a paid order yet.
      if(!c.recorded)return res.status(500).json({ok:false,order_id:orderId,mode:c.mode});
      return res.status(200).json({ok:true,order_id:orderId,confirmed:true,mode:c.mode});
    }
    return res.status(200).json({ok:true,ignored:true,order_id:orderId,status});
  }catch(e){
    console.error('CASHFREE_WEBHOOK_ERROR',e);
    return res.status(400).json({error:'Invalid webhook payload'});
  }
}
