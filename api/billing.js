const crypto = require('node:crypto');
const {db}=require('./workspace');
function signatureValid(body, supplied, secret) {
 if(!secret||!Buffer.isBuffer(body)||typeof supplied!=='string')return false;
 const actual=crypto.createHmac('sha256',secret).update(body).digest();
 const expected=Buffer.from(supplied,'base64');
 return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
function nextMonth(value) {
 const date=new Date(value);if(!Number.isFinite(date.getTime()))throw new Error('Invalid payment date');
 const day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+1);
 const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,last));return date.toISOString();
}
function paidOrder(order,variant,now=Date.now()) {
 if(!variant||!order.id||order.test!==false||order.financial_status!=='paid'||order.currency!=='ZAR')return null;
 const lines=order.line_items?.filter(line=>String(line.variant_id)===String(variant))||[];
 if(!lines.length||!lines.every(line=>Number(line.price)===299&&line.quantity===1&&Number(line.total_discount||0)===0))return null;
 const paidAt=order.processed_at;
 if(!Number.isFinite(Date.parse(paidAt))||Date.parse(paidAt)>now+300000)return null;
 const email=(order.email||'').trim().toLowerCase();if(!email||email.length>254)return null;
 return {order_id:String(order.id),customer_email:email,paid_at:paidAt,paid_until:nextMonth(paidAt)};
}
function mount(app,express) {
 app.post('/api/webhooks/shopify',express.raw({type:'application/json',limit:'1mb'}),async(req,res)=>{
  if(!process.env.SHOPIFY_WEBHOOK_SECRET||!process.env.SHOPIFY_STORE_DOMAIN||!process.env.SHOPIFY_PRO_VARIANT_ID||process.env.SHOPIFY_BILLING_ENABLED!=='true')return res.sendStatus(503);
  if(req.headers['x-shopify-shop-domain']!==process.env.SHOPIFY_STORE_DOMAIN||!signatureValid(req.body,req.headers['x-shopify-hmac-sha256'],process.env.SHOPIFY_WEBHOOK_SECRET))return res.sendStatus(401);
  let payload;try{payload=JSON.parse(req.body.toString('utf8'));}catch{return res.sendStatus(400);}
  try {
   const topic=req.headers['x-shopify-topic'];
   if(topic==='orders/paid'){
    const order=paidOrder(payload,process.env.SHOPIFY_PRO_VARIANT_ID);if(!order)return res.sendStatus(200);
    await db('rpc/record_paid_order',{method:'POST',body:JSON.stringify(order)});
   }else if(topic==='refunds/create'){
    // Revoke only if this refund includes the configured Pro line. A later paid
    // order is a separate entitlement period and is not overwritten by this one.
    const proRefund=payload.refund_line_items?.some(line=>String(line.line_item?.variant_id)===process.env.SHOPIFY_PRO_VARIANT_ID&&line.quantity>0);
    if(proRefund&&payload.order_id)await db('rpc/revoke_paid_order',{method:'POST',body:JSON.stringify({refunded_order_id:String(payload.order_id)})});
   }
   res.sendStatus(200);
  }catch{res.sendStatus(503);}
 });
}
module.exports={mount,signatureValid,nextMonth,paidOrder};
