export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const orderId=String(req.query?.orderId||'');
    if(!orderId) return res.status(400).json({error:'orderId required'});
    const clientId=process.env.CASHFREE_CLIENT_ID||process.env.cashfree_client_id||process.env['cashfree-client-id'];
    const clientSecret=process.env.CASHFREE_CLIENT_SECRET||process.env.cashfree_client_secret||process.env['cashfree-client-secret'];
    if(!clientId||!clientSecret) return res.status(500).json({error:'Cashfree environment variables are missing'});
    const env=String(process.env.CASHFREE_ENV||'production').toLowerCase()==='sandbox'?'sandbox':'production';
    const baseUrl=env==='sandbox'?'https://sandbox.cashfree.com':'https://api.cashfree.com';
    const apiVersion=process.env.CASHFREE_API_VERSION||'2025-01-01';
    const r=await fetch(`${baseUrl}/pg/orders/${encodeURIComponent(orderId)}/payments`,{headers:{'x-client-id':clientId,'x-client-secret':clientSecret,'x-api-version':apiVersion,Accept:'application/json'}});
    const data=await r.json().catch(()=>[]);
    if(!r.ok)return res.status(r.status).json({error:data?.message||'Unable to fetch payment status',details:data});
    const payments=Array.isArray(data)?data:[];
    const paid=payments.some(x=>x?.payment_status==='SUCCESS');
    const pending=payments.some(x=>x?.payment_status==='PENDING');
    return res.status(200).json({paid,pending,payments});
  }catch(e){return res.status(500).json({error:e.message||'Server error'});}
}
