// Admin-only: membership codes, incoming requests, and granting memberships.
import {rateLimit,verifyAdminToken} from './_security.js';
import {db,extendMembership,sanitizeCode} from './_era-promos.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!rateLimit(req,res,'admin-membership',60,60*1000))return;
  if(!verifyAdminToken(req.headers?.['x-admin-token']))return res.status(401).json({error:'Admin session expired. Please log in again.'});
  try{
    if(req.method==='GET'){
      const [requests,codes]=await Promise.all([
        db('kryven_membership_requests?select=id,user_id,name,email,phone,code,status,created_at,decided_at&order=created_at.desc&limit=300'),
        db('kryven_membership_codes?select=*&order=created_at.desc&limit=300')
      ]);
      return res.status(200).json({ok:true,requests:requests||[],codes:codes||[]});
    }
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    if(b.action==='addCode'){
      const code=sanitizeCode(b.code);if(code.length<4)return res.status(400).json({error:'Code must be at least 4 letters/numbers.'});
      await db('kryven_membership_codes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({code,note:String(b.note||'').slice(0,120),max_uses:Math.max(1,Math.min(1000,Number(b.maxUses)||1)),days:Math.max(1,Math.min(3650,Number(b.days)||30))})});
      return res.status(200).json({ok:true});
    }
    if(b.action==='deleteCode'){await db(`kryven_membership_codes?code=eq.${encodeURIComponent(sanitizeCode(b.code))}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});return res.status(200).json({ok:true})}
    if(b.action==='grant'||b.action==='reject'){
      const id=String(b.id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:'Invalid request id.'});
      const rows=await db(`kryven_membership_requests?id=eq.${id}&select=id,user_id,status&limit=1`);const row=rows?.[0];
      if(!row)return res.status(404).json({error:'Request not found.'});
      let expiresAt=null;
      if(b.action==='grant'){
        if(row.status==='granted')return res.status(200).json({ok:true,already:true});
        const r=await extendMembership(row.user_id,Math.max(1,Math.min(3650,Number(b.days)||90)),'admin','');expiresAt=r.expiresAt;
      }
      await db(`kryven_membership_requests?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:b.action==='grant'?'granted':'rejected',decided_at:new Date().toISOString()})});
      return res.status(200).json({ok:true,expiresAt});
    }
    return res.status(400).json({error:'Unknown action'});
  }catch(e){if(e?.status&&e.status<500)return res.status(e.status).json({error:e.message});console.error('ADMIN_MEMBERSHIP_ERROR',e);return res.status(503).json({error:'Membership service unavailable.'})}
}
