// 01 — Build the review training set from the raw Google Maps scrape.
//
// Input:  food-discovery/data/raw/scrape.json   (one place per line, gosom JSON)
// Output: food-discovery/data/work/reviews.jsonl (sampled training reviews)
//         food-discovery/data/work/entities.json (brands -> branches, with metadata)
//
// Sampling goal: ~LATEST reviews, spread across DIFFERENT restaurants, per city.
import fs from "fs";

const RAW_DIR = "food-discovery/data/raw";
const OUT_REVIEWS = "food-discovery/data/work/reviews.jsonl";
const OUT_ENTITIES = "food-discovery/data/work/entities.json";

const PER_CITY = 80;        // target reviews per city
const PER_BRANCH_CAP = 8;   // max reviews from one branch (diversity)
const MIN_LEN = 40;         // skip trivially short reviews

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi"];

// --- brand normalization: collapse a branch title to its brand identity ---
function normalizeBrand(title) {
  let t = (title || "").trim();
  // drop everything after a " - " / " | " (usually the branch/area)
  t = t.split(/\s+[-|–]\s+/)[0];
  // strip trailing "Branch", area words, city names
  t = t.replace(/\b(branch|restaurant|cafe|café|kitchen|foods?|grill|bbq)\b\.?$/gi, "").trim();
  for (const c of CITIES) t = t.replace(new RegExp(`\\b${c}\\b`, "gi"), "").trim();
  t = t.replace(/[-|–,]+$/g, "").trim();
  return t || (title || "").trim();
}

function inferCity(place) {
  const hay = `${place.complete_address ? JSON.stringify(place.complete_address) : ""} ${place.address || ""}`;
  for (const c of CITIES) if (new RegExp(`\\b${c}\\b`, "i").test(hay)) return c === "Rawalpindi" ? "Islamabad" : c;
  // fall back to the search query (input_id often carries it)
  const q = `${place.input_id || ""}`;
  for (const c of CITIES) if (new RegExp(c, "i").test(q)) return c;
  return "Unknown";
}

function reviewText(r) { return (r.text_original || r.Description || "").trim().replace(/\s+/g, " "); }
function reviewTs(r) {
  if (r.posted_at_unix_micros) return Math.floor(Number(r.posted_at_unix_micros) / 1e6);
  if (r.published_at) { const t = Date.parse(r.published_at); if (!isNaN(t)) return Math.floor(t / 1000); }
  return 0;
}
function reviewStars(r) { return r.Rating || r.rating_float || (r.rating_scale && r.rating ? r.rating : null) || null; }

const lines = fs.readdirSync(RAW_DIR).filter(f => f.endsWith(".json"))
  .flatMap(f => fs.readFileSync(`${RAW_DIR}/${f}`, "utf8").trim().split("\n").filter(Boolean));
const brands = {};   // brandKey -> { name, branches: {branchId -> branchObj} }
const byCity = {};   // city -> [reviewRecord]
let reviewId = 0;

for (const ln of lines) {
  let place; try { place = JSON.parse(ln); } catch { continue; }
  const title = place.title;
  if (!title) continue;
  const city = inferCity(place);
  const brandName = normalizeBrand(title);
  const brandKey = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const branchId = place.place_id || place.cid || `${brandKey}-${title}`;

  // register brand + branch
  brands[brandKey] ||= { name: brandName, branches: {} };
  brands[brandKey].branches[branchId] ||= {
    branch_id: branchId,
    brand_key: brandKey,
    brand: brandName,
    title,
    city,
    place_id: place.place_id || null,
    lat: place.latitude ?? null,
    lng: place.longitude ?? place.longtitude ?? null,
    address: place.address || null,
    categories: place.categories || (place.category ? [place.category] : []),
    price_range: place.price_range || null,
    google_rating: place.review_rating ?? null,
    google_review_count: place.review_count ?? null,
    has_popular_times: !!place.popular_times,
    delivery: (place.order_online || []).map(o => o.source).filter(Boolean),
    review_pool: 0,
  };

  // collect reviews
  const revs = [...(place.user_reviews_extended || []), ...(place.user_reviews || [])];
  const seen = new Set();
  for (const r of revs) {
    const text = reviewText(r);
    if (text.length < MIN_LEN) continue;
    const key = text.slice(0, 80);
    if (seen.has(key)) continue; seen.add(key);
    (byCity[city] ||= []).push({
      _branchId: branchId, _brandKey: brandKey,
      brand: brandName, branch_title: title, city,
      stars: reviewStars(r), ts: reviewTs(r), text,
    });
    brands[brandKey].branches[branchId].review_pool++;
  }
}

// --- sample: per city, latest-first, round-robin across branches for diversity ---
const sampled = [];
for (const [city, pool] of Object.entries(byCity)) {
  if (city === "Unknown") continue;
  pool.sort((a, b) => b.ts - a.ts);                       // latest first
  const perBranch = {}; const picked = [];
  for (const r of pool) {
    perBranch[r._branchId] = (perBranch[r._branchId] || 0);
    if (perBranch[r._branchId] >= PER_BRANCH_CAP) continue;
    perBranch[r._branchId]++; picked.push(r);
    if (picked.length >= PER_CITY) break;
  }
  picked.forEach(r => { r.review_id = reviewId++; sampled.push(r); });
}

// write reviews.jsonl (training set)
fs.writeFileSync(OUT_REVIEWS, sampled.map(r => JSON.stringify({
  review_id: r.review_id, brand: r.brand, branch_id: r._branchId, brand_key: r._brandKey,
  city: r.city, stars: r.stars, ts: r.ts, text: r.text,
})).join("\n"));

// keep only branches that contributed to the sample, with brand grouping
const usedBranches = new Set(sampled.map(r => r._branchId));
const entities = {};
for (const [bk, b] of Object.entries(brands)) {
  const branches = Object.values(b.branches).filter(x => usedBranches.has(x.branch_id));
  if (!branches.length) continue;
  entities[bk] = { brand: b.name, brand_key: bk, branch_count: branches.length, branches };
}
fs.writeFileSync(OUT_ENTITIES, JSON.stringify(entities, null, 1));

// --- report ---
const cityCounts = {};
sampled.forEach(r => cityCounts[r.city] = (cityCounts[r.city] || 0) + 1);
const multiBranch = Object.values(entities).filter(e => e.branch_count > 1);
console.log("=== build_review_set ===");
console.log("places scraped:", lines.length);
console.log("sampled reviews:", sampled.length, cityCounts);
console.log("brands:", Object.keys(entities).length, "| branches:", sampled.reduce((s, r) => s.add(r._branchId), new Set()).size);
console.log("multi-branch brands:", multiBranch.map(e => `${e.brand}(${e.branch_count})`).join(", ") || "(none)");
