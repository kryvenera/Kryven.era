export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const orderId=String(req.query?.orderId||''); if(!orderId) return res.status(400).json({error:'orderId required'});
    const clientId=process.env.CASHFREE_CLIENT_ID, clientSecret=process.env.CASHFREE_CLIENT_SECRET;
    if(!clientId||!clientSecret) return res.status(500).json({error:'Cashfree environment variables are missing'});
    const base=String(process.env.CASHFREE_ENV||'production').toLowerCase()==='sandbox'?'https://sandbox.cashfree.com':'https://api.cashfree.com';
    const r=await fetch(`${base}/pg/orders/${encodeURIComponent(orderId)}/payments`,{headers:{'x-client-id':clientId,'x-client-secret':clientSecret,'x-api-version':'2025-01-01',Accept:'application/json'}});
    const data=await r.json().catch(()=>[]); if(!r.ok)return res.status(r.status).json({error:data?.message||'Unable to fetch payment status',details:data});
    const paid=Array.isArray(data)&&data.some(x=>x?.payment_status==='SUCCESS');
    const pending=Array.isArray(data)&&data.some(x=>x?.payment_status==='PENDING');
    return res.status(200).json({paid,pending,payments:data});
  }catch(e){return res.status(500).json({error:e.message||'Server error'});}
}
