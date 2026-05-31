// 03 — LLM extraction (teacher). Review text -> locked contract.
// Runs the local Ollama model over reviews.jsonl, writes labels.jsonl.
// Robust: JSON validation, one retry, fallback, incremental save + resume.
import fs from "fs";

const IN = "food-discovery/data/work/reviews.jsonl";
const OUT = "food-discovery/data/work/labels.jsonl";
const MODEL = process.env.MODEL || "llama3.2:3b";
const HOST = "http://localhost:11434";

const ASPECTS = ["food","service","ambiance","value","cleanliness","portion","wait","delivery"];
const SENT = new Set(["positive","negative","neutral"]);

const SYS = `You label Pakistani restaurant reviews. Reviews mix English and Roman Urdu (mazedar/lazeez=tasty, bakwas/bekar=bad, behtreen/zabardast=excellent, mehnga=expensive).
Return ONLY a JSON object with EXACTLY these keys:
{
 "relevant": true|false,                       // false if it says nothing about the food/restaurant experience
 "dishes": [{"dish":"<as written>","sentiment":"positive|negative|neutral"}],
 "aspects": [{"aspect":"food|service|ambiance|value|cleanliness|portion|wait|delivery","sentiment":"positive|negative|neutral"}],
 "tags": ["occasion:date|family|friends|business|solo|groups", "vibe:rooftop|outdoor|cozy|romantic|loud|view|aesthetic", "meal:breakfast|lunch|dinner|latenight|brunch|iftar|sehri", "value:cheap|midrange|expensive"],
 "hygiene_concern": true|false,                // true if dirty/unhygienic/food-poisoning mentioned
 "overall": "positive|negative|neutral"
}
Only include dishes/aspects/tags actually present. Empty arrays are fine. No commentary.`;

async function gen(text){
  const res = await fetch(`${HOST}/api/generate`, {method:"POST", body: JSON.stringify({
    model: MODEL, system: SYS, prompt: `Review: "${text.slice(0,600)}"`,
    stream:false, format:"json", options:{temperature:0, num_predict:400}
  })});
  const d = await res.json();
  return d.response;
}

function clean(obj){
  const out = { relevant: obj.relevant !== false, dishes:[], aspects:[], tags:[], hygiene_concern: !!obj.hygiene_concern,
    overall: SENT.has(obj.overall) ? obj.overall : "neutral" };
  for(const d of (Array.isArray(obj.dishes)?obj.dishes:[])){
    if(d && d.dish) out.dishes.push({ dish:String(d.dish).toLowerCase().trim(), sentiment: SENT.has(d.sentiment)?d.sentiment:"neutral" });
  }
  for(const a of (Array.isArray(obj.aspects)?obj.aspects:[])){
    if(a && ASPECTS.includes(a.aspect)) out.aspects.push({ aspect:a.aspect, sentiment: SENT.has(a.sentiment)?a.sentiment:"neutral" });
  }
  for(const t of (Array.isArray(obj.tags)?obj.tags:[])) if(typeof t==="string" && t.includes(":")) out.tags.push(t.toLowerCase());
  return out;
}

async function label(text){
  for(let attempt=0; attempt<2; attempt++){
    try { return clean(JSON.parse(await gen(text))); } catch(e){ if(attempt===1) return null; }
  }
}

const reviews = fs.readFileSync(IN,"utf8").trim().split("\n").filter(Boolean).map(l=>JSON.parse(l));
const done = new Set();
if(fs.existsSync(OUT)) for(const l of fs.readFileSync(OUT,"utf8").trim().split("\n").filter(Boolean)){ try{done.add(JSON.parse(l).review_id);}catch{} }
const fd = fs.openSync(OUT, "a");

console.log(`=== extract === model=${MODEL} reviews=${reviews.length} already=${done.size}`);
let ok=0, fb=0, t0=Date.now();
for(let i=0;i<reviews.length;i++){
  const r = reviews[i];
  if(done.has(r.review_id)) continue;
  let lab = await label(r.text);
  if(!lab){ fb++; lab = {relevant:true,dishes:[],aspects:[],tags:[],hygiene_concern:false,overall:"neutral",_fallback:true}; } else ok++;
  fs.writeSync(fd, JSON.stringify({ review_id:r.review_id, branch_id:r.branch_id, brand_key:r.brand_key, city:r.city, stars:r.stars, ...lab })+"\n");
  if((i+1)%20===0) console.log(`  ${i+1}/${reviews.length}  ok=${ok} fallback=${fb}  ${((Date.now()-t0)/(i+1)/1000).toFixed(2)}s/rev`);
}
fs.closeSync(fd);
console.log(`done: ok=${ok} fallback=${fb} total_out=${ok+fb+done.size}  elapsed=${((Date.now()-t0)/1000).toFixed(0)}s`);
