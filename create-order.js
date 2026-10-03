export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {order_id,order_amount,customer}=req.body||{};
    const amount=Number(order_amount);
    if(!order_id||!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:'Invalid order details'});
    const clientId=process.env.CASHFREE_CLIENT_ID||process.env.cashfree_client_id||process.env['cashfree-client-id'];
    const clientSecret=process.env.CASHFREE_CLIENT_SECRET||process.env.cashfree_client_secret||process.env['cashfree-client-secret'];
    if(!clientId||!clientSecret) return res.status(500).json({error:'Cashfree environment variables are missing'});
    const env=String(process.env.CASHFREE_ENV||'production').toLowerCase()==='sandbox'?'sandbox':'production';
    const baseUrl=env==='sandbox'?'https://sandbox.cashfree.com':'https://api.cashfree.com';
    const apiVersion=process.env.CASHFREE_API_VERSION||'2025-01-01';
    const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
    const host=req.headers['x-forwarded-host']||req.headers.host;
    if(!host) return res.status(500).json({error:'Unable to determine website URL'});
    const origin=`${proto}://${host}`;
    const customerPhone=String(customer?.customer_phone||'').replace(/\D/g,'');
    if(!/^\d{10}$/.test(customerPhone)) return res.status(400).json({error:'A valid 10-digit customer phone number is required'});
    const body={
      order_id:String(order_id),
      order_amount:Number(amount.toFixed(2)),
      order_currency:'INR',
      customer_details:{
        customer_id:String(customer?.customer_id||order_id),
        customer_name:String(customer?.customer_name||'Kryven Customer'),
        customer_email:String(customer?.customer_email||'customer@kryvenera.in'),
        customer_phone:customerPhone
      },
      order_meta:{
        return_url:`${origin}/payment.html?cashfree_return=1&order_id={order_id}`,
        notify_url:`${origin}/api/webhook`
      }
    };
    const r=await fetch(`${baseUrl}/pg/orders`,{method:'POST',headers:{'x-client-id':clientId,'x-client-secret':clientSecret,'x-api-version':apiVersion,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) return res.status(r.status).json({error:data?.message||data?.error_description||data?.error||'Cashfree order creation failed',cashfree_status:r.status,details:data});
    return res.status(200).json({order_id:data.order_id||order_id,payment_session_id:data.payment_session_id,cashfree_mode:env});
  }catch(e){return res.status(500).json({error:e.message||'Server error'});}
}
