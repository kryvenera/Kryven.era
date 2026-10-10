// KRYVEN ERA / CASHFREE PAYMENT VERIFICATION
// The order is confirmed ONLY here (and in webhook.js), and only after Cashfree reports a successful payment
// that covers the full amount. The browser can never mark an order as paid.
import {rateLimit,ORDER_ID_RE} from './_security.js';
import {cashfreeConfig,verifyPayment} from './_cashfree.js';
import {confirmOrder,findOrderRows,publicSummary} from './_orders.js';
import {settleOrderPromos} from './_era-promos.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'status',60,60*1000))return;
  try{
    const orderId=String(req.query?.orderId||'').trim();
    if(!ORDER_ID_RE.test(orderId))return res.status(400).json({error:'Invalid orderId'});
    const cfg=cashfreeConfig();
    if(!cfg.clientId||!cfg.clientSecret)return res.status(500).json({error:'Online payments are not set up yet.'});

    const v=await verifyPayment(cfg,orderId);
    let confirmation=null,order=null;
    if(v.paid){
      confirmation=await confirmOrder(orderId,v.payment);
      order=confirmation.order||null;
    }else{
      try{order=(await findOrderRows(orderId))[0]?.o||null}catch{}
      if(v.failed)await settleOrderPromos(orderId,false);
    }
    return res.status(200).json({
      paid:v.paid,
      recorded:v.paid?Boolean(confirmation?.recorded):false,
      pending:v.pending,
      failed:v.failed,
      status:v.status,
      amount:v.payment?.payment_amount!=null?Number(v.payment.payment_amount):null,
      order:publicSummary(order)
    });
  }catch(e){
    console.error('STATUS_ERROR',e);
    return res.status(500).json({error:'Unable to verify payment status'});
  }
}
