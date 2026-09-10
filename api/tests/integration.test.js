const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const express=require('express');
const {db}=require('../workspace');
function token(claims={}){return 'header.'+Buffer.from(JSON.stringify({sub:'account-a',aal:'aal2',exp:Date.now()/1000+300,...claims})).toString('base64url')+'.signature';}
test('HTTP: protected routes, account data, missing services and verified Shopify events',async t=>{
 const realFetch=global.fetch;const saved={...process.env};let server;const listen=express.application.listen;
 Object.assign(process.env,{PORT:'0',SUPABASE_URL:'https://identity.example.test',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'server-fixture',SHOPIFY_STORE_DOMAIN:'fixture.myshopify.com',SHOPIFY_PRO_VARIANT_ID:'299',SHOPIFY_WEBHOOK_SECRET:'fixture-signing-key',SHOPIFY_BILLING_ENABLED:'true'});process.env.GEMINI_API_KEY='fixture-gemini-key';
 let mode='active',captured=[],calls=[];
 global.fetch=async(url,options={})=>{
  if(String(url).startsWith('http://127.0.0.1:'))return realFetch(url,options);
  calls.push(String(url));if(String(url).includes('generativelanguage.googleapis.com')){captured.push({url:String(url),body:JSON.parse(options.body)});if(mode==='gemini-error')return Response.json({error:{message:'provider-private-detail',status:'UNAVAILABLE'}},{status:503});return Response.json({candidates:[{content:{parts:[{text:'Fixture Gemini answer'}],role:'model'},finishReason:'STOP'}]});}if(mode==='outage')throw Error('fixture outage');
  if(String(url).endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:'account-a',email:'alice@example.test',email_confirmed_at:'2026-01-01'}),{status:mode==='invalid'?401:200});
  if(String(url).includes('current_membership'))return Response.json(mode==='expired'?[]:[{plan:'pro',status:'active',paid_until:new Date(Date.now()+86400000).toISOString()}]);
  if(String(url).includes('consume_ai_request'))return Response.json(true);
  if(options.method&&options.method!=='GET'){captured.push({url:String(url),body:JSON.parse(options.body)});return new Response(null,{status:201});}
  return Response.json([{profile:{businessName:'Account A'},assessment:null,tasks:[]}]);
 };
 express.application.listen=function(){server=listen.call(this,0,'127.0.0.1');return server;};
 try{
  delete require.cache[require.resolve('../index')];require('../index');express.application.listen=listen;
  if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const request=(path,method='GET',body,auth=token())=>realFetch(origin+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  await t.test('public shell exposes no account data or private source',async()=>{for(const p of ['/','/growth-pro/','/services/','/growth-pro/manifest.webmanifest'])assert.equal((await request(p)).status,200);for(const p of ['/.env','/api/schema.sql','/api/index.js'])assert.equal((await request(p)).status,404);const html=await(await request('/growth-pro/')).text();assert.equal(html.includes('Account A'),false);});
  await t.test('CORS permits existing production origins only',async()=>{for(const allowed of ['https://app.zionflow.co.za','https://zionflow.co.za','https://www.zionflow.co.za']){const r=await realFetch(origin+'/api/health',{headers:{Origin:allowed}});assert.equal(r.headers.get('access-control-allow-origin'),allowed);}const r=await realFetch(origin+'/api/health',{headers:{Origin:'https://untrusted.example.test'}});assert.equal(r.headers.get('access-control-allow-origin'),null);});
  await t.test('all account routes require authentication and MFA',async()=>{for(const [p,m,b] of [['/api/workspace','GET'],['/api/profile','PUT',{}],['/api/assessment','POST',{}],['/api/tasks/a','PATCH',{completed:true}],['/api/ai','POST',{message:'test'}]]){assert.equal((await request(p,m,b,null)).status,401);assert.equal((await request(p,m,b,token({aal:'aal1'}))).status,403);}});
  await t.test('expired subscription denies every protected action',async()=>{mode='expired';for(const [p,m,b]of [['/api/workspace','GET'],['/api/profile','PUT',{}],['/api/assessment','POST',{answers:Array(8).fill(0)}],['/api/tasks/a','PATCH',{completed:true}],['/api/ai','POST',{message:'test'}]])assert.equal((await request(p,m,b)).status,402);mode='active';});
  await t.test('account support information remains available when paid access expires',async()=>{mode='expired';const r=await request('/api/account');assert.equal(r.status,200);assert.equal((await r.json()).email,'alice@example.test');assert.equal((await request('/api/account','GET',undefined,null)).status,401);mode='active';});
  await t.test('malformed JSON returns a safe client error without a stack',async()=>{const r=await realFetch(origin+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});assert.equal(r.status,400);const body=await r.text();assert.equal(body.includes('SyntaxError'),false);assert.equal(JSON.parse(body).success,false);});
  await t.test('account saves accept successful empty database responses',async()=>{const result=await request('/api/profile','PUT',{businessName:'Saved name',industry:'',idealCustomer:'',productsServices:'',biggestProblem:'',user_id:'attacker'});assert.equal(result.status,200);assert.equal(captured.at(-1).body.user_id,'account-a');});
  await t.test('assessment score is computed by server and tied to verified account',async()=>{const result=await request('/api/assessment','POST',{answers:[0,1,2,3,0,1,2,3],score:80,user_id:'attacker'});assert.equal(result.status,200);const data=captured.at(-1).body;assert.equal(data.user_id,'account-a');assert.equal(data.assessment.score,44);assert.equal(data.tasks.length,3);assert.equal((await request('/api/assessment','POST',{answers:[0]})).status,400);});
  await t.test('absent JSON body receives a client error rather than server error',async()=>{const result=await realFetch(origin+'/api/assessment',{method:'POST',headers:{Authorization:'Bearer '+token()}});assert.equal(result.status,400);});
  await t.test('missing identity/storage and Gemini fail safely',async()=>{mode='outage';assert.equal((await request('/api/workspace')).status,503);mode='active';delete process.env.GEMINI_API_KEY;const result=await request('/api/ai','POST',{message:'Hello'});assert.equal(result.status,500);assert.match((await result.json()).error,/not configured/);assert.equal(calls.some(u=>u.includes('generativelanguage.googleapis.com')),false);process.env.GEMINI_API_KEY='fixture-gemini-key';});
  await t.test('Gemini SDK flow uses saved account context and handles provider errors',async()=>{
   let result=await request('/api/ai','POST',{message:'Help my business',businessProfile:{businessName:'FORGED PROFILE'}});assert.equal(result.status,200);assert.equal((await result.json()).answer,'Fixture Gemini answer');const sent=JSON.stringify(captured.at(-1).body);assert.match(sent,/Account A/);assert.equal(sent.includes('FORGED PROFILE'),false);
   mode='gemini-error';result=await request('/api/ai','POST',{message:'Help'});assert.equal(result.status,500);assert.equal((await result.text()).includes('provider-private-detail'),false);mode='active';
  });
  await t.test('webhook HMAC is required; R149 is ignored and refund targets its order',async()=>{
   async function webhook(topic,payload,valid=true){const raw=JSON.stringify(payload);return realFetch(origin+'/api/webhooks/shopify',{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Shop-Domain':'fixture.myshopify.com','X-Shopify-Topic':topic,'X-Shopify-Hmac-Sha256':valid?crypto.createHmac('sha256','fixture-signing-key').update(raw).digest('base64'):'bad'},body:raw});}
   const order={id:123,test:false,financial_status:'paid',currency:'ZAR',email:'alice@example.test',processed_at:new Date().toISOString(),line_items:[{variant_id:149,price:'149',quantity:1}]};
   assert.equal((await webhook('orders/paid',order,false)).status,401);let count=captured.length;assert.equal((await webhook('orders/paid',order)).status,200);assert.equal(captured.length,count);
   order.line_items=[{variant_id:299,price:'299',quantity:1}];assert.equal((await webhook('orders/paid',order)).status,200);assert.match(captured.at(-1).url,/record_paid_order/);
   assert.equal((await webhook('refunds/create',{order_id:123,refund_line_items:[{line_item:{variant_id:299},quantity:1}]})).status,200);assert.deepEqual(captured.at(-1).body,{refunded_order_id:'123'});
  });
 }finally{express.application.listen=listen;global.fetch=realFetch;for(const k of Object.keys(process.env)){if(!(k in saved))delete process.env[k];}Object.assign(process.env,saved);if(server)await new Promise(resolve=>server.close(resolve));}
});
