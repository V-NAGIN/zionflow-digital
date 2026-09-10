(() => {
 const form=document.getElementById('brief-form');
 const status=document.getElementById('brief-status');
 function values(){
  for(const field of form.querySelectorAll('[required]'))field.setCustomValidity(field.value.trim()?'':'Please complete this field.');
  if(!form.reportValidity())return null;
  return Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
 }
 form.addEventListener('input',event=>event.target.setCustomValidity?.(''));
 for(const button of document.querySelectorAll('[data-service]'))button.onclick=()=>{
  document.getElementById('service').value=button.dataset.service;
  document.getElementById('brief').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 form.onsubmit=event=>{
  event.preventDefault();const d=values();if(!d)return;
  const message=`Hi ZionFlow 👋\n\nI’d like help with a project.\n\nBusiness: ${d.business}\nService: ${d.service}\nWhat I want to achieve: ${d.goal}${d.timeframe?'\nTimeframe: '+d.timeframe:''}\n\nI completed the project brief on the ZionFlow website and I’d like to discuss the next steps.`;
  const link=document.createElement('a');link.href='https://api.whatsapp.com/send/?phone=27833110552&text='+encodeURIComponent(message);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open your prepared WhatsApp message';
  status.replaceChildren(document.createTextNode('Review your message in WhatsApp, then press Send. If it did not open, '),link,document.createTextNode('.'));
  link.click();
 };
 document.getElementById('download-brief').onclick=()=>{
  const d=values();if(!d)return;
  const brief=`ZIONFLOW PROJECT BRIEF\n\nBusiness: ${d.business}\nService: ${d.service}\n\nGoal:\n${d.goal}${d.timeframe?'\n\nTimeframe: '+d.timeframe:''}\n\nPrepared locally. Not submitted to ZionFlow.\n`;
  const url=URL.createObjectURL(new Blob([brief],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='zionflow-project-brief.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Your copy is ready. To contact our team, send your brief on WhatsApp.';
 };
})();
