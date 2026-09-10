// Startup diagnostics run inside the hosting environment. Never log credentials,
// customer rows, provider error bodies, or request headers.
async function verify() {
 const result={database:'unavailable',gemini:'unavailable',model:process.env.GEMINI_MODEL||'gemini-3.6-flash'};
 try {await require('./workspace').db('workspaces?select=user_id&limit=0');result.database='ready';}catch{}
 if(process.env.GEMINI_API_KEY){
  try {
   const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.timeout(10000)});
   if(response.ok){const data=await response.json();const available=(data.models||[]).filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace(/^models\//,''));result.gemini=available.includes(result.model)?'model available':'model unavailable';if(result.gemini==='model unavailable')result.availableModels=available;}
   else result.gemini='provider HTTP '+response.status;
  }catch{}
 }
 return result;
}
module.exports={verify};
