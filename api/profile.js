// Store the signed-in customer's latest checkout details in their own Supabase Auth user metadata.
import {rateLimit} from './_security.js';
import {requireEraUser} from './_era-promos.js';
const SUPABASE_URL=process.env.SUPABASE_URL||'https://iisezaptudifgwkjxnkh.supabase.co';
const SUPABASE_KEY=process.env.SUPABASE_ANON_KEY||'sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
const clean=(v,n)=>String(v||'').replace(/[<>\u0000-\u001F]/g,' ').trim().slice(0,n);
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'era-profile',20,60*1000))return;
  try{
    const user=await requireEraUser(req);
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const phone=clean(body.phone,20).replace(/\D/g,'').slice(-10);
    if(!clean(body.name,100)||!/^\d{10}$/.test(phone))return res.status(400).json({error:'Enter your name and a valid 10-digit mobile number.'});
    const metadata={...(user.metadata||{}),name:clean(body.name,100),phone,address:clean(body.address,300),landmark:clean(body.landmark,120),houseNumber:clean(body.houseNumber,60),city:clean(body.city,80),state:clean(body.state,80),pincode:clean(body.pincode,6)};
    const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${user.token}`,'Content-Type':'application/json'},body:JSON.stringify({data:metadata})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)return res.status(r.status>=500?503:400).json({error:data.msg||data.message||'Could not save customer details to your account.'});
    return res.status(200).json({ok:true,profile:{name:metadata.name,phone:metadata.phone,address:metadata.address,landmark:metadata.landmark,houseNumber:metadata.houseNumber,city:metadata.city,state:metadata.state,pincode:metadata.pincode}});
  }catch(e){if(e?.status)return res.status(e.status).json({error:e.message});console.error('ERA_PROFILE_ERROR',e);return res.status(503).json({error:'Customer profile could not be saved.'})}
}
