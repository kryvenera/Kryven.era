// Authenticated reward wallet and server-randomized spin wheel. No client-selected prizes are accepted.
import crypto from 'crypto';
import {rateLimit} from './_security.js';
import {requireEraUser,getStoreState,db,activeMembership,extendMembership,sanitizeCode} from './_era-promos.js';

function draw(prizes){
  const clean=(Array.isArray(prizes)?prizes:[]).map(p=>({...p,weight:Number(p.weight)})).filter(p=>p.weight>0&&Number.isFinite(p.weight));
  const total=clean.reduce((n,p)=>n+p.weight,0);
  if(!clean.length||Math.abs(total-100)>0.02)throw Object.assign(new Error('Wheel weights must total exactly 100% in Admin → Rewards.'),{status:400});
  const r=crypto.randomInt(0,1000000)/10000;
  let cursor=0;for(const p of clean){cursor+=p.weight;if(r<cursor)return p;}return clean[clean.length-1];
}
function code(){return 'ERA-'+crypto.randomBytes(4).toString('hex').toUpperCase()}

const DEFAULT_PRIZES=[
  {id:'off25',type:'discount',percent:25,label:'25% OFF',weight:30,productIds:[]},
  {id:'off30',type:'discount',percent:30,label:'30% OFF',weight:25,productIds:[]},
  {id:'off35',type:'discount',percent:35,label:'35% OFF',weight:20,productIds:[]},
  {id:'off40',type:'discount',percent:40,label:'40% OFF',weight:15,productIds:[]},
  {id:'off50',type:'discount',percent:50,label:'50% OFF',weight:9.5,productIds:[]},
  {id:'eraPass',type:'membership',label:'ERA PASS',weight:0.5,productIds:[]}
];
function validatePrizes(prizes){
  const memberships=prizes.filter(p=>p.type==='membership');
  if(memberships.length!==1||Math.abs(Number(memberships[0].weight)-0.5)>0.0001)throw Object.assign(new Error('Keep exactly one ERA PASS reward at 0.50% in Admin → Spin Wheel.'),{status:400});
  for(const p of prizes){
    if(p.type==='discount'&&(Number(p.percent)<25||Number(p.percent)>50))throw Object.assign(new Error('Spin rewards must be between 25% and 50% OFF.'),{status:400});
    if(!['discount','membership'].includes(p.type))throw Object.assign(new Error('Only discount or ERA PASS rewards are allowed on the wheel.'),{status:400});
  }
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'era-rewards',req.method==='POST'?8:40,60*1000))return;
  try{
    const user=await requireEraUser(req);
    const membership=await activeMembership(user.id);
    if(req.method==='GET'){
      const spins=await db(`kryven_reward_claims?user_id=eq.${encodeURIComponent(user.id)}&select=campaign_key,reward_type,discount_percent,product_ids,coupon_code,status,expires_at,created_at,metadata,order_id&order=created_at.desc&limit=25`);
      return res.status(200).json({ok:true,user:{id:user.id,email:user.email,name:user.metadata?.name||''},membershipActive:!!membership,membershipExpiresAt:membership?.expires_at||null,claims:spins||[]});
    }
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    if(body.action!=='spin')return res.status(400).json({error:'Unknown rewards action'});
    const store=await getStoreState();const configured=store.settings?.rewards?.wheel||{};const cfg={enabled:true,campaignKey:'era-wheel-2026',couponValidityDays:14,prizes:DEFAULT_PRIZES,...configured,prizes:Array.isArray(configured.prizes)&&configured.prizes.length?configured.prizes:DEFAULT_PRIZES};
    if(cfg.enabled===false)return res.status(403).json({error:'The Spin the Era campaign is paused.'});
    validatePrizes(cfg.prizes);
    const campaign=String(cfg.campaignKey||'era-wheel-2026').replace(/[^A-Za-z0-9_-]/g,'').slice(0,60)||'era-wheel-2026';
    const existing=await db(`kryven_reward_claims?user_id=eq.${encodeURIComponent(user.id)}&campaign_key=eq.${encodeURIComponent(campaign)}&select=*&limit=1`);
    if(existing?.length)return res.status(409).json({error:'You have already used your spin for this campaign.',claim:existing[0]});
    const products=store.products||[];
    const allPrizes=cfg.prizes;
    // Fail closed: every wheel discount must explicitly name eligible existing products.
    const prizes=allPrizes.map(p=>({...p,productIds:p.type==='discount'?(Array.isArray(p.productIds)?p.productIds.map(String).filter(id=>products.some(pr=>String(pr.id)===id)):[]):[]}));
    if(prizes.some(p=>p.type==='discount'&&p.productIds.length===0))throw Object.assign(new Error('Select at least one existing eligible product for every discount prize in Admin → Spin Wheel before enabling the campaign.'),{status:400});
    const chosen=draw(prizes);
    const expires=new Date(Date.now()+Math.max(1,Math.min(365,Number(cfg.couponValidityDays)||14))*86400000).toISOString();
    let inserted;
    for(let tries=0;tries<3;tries++){
      const coupon=chosen.type==='discount'?code():null;
      try{
        const rows=await db('kryven_reward_claims',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:user.id,campaign_key:campaign,reward_type:chosen.type,discount_percent:chosen.type==='discount'?Number(chosen.percent):null,product_ids:chosen.productIds||[],coupon_code:coupon,status:'available',expires_at:expires,metadata:{label:chosen.label||'',prizeId:String(chosen.id||'')} })});
        inserted=rows?.[0];break;
      }catch(e){if(e.status===409||e.body?.code==='23505'){return res.status(409).json({error:'You have already used your spin for this campaign.'})}throw e;}
    }
    if(!inserted)throw new Error('The reward could not be saved. Please try again.');
    if(chosen.type==='membership'){
      try{
        const active=await extendMembership(user.id,Math.max(1,Math.min(3650,Number(store.settings?.membership?.durationDays)||90)),'wheel','');
        return res.status(200).json({ok:true,claim:inserted,prizeId:String(chosen.id||''),reward:{type:'membership',label:`${Math.max(1,Math.min(3650,Number(store.settings?.membership?.durationDays)||90))}-DAY ERA PASS`,text:'You won an ERA PASS membership reward!',expiresAt:active.expiresAt},membershipActive:true,membershipExpiresAt:active.expiresAt});
      }catch(e){try{await db(`kryven_reward_claims?id=eq.${encodeURIComponent(inserted.id)}`,{method:'DELETE'})}catch{};throw e;}
    }
    return res.status(200).json({ok:true,claim:inserted,prizeId:String(chosen.id||''),reward:{type:'discount',percent:Number(chosen.percent),label:chosen.label||`${Number(chosen.percent)}% OFF`,couponCode:inserted.coupon_code,productIds:inserted.product_ids,expiresAt:inserted.expires_at},membershipActive:!!membership});
  }catch(e){
    if(e.status===401||e.status===403||e.status===400||e.status===409||e.status===503)return res.status(e.status).json({error:e.message});
    console.error('ERA_REWARDS_ERROR',e);return res.status(503).json({error:'Reward service is not ready. Check the Supabase rewards setup.'});
  }
}
