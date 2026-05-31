// 02 — Entity resolution + offer join.
// Match scraped brands/branches to Konsacard offers.json, attach offers at
// scope = 'branch' (matched by proximity) or 'brand' (fan-out default).
//
// In:  data/work/entities.json, apps/web/data/offers.json
// Out: data/work/entities_offers.json
import fs from "fs";

const ENT = "food-discovery/data/work/entities.json";
const OFFERS = "apps/web/data/offers.json";
const OUT = "food-discovery/data/work/entities_offers.json";
const BRANCH_KM = 0.7; // proximity to call an offer branch-scoped

const STOP = new Set(["restaurant","cafe","café","the","and","kitchen","foods","food","grill","bbq","co","pvt","ltd","branch","house"]);
function norm(s){ return (s||"").toLowerCase().replace(/[’'`.]/g,"").replace(/[^a-z0-9]+/g," ").trim(); }
function tokens(s){ return norm(s).split(/\s+/).filter(t=>t && !STOP.has(t)); }
function jaccard(a,b){ const A=new Set(a),B=new Set(b); if(!A.size||!B.size) return 0; let i=0; for(const x of A) if(B.has(x)) i++; return i/(A.size+B.size-i); }
function haversine(a,b,c,d){ if([a,b,c,d].some(v=>v==null))return 1e9; const R=6371,r=Math.PI/180; const dla=(c-a)*r,dlo=(d-b)*r; const x=Math.sin(dla/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dlo/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }

const entities = JSON.parse(fs.readFileSync(ENT,"utf8"));
const offers = (JSON.parse(fs.readFileSync(OFFERS,"utf8")).offers)||[];

// group Konsacard offers by restaurant
const byRest = {};
for(const o of offers){ (byRest[o.restaurant] ||= {name:o.restaurant, rows:[]}).rows.push(o); }
const restIndex = Object.values(byRest).map(r=>({ ...r, key:norm(r.name), toks:tokens(r.name),
  cities:[...new Set(r.rows.map(x=>x.city))] }));

function matchRestaurant(brandName, cities){
  const bt = tokens(brandName), bn = norm(brandName);
  let best=null, bestScore=0;
  for(const r of restIndex){
    if(r.key===bn){ return {r, score:1, how:"exact"}; }
    let s = jaccard(bt, r.toks);
    if(bn && r.key && (bn.includes(r.key)||r.key.includes(bn))) s = Math.max(s, 0.8);
    // small bonus if cities overlap
    if(cities.some(c=>r.cities.includes(c))) s += 0.05;
    if(s>bestScore){ bestScore=s; best=r; }
  }
  return bestScore>=0.5 ? {r:best, score:+bestScore.toFixed(2), how:"fuzzy"} : null;
}

function offerSummary(o){ return {
  bank:o.bank, card:o.card, cardCategory:o.cardCategory,
  discountPct:o.discountPct, discountLabel:o.discountLabel, offerTitle:o.offerTitle,
  days:o.days, orderTypes:o.orderTypes, capPkr:o.capPkr,
  lat:o.sourceLat??null, lng:o.sourceLng??null, address:o.sourceAddress||null,
}; }

let matched=0, totalBrands=0;
for(const [bk,e] of Object.entries(entities)){
  totalBrands++;
  const cities=[...new Set(e.branches.map(b=>b.city))];
  const m = matchRestaurant(e.brand, cities);
  e.offer_match = m ? {restaurant:m.r.name, score:m.score, how:m.how, offer_rows:m.r.rows.length} : null;
  e.brand_offers = [];
  for(const b of e.branches) b.applicable_offers = [];
  if(!m){ continue; }
  matched++;

  const rows = m.r.rows.map(offerSummary);
  // dedup brand-level offer list by bank|card|discount
  const seen=new Set();
  for(const o of rows){ const k=`${o.bank}|${o.card}|${o.discountPct}`; if(!seen.has(k)){seen.add(k); e.brand_offers.push(o);} }

  // scope each offer row: branch if it sits near a scraped branch, else brand fan-out
  for(const o of rows){
    let placed=false;
    if(o.lat!=null && o.lng!=null){
      for(const b of e.branches){
        if(haversine(o.lat,o.lng,b.lat,b.lng) <= BRANCH_KM){
          b.applicable_offers.push({...o, scope:"branch"}); placed=true;
        }
      }
    }
    if(!placed){ // brand fan-out: applies to all branches
      for(const b of e.branches) b.applicable_offers.push({...o, scope:"brand"});
    }
  }
  // dedup per-branch
  for(const b of e.branches){
    const s=new Set(); b.applicable_offers = b.applicable_offers.filter(o=>{const k=`${o.bank}|${o.card}|${o.discountPct}|${o.scope}`; if(s.has(k))return false; s.add(k); return true;});
    // best discount for quick ranking use
    b.best_offer = b.applicable_offers.slice().sort((x,y)=>(y.discountPct||0)-(x.discountPct||0))[0]||null;
  }
}

fs.writeFileSync(OUT, JSON.stringify(entities,null,1));
console.log("=== resolve_offers ===");
console.log(`brands: ${totalBrands} | matched to Konsacard offers: ${matched}`);
const examples = Object.values(entities).filter(e=>e.offer_match).slice(0,8)
  .map(e=>`  ${e.brand} -> ${e.offer_match.restaurant} (${e.offer_match.how} ${e.offer_match.score}), ${e.brand_offers.length} offers`);
console.log("sample matches:\n"+examples.join("\n"));
const scopes = {branch:0,brand:0};
for(const e of Object.values(entities)) for(const b of e.branches) for(const o of (b.applicable_offers||[])) scopes[o.scope]++;
console.log("offer placements by scope:", scopes);
