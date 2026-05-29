// Precompute per-scope card rankings + restaurant deals + sidebar facets at the
// DEFAULT app settings, so the client's first paint loads a small summary file
// instead of parsing ~21 MB of raw offers and aggregating 28k records on the
// main thread.
//
// Correctness contract
// ────────────────────
// The summary is produced by the SAME shared `computeRanking` core that the
// browser (assets/algorithms.js) and the SSR worker (functions/_middleware.js)
// use. At the default scope — selectedCity ∈ {all, <city>}, orderValue 10000,
// no day/restaurant/bank/cardType/cuisine filters, eligibility OFF — the core
// output is, by construction, what the SSR renders and what the browser renders
// (eligibility off ⇒ qualificationDelta 0). The moment the user changes any
// input the client recomputes from raw offers, so the summary is strictly a
// cache of the default render. `scripts/verify_ranking_parity.mjs` proves
// core-default === browser-default; a mobile jest test proves mobile parity.
//
// Output: data/summary.json  (referenced from offers-index.json by the loaders;
// content-hashing of the filename is wired in the pipeline step).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeRanking, getOfferSavingValue } from "../lib/ranking-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const REQ_DIR = path.join(DATA_DIR, "card-requirements/normalized");

const DEFAULT_ORDER_VALUE = 10000; // mirrors state.js / mobile store defaults
const SCOPES = ["all", "karachi", "lahore", "islamabad"];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadOffers() {
  const index = readJson(path.join(DATA_DIR, "offers-index.json"));
  let offers = [];
  for (const city of index.cities) {
    const rel = index.cityFiles?.[city];
    if (!rel) continue;
    const file = path.join(DATA_DIR, path.basename(rel));
    const payload = readJson(file);
    offers = offers.concat(payload.offers || []);
  }
  let restaurants = {};
  if (index.restaurantsFile) {
    try {
      restaurants = readJson(path.join(DATA_DIR, path.basename(index.restaurantsFile))).restaurants || {};
    } catch { /* best-effort enrichment */ }
  }
  return { index, offers, restaurants };
}

// Build the requirements lookup Maps exactly as functions/_middleware.js and
// app.js do, so feePenalty matches the runtime.
function loadRequirements() {
  try {
    const reqRows = readJson(path.join(REQ_DIR, "card_requirements.json"));
    const mapRows = readJson(path.join(REQ_DIR, "deal_requirement_card_map.json"));
    return {
      byCardId: new Map(reqRows.map((row) => [row.card_id, row])),
      mappingByDealKey: new Map(
        mapRows.map((row) => [
          `${String(row.deal_bank_name || "").trim().replace(/\s+/g, " ").toLowerCase()} || ${String(row.deal_card_name || "").trim().replace(/\s+/g, " ").toLowerCase()}`,
          row,
        ]),
      ),
    };
  } catch {
    return null; // ranking still works, just without fee penalty
  }
}

const EMPTY = Object.freeze(new Set());

// Default settings for a scope — every multi-select filter empty, eligibility
// off (the core never sees eligibility anyway).
function defaultSettings(city) {
  return {
    city,
    orderValue: DEFAULT_ORDER_VALUE,
    outingsPerWeek: 1,
    selectedDays: EMPTY,
    selectedRestaurants: EMPTY,
    selectedBanks: EMPTY,
    selectedCardTypes: EMPTY,
    selectedCards: EMPTY,
    selectedCuisines: EMPTY,
  };
}

function cityMatches(scope, offerCity) {
  if (scope === "all") return true;
  return String(offerCity || "").toLowerCase() === scope;
}

// Best card per (city, restaurant) at the default order value — mirrors the
// "restaurants" tab default. Uses the shared getOfferSavingValue so per-offer
// savings are identical to the runtime.
function restaurantDealsForScope(offers, scope) {
  const best = new Map();
  for (const offer of offers) {
    if (!cityMatches(scope, offer.city)) continue;
    const saving = getOfferSavingValue(offer, DEFAULT_ORDER_VALUE);
    if (!Number.isFinite(saving) || saving <= 0) continue;
    const key = `${offer.city} || ${offer.restaurant}`;
    const cur = best.get(key);
    if (!cur || saving > cur.saving) {
      best.set(key, {
        restaurant: offer.restaurant,
        city: offer.city,
        saving,
        discountLabel: offer.discountLabel,
        daysLabel: offer.daysLabel,
        bestCard: offer.card,
        bestBank: offer.bank,
      });
    }
  }
  return [...best.values()].sort((a, b) => b.saving - a.saving);
}

function buildFacets(offers) {
  const banks = new Set();
  const cardTypes = new Set();
  const cards = new Set();
  for (const o of offers) {
    if (o.bank) banks.add(o.bank);
    if (o.cardCategory) cardTypes.add(o.cardCategory);
    if (o.bank && o.card) cards.add(`${o.bank} || ${o.card}`);
  }
  return {
    banks: [...banks].sort(),
    cardTypes: [...cardTypes].sort(),
    cards: [...cards].sort(),
  };
}

function main() {
  const t0 = Date.now();
  const { index, offers, restaurants } = loadOffers();
  const requirements = loadRequirements();

  const scopes = {};
  const restaurantDeals = {};
  for (const scope of SCOPES) {
    const { aggregates } = computeRanking({
      offers,
      restaurantsEnrichment: restaurants,
      requirements,
      settings: defaultSettings(scope),
    });
    scopes[scope] = aggregates;
    restaurantDeals[scope] = restaurantDealsForScope(offers, scope);
  }

  const summary = {
    splitFormat: "summary-v1",
    generatedAt: index.generatedAt || new Date().toISOString(),
    orderValue: DEFAULT_ORDER_VALUE,
    scopes,
    restaurantDeals,
    facets: buildFacets(offers),
  };

  const outPath = path.join(DATA_DIR, "summary.json");
  fs.writeFileSync(outPath, JSON.stringify(summary));
  const bytes = fs.statSync(outPath).size;
  const cardCounts = SCOPES.map((s) => `${s}:${scopes[s].length}`).join(" ");
  console.log(`[precompute] wrote ${path.relative(process.cwd(), outPath)} ${(bytes / 1e6).toFixed(2)}MB in ${Date.now() - t0}ms`);
  console.log(`[precompute] scopes ${cardCounts}  | offers in=${offers.length}  | requirements=${requirements ? "yes" : "no"}`);
}

main();
