// Ambient perspective geometry. No libraries, remote assets or account data.
// Motion is optional and pauses whenever the document is hidden.
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)');
const surfaces=document.querySelectorAll('.hero,.auth-brand,.score-card,.welcome-card');
for(const surface of surfaces){
 surface.classList.add('depth-surface');
 const canvas=document.createElement('canvas');canvas.className='zion-depth';canvas.setAttribute('aria-hidden','true');surface.prepend(canvas);
 const ctx=canvas.getContext('2d');if(!ctx)continue;
 let width=0,height=0,visible=false,frame=0,t=0,last=0;
 function resize(){const rect=surface.getBoundingClientRect();width=rect.width;height=rect.height;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
 function draw(){ctx.clearRect(0,0,width,height);if(!width||!height)return;const horizon=height*.40;const center=width*.72;const shift=Math.sin(t*.12)*width*.025;ctx.lineWidth=.7;
  for(let i=-9;i<=9;i++){ctx.beginPath();ctx.moveTo(center+shift+i*8,horizon);ctx.lineTo(center+i*width*.18,height*1.15);ctx.strokeStyle='rgba(215,181,108,.16)';ctx.stroke();}
  for(let j=1;j<12;j++){const p=((j+t*.13)%12)/12;const y=horizon+(height-horizon)*p*p;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.strokeStyle=`rgba(215,181,108,${p*.17})`;ctx.stroke();}
  const glow=ctx.createRadialGradient(center+shift,horizon,0,center,horizon,width*.55);glow.addColorStop(0,'rgba(215,181,108,.11)');glow.addColorStop(.45,'rgba(86,126,171,.05)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 }
 function loop(now){frame=0;if(!visible||document.hidden||reduce.matches||coarse.matches)return;if(now-last>45){t+=Math.min((now-last)/1000,.1);last=now;draw();}frame=requestAnimationFrame(loop);}
 function sync(){if(frame)cancelAnimationFrame(frame);frame=0;draw();if(visible&&!document.hidden&&!reduce.matches&&!coarse.matches){last=performance.now();frame=requestAnimationFrame(loop);}}
 new ResizeObserver(resize).observe(surface);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(surface);document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);coarse.addEventListener('change',sync);
}
for(const card of document.querySelectorAll('.score-card,.price-card.featured')){
 card.classList.add('depth-card');card.style.position='relative';
 card.addEventListener('pointermove',event=>{if(reduce.matches||coarse.matches||event.pointerType==='touch')return;const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;card.style.setProperty('--rx',`${(y-.5)*-3}deg`);card.style.setProperty('--ry',`${(x-.5)*3}deg`);card.style.setProperty('--light-x',`${x*100}%`);card.style.setProperty('--light-y',`${y*100}%`);});
 card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');});
}
