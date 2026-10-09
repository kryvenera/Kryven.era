export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const payload=req.body||{};
    console.log('CASHFREE_WEBHOOK',JSON.stringify({order_id:payload?.data?.order?.order_id||payload?.order_id||null,type:payload?.type||null}));
    return res.status(200).json({ok:true});
  }catch(e){return res.status(400).json({error:'Invalid webhook payload'});}
}
