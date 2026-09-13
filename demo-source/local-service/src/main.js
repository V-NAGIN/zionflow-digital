import {site} from './site.config.js';
import {contactURL} from './render.js';
const $ = s => document.querySelector(s);
const menu=$('.menu-toggle');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#navigation').classList.toggle('open',open);});
$('#navigation').addEventListener('click',e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');$('#navigation').classList.remove('open');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && menu.getAttribute('aria-expanded')==='true'){menu.click();menu.focus();}});
for(const link of document.querySelectorAll('[data-service]'))link.addEventListener('click',()=>{$('#service').value=link.dataset.service;});
for(const button of document.querySelectorAll('[data-detail]'))button.addEventListener('click',()=>{for(const item of document.querySelectorAll('[data-detail]')){const selected=item.dataset.detail===button.dataset.detail;item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));}});
function showArea(value){$('#area-result').textContent=value==='other'?'Outside these example areas? Add your suburb to the enquiry below.':`${value} is included in this example service area. Add your project below to try the enquiry.`;$('#location').value=value==='other'?'':value;}
$('#area-form').addEventListener('submit',e=>{e.preventDefault();showArea($('#suburb').value);});
for(const b of document.querySelectorAll('[data-area]'))b.addEventListener('click',()=>{$('#suburb').value=b.dataset.area;showArea(b.dataset.area);});
const dialog=$('#result-dialog');let enquiry='';
function showDialog(title,message,summary=''){$('#dialog-title').textContent=title;$('#dialog-message').textContent=message;$('#enquiry-summary').textContent=summary;$('#enquiry-summary').hidden=!summary;$('#download-enquiry').hidden=!summary;$('#send-whatsapp').hidden=true;dialog.showModal();}
for(const b of document.querySelectorAll('.dialog-close,.dialog-close-text'))b.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
for(const a of document.querySelectorAll('[data-contact]'))a.addEventListener('click',e=>{e.preventDefault();showDialog('Try the enquiry experience.',`This is a fictional demonstration business. ${a.dataset.contact==='phone'?'Calling':'WhatsApp'} becomes available when a verified business number is added. You can explore the quote form without sending any information.`);});
$('#demo-info').addEventListener('click',()=>showDialog('A concept with possibilities.','FORGE is a fictional brand created by ZionFlow to demonstrate a premium local-service website. Imagery is AI-generated; testimonials, project descriptions and service areas are illustrative. This preview uses no analytics, cookies or form backend. Form details remain in this tab unless you choose to download them. No enquiry is submitted.'));
$('#quote-form').addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(e.target);for(const id of ['name','location','message']){$('#'+id).setCustomValidity(String(data.get(id)).trim()?'':'Please add a little detail.');}const contact=String(data.get('contact')).trim();
 const validContact=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)||/^\+?[\d\s()-]{7,25}$/.test(contact)&&contact.replace(/\D/g,'').length>=7;
 $('#contact').setCustomValidity(validContact?'':'Please enter an email address or phone number.');if(!e.target.reportValidity())return;
 const selected=site.services.find(s=>s.id===data.get('service'))?.name||'Something else';
 enquiry=`${site.brand} — ${site.demo?'DEMO ENQUIRY (NOT SENT)':'ENQUIRY'}\n\nName: ${String(data.get('name')).trim()}\nContact: ${contact}\nService: ${selected}\nSuburb: ${String(data.get('location')).trim()}\n\nProject:\n${String(data.get('message')).trim()}`;
 showDialog('Your enquiry, ready to review.',site.demo?'Demo complete. Nothing has been sent or stored. You can save a copy of this enquiry to your device.':'Nothing has been sent yet. Save a copy, or continue to WhatsApp to review and send it.',enquiry);
 if(!site.demo && contactURL('whatsapp')!=='#quote'){$('#send-whatsapp').href=`${contactURL('whatsapp')}?text=${encodeURIComponent(enquiry)}`;$('#send-whatsapp').hidden=false;}
});
for(const id of ['name','location','message','contact'])$('#'+id).addEventListener('input',()=>$('#'+id).setCustomValidity(''));
$('#download-enquiry').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([enquiry],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='project-enquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
// A small transform provides depth without a 3D dependency, canvas or continuous render loop.
const hero=$('.hero');
if(matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches){
 let frame;hero.addEventListener('pointermove',e=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--shift-x',`${(e.clientX-r.left-r.width/2)*.009}px`);hero.style.setProperty('--shift-y',`${(e.clientY-r.top-r.height/2)*.006}px`);});});
 hero.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);hero.style.setProperty('--shift-x','0px');hero.style.setProperty('--shift-y','0px');});
}
