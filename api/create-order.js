// KRYVEN ERA / CREATE CASHFREE ORDER
// The browser sends WHAT was picked (ids, sizes, qty) and the payment option. The server recomputes every amount
// from the live catalog, creates the Cashfree order for exactly that amount, and stores the pending order.
// The order stays "Awaiting Payment Verification" until Cashfree itself confirms the payment (see status.js / webhook.js).
import {rateLimit,ORDER_ID_RE,cleanText,validEmail} from './_security.js';
import {loadCatalog,priceOrder,OrderError} from './_pricing.js';
import {findOrderRows,insertOrder} from './_orders.js';
import {cashfreeConfig,cfHeaders,getCashfreeOrder} from './_cashfree.js';
import {requireEraUser,activeMembership,resolveCoupon,reserveCouponForOrder,settleOrderPromos} from './_era-promos.js';

function siteOrigin(req){
  const fixed=String(process.env.SITE_URL||'').trim().replace(/\/+$/,'');
  if(/^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/.test(fixed))return fixed;
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  return host?`${proto}://${host}`:'';
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!rateLimit(req,res,'create-order',10,60*1000))return;
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const orderId=String(body.order_id||'');
    if(!ORDER_ID_RE.test(orderId))return res.status(400).json({error:'Invalid order details'});
    const mode=body.mode==='cod'?'cod':body.mode==='online'?'online':'';
    if(!mode)return res.status(400).json({error:'Choose a payment option'});

    const membershipOnly=Array.isArray(body.items)&&body.items.length>0&&body.items.every(x=>String(x?.id||'')==='ERA_PASS_90');
    let eraUser=null;
    const wantsMemberOrCoupon=membershipOnly||Boolean(String(body.coupon_code||'').trim());
    const hasBearer=/^Bearer\s+.+/i.test(String(req.headers.authorization||''));
    if(wantsMemberOrCoupon||hasBearer){
      try{eraUser=await requireEraUser(req)}catch(e){if(wantsMemberOrCoupon)return res.status(e.status||401).json({error:e.message});}
    }
    // Customer details (validated + sanitised; nothing here affects the amount).
    const c=body.customer||{};
    const phone=String(c.phone||'').replace(/\D/g,'').slice(-10);
    const pincode=String(c.pincode||'').trim();
    const customer={
      name:cleanText(c.name,100),phone,email:validEmail(c.email)||validEmail(eraUser?.email),
      address:cleanText(c.address,300),landmark:cleanText(c.landmark,120),houseNumber:cleanText(c.houseNumber,60),
      city:cleanText(c.city,80),state:cleanText(c.state,80),pincode
    };
    if(!customer.name)return res.status(400).json({error:'Please enter your full name'});
    if(!membershipOnly&&(!customer.address||!customer.landmark||!customer.city||!customer.state))return res.status(400).json({error:'Please fill in all required delivery details'});
    if(!/^\d{10}$/.test(phone))return res.status(400).json({error:'A valid 10-digit mobile number is required'});
    if(!membershipOnly&&!/^\d{6}$/.test(pincode))return res.status(400).json({error:'A valid 6-digit pincode is required'});
    if(membershipOnly&&(!eraUser||!customer.email))return res.status(401).json({error:'Sign in with an email account before purchasing membership.'});

    // Authoritative pricing. Membership and coupon privileges are derived from Supabase Auth, never from a client-sent customer ID.
    const catalog=await loadCatalog();
    let active=null;
    if(eraUser){try{active=await activeMembership(eraUser.id)}catch(e){if(membershipOnly||String(body.coupon_code||'').trim())throw e;console.warn('Membership status unavailable; standard pricing used.')}}
    const couponCode=String(body.coupon_code||'').trim();
    let resolved=null;
    if(couponCode){
      if(!eraUser)return res.status(401).json({error:'Sign in to redeem a one-use coupon.'});
      resolved=await resolveCoupon(eraUser.id,couponCode,catalog,orderId);
    }
    const priced=priceOrder(catalog,body.items,mode,{userId:eraUser?.id||'',membershipActive:!!active,coupon:resolved?.coupon||null});
    const drop=catalog.settings?.limitedDrops||{};const dropIds=new Set(Array.isArray(drop.productIds)?drop.productIds.map(String):[]);const qualifyingDropItems=priced.items.filter(it=>String(it.id)!=='ERA_PASS_90'&&dropIds.has(String(it.id)));const freebie=drop.enabled!==false&&dropIds.size&&qualifyingDropItems.length?{title:String(drop.title||'LIMITED ERA DROP').slice(0,100),giftText:String(drop.giftText||'Exclusive KRYVEN ERA collectible').slice(0,180),productIds:[...new Set(qualifyingDropItems.map(it=>String(it.id)))]}:null;
    const claimed=Number(body.client_amount);
    if(Number.isFinite(claimed)&&Math.abs(claimed-priced.payNow)>0.5){
      return res.status(409).json({error:'Prices were just updated. Please review your order and try again.',code:'PRICE_CHANGED',pay_now:priced.payNow,total:priced.total});
    }

    const cfg=cashfreeConfig();
    if(!cfg.clientId||!cfg.clientSecret)return res.status(500).json({error:'Online payments are not set up yet. Please contact support.'});
    const origin=siteOrigin(req);
    if(!origin)return res.status(500).json({error:'Unable to determine website URL'});

    const customerId=cleanText(body.customer_id||orderId,50).replace(/[^A-Za-z0-9_-]/g,'')||orderId;
    const cfBody={
      order_id:orderId,
      order_amount:priced.payNow,
      order_currency:'INR',
      customer_details:{customer_id:customerId,customer_name:customer.name,customer_email:customer.email||'customer@kryvenera.in',customer_phone:phone},
      order_meta:{return_url:`${origin}/payment.html?cashfree_return=1&order_id={order_id}`,notify_url:`${origin}/api/webhook`}
    };

    // 1) Cashfree order (no money moves until the customer pays).
    let session='';
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    let r,data;
    try{
      r=await fetch(`${cfg.baseUrl}/pg/orders`,{method:'POST',headers:{...cfHeaders(cfg),'Content-Type':'application/json'},body:JSON.stringify(cfBody),signal:controller.signal});
      data=await r.json().catch(()=>({}));
    }catch(e){
      console.error('CASHFREE_CONNECT_ERROR',e?.message);
      return res.status(502).json({error:'Could not connect to the payment gateway. Please try again.'});
    }finally{clearTimeout(timer)}

    if(r.ok&&data?.payment_session_id){
      session=data.payment_session_id;
    }else if(r.status===409||/already_exists|already exists/i.test(`${data?.code||''} ${data?.message||''}`)){
      // Same order id again (refresh / back button). Reuse only if it is still unpaid, for the same amount.
      const existing=await getCashfreeOrder(cfg,orderId);
      const status=String(existing?.order_status||'').toUpperCase();
      if(status==='PAID')return res.status(409).json({error:'This order is already paid.',code:'ALREADY_PAID',order_id:orderId});
      if(existing&&status==='ACTIVE'&&existing.payment_session_id&&Math.abs(Number(existing.order_amount)-priced.payNow)<0.01){
        session=existing.payment_session_id;
      }else{
        return res.status(409).json({error:'Please start checkout again.',code:'RETRY_WITH_NEW_ID'});
      }
    }else{
      console.error('CASHFREE_ORDER_ERROR',r.status,data);
      return res.status(r.status>=500?502:400).json({error:data?.message||'Payment could not be started. Please try again.'});
    }

    // Reserve a single-use reward/coupon to prevent concurrent checkout reuse.
    if(resolved?.coupon){
      try{await reserveCouponForOrder(eraUser.id,resolved,orderId,priced.discount)}catch(e){return res.status(e.status||409).json({error:e.message||'Coupon reservation failed. Please retry.'})}
    }

    // 2) Save the pending order (server-built, with server-computed amounts). If this fails, nothing has been charged.
    let existingRows=[];
    try{existingRows=await findOrderRows(orderId)}catch(e){console.error('ORDER_LOOKUP_ERROR',e?.message)}
    if(!existingRows.length){
      const order={
        id:orderId,createdAt:new Date().toISOString(),customerId,customer:{id:customerId,...customer},
        items:priced.items,subtotal:priced.subtotal,discount:priced.discount,shipping:priced.shipping,total:priced.total,
        payment:mode==='cod'?'cod':'online',status:'Awaiting Payment Verification',paymentVerified:false,
        payNow:priced.payNow,advancePaid:priced.payNow,remainingDue:priced.remaining,codAdvancePercent:priced.codAdvancePercent,
        paymentGateway:'Cashfree',authUserId:eraUser?.id||null,couponCode:resolved?.coupon?.code||null,
        membershipDurationDays:Number(catalog.settings?.membership?.durationDays)||90,freebie
      };
      const rowId=await insertOrder(order);
      if(!rowId){await settleOrderPromos(orderId,false);return res.status(502).json({error:'We could not save your order. You have not been charged. Please try again.'});}
    }

    return res.status(200).json({order_id:orderId,payment_session_id:session,cashfree_mode:cfg.env,total:priced.total,pay_now:priced.payNow,remaining:priced.remaining,discount:priced.discount,applied_coupon:priced.appliedCoupon,membership_active:!!active,freebie});
  }catch(e){
    if(e instanceof OrderError)return res.status(e.status).json({error:e.message});
    if(e?.status && e.status>=400 && e.status<600)return res.status(e.status).json({error:e.message||'Could not validate this promotion.'});
    console.error('CREATE_ORDER_ERROR',e);
    return res.status(500).json({error:'Server error. Please try again.'});
  }
}
