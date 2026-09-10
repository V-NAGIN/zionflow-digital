const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const alice='00000000-0000-4000-8000-000000000001';
const bob='00000000-0000-4000-8000-000000000002';
async function setup(){
 const db=new PGlite();
 await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); insert into auth.users values('${alice}','alice@example.test',now()),('${bob}','bob@example.test',now());`);
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema.sql'),'utf8'));return db;
}
async function paid(db,id,email='alice@example.test',days=15){await db.query("select record_paid_order($1,$2,now()-interval '1 day',now()+$3*interval '1 day')",[id,email,days]);}
async function membership(db,user=alice){return (await db.query('select * from current_membership($1)',[user])).rows;}
test('SQL: paid periods, expiry, duplicates, refunds, refund-first delivery and renewal',async()=>{
 const db=await setup();try{
  assert.deepEqual(await membership(db),[]);
  await paid(db,'expired','alice@example.test',-1);assert.deepEqual(await membership(db),[]);
  await paid(db,'paid');assert.equal((await membership(db))[0].plan,'pro');assert.deepEqual(await membership(db,bob),[]);
  const original=(await membership(db))[0].paid_until;
  await paid(db,'paid','alice@example.test',90);assert.deepEqual((await membership(db))[0].paid_until,original);
  await db.query('select revoke_paid_order($1)',['paid']);assert.deepEqual(await membership(db),[]);
  await paid(db,'paid');assert.deepEqual(await membership(db),[]);
  await db.query('select revoke_paid_order($1)',['refund-first']);await paid(db,'refund-first');assert.deepEqual(await membership(db),[]);
  await paid(db,'renewal');assert.equal((await membership(db)).length,1);
  await db.query('select revoke_paid_order($1)',['paid']);assert.equal((await membership(db)).length,1);
  await db.exec(`update auth.users set email_confirmed_at=null where id='${alice}'`);assert.deepEqual(await membership(db),[]);
 }finally{await db.close();}
});
test('SQL: task updates are account-scoped and preserve other tasks; client roles cannot self-grant access',async()=>{
 const db=await setup();try{
  const tasks=JSON.stringify([{id:'a',completed:false},{id:'b',completed:false}]);
  await db.query('insert into workspaces(user_id,tasks) values($1,$2),($3,$2)',[alice,tasks,bob]);
  await db.query('select set_task_completed($1,$2,$3)',[alice,'a',true]);
  await db.query('select set_task_completed($1,$2,$3)',[alice,'b',true]);
  const rows=(await db.query('select * from workspaces order by user_id')).rows;
  assert.deepEqual(rows[0].tasks.map(t=>t.completed),[true,true]);assert.deepEqual(rows[1].tasks.map(t=>t.completed),[false,false]);
  for(let i=0;i<12;i++)assert.equal((await db.query('select consume_ai_request($1) as allowed',[alice])).rows[0].allowed,true);
  assert.equal((await db.query('select consume_ai_request($1) as allowed',[alice])).rows[0].allowed,false);
  for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select * from workspaces'),/permission denied/);await assert.rejects(db.query('select current_membership($1)',[alice]),/permission denied/);await assert.rejects(db.query("select record_paid_order('forged','alice@example.test',now(),now()+interval '1 month')"),/permission denied/);await db.exec('reset role');}
 }finally{await db.close();}
});
