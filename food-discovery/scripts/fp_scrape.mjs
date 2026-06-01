// Foodpanda (Pakistan) scraper — JSON API, no browser.
// Pulls the vendor listing for a location, then each vendor's full menu + prices.
//
// Usage:
//   node fp_scrape.mjs --lat 24.8138 --lng 67.0300 --limit 10 [--q biryani] [--out path]
// Endpoints:
//   listing: disco.deliveryhero.io/listing/api/v1/pandora/vendors
//   menu:    pk.fd-api.com/api/v5/vendors/{code}?include=menus
import fs from "fs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const args = Object.fromEntries(process.argv.slice(2).reduce((a,v,i,arr)=> v.startsWith("--")?[...a,[v.slice(2),arr[i+1]]]:a,[]));
const LAT = +(args.lat ?? 24.8138), LNG = +(args.lng ?? 67.0300);
const LIMIT = +(args.limit ?? 10), Q = args.q || null;
const OUT = args.out || "food-discovery/data/raw/foodpanda.jsonl";
const PAGE = 48, DELAY = 400;

const sleep = ms => new Promise(r=>setTimeout(r,ms));
const perseus = () => `${Date.now()}.${Math.floor(Math.random()*1e18)}.${Math.random().toString(36).slice(2,12)}`;
const baseHeaders = () => ({ "User-Agent":UA, "Accept":"application/json",
  "x-fp-api-key":"volo", "x-disco-client-id":"web",
  "Perseus-Client-Id":perseus(), "Perseus-Session-Id":perseus(), "dps-session-id":perseus() });

async function getJSON(url, tries=3){
  for(let t=0;t<tries;t++){
    try{ const r=await fetch(url,{headers:baseHeaders()}); if(r.status===200) return await r.json();
      if(r.status===429||r.status>=500){ await sleep(1000*(t+1)); continue; } return {__err:r.status}; }
    catch(e){ if(t===tries-1) return {__err:e.message}; await sleep(800*(t+1)); }
  }
  return {__err:"retries_exhausted"};
}

async function listVendors(){
  const out=[]; let offset=0;
  while(out.length<LIMIT){
    const u=new URL("https://disco.deliveryhero.io/listing/api/v1/pandora/vendors");
    Object.entries({longitude:LNG, latitude:LAT, language_id:1, include:"characteristics",
      dynamic_pricing:0, configuration:"Variant1", country:"pk", customer_type:"regular",
      limit:PAGE, offset, vertical:"restaurants", ...(Q?{q:Q}:{})}).forEach(([k,v])=>u.searchParams.set(k,v));
    const j=await getJSON(u.toString());
    const items=j?.data?.items; if(!items||!items.length) break;
    out.push(...items); offset+=PAGE; await sleep(DELAY);
    if(items.length<PAGE) break;
  }
  return out.slice(0,LIMIT);
}

function parseMenu(v){
  const out=[];
  for(const m of (v.menus||[])) for(const c of (m.menu_categories||[])) for(const p of (c.products||[])){
    const variations=(p.product_variations||[]).map(x=>({name:x.name||null, price:x.price??null, original:x.original_price??null}));
    const best=variations[0]||{};
    out.push({ category:c.name, name:p.name, description:p.description||null,
      price:best.price??null, original_price:best.original??null,
      variations: variations.length>1?variations:undefined });
  }
  return out;
}

async function getMenu(code){
  const u=`https://pk.fd-api.com/api/v5/vendors/${code}?include=menus&language_id=1&opening_type=delivery&basket_currency=PKR`;
  const j=await getJSON(u);
  if(j.__err) return {__err:j.__err};
  const v=j.data;
  return {
    foodpanda_id:v.id, code:v.code, name:v.name, chain:v.chain?.name||null,
    address:v.address||null, area:v.address_line2||null, city:v.city?.name||null,
    lat:v.latitude??null, lng:v.longitude??null,
    cuisines:(v.cuisines||[]).map(c=>c.name), rating:v.rating??null, review_number:v.review_number??null,
    min_order:v.minimum_order_amount??null, menu:parseMenu(v),
  };
}

console.log(`=== foodpanda scrape === loc=${LAT},${LNG} limit=${LIMIT}${Q?` q="${Q}"`:""}`);
const vendors = await listVendors();
console.log(`listing: ${vendors.length} vendors`);
const fd = fs.openSync(OUT,"w");
let ok=0, err=0, totalItems=0;
for(let i=0;i<vendors.length;i++){
  const lv=vendors[i]; const code=lv.code;
  const m=await getMenu(code);
  if(m.__err){ err++; console.log(`  ✗ ${lv.name} (${code}) -> ${m.__err}`); }
  else { ok++; totalItems+=m.menu.length;
    fs.writeSync(fd, JSON.stringify({...m, listing_rating:lv.rating, listing_chain:lv.chain?.name})+"\n");
    console.log(`  ✓ ${m.name} | ${m.cuisines.join(",")} | ${m.rating}★/${m.review_number} | ${m.menu.length} items`);
  }
  await sleep(DELAY);
}
fs.closeSync(fd);
console.log(`\ndone: ${ok} vendors with menus, ${err} errors, ${totalItems} total menu items -> ${OUT}`);
