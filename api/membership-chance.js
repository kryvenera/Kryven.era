// Customer enters a personal "Chance to Membership" code. Valid code -> request is saved for Admin to grant.
import {rateLimit,cleanText} from './_security.js';
import {requireEraUser,db,activeMembership,sanitizeCode} from './_era-promos.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'membership-chance',6,60*1000))return;
  try{
    const user=await requireEraUser(req);
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const code=sanitizeCode(body.code);
    if(!code)return res.status(400).json({error:'Enter your membership code.'});
    if(await activeMembership(user.id))return res.status(200).json({ok:true,already:true,message:'Your ERA PASS is already active.'});
    const pending=await db(`kryven_membership_requests?user_id=eq.${encodeURIComponent(user.id)}&status=eq.pending&select=id&limit=1`);
    if(pending?.[0])return res.status(200).json({ok:true,already:true,message:'Your request is already with KRYVEN ERA. We will activate your membership shortly.'});
    const rows=await db(`kryven_membership_codes?code=eq.${encodeURIComponent(code)}&enabled=eq.true&select=code,max_uses,uses&limit=1`);
    const row=rows?.[0];
    if(!row||Number(row.uses)>=Number(row.max_uses))return res.status(400).json({error:'This code is not valid or has already been used.'});
    await db(`kryven_membership_codes?code=eq.${encodeURIComponent(code)}&uses=eq.${Number(row.uses)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({uses:Number(row.uses)+1})});
    await db('kryven_membership_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
      user_id:user.id,code,
      name:cleanText(body.name||user.metadata?.name||user.metadata?.full_name||'',80),
      email:cleanText(user.email||body.email||'',120),
      phone:cleanText(body.phone||user.metadata?.phone||'',20)
    })});
    return res.status(200).json({ok:true,message:'Code accepted. Your details have reached KRYVEN ERA — your membership will be activated soon.'});
  }catch(e){if(e?.status&&e.status<500)return res.status(e.status).json({error:e.message});console.error('MEMBERSHIP_CHANCE_ERROR',e);return res.status(503).json({error:'Membership requests are unavailable right now. Please try again.'})}
}
