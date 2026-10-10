// Validate one-use creator or wheel coupons for the signed-in customer. Actual amount is revalidated at create-order.
import {rateLimit} from './_security.js';
import {requireEraUser,getStoreState,resolveCoupon,sanitizeCode} from './_era-promos.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'coupon-check',15,60*1000))return;
  try{
    const user=await requireEraUser(req);
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const code=sanitizeCode(body.code);if(!code)return res.status(400).json({error:'Enter a coupon code.'});
    const store=await getStoreState();const resolved=await resolveCoupon(user.id,code,store,'');
    const c=resolved.coupon;
    return res.status(200).json({ok:true,code:c.code,type:c.type,percent:c.percent||0,amount:c.amount||0,productIds:c.productIds||[],minCartValue:c.minCartValue||0,maxDiscount:c.maxDiscount||0,expiresAt:resolved.claim?.expires_at||resolved.creator?.expiresAt||null,source:resolved.claim?'wheel':'creator'});
  }catch(e){if(e?.status)return res.status(e.status).json({error:e.message});console.error('COUPON_CHECK_ERROR',e);return res.status(503).json({error:'Coupon verification is unavailable. Please try again later.'})}
}
