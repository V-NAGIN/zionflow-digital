// Keep the public support link away from actionable content, including form fields.
(() => {
 const link=document.querySelector('.zion-support');if(!link)return;
 let pending=false;
 function update(){
  pending=false;
  if(document.activeElement===link)return;
  link.hidden=false;
  const r=link.getBoundingClientRect();
  // Reserve the expanded desktop label's footprint as well as the icon.
  const left=r.right-(matchMedia('(min-width:761px)').matches?230:52);
  link.hidden=[...document.querySelectorAll('button,input,select,textarea,a:not(.zion-support)')].some(el=>{
   const b=el.getBoundingClientRect();
   return b.width>0&&b.height>0&&b.right>left-8&&b.left<r.right+8&&b.bottom>r.top-8&&b.top<r.bottom+8;
  })||Boolean(document.activeElement?.closest('form'));
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
 for(const event of ['scroll','resize','focusin','focusout'])window.addEventListener(event,schedule,{passive:true});
 new ResizeObserver(schedule).observe(document.body);
 update();
})();
