// Render the supported Markdown subset as DOM nodes, never provider HTML.
(function(root){
 function inline(parent,text){
  const pattern=/\*\*(.+?)\*\*|__(.+?)__|\*([^*\n]+)\*|`([^`]+)`/g;let start=0,m;
  while((m=pattern.exec(text))){parent.append(document.createTextNode(text.slice(start,m.index)));const el=document.createElement(m[1]||m[2]?'strong':m[3]?'em':'code');el.textContent=m[1]||m[2]||m[3]||m[4];parent.append(el);start=pattern.lastIndex;}
  parent.append(document.createTextNode(text.slice(start)));
 }
 function render(parent,text){
  parent.replaceChildren();let paragraph=[],list=null,listType='';
  const flush=()=>{if(paragraph.length){const p=document.createElement('p');inline(p,paragraph.join(' '));parent.append(p);paragraph=[];}};
  for(const raw of String(text).replace(/\r\n?/g,'\n').split('\n')){
   const line=raw.trim();if(!line){flush();list=null;continue;}
   if(/^([-*_])\1{1,}$/.test(line)){flush();list=null;parent.append(document.createElement('hr'));continue;}
   const heading=line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?$/);if(heading){flush();list=null;const h=document.createElement('h3');inline(h,heading[1]);parent.append(h);continue;}
   const item=line.match(/^(?:([-*+] )|(\d+)[.)]\s+)(.+)$/);if(item){flush();const type=item[2]?'ol':'ul';if(!list||listType!==type){list=document.createElement(type);if(item[2])list.start=Number(item[2]);parent.append(list);listType=type;}const li=document.createElement('li');inline(li,item[3]);list.append(li);continue;}
   list=null;paragraph.push(line);
  }flush();
 }
 root.ZionAnswer={render};
})(typeof window!=='undefined'?window:globalThis);
