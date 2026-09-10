const {test}=require('node:test'),assert=require('node:assert/strict');
const {entitlement}=require('../workspace');
test('server roles grant staff access; customers still require a real active period',async()=>{
 const original=global.fetch;try{
 for(const role of ['owner','admin','customer',null,'OWNER','invalid'])for(const paid of [false,true]){
  const calls=[];global.fetch=async url=>{calls.push(String(url));return Response.json(String(url).includes('account_roles?')?(role?[{role}]:[]):paid?[{plan:'pro',status:'active',paid_until:new Date(Date.now()+86400000).toISOString()}]:[]);};
  const req={account:{id:'verified-user'},body:{role:'owner'}};let allowed=false,status;
  const res={status(n){status=n;return this;},json(){}};
  await entitlement(req,res,()=>{allowed=true;});const staff=['owner','admin'].includes(role);
  assert.equal(allowed,staff||paid,role+' paid='+paid);
  if(staff){assert.equal(req.membership.role,role);assert.equal(req.membership.paid_until,null);assert.equal(calls.length,1);}else if(!paid)assert.equal(status,402);
  assert.match(calls[0],/user_id=eq.verified-user/);
 }
 }finally{global.fetch=original;}
});
test('role lookup failure cannot grant customer or owner access',async()=>{const old=global.fetch;global.fetch=async()=>{throw Error('offline');};try{let status;await entitlement({account:{id:'verified-user'}},{status(s){status=s;return this;},json(){}},()=>assert.fail('must not grant'));assert.equal(status,503);}finally{global.fetch=old;}});
