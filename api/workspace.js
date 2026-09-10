const crypto = require('node:crypto');
const CATEGORIES = ['WhatsApp & Customer Communication','Social Media Visibility','Website & Digital Presence','Social Media Visibility','Local Visibility','Content & Consistency','Leads & Follow-Up','Customer Journey'];
const ACTIONS = [
  'Complete your WhatsApp Business profile and add a clear enquiry link.',
  'Update your social profile with a clear offer and contact action.',
  'Review your website on mobile and make the next step easy to find.',
  'Update your Facebook profile with a clear offer and contact action.',
  'Claim or update your Google Business Profile with accurate business details.',
  'Plan three useful posts that answer your customers’ common questions.',
  'Write a simple follow-up message for new enquiries.',
  'Make the path from your content to an enquiry clear and easy to follow.'
];
function configured() { return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY); }
function active(e, now=Date.now()) { return e && e.plan === 'pro' && e.status === 'active' && Number.isFinite(Date.parse(e.paid_until)) && Date.parse(e.paid_until) > now; }
async function db(path, options={}) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: {apikey:process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', ...options.headers}, signal:AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Account storage unavailable');
  const body = await response.text();
  return body.trim() ? JSON.parse(body) : null;
}
async function identity(req,res,next) {
  res.set('Cache-Control','no-store');
  if (!configured()) return res.status(503).json({success:false,error:'Account services are not connected yet.',code:'NOT_CONFIGURED'});
  const token = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(req.headers.authorization || '')?.[1];
  if (!token) return res.status(401).json({success:false,error:'Please sign in.',code:'SIGN_IN'});
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
    if (!response.ok) return res.status(401).json({success:false,error:'Please sign in again.',code:'SIGN_IN'});
    const user = await response.json();
    // Decode claims only AFTER the identity provider has authenticated this exact token.
    const claims = JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
    if (!user.id || claims.sub !== user.id || claims.exp * 1000 <= Date.now()) return res.status(401).json({success:false,code:'SIGN_IN'});
    if (!user.email_confirmed_at || claims.aal !== 'aal2') return res.status(403).json({success:false,error:'Verify your email and authenticator code.',code:'MFA_REQUIRED'});
    req.account = {id:user.id,email:user.email}; next();
  } catch { return res.status(503).json({success:false,error:'Unable to verify your account. Please try again.'}); }
}
async function entitlement(req,res,next) {
  try {
    const rows = await db('rpc/current_membership',{method:'POST',body:JSON.stringify({account_id:req.account.id})});
    if (!active(rows[0])) return res.status(402).json({success:false,error:'An active Growth Pro subscription is required.',code:'SUBSCRIPTION_REQUIRED'});
    req.membership = rows[0]; next();
  } catch { res.status(503).json({success:false,error:'Unable to verify your membership.'}); }
}
function mount(app) {
  app.get('/api/config',(req,res)=>res.json({configured:configured(),authUrl:process.env.SUPABASE_URL || '',authKey:process.env.SUPABASE_ANON_KEY || ''}));
  app.get('/api/workspace',identity,entitlement,async(req,res)=>{
    try { const rows=await db(`workspaces?user_id=eq.${encodeURIComponent(req.account.id)}&select=profile,assessment,tasks`); res.json({success:true,email:req.account.email,membership:req.membership,...(rows[0] || {profile:{},assessment:null,tasks:[]})}); }
    catch {res.status(503).json({success:false,error:'Your workspace could not be loaded.'});}
  });
  app.put('/api/profile',identity,entitlement,async(req,res)=>{
    const profile={};
    for(const field of ['businessName','industry','idealCustomer','productsServices','biggestProblem']) {
      if(typeof req.body?.[field] !== 'string' || req.body[field].length > 1500) return res.status(400).json({success:false,error:'Please check your profile fields.'});
      profile[field]=req.body[field].trim();
    }
    try {await db('workspaces?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:req.account.id,profile})});res.json({success:true});}
    catch {res.status(503).json({success:false,error:'Your profile was not saved. Please try again.'});}
  });
  app.post('/api/assessment',identity,entitlement,async(req,res)=>{
    const {answers}=req.body || {};
    if(!Array.isArray(answers)||answers.length!==8||!answers.every(n=>Number.isInteger(n)&&n>=0&&n<=3)) return res.status(400).json({success:false,error:'Complete all eight assessment questions.'});
    const points=[10,7,4,1];
    const areas=answers.map((answer,i)=>({name:CATEGORIES[i],score:points[answer]}));
    const assessment={score:areas.reduce((s,a)=>s+a.score,0),areas,completedAt:new Date().toISOString()};
    const tasks=areas.map((a,i)=>({...a,index:i})).sort((a,b)=>a.score-b.score).slice(0,3).map(a=>({id:crypto.randomUUID(),title:ACTIONS[a.index],area:a.name,completed:false}));
    try {await db('workspaces?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:req.account.id,assessment,tasks})});res.json({success:true});}
    catch {res.status(503).json({success:false,error:'Your assessment was not saved. Please try again.'});}
  });
  app.patch('/api/tasks/:id',identity,entitlement,async(req,res)=>{
    if(typeof req.body?.completed!=='boolean')return res.status(400).json({success:false,error:'Invalid task status.'});
    try {await db('rpc/set_task_completed',{method:'POST',body:JSON.stringify({account_id:req.account.id,task_id:req.params.id,done:req.body.completed})});res.json({success:true});}
    catch {res.status(503).json({success:false,error:'Your task was not saved. Please try again.'});}
  });
}
module.exports={mount,identity,entitlement,active,db};
