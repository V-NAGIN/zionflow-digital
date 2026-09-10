const createClient = window.supabase?.createClient;
const $ = id => document.getElementById(id);
const base = (window.ZIONFLOW_CONFIG?.API_BASE || '').replace(/\/$/,'');
let auth, state, factor, signup=false, installPrompt, busy=false, recovering=false;
let accessEpoch=0, expiryTimer;
const message=(text,inside=false)=>{const el=$(inside?'app-message':'auth-message');el.textContent=text;el.hidden=!text;};
async function api(path,options={}) {
 const epoch=accessEpoch;
 const {data:{session}}=await auth.auth.getSession();
 const response=await fetch(base+path,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.access_token}`}:{})},signal:AbortSignal.timeout(path==='/api/ai'?60000:15000)});
 const data=await response.json().catch(()=>({error:'The service returned an unexpected response.'}));
 if(epoch!==accessEpoch){const e=new Error('Session changed.');e.code='SESSION_CHANGED';throw e;}
 if(!response.ok){const e=new Error(data.error||'Please try again.');e.code=data.code;e.status=response.status;if([401,402,403].includes(e.status))denyAccess(e);throw e;}return data;
}
function lock(){
 accessEpoch++;clearTimeout(expiryTimer);state=null;
 $('app').hidden=true;$('access').hidden=false;$('login-form').hidden=false;$('mfa-form').hidden=true;$('billing-gate').hidden=true;
 $('conversation').replaceChildren();$('profile-form').reset();$('question').value='';$('mfa-code').value='';$('mfa-qr').removeAttribute('src');$('mfa-qr').hidden=true;
 $('welcome').textContent='Your growth, in focus.';$('billing-summary').textContent='';$('assessed-at').textContent='';
 ['score','completed','completion','renewal'].forEach(id=>$(id).textContent='—');
 ['next-tasks','all-tasks','areas','progress-areas'].forEach(id=>$(id).replaceChildren());
}
function denyAccess(error){
 lock();
 if(error.status===402){$('login-form').hidden=true;$('billing-gate').hidden=false;message('Your membership is not active. Your saved work is retained.');}
 else message(error.message||'Please sign in again.');
}
function scheduleExpiry(){
 clearTimeout(expiryTimer);if(!state)return;
 const remaining=Date.parse(state.membership.paid_until)-Date.now();
 if(!Number.isFinite(remaining)||remaining<=0){denyAccess({status:402});return;}
 expiryTimer=setTimeout(scheduleExpiry,Math.min(remaining,2147483647));
}
async function gate(){
 if(recovering)return;
 try{
  const {data:{session}}=await auth.auth.getSession();if(!session){lock();return;}
  const {data,error}=await auth.auth.mfa.getAuthenticatorAssuranceLevel();if(error)throw error;
  if(data.currentLevel!=='aal2'){
   lock();$('login-form').hidden=true;$('mfa-form').hidden=false;$('billing-gate').hidden=true;
   const {data:factors,error:listError}=await auth.auth.mfa.listFactors();if(listError)throw listError;
   factor=factors.totp.find(f=>f.status==='verified')?.id;
   if(!factor){
    // Reuse a pending factor within this page rather than repeatedly enrolling it.
    const pending=(factors.all||[]).find(f=>f.factor_type==='totp'&&f.status==='unverified');if(pending){const {error}=await auth.auth.mfa.unenroll({factorId:pending.id});if(error)throw error;}
    const {data:enrolled,error:enrollError}=await auth.auth.mfa.enroll({factorType:'totp',friendlyName:'ZionFlow authenticator'});if(enrollError)throw enrollError;
    factor=enrolled.id;$('mfa-qr').src=enrolled.totp.qr_code;$('mfa-qr').hidden=false;$('mfa-description').textContent='Scan this code in your authenticator app, then enter its six-digit code. Keep your authenticator backed up securely.';
   }return;
  }
  $('mfa-form').hidden=true;state=await api('/api/workspace');$('access').hidden=true;$('app').hidden=false;message('');render();scheduleExpiry();
  const draft=localStorage.getItem('zionflow_assessment_draft');
  if(draft){try{const parsed=JSON.parse(draft);if(Array.isArray(parsed.answers)&&parsed.answers.length===8){await api('/api/assessment',{method:'POST',body:JSON.stringify({answers:parsed.answers})});localStorage.removeItem('zionflow_assessment_draft');state=await api('/api/workspace');render();}}catch{message('Your assessment has not been saved yet. Reconnect and try again.',true);}}
 }catch(e){if(e.code==='SESSION_CHANGED')return;if(e.code==='SUBSCRIPTION_REQUIRED'){lock();$('login-form').hidden=true;$('mfa-form').hidden=true;$('billing-gate').hidden=false;message('Your membership is not active. Your saved work is retained.');}else if(e.code==='SIGN_IN'){await auth.auth.signOut({scope:'local'});lock();$('login-form').hidden=false;message(e.message);}else{message(e.message,$('access').hidden);}}
}
function navigate(id){document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==id);document.querySelectorAll('.nav-button').forEach(b=>b.setAttribute('aria-current',b.dataset.page===id?'page':'false'));$('crumb').textContent={overview:'Overview',plan:'Growth plan',assistant:'AI assistant',progress:'Growth score',account:'Account & billing'}[id];$('rail').classList.remove('open');$('menu').setAttribute('aria-expanded','false');}
function tasks(target,limit=Infinity){const root=$(target);root.replaceChildren();const list=(state.tasks||[]).slice(0,limit);if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent='Your next actions appear after you complete the assessment.';root.append(p);return;}for(const task of list){const row=document.createElement('div');row.className='task';const input=document.createElement('input');input.type='checkbox';input.id=target+'-'+task.id;input.checked=task.completed;const label=document.createElement('label');label.htmlFor=input.id;label.textContent=task.title;const small=document.createElement('small');small.textContent=task.area;label.append(small);input.addEventListener('change',async()=>{input.disabled=true;try{await api('/api/tasks/'+encodeURIComponent(task.id),{method:'PATCH',body:JSON.stringify({completed:input.checked})});task.completed=input.checked;render();}catch(e){input.checked=task.completed;message(e.message,true);}finally{input.disabled=false;}});row.append(input,label);root.append(row);}}
function areas(target){const root=$(target);root.replaceChildren();if(!state.assessment){const p=document.createElement('p');p.className='empty';p.textContent='No assessment saved yet.';root.append(p);return;}for(const area of state.assessment.areas){const el=document.createElement('div');el.className='area';const top=document.createElement('div');top.className='area-label';const name=document.createElement('span');name.textContent=area.name;const number=document.createElement('span');number.textContent=area.score+'/10';top.append(name,number);const track=document.createElement('div');track.className='track';const fill=document.createElement('span');fill.style.width=Math.max(0,Math.min(100,area.score*10))+'%';track.append(fill);el.append(top,track);root.append(el);}}
function render(){if(!state)return;$('welcome').textContent=state.profile.businessName?state.profile.businessName+', in focus.':'Your growth, in focus.';$('account-label').textContent='My account';const score=state.assessment?.score;$('score').textContent=score??'—';$('score-dial').style.setProperty('--score',score==null?0:score/80*100);$('stage').textContent=score==null?'Start with clarity.':score>=65?'Strong foundations.':score>=48?'Momentum is building.':score>=30?'Room to grow.':'Build your foundation.';if(score!=null)$('score-caption').textContent='Focus on your lowest-scoring areas to strengthen your next steps.';const done=state.tasks.filter(t=>t.completed).length;$('completed').textContent=done+' / '+state.tasks.length;$('completion').textContent=state.tasks.length?Math.round(done/state.tasks.length*100)+'%':'—';$('renewal').textContent=new Date(state.membership.paid_until).toLocaleDateString('en-ZA',{day:'numeric',month:'short'});$('billing-summary').textContent='Paid access through '+new Date(state.membership.paid_until).toLocaleDateString('en-ZA')+'. Membership is checked whenever you use the workspace.';$('assessed-at').textContent=state.assessment?'Last assessed '+new Date(state.assessment.completedAt).toLocaleDateString('en-ZA'):'';tasks('next-tasks',3);tasks('all-tasks');areas('areas');areas('progress-areas');for(const element of $('profile-form').elements){if(element.name)element.value=state.profile[element.name]||'';}}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();$('login-submit').disabled=true;message('');try{const credentials={email:$('email').value.trim(),password:$('password').value};let result;if(recovering){result=await auth.auth.updateUser({password:credentials.password});}else{result=signup?await auth.auth.signUp({...credentials,options:{emailRedirectTo:location.origin+'/growth-pro/'}}):await auth.auth.signInWithPassword(credentials);}if(result.error)throw result.error;$('password').value='';if(signup&&!result.data.session){message('Check your email to confirm your account, then return to sign in.');}else{recovering=false;await gate();}}catch(e){message(e.message);}finally{$('login-submit').disabled=false;}});
$('signup').onclick=()=>{signup=!signup;$('auth-title').textContent=signup?'Your next chapter.':'Welcome back.';$('login-submit').textContent=signup?'Create account':'Sign in';$('signup').textContent=signup?'Already have an account?':'Create an account';$('password').autocomplete=signup?'new-password':'current-password';};
$('reset').onclick=async()=>{if(!$('email').reportValidity())return;try{const {error}=await auth.auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:location.origin+'/growth-pro/'});if(error)throw error;message('If an account exists, you’ll receive an email with the next steps.');}catch(e){message(e.message);}};
$('mfa-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const {error}=await auth.auth.mfa.challengeAndVerify({factorId:factor,code:$('mfa-code').value});if(error)throw error;$('mfa-code').value='';$('mfa-qr').removeAttribute('src');$('mfa-qr').hidden=true;await gate();}catch(e){message(e.message);}finally{button.disabled=false;}});
$('check-access').onclick=gate;
$('gate-logout').onclick=async()=>{const {error}=await auth.auth.signOut({scope:'local'});if(error){message(error.message);return;}lock();message('');};
for(const id of ['logout','logout-all'])$(id).onclick=async()=>{const {error}=await auth.auth.signOut({scope:id==='logout-all'?'global':'local'});if(error){message('Sign-out could not be completed. Please reconnect and retry.',true);return;}lock();$('login-form').hidden=false;$('billing-gate').hidden=true;};
$('profile-form').addEventListener('submit',async event=>{event.preventDefault();event.submitter.disabled=true;try{const profile=Object.fromEntries(new FormData(event.target));await api('/api/profile',{method:'PUT',body:JSON.stringify(profile)});state.profile=profile;message('Your business profile is saved.',true);render();}catch(e){message(e.message,true);}finally{event.submitter.disabled=false;}});
function chat(text,role){const el=document.createElement('div');el.className='message '+role;el.textContent=text;$('conversation').append(el);el.scrollIntoView({block:'nearest'});}
$('ai-form').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;const question=$('question').value.trim();if(!question)return;busy=true;$('ai-send').disabled=true;$('ai-send').textContent='Thinking…';$('conversation').querySelector('.empty')?.remove();chat(question,'user');try{const data=await api('/api/ai',{method:'POST',body:JSON.stringify({message:question})});chat(data.answer,'assistant');$('question').value='';}catch(e){chat('Your message could not be completed. '+e.message,'assistant');}finally{busy=false;$('ai-send').disabled=false;$('ai-send').textContent='Send ↗';}});
for(const button of document.querySelectorAll('[data-page]'))button.onclick=()=>navigate(button.dataset.page);
for(const button of document.querySelectorAll('[data-prompt]'))button.onclick=()=>{$('question').value=button.dataset.prompt;$('question').focus();};
$('menu').onclick=()=>{$('rail').classList.toggle('open');$('menu').setAttribute('aria-expanded',String($('rail').classList.contains('open')));};
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else{message('On iPhone or iPad, open Safari’s Share menu and choose Add to Home Screen. On a computer, use your browser’s Install app or Add to Dock option where supported.',true);}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('/growth-pro/sw.js').catch(()=>{});
try{if(!createClient)throw new Error('Sign-in could not load. Reload the page when your connection is available.');const response=await fetch(base+'/api/config',{cache:'no-store',signal:AbortSignal.timeout(10000)});const config=await response.json();if(!response.ok||!config.configured)throw new Error('Account services are being connected. Please return shortly.');auth=createClient(config.authUrl,config.authKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});auth.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')lock();if(event==='PASSWORD_RECOVERY'){recovering=true;$('email').value=session?.user?.email||'';$('auth-title').textContent='Set a new password';$('login-form').hidden=false;$('login-submit').textContent='Save new password';}});await gate();async function checkMembership(){if(!state)return;scheduleExpiry();if(!state)return;try{const latest=await api('/api/workspace');if(state){state.membership=latest.membership;scheduleExpiry();}}catch(e){if(state)message('Membership verification is temporarily unavailable. Reconnect to continue.',true);}}setInterval(checkMembership,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkMembership();});}catch(e){message(e.message);$('login-submit').disabled=true;$('signup').disabled=true;$('reset').disabled=true;}
