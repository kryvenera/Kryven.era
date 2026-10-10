// Shared, server-only helpers for KRYVEN ERA membership and one-use rewards.
import {supabaseConfig} from './_security.js';

const cfg=supabaseConfig();
const base=cfg.url.replace(/\/+$/,'');
const dbKey=cfg.key;
const authKey=process.env.SUPABASE_ANON_KEY || 'sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
const headers=(extra={})=>Object.assign({apikey:dbKey,Authorization:`Bearer ${dbKey}`,'Content-Type':'application/json'},extra);
const safeCode=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,40);
export const round2=n=>Math.round((Number(n||0)+Number.EPSILON)*100)/100;

export async function requireEraUser(req){
  const auth=String(req.headers?.authorization||'');
  const token=auth.match(/^Bearer\s+(.+)$/i)?.[1]||'';
  if(!token)throw Object.assign(new Error('Sign in to use membership and one-time rewards.'),{status:401});
  const r=await fetch(`${base}/auth/v1/user`,{headers:{apikey:authKey,Authorization:`Bearer ${token}`},cache:'no-store'});
  const user=await r.json().catch(()=>null);
  if(!r.ok||!user?.id)throw Object.assign(new Error('Your session expired. Please sign in again.'),{status:401});
  return {id:user.id,email:user.email||'',metadata:user.user_metadata||{},token};
}
export async function getStoreState(){
  const r=await fetch(`${base}/rest/v1/kryven_store_state?id=eq.1&select=state`,{headers:{apikey:dbKey,Authorization:`Bearer ${dbKey}`},cache:'no-store'});
  if(!r.ok)throw Object.assign(new Error('Store settings are unavailable.'),{status:503});
  const rows=await r.json();const state=rows?.[0]?.state;
  if(!state||!Array.isArray(state.products))throw Object.assign(new Error('Store catalog is not configured.'),{status:503});
  return state;
}
export async function db(path,options={}){
  const r=await fetch(`${base}/rest/v1/${path}`,{...options,headers:headers(options.headers||{}),cache:'no-store'});
  const body=await r.json().catch(()=>null);
  if(!r.ok){const e=new Error(body?.message||body?.hint||`Rewards database request failed (${r.status})`);e.status=r.status;e.body=body;throw e;}
  return body;
}
export async function activeMembership(userId){
  const rows=await db(`kryven_memberships?user_id=eq.${encodeURIComponent(userId)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=expires_at,source,created_at&order=expires_at.desc&limit=1`);
  return rows?.[0]||null;
}
export async function extendMembership(userId,days=90,source='paid',orderId=''){
  if(orderId){const prior=await db(`kryven_memberships?user_id=eq.${encodeURIComponent(userId)}&order_id=eq.${encodeURIComponent(orderId)}&select=expires_at&limit=1`);if(prior?.[0])return {active:true,expiresAt:prior[0].expires_at};}
  const existing=await activeMembership(userId);
  const start=existing?new Date(existing.expires_at):new Date();
  const startsAt=existing?existing.expires_at:new Date().toISOString();
  const expiresAt=new Date(start.getTime()+Math.max(1,Math.min(3650,Number(days)||90))*86400000).toISOString();
  const rows=await db('kryven_memberships',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:userId,source,order_id:orderId||null,starts_at:startsAt,expires_at:expiresAt})});
  return {active:true,expiresAt:rows?.[0]?.expires_at||expiresAt};
}
export async function findRewardByCode(userId,code){
  const c=safeCode(code);if(!c)return null;
  const rows=await db(`kryven_reward_claims?user_id=eq.${encodeURIComponent(userId)}&coupon_code=eq.${encodeURIComponent(c)}&select=*&limit=1`);
  return rows?.[0]||null;
}
export async function findCreatorCouponRedemption(userId,code){
  const rows=await db(`kryven_coupon_redemptions?user_id=eq.${encodeURIComponent(userId)}&coupon_code=eq.${encodeURIComponent(safeCode(code))}&select=*&limit=1`);
  return rows?.[0]||null;
}
export async function reserveCreatorCoupon(userId,code,orderId,discountAmount,maxUses=0){
  const rows=await db('rpc/reserve_kryven_coupon',{method:'POST',body:JSON.stringify({p_user_id:userId,p_coupon_code:safeCode(code),p_order_id:orderId,p_discount_amount:round2(discountAmount),p_max_uses:Math.max(0,Number(maxUses)||0)})});
  if(rows===true)return true;
  if(Array.isArray(rows)&&rows[0]===true)return true;
  return false;
}
export async function settleOrderPromos(orderId,confirmed){
  const query=`order_id=eq.${encodeURIComponent(orderId)}&status=eq.pending`;
  try{await db(`kryven_coupon_redemptions?${query}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(confirmed?{status:'redeemed',redeemed_at:new Date().toISOString()}:{status:'released'})})}catch(e){console.error('creator coupon settlement failed',e?.message)}
  try{await db(`kryven_reward_claims?${query}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(confirmed?{status:'redeemed',redeemed_at:new Date().toISOString(),reserved_until:null}:{status:'available',order_id:null,reserved_until:null})})}catch(e){console.error('wheel coupon settlement failed',e?.message)}
}
export function couponDefinition(settings,code){
  const c=safeCode(code);
  return (Array.isArray(settings?.creatorCoupons)?settings.creatorCoupons:[]).find(x=>safeCode(x.code)===c&&x.enabled!==false)||null;
}
export function eligibleIds(config,products){
  const ids=Array.isArray(config?.productIds)?config.productIds.map(String).filter(Boolean):[];
  if(ids.length)return new Set(ids);
  // If no IDs were set, restrict game rewards to T-shirts rather than every product.
  return new Set((products||[]).filter(p=>String(p.category||'').toLowerCase().includes('t-shirt')).map(p=>String(p.id)));
}
export const sanitizeCode=safeCode;

