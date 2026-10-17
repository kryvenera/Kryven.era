// Customer enters a membership code. Valid code -> ERA PASS is activated instantly for the duration the admin set on that code.
import {rateLimit,cleanText} from './_security.js';
import {requireEraUser,db,activeMembership,extendMembership,sanitizeCode} from './_era-promos.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'membership-chance',6,60*1000))return;
  let claimed=null;
  try{
    const user=await requireEraUser(req);
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const code=sanitizeCode(body.code);
    if(!code)return res.status(400).json({error:'Enter your membership code.'});
    if(await activeMembership(user.id))return res.status(200).json({ok:true,already:true,message:'Your ERA PASS is already active. Your code was not used.'});
    const mine=await db(`kryven_membership_requests?user_id=eq.${encodeURIComponent(user.id)}&code=eq.${encodeURIComponent(code)}&select=id&limit=1`);
    if(mine?.[0])return res.status(400).json({error:'You have already used this code.'});
    const rows=await db(`kryven_membership_codes?code=eq.${encodeURIComponent(code)}&enabled=eq.true&select=*&limit=1`);
    const row=rows?.[0];
    if(!row||Number(row.uses)>=Number(row.max_uses))return res.status(400).json({error:'This code is not valid or has already been used.'});
    const days=Math.max(1,Math.min(3650,Number(row.days)||30));
    // Claim one use atomically (fails if someone else used it first).
    const upd=await db(`kryven_membership_codes?code=eq.${encodeURIComponent(code)}&uses=eq.${Number(row.uses)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({uses:Number(row.uses)+1})});
    if(!upd?.length)return res.status(409).json({error:'This code was just used. Please try again.'});
    claimed=row;
    const m=await extendMembership(user.id,days,'admin','');
    claimed=null;
    await db('kryven_membership_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
      user_id:user.id,code,status:'granted',decided_at:new Date().toISOString(),
      name:cleanText(body.name||user.metadata?.name||user.metadata?.full_name||'',80),
      email:cleanText(user.email||body.email||'',120),
      phone:cleanText(body.phone||user.metadata?.phone||'',20)
    })}).catch(e=>console.error('MEMBERSHIP_LOG_ERROR',e));
    const label=days>=365&&days%365===0?`${days/365}-year`:`${days}-day`;
    return res.status(200).json({ok:true,days,expiresAt:m.expiresAt,message:`Code accepted! Your ${label} ERA PASS is now active.`});
  }catch(e){
    if(claimed){try{await db(`kryven_membership_codes?code=eq.${encodeURIComponent(claimed.code)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({uses:Number(claimed.uses)})})}catch{}}
    if(e?.status&&e.status<500)return res.status(e.status).json({error:e.message});
    console.error('MEMBERSHIP_CHANCE_ERROR',e);return res.status(503).json({error:'Membership is unavailable right now. Please try again.'});
  }
}
