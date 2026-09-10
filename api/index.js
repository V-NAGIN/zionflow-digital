const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env")
});

const app = express();
const workspace = require("./workspace");
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// Gemini AI
// --------------------------------------------------

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = gemini.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash"
});

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors({
  origin: [
    "https://app.zionflow.co.za",
    "https://zionflow.co.za",
    "https://www.zionflow.co.za"
  ]
}));

require("./billing").mount(app, express);
app.use(express.json({ limit: "1mb" }));
app.use((req,res,next)=>{res.set("X-Content-Type-Options","nosniff");res.set("Referrer-Policy","strict-origin-when-cross-origin");if(req.path.startsWith("/api/"))res.set("Cache-Control","no-store");next();});
workspace.mount(app);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ZionFlow API",
    status: "online",
    version: "2.0.0"
  });
});

// --------------------------------------------------
// AI Growth Assistant
// --------------------------------------------------

app.post("/api/ai", workspace.identity, workspace.entitlement, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (typeof message !== 'string' || message.length > 4000) return res.status(400).json({success:false,error:'Please keep your question under 4,000 characters.'});
    const rows = await workspace.db('workspaces?user_id=eq.' + encodeURIComponent(req.account.id) + '&select=profile,assessment,tasks');
    const businessProfile = rows[0]?.profile || {};
    const currentPlan = JSON.stringify(rows[0]?.assessment || {});
    const currentTask = JSON.stringify(rows[0]?.tasks || []);

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "A message is required."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "AI service is not configured."
      });
    }

    const allowed = await workspace.db('rpc/consume_ai_request',{method:'POST',body:JSON.stringify({account_id:req.account.id})});
    if(!allowed) return res.status(429).json({success:false,error:'Please wait a minute before sending another question.'});
    const profile = businessProfile || {};

    const businessContext = `
BUSINESS PROFILE

Business name: ${profile.businessName || "Not provided"}
Industry: ${profile.industry || "Not provided"}
Location/market: ${profile.location || "Not provided"}
Products/services: ${profile.productsServices || "Not provided"}
Target customer: ${profile.idealCustomer || "Not provided"}
Business stage: ${profile.businessStage || "Not provided"}
Goals: ${profile.goals || "Not provided"}
Marketing budget: ${profile.marketingBudget || "Not provided"}
Website: ${profile.website || "Not provided"}
Marketing channels: ${profile.marketingChannels || "Not provided"}
Biggest growth problem: ${profile.biggestProblem || "Not provided"}

CURRENT GROWTH PLAN

${currentPlan || "Not provided"}

CURRENT TASK

${currentTask || "Not provided"}
`;

    const prompt = `
You are ZionFlow AI Growth Assistant.

ZionFlow helps businesses build, grow and scale through practical
strategy, marketing guidance, content planning, lead generation,
offer optimisation and business growth tools.

Your job is to give useful, practical and personalized advice based
on the business context provided.

IMPORTANT RULES:

- Never guarantee revenue, customers or business results.
- Do not give generic advice when the business context allows
  a more specific recommendation.
- Prioritize the highest-impact actions.
- Keep recommendations realistic for the business's resources
  and marketing budget.
- Give clear next steps the owner can actually complete.
- Help with marketing, content, offers, lead generation, customer
  journeys, websites, social media and business strategy.
- If information is missing, make a reasonable assumption and
  clearly state it rather than inventing specific facts.
- Be concise but useful.
- Speak like a knowledgeable growth strategist working alongside
  the business owner.

${businessContext}

USER REQUEST:

${message}
`;
console.log("ZionFlow: sending request to Gemini...");
    const result = await model.generateContent(prompt);

    const answer = result.response.text();

    return res.json({
      success: true,
      answer
    });

  } catch (error) {
    console.error("ZionFlow AI request failed", { status: error.status || 500 });

    return res.status(500).json({
      success: false,
      error: "The AI assistant could not process your request."
    });
  }
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

// Explicit public directories only: never serve .env, API source, or node_modules.
const path = require("node:path");
for (const dir of ["assets", "growth-pro", "app", "services"]) app.use("/" + dir, express.static(path.join(__dirname,"..",dir), {dotfiles:"deny"}));
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"..","index.html")));
// Never expose parser errors or development stack traces to API clients.
app.use((error,req,res,next)=>{
  if(res.headersSent)return next(error);
  const status=error.type==='entity.too.large'?413:error.type==='entity.parse.failed'?400:503;
  res.status(status).json({success:false,error:status===413?'The request is too large.':status===400?'Please send a valid request.':'The service is temporarily unavailable.'});
});
app.listen(PORT, () => {
  console.log(`ZionFlow API running on port ${PORT}`);
  if(process.env.RENDER==='true')require('./verify-services').verify().then(result=>console.log('ZionFlow service check',JSON.stringify(result))).catch(()=>{});
});