export async function resolveCoupon(userId,code,store,orderId=''){
  const c=safeCode(code);if(!c)return {coupon:null,claim:null,creator:null};
  let reward=await findRewardByCode(userId,c);
  if(reward){
    if(reward.status==='pending'&&String(reward.order_id||'')!==String(orderId)&&reward.reserved_until&&new Date(reward.reserved_until).getTime()<=Date.now()){
      const released=await db(`kryven_reward_claims?id=eq.${encodeURIComponent(reward.id)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.pending`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'available',order_id:null,reserved_until:null})});
      if(released?.length)reward={...reward,status:'available',order_id:null,reserved_until:null};
    }
    if(reward.status!=='available'&&!(reward.status==='pending'&&String(reward.order_id||'')===String(orderId)))throw Object.assign(new Error('This reward code has already been used or is being reserved.'),{status:409});
    if(reward.expires_at&&new Date(reward.expires_at).getTime()<Date.now()){
      await db(`kryven_reward_claims?id=eq.${encodeURIComponent(reward.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'expired',reserved_until:null})});
      throw Object.assign(new Error('This reward code has expired.'),{status:400});
    }
    return {coupon:{code:c,type:'percent',percent:Number(reward.discount_percent),productIds:reward.product_ids||[],minCartValue:Number(reward.metadata?.minCartValue)||0,maxDiscount:Number(reward.metadata?.maxDiscount)||0},claim:reward,creator:null};
  }
  const creator=couponDefinition(store.settings,c);
  if(!creator)throw Object.assign(new Error('That coupon code is not active or does not exist.'),{status:400});
  if(creator.expiresAt&&new Date(creator.expiresAt).getTime()<Date.now())throw Object.assign(new Error('This coupon code has expired.'),{status:400});
  if(Number(creator.minCartValue)>0&&Number(creator.minCartValue)>10000000)throw Object.assign(new Error('Coupon minimum is invalid.'),{status:400});
  const existing=await findCreatorCouponRedemption(userId,c);
  if(existing?.status==='redeemed')throw Object.assign(new Error('You have already used this coupon.'),{status:409});
  if(existing?.status==='pending'&&String(existing.order_id||'')===String(orderId))return {coupon:{code:c,type:creator.type==='fixed'?'fixed':'percent',percent:Number(creator.percent)||0,amount:Number(creator.amount)||0,productIds:Array.isArray(creator.productIds)?creator.productIds.map(String):[],minCartValue:Number(creator.minCartValue)||0,maxDiscount:Number(creator.maxDiscount)||0},claim:null,creator};
  if(existing?.status==='pending'&&existing.reserved_until&&new Date(existing.reserved_until).getTime()>Date.now())throw Object.assign(new Error('This coupon is already reserved for another checkout. Try again shortly.'),{status:409});
  if(Number(creator.maxUses)>0){
    const used=await db(`kryven_coupon_redemptions?coupon_code=eq.${encodeURIComponent(c)}&status=eq.redeemed&select=id&limit=${Math.min(10000,Number(creator.maxUses)+1)}`);
    if((used||[]).length>=Number(creator.maxUses))throw Object.assign(new Error('This coupon has reached its usage limit.'),{status:409});
  }
  return {coupon:{code:c,type:creator.type==='fixed'?'fixed':'percent',percent:Number(creator.percent)||0,amount:Number(creator.amount)||0,productIds:Array.isArray(creator.productIds)?creator.productIds.map(String):[],minCartValue:Number(creator.minCartValue)||0,maxDiscount:Number(creator.maxDiscount)||0},claim:null,creator};
}
export async function reserveCouponForOrder(userId,resolved,orderId,discountAmount){
  if(!resolved?.coupon)return true;
  if(resolved.claim){
    if(resolved.claim.status==='pending'&&String(resolved.claim.order_id||'')===String(orderId))return true;
    const rows=await db(`kryven_reward_claims?id=eq.${encodeURIComponent(resolved.claim.id)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.available`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'pending',order_id:orderId,reserved_until:new Date(Date.now()+30*60*1000).toISOString()})});
    if(!rows?.length)throw Object.assign(new Error('This reward has already been used in another checkout.'),{status:409});
    return true;
  }
  const ok=await reserveCreatorCoupon(userId,resolved.coupon.code,orderId,discountAmount,Number(resolved.creator?.maxUses)||0);
  if(!ok)throw Object.assign(new Error('This coupon has already been used or is currently reserved.'),{status:409});
  return true;
}
export async function activateMembershipForOrder(order){
  const userId=String(order?.authUserId||'');
  if(!userId||(order?.items||[]).every(x=>String(x.id)!=='ERA_PASS_90'))return null;
  return extendMembership(userId,Number(order.membershipDurationDays)||90,'paid',String(order.id||''));
}
