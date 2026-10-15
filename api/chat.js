import crypto from 'crypto';
import { rateLimit, cleanText, verifyAdminToken } from './_security.js';

const BASE=(process.env.SUPABASE_URL||'https://iisezaptudifgwkjxnkh.supabase.co').replace(/\/$/,'');
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const CONV=`${BASE}/rest/v1/kryven_chat_conversations`;
const MSG=`${BASE}/rest/v1/kryven_chat_messages`;
const headers=(extra={})=>Object.assign({apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},extra);
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
function bodyOf(req){if(req.body&&typeof req.body==='object')return req.body;try{return JSON.parse(req.body||'{}')}catch{return {}}}
function admin(req){const t=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');return Boolean(t&&verifyAdminToken(t));}
async function request(url,options={}){const r=await fetch(url,{...options,headers:headers(options.headers||{})});const txt=await r.text();let d;try{d=txt?JSON.parse(txt):null}catch{d=txt}if(!r.ok)throw new Error(typeof d==='string'?d:(d?.message||d?.details||`Supabase HTTP ${r.status}`));return d}
function err(res,e){console.error('CHAT_API_ERROR',e?.message||e);return res.status(500).json({error:'Chat service is temporarily unavailable. Please try again.'})}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
  if(!KEY)return res.status(503).json({error:'Chat setup incomplete: SUPABASE_SERVICE_ROLE_KEY is missing in Vercel.'});
  const action=String(req.query?.action||bodyOf(req).action||'');
  const isAdmin=['list','admin-messages','reply','close'].includes(action);
  if(isAdmin&&!admin(req))return res.status(401).json({error:'Admin login required.'});
  if(!rateLimit(req,res,`chat-${isAdmin?'admin':'customer'}-${action}`,isAdmin?120:30,60*1000))return;
  try{
    if(action==='start'&&req.method==='POST'){
      const b=bodyOf(req);const token=String(b.token||'');if(token.length<32||token.length>200)return res.status(400).json({error:'Invalid chat session.'});
      const name=cleanText(b.name||'Website visitor',80)||'Website visitor';
      const rows=await request(CONV,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({session_hash:hash(token),customer_name:name,status:'open',last_message:'Chat started',updated_at:new Date().toISOString()})});
      const c=rows?.[0];if(!c?.id)return res.status(500).json({error:'Could not start chat.'});
      await request(MSG,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({conversation_id:c.id,sender:'system',body:'Welcome to KRYVEN ERA support. Send us your question here.',created_at:new Date().toISOString()})});
      return res.status(201).json({ok:true,conversationId:c.id});
    }
    if(action==='send'&&req.method==='POST'){
      const b=bodyOf(req),id=String(b.conversationId||''),token=String(b.token||''),message=cleanText(b.message||'',1500);
      if(!id||token.length<32||!message)return res.status(400).json({error:'Enter a message to send.'});
      const rows=await request(`${CONV}?id=eq.${encodeURIComponent(id)}&select=id,session_hash,status&limit=1`);const c=rows?.[0];
      if(!c||c.session_hash!==hash(token))return res.status(404).json({error:'Chat session not found. Start a new chat.'});
      if(c.status==='closed')return res.status(409).json({error:'This chat is closed. Start a new chat to continue.'});
      await request(MSG,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({conversation_id:id,sender:'customer',body:message,created_at:new Date().toISOString()})});
      await request(`${CONV}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({last_message:message.slice(0,240),updated_at:new Date().toISOString()})});
      return res.status(200).json({ok:true});
    }
    if(action==='messages'&&req.method==='GET'){
      const id=String(req.query?.conversationId||''),token=String(req.query?.token||'');if(!id)return res.status(400).json({error:'Missing conversation.'});
      const rows=await request(`${CONV}?id=eq.${encodeURIComponent(id)}&select=id,session_hash,status&limit=1`);const c=rows?.[0];
      if(!c)return res.status(404).json({error:'Chat not found.'});
      if(!admin(req)&&(!token||c.session_hash!==hash(token)))return res.status(404).json({error:'Chat not found.'});
      const msgs=await request(`${MSG}?conversation_id=eq.${encodeURIComponent(id)}&select=id,sender,body,created_at&order=id.asc&limit=300`);
      return res.status(200).json({messages:msgs||[],status:c.status});
    }
    if(action==='list'&&req.method==='GET'){
      const rows=await request(`${CONV}?select=id,customer_name,status,last_message,created_at,updated_at&order=updated_at.desc&limit=300`);
      return res.status(200).json({conversations:rows||[]});
    }
    if(action==='admin-messages'&&req.method==='GET'){
      const id=String(req.query?.conversationId||'');if(!id)return res.status(400).json({error:'Missing conversation.'});
      const msgs=await request(`${MSG}?conversation_id=eq.${encodeURIComponent(id)}&select=id,sender,body,created_at&order=id.asc&limit=300`);
      return res.status(200).json({messages:msgs||[]});
    }
    if(action==='reply'&&req.method==='POST'){
      const b=bodyOf(req),id=String(b.conversationId||''),message=cleanText(b.message||'',1500);if(!id||!message)return res.status(400).json({error:'Enter a reply.'});
      const rows=await request(`${CONV}?id=eq.${encodeURIComponent(id)}&select=id,status&limit=1`);if(!rows?.length)return res.status(404).json({error:'Conversation not found.'});
      await request(MSG,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({conversation_id:id,sender:'support',body:message,created_at:new Date().toISOString()})});
      await request(`${CONV}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({last_message:message.slice(0,240),updated_at:new Date().toISOString(),status:'open'})});
      return res.status(200).json({ok:true});
    }
    if(action==='close'&&req.method==='POST'){
      const b=bodyOf(req),id=String(b.conversationId||'');if(!id)return res.status(400).json({error:'Missing conversation.'});
      await request(`${CONV}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'closed',updated_at:new Date().toISOString()})});return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:'Unknown chat action.'});
  }catch(e){return err(res,e)}
}
