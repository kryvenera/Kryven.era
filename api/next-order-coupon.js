// Issue one unique repeat-order coupon only for an authenticated customer's delivered order.
import crypto from 'crypto';
import {rateLimit} from './_security.js';
import {requireEraUser,getStoreState,db,sanitizeCode} from './_era-promos.js';
import {findOrderRows} from './_orders.js';

function samePhone(a,b){const x=String(a||'').replace(/\D/g,'').slice(-10),y=String(b||'').replace(/\D/g,'').slice(-10);return x.length===10&&y.length===10&&x===y}
function sameEmail(a,b){return !!a&&!!b&&String(a).trim().toLowerCase()===String(b).trim().toLowerCase()}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'next-order-coupon',8,60*60*1000))return;
  try{
    const user=await requireEraUser(req);
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const orderId=String(body.order_id||'').trim();
    if(!/^[A-Za-z0-9_-]{1,50}$/.test(orderId))return res.status(400).json({error:'Enter a valid order ID.'});
    const store=await getStoreState();
    const cfg=store.settings?.nextOrderOffer||{};
    if(cfg.enabled===false)return res.status(403).json({error:'The next-order reward is currently paused.'});
    const matches=await findOrderRows(orderId);
    const order=matches.map(x=>x.o).find(o=>String(o.id)===orderId);
    if(!order)return res.status(404).json({error:'We could not find that order. Check the order ID and try again.'});
    const ownerById=String(order.authUserId||'')===String(user.id);
    const phone=user.metadata?.phone||'';
    const ownerByVerifiedDetails=sameEmail(order.customer?.email,user.email)&&samePhone(order.customer?.phone,phone);
    if(!ownerById&&!ownerByVerifiedDetails)return res.status(403).json({error:'This order is not linked to your account. Sign in with the account used for the order.'});
    if(order.paymentVerified!==true||String(order.paymentStatus||'').toUpperCase()!=='SUCCESS')return res.status(400).json({error:'This order must have a verified payment before it can unlock the next-order reward.'});
    if(String(order.status||'').toLowerCase()!=='delivered')return res.status(400).json({error:'Your next-order reward unlocks after the order is marked Delivered.'});
    const campaign='next-order-'+sanitizeCode(orderId).slice(0,80);
    const previous=await db(`kryven_reward_claims?user_id=eq.${encodeURIComponent(user.id)}&campaign_key=eq.${encodeURIComponent(campaign)}&select=id,coupon_code,status,discount_percent,product_ids,expires_at,metadata&limit=1`);
    if(previous?.[0]){
      const c=previous[0];
      return res.status(200).json({ok:true,alreadyIssued:true,code:c.status==='redeemed'?null:c.coupon_code,status:c.status,percent:Number(c.discount_percent)||Number(cfg.percent)||30,expiresAt:c.expires_at,message:c.status==='redeemed'?'This order ID reward has already been used.':'A reward was already issued for this delivered order.'});
    }
    const percent=Math.max(1,Math.min(50,Number(cfg.percent)||30));
    const validity=Math.max(1,Math.min(365,Number(cfg.validityDays)||14));
    const expiresAt=new Date(Date.now()+validity*86400000).toISOString();
    const productIds=Array.isArray(cfg.productIds)?cfg.productIds.map(String).filter(id=>store.products.some(p=>String(p.id)===id)):[];
    const coupon='ERA30-'+crypto.randomBytes(4).toString('hex').toUpperCase();
    const rows=await db('kryven_reward_claims',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:user.id,campaign_key:campaign,reward_type:'discount',discount_percent:percent,product_ids:productIds,coupon_code:coupon,status:'available',expires_at:expiresAt,metadata:{label:'NEXT ORDER REWARD',sourceOrderId:orderId,minCartValue:Math.max(0,Number(cfg.minCartValue)||0),maxDiscount:Math.max(0,Number(cfg.maxDiscount)||0)}})});
    const c=rows?.[0];if(!c)throw new Error('Could not save your reward. Please try again.');
    return res.status(200).json({ok:true,alreadyIssued:false,code:c.coupon_code,status:c.status,percent,expiresAt,message:'Your next-order coupon is ready. It can be used once on eligible products.'});
  }catch(e){
    if(e?.status&&e.status>=400&&e.status<600)return res.status(e.status).json({error:e.message||'Could not issue the reward.'});
    if(e?.body?.code==='23505')return res.status(409).json({error:'A reward was already issued for this order.'});
    console.error('NEXT_ORDER_COUPON_ERROR',e);return res.status(503).json({error:'Next-order reward service is unavailable. Check the Supabase setup.'});
  }
}
