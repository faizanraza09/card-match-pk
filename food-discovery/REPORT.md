# Food-Discovery spike — results

**Built overnight, fully locally on the Mac (Apple Silicon M5).** This is a working
end-to-end proof of the review-grounded food-discovery engine layered on Konsacard's
offer data. Everything below ran on **real scraped data** — no mocks.

**TL;DR: the whole pipeline works end-to-end.** Scrape → build review set → resolve
entities & join offers → LLM extraction → aggregate with brand-shrinkage → rank +
synthesize → train a distilled student. Real Karachi/Lahore/Islamabad data the whole way.

---

## What ran, and the numbers

| Stage | Script | Result |
|---|---|---|
| 1. Scrape (Google Maps, gosom) | — | 104 places across KHI/LHR/ISB, full reviews |
| 2. Build review training set | `01_build_review_set.mjs` | **240 reviews** (80/city), 43 brands, 52 branches |
| 3. Entity resolution + offer join | `02_resolve_offers.mjs` | **18/43 brands** matched to Konsacard offers; **269 branch-scope + 553 brand-scope** offer placements |
| 4. LLM extraction (teacher) | `03_extract.mjs` | **240/240 labelled, 0 fallbacks**; ~5.6s/review (llama3.2:3b) |
| 5. Aggregate w/ brand shrinkage | `04_aggregate.mjs` | 52 branches scored, 191 distinct dishes |
| 6. Rank + synthesize | `05_rank_demo.mjs` | 4/5 example queries answered with grounded NL answers |
| 7. ML student (distillation proof) | `06_train_student.mjs` | **83.3% acc vs 62.5% baseline (+20.8pp)** on held-out reviews |

Extraction label coverage: 169/240 with dishes, 172 with aspects, 48 with tags, 31
hygiene flags, 63 marked irrelevant. Sentiment balance: 125 pos / 81 neg / 34 neutral.

---

## Does it actually work? Yes — highlights

### The product vision, on real data (Islamabad query)
> **"best restaurant in Islamabad"** →
> *"I'd recommend **Coco Cafe** in Islamabad, with an impressive 4.3-star rating from 78
> reviews! This spot offers a great deal of **20% off with the Meezan Bank Mastercard**,
> making it a convenient and affordable choice for diners."*

That single sentence is the whole thesis: **review-grounded quality + the card that saves
you most**, generated locally for $0. The offer here came in at **brand scope** (fanned out
from Konsacard) — exactly the design.

### Brand-vs-branch shrinkage, working (Kababjees Fried Chicken, 7 branches)
Brand-level "food" sentiment is **0.273** (a chain with lots of unhappy reviews). Watch the
shrinkage decide how much to trust each branch:

| Branch | own reviews (n) | branch rate | final score | what happened |
|---|---|---|---|---|
| North Five Star | 3 | 0.333 | **0.303** | enough data → trusts itself |
| Garden East | 1 | 1.000 | **0.455** | one rave review **pulled down** toward brand 0.273 (not enough to trust) |
| Gulshan-e-Iqbal | 2 | 0.000 | **0.164** | bad branch, shrunk slightly up toward brand |
| (any branch with 0) | 0 | — | **0.273** | falls back to brand reputation |

This is exactly the behaviour we designed: a branch with one glowing review doesn't get to
claim "great"; it earns trust as its own review count grows.

### Branch evidence beats brand prior in ranking (nihari, Lahore)
The two Muhammadi branches with actual nihari mentions (n=1) ranked **above** sibling
branches scored purely from the brand prior (n=0) — branch-level truth wins when it exists.

---

## Honest limitations (all expected at this scale/model)

- **Small data.** 240 reviews is a *pipeline* proof, not a quality bar. Most branch×dish
  cells have n=1, so shrinkage leans on the brand prior more than it would at 10k+ reviews.
- **3B teacher is noisy.** It occasionally extracts non-dish words ("food", "good", "taste")
  as dishes, and sometimes doesn't lead the synthesis with the #1 pick. A **dish gazetteer +
  canonicalization** step (planned, downstream) filters the noise; a 7–8B teacher (Lenovo)
  improves it further.
- **Literal dish matching.** "best bbq in Lahore" returned 0 results because no review said
  the literal token "bbq" (they say "tikka", "seekh kabab"). Needs a **synonym/cuisine
  gazetteer** — a known next step, not a pipeline flaw.
- **Entity-resolution is fuzzy.** e.g. "House of Kababjees → Kababjees" over-matched. This is
  the genuinely hard stage and where real engineering effort goes.
- **Neutral sentiment is weak** (F1 0.29) — scarce and inherently fuzzy class.
- **Student is a stand-in.** It's a dependency-free Naive Bayes (sklearn wouldn't install on
  Python 3.14). It proves the *distillation loop* (teacher labels → model that generalizes);
  the real student is a fine-tuned transformer on ~10k labels — same loop, better model.

---

## What this validates for the plan

1. The scraper yields a usable corpus with dish-level review text. ✓
2. The locked **extraction contract** (dishes/aspects/tags/hygiene/relevance) is produced
   reliably by a local model — 0 JSON failures over 240. ✓
3. **Branches-from-base-layer + offer scope (branch|brand)** joins cleanly to Konsacard. ✓
4. **Brand-prior shrinkage** behaves correctly on real multi-branch chains. ✓
5. The **deterministic scorer + grounded synthesis** produces the intended "quality + savings"
   answer. ✓
6. A model **trained only on the teacher's labels generalizes** (+20.8pp over baseline). ✓

## Next steps (in priority order)
1. Scale labeling to ~10k (Lenovo, 7–8B teacher) → train the real transformer student.
2. Add the **dish/cuisine gazetteer** (canonicalization + synonyms) — biggest quality win.
3. Harden **entity resolution** (name + geo + address) — the critical-path stage.
4. Add proximity/route to the scorer (we already have branch coordinates).
5. Wire `/api/discover` + mobile mirror, fed by precomputed `scores.json`.

---

*Artifacts: `data/work/reviews.jsonl` (training set), `labels.jsonl` (teacher labels),
`scores.json` (index), `out/demo.md` (ranked answers), `out/student_metrics.json`. Raw
scrapes are gitignored (large, verbatim review text).*
