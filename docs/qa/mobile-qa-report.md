# KonsaCard Mobile QA Report

**Date:** 2026-05-21
**URL tested:** http://127.0.0.1:8002/
**App:** KonsaCard — Pakistani bank card comparison single-page app
**Tester:** Automated Playwright audit (Claude Code)
**Viewports:** iPhone SE (375×667), iPhone 14 (390×844), Pixel 5 (393×851)
**Methodology:** Headless Chromium; cleared localStorage on each load; walked main app flows + spot-checked one bank and one restaurant SEO page; measured `boundingBox()` for every interactive control.

---

## Summary Table

| Section | Description | iPhone SE | iPhone 14 | Pixel 5 | Status |
|---|---|---|---|---|---|
| A | Landing / Quiz / Onboarding | ⚠️ Info | ⚠️ Info | ⚠️ Info | INFO |
| B | Main results page | ⚠️ Minor | ⚠️ Minor | ⚠️ Minor | PARTIAL |
| C | Mobile bottom tab + Filters | ⚠️ Minor | ⚠️ Minor | ⚠️ Minor | PARTIAL |
| D | Card detail modal | ⚠️ Issues | ⚠️ Issues | ⚠️ Issues | PARTIAL |
| E | Compare flow | ⚠️ Minor | ⚠️ Minor | ⚠️ Minor | PARTIAL |
| F | Chat panel | ⚠️ Minor | ⚠️ Minor | ⚠️ Minor | PARTIAL |
| G | My Wallet view | ⚠️ Minor | ⚠️ Minor | ⚠️ Minor | PARTIAL |
| H | Build Wallet advisor | ❌ Issues | ❌ Issues | ❌ Issues | FAIL |
| I | Favorites button (in restaurant detail) | ⚠️ Issues | ⚠️ Issues | ⚠️ Issues | PARTIAL |
| J | Bottom tab bar (mob-tabs) | ✅ Pass | ✅ Pass | ✅ Pass | PASS |
| K | Horizontal overflow | ✅ Pass | ✅ Pass | ✅ Pass | PASS |
| L | Static SEO pages | ❌ Issues | n/a | n/a | FAIL |
| M | Restaurant detail modal | ❌ Issues | ❌ Issues | ❌ Issues | FAIL |

**Total issues (deduped across viewports):** 25 — 0 HIGH, 15 MEDIUM, 10 LOW (after follow-up investigation; original 2 INFO items both resolved as false positives)

**Big-picture verdict:** No HIGH-severity bugs and no horizontal overflow anywhere. Main app touch targets are mostly fine; the worst-offender areas are:

1. **Restaurant detail modal** — multiple controls under 36px including the conversion-critical `.btn-apply.btn-apply-sm` "Apply →" link at 69×27px (many instances, one per offer row)
2. **Build Wallet setup row** — controls 27px tall, an input only 16px tall
3. **Static SEO bank/restaurant pages** — ship the old desktop-only nav/control sizes

---

## Issues Found

### Section A — Landing / Quiz / Onboarding

#### A-1 — ~~INFO~~ RESOLVED (false positive)
- **Original claim:** Onboarding screen did not appear after "Get Started"
- **Investigation result:** Flow works correctly. Reproduced manually:
  - First load → `landing-screen` shown, `konsacard_visited_v2` flag set
  - `localStorage.clear()` + reload → landing-screen shown again (flag re-set on this load)
  - Click `#landing-start-btn` → `landing-screen` hidden, `#onboarding-screen` displays with 1814 chars of content
- **Root cause of false positive:** The original audit likely cleared localStorage *after* the page had already booted (which sets the visited flag), then didn't reload — so it never saw the landing screen and Get Started had no effect on the already-rendered results view.
- **App state:** No bug. `assets/quiz.js:21-36` is correctly wired.

---

### Section B — Main results page

#### B-1 — MEDIUM — "Estimated Saving" label font is 10.5px
- **Viewports:** All
- **Selector:** `.cs-l` (`assets/styles.css:722`)
- **Measured:** `font-size: 10.5px`
- **Description:** The "Fit Score" / "Estimated Saving" / "Restaurants Matched" stat labels under each card are 10.5px. Readable on iPhone 14 / Pixel 5 but tight on iPhone SE.
- **Fix:** Bump to `12px` on viewports ≤ 768px.
  ```css
  @media (max-width: 768px) { .cs-l { font-size: 12px; } }
  ```

#### B-2 — LOW — `.btn-compare` is exactly at the 36px floor
- **Viewports:** All
- **Selector:** `.btn-compare`
- **Measured:** 75×36
- **Description:** At-threshold rather than below. Already has a mobile-specific `min-height: 36px` (`assets/styles.css:1916`). Bumping to 40 would give comfortable headroom.

#### B-3 — LOW — `.view-toggle-btn` is 72×36
- **Viewports:** All (also fires inside My Wallet / Build Wallet — see G-1 / H-4)
- **Selector:** `.view-toggle-btn` (line 2235)
- **Description:** Same story — at the 36px floor, not below. Adding `min-height: 40px` on mobile would be safer.

---

### Section C — Mobile bottom tab + Filters sidebar

#### C-1 — LOW — `.s-pill` filter pills are 38×36
- **Viewports:** All
- **Selector:** `.s-pill` (line 292)
- **Description:** Pills like "1×", "2×", "Mon", "Tue" inside the filter sidebar are 38×36 — narrow width because the labels are short. Sit on the 36px floor; readable and tappable but tight.
- **Fix:** `min-width: 44px;` on `.s-pill` in the mobile media query.

#### C-2 — INFO — Bottom tab bar works correctly
- **Viewports:** All — **PASS**
- The `#mob-tabs` bar with Filters / Results / Chat buttons opens the sidebar correctly. No bug here — calling out only because the previous QA report flagged this as broken.

---

### Section D — Card detail modal

#### D-1 — MEDIUM — `.btn-modal-close` "×" button is 29×34
- **Viewports:** All
- **Selector:** `.btn-modal-close` (line 1200), narrowed by `.cd-head-actions .btn-modal-close { height: 34px }` (line 2347)
- **Measured:** 29×34
- **Description:** Both dimensions below 36. The header close button in the card detail modal is harder to tap than it should be.
- **Fix:**
  ```css
  @media (max-width: 768px) {
    .cd-head-actions .btn-modal-close {
      min-width: 44px;
      min-height: 44px;
      height: auto;
    }
  }
  ```

#### D-2 — MEDIUM — `.cd-head-actions .btn-apply` is 79×34
- **Viewports:** All
- **Selector:** `.cd-head-actions .btn-apply`
- **Measured:** 79×34
- **Description:** Primary "Apply →" CTA in the card detail header is 34px tall — below 36. This is one of the more important conversion actions in the app.
- **Fix:**
  ```css
  @media (max-width: 768px) {
    .cd-head-actions .btn-apply { min-height: 44px; }
  }
  ```

---

### Section E — Compare flow

#### E-1 — MEDIUM — `.cmp-tray-card-remove` "×" is 32×32
- **Viewports:** All
- **Selector:** `.cmp-tray-card-remove` (line 1052)
- **Measured:** 32×32 (already has explicit `min-width: 32px; min-height: 32px;`)
- **Description:** The small "×" used to remove a card from the compare tray sits at 32 — below the 36 floor. Risk is hitting "×" when the user means to tap the card. Stacked against `.btn-compare-open` (which is fine at 44px), this is annoying but not flow-breaking.
- **Fix:** Lift the min from 32 → 36, or wrap "×" in extra padding so the hit target is larger than the glyph.

#### E-2 — LOW — `.cmp-tray-card` is 106×42
- **Viewports:** All
- **Description:** Card pill in the compare tray; 42px height is fine, width is the cramped dimension. Not a bug; flagged because tap area sits next to the "×" remove.

---

### Section F — Chat panel

#### F-1 — LOW — `.chat-close` is 36×36
- **Viewports:** All
- **Description:** At the floor. Same story as B-2.

#### F-2 — LOW — `.chat-top-btn` (delete-thread) is 36×36
- **Viewports:** All
- **Description:** At the floor.

#### F-3 — LOW — `.quick-chip` quick-question chips are 36px tall
- **Viewports:** All
- **Description:** Sit at the floor, but width is fine (244px on iPhone SE). Bumping to 40 would help.

---

### Section G — My Wallet view

#### G-1 — LOW — `.view-toggle-btn` inside wallet view is 72×36
- **Viewports:** All
- **Description:** Same selector as B-3, surfaces again inside My Wallet. Fix once in the shared rule.

---

### Section H — Build Wallet advisor

#### H-1 — MEDIUM — `#wallet-setup` "size" buttons are 58×27
- **Viewports:** All
- **Selector:** `#wallet-setup button`, `.wo-setup-wrap button`
- **Measured:** 58×27 (button labelled "2 cards" / "3 cards" / etc.)
- **Description:** The wallet-size selector buttons in the Build Wallet setup row are 27px tall — well below the 36 minimum. These are core to the flow.
- **Fix:** Add explicit min-height in `assets/styles.css`:
  ```css
  @media (max-width: 768px) {
    .wo-setup-wrap button { min-height: 44px; padding: 10px 14px; }
  }
  ```

#### H-2 — MEDIUM — `#wallet-setup input` is 235×16
- **Viewports:** All
- **Selector:** `#wallet-setup input`
- **Measured:** 235×16
- **Description:** The budget/input field in Build Wallet renders at 16px tall. Effectively impossible to tap with a finger; users would have to land precisely on a 16px-tall line.
- **Fix:**
  ```css
  @media (max-width: 768px) {
    .wo-setup-wrap input { min-height: 44px; padding: 10px 12px; font-size: 14px; }
  }
  ```

#### H-3 — LOW — `.view-toggle-btn` 72×36 inside Build Wallet
- Same root cause as B-3.

---

### Section I — Favorites button (in restaurant detail)

#### I-1 — ~~INFO~~ RESOLVED (false positive) — Favorite button is in the **restaurant detail modal**, not the restaurants list
- **Investigation result:** The feature is reachable and works. Open a restaurant from the list → modal opens → header shows `#btn-rd-fav` "☆ Save" button → click toggles to "★ Saved" and updates `state.favoriteRestaurants` in localStorage. Confirmed via repro.
- **Location in code:** `assets/app.js:2788` (renders inside the restaurant detail modal header).
- **App state:** No bug. The original audit's selector probe assumed favorites would surface as stars next to each restaurant in the list, but they're a save-toggle in the detail view — which is the intended UX per the commit message ("Users can now star restaurants from the restaurant-detail modal").
- **Followup issue:** While verifying, the modal's controls were measured and several are below 36px — see Section M.

---

### Section J — Bottom tab bar (`mob-tabs`)

✅ **PASS** on all viewports. Filters / Results / Chat tabs are present, sized adequately, and the Filters tab opens the sidebar as expected. This addresses the previous report's HIGH-severity C-1 ("no way to reach filters on mobile").

---

### Section K — Horizontal overflow

✅ **PASS** on all viewports. `document.documentElement.scrollWidth` did not exceed `window.innerWidth` on any tested screen state (landing, results, filters open, card detail, compare tray, chat open, My Wallet, Build Wallet). Previously fragile flows are clean.

---

### Section L — Static SEO pages

#### L-1 — MEDIUM — `/banks/habib-bank-limited/` has 36 controls below 36px
- **Viewport:** iPhone SE (representative)
- **Description:** The generated static bank page ships with the old desktop nav and table chrome — e.g., `.nav-wordmark` 108×30, `.btn-find-my-card` 116×32, `.hamburger-btn` 18×44 (width too narrow), and 30+ smaller controls in the offers table/header.
- **Root cause:** `scripts/seo/generate_seo_pages.py` renders these pages with their own inline CSS, which hasn't been updated alongside the main `assets/styles.css` mobile pass.
- **Fix:** Either (a) audit + update the inline styles in the generator template, or (b) link the SEO pages against shared `assets/styles.css` so future mobile fixes flow through automatically.

#### L-2 — MEDIUM — `/restaurants/xander-s/` has 68 controls below 36px
- **Viewport:** iPhone SE (representative)
- **Description:** Same as L-1 but worse — restaurant pages have a longer card list, so the count of sub-36 controls is higher. Same root cause.
- **Fix:** Same as L-1.

---

### Section M — Restaurant detail modal (added during follow-up investigation)

The original audit never opened the restaurant detail modal (it was looking for favorite buttons in the list and didn't find them). Probing the modal directly surfaced five new findings, all consistent across viewports.

#### M-1 — MEDIUM — `.btn-apply.btn-apply-sm` "Apply →" links are 69×27
- **Viewports:** All
- **Selector:** `.btn-apply.btn-apply-sm` (one per offer row inside the modal)
- **Measured:** 69×27
- **Description:** 27px tall — well below 36. These are conversion-critical CTAs: each row in the restaurant modal pairs a card with its discount and an inline Apply link. There are 5–10+ of these stacked tightly, so users miss-tap into the wrong row easily.
- **Fix:**
  ```css
  @media (max-width: 768px) {
    .btn-apply-sm { min-height: 40px; padding: 8px 12px; }
  }
  ```

#### M-2 — MEDIUM — `#btn-rd-fav` "☆ Save" favorite button is 72×34
- **Viewports:** All
- **Selector:** `#btn-rd-fav.btn-fav`
- **Measured:** 72×34
- **Description:** Height below 36px. The main entry point for the favorites feature (commit f96f623). At 34px tall it's borderline tappable.
- **Fix:**
  ```css
  @media (max-width: 768px) { #btn-rd-fav { min-height: 44px; } }
  ```

#### M-3 — MEDIUM — `#btn-rd-close` close-modal "×" is 29×34
- **Viewports:** All
- **Selector:** `#btn-rd-close.btn-modal-close`
- **Measured:** 29×34
- **Description:** Same selector class as the card-detail close (D-1) — both modals share `.btn-modal-close`. One fix covers both.

#### M-4 — MEDIUM — `.btn-detail.rd-open-card` "⤢" expand button is 32×32
- **Viewports:** All
- **Selector:** `.btn-detail.rd-open-card`
- **Measured:** 32×32 (one per offer row, so many instances)
- **Description:** The icon button that jumps from a restaurant row to that card's full detail page. Below 36 on both axes.
- **Fix:**
  ```css
  @media (max-width: 768px) { .btn-detail { min-width: 40px; min-height: 40px; } }
  ```

#### M-5 — LOW — `.pager-btn` Prev/Next pagination buttons are 72×33
- **Viewports:** All
- **Description:** Used to page through long lists in the modal. Height below 36 by 3px.

---

## Priority Fix List

| # | Issue | Section | Severity | Effort | Notes |
|---|---|---|---|---|---|
| 1 | Restaurant modal "Apply →" links 69×27 (many) | M-1 | MEDIUM | Trivial CSS | Conversion CTA, repeated per row — high mis-tap risk |
| 2 | Build Wallet input is 16px tall — effectively untappable | H-2 | MEDIUM | Trivial CSS | Highest impact per CSS line |
| 3 | Build Wallet size buttons 58×27 | H-1 | MEDIUM | Trivial CSS | Pair with H-2 |
| 4 | Static SEO pages ship 36+ undersized controls | L-1, L-2 | MEDIUM | Medium (template) | Biggest absolute volume — needs template work in `generate_seo_pages.py` |
| 5 | Card detail "Apply →" button 79×34 | D-2 | MEDIUM | Trivial CSS | Conversion-critical CTA |
| 6 | `.btn-modal-close` 29×34 (both card detail and restaurant detail share the class) | D-1, M-3 | MEDIUM | Trivial CSS | One rule covers both |
| 7 | Restaurant favorite "☆ Save" button 72×34 | M-2 | MEDIUM | Trivial CSS | Primary entry point for favorites feature |
| 8 | Restaurant row expand "⤢" button 32×32 | M-4 | MEDIUM | Trivial CSS | Many instances per modal |
| 9 | Compare tray "×" remove 32×32 | E-1 | MEDIUM | Trivial CSS | Risk of mis-tap next to card pill |
| 10 | `.cs-l` stat labels 10.5px on mobile | B-1 | MEDIUM | Trivial CSS | Bump to 12px on mobile |
| 11 | At-floor 36px / 33px controls (`.btn-compare`, `.view-toggle-btn`, `.s-pill`, chat buttons, quick chips, `.pager-btn`) | B-2/B-3, C-1, F-1/F-2/F-3, G-1, H-3, M-5 | LOW | Trivial CSS | Bump from 36 → 40 in one batch |

---

## CSS Quick-Fix Reference

Most issues collapse to one mobile-media-query block in `assets/styles.css`:

```css
@media (max-width: 768px) {
  /* B-1 — readable stat labels */
  .cs-l { font-size: 12px; }

  /* D-1 + M-3 — modal close button (used by both card detail and restaurant detail) */
  .btn-modal-close { min-width: 44px; min-height: 44px; height: auto; }

  /* D-2 — card detail Apply button */
  .cd-head-actions .btn-apply { min-height: 44px; }

  /* E-1 — compare tray remove */
  .cmp-tray-card-remove { min-width: 36px; min-height: 36px; }

  /* H-1, H-2 — Build Wallet setup row */
  .wo-setup-wrap button { min-height: 44px; padding: 10px 14px; }
  .wo-setup-wrap input { min-height: 44px; padding: 10px 12px; font-size: 14px; }

  /* M-1 — restaurant detail inline Apply links (per-row) */
  .btn-apply-sm { min-height: 40px; padding: 8px 12px; }

  /* M-2 — restaurant detail favorite button */
  #btn-rd-fav { min-height: 44px; }

  /* M-4 — restaurant detail per-row expand button */
  .btn-detail { min-width: 40px; min-height: 40px; }

  /* Low-priority lift from 36/33 → 40 */
  .btn-compare { min-height: 40px; }
  .view-toggle-btn { min-height: 40px; }
  .s-pill { min-width: 44px; min-height: 40px; }
  .chat-close,
  .chat-top-btn { min-width: 40px; min-height: 40px; }
  .quick-chip { min-height: 40px; }
  .pager-btn { min-height: 40px; }
}
```

The static SEO pages (L-1, L-2) need a separate pass in `scripts/seo/generate_seo_pages.py` — either consolidating to the shared stylesheet or updating the inline template's mobile rules.

---

## Methodology notes / scope limits

- **What was NOT tested:** dark/light mode toggle, real network conditions, A11y / screen reader, RTL, very long restaurant names overflowing within rows, the entire `archive/` directory.
- **What changed since the prior (2026-04-28) report:** the previous HIGH issues (hamburger doesn't reach filters; compare tray button blocked) are both resolved — the bottom tab bar and the larger `.btn-compare-open` (44px) fix them.
- **Follow-up investigation:** Two original findings (A-1 onboarding gate, I-1 missing favorites) were flagged as INFO during the automated audit. A manual repro pass against `assets/quiz.js` and `assets/app.js` confirmed both are working as intended — both were audit false positives caused by the test approach (clearing localStorage post-boot; probing for favorites in the list instead of the detail modal). The investigation also uncovered the Section M findings that the automated pass missed.

---

## Fixes proposed and rejected (2026-05-21)

A first pass applied the CSS Quick-Fix Reference above to `assets/styles.css`
and was reverted after a visual side-by-side review. The 44px touch-target
minimum made the UI feel oversized and broke the compact editorial aesthetic
of the app — the Build Wallet setup row, the restaurant detail modal, and
the card detail header all looked noticeably heavier than intended.

**Design call:** keep the existing compact sizing. The smaller controls are a
deliberate aesthetic choice, not an oversight. Don't apply blanket 44×44
HIG minimums on this project.

**Implication for future mobile work:**
- Treat the measurements above as a reference, not a fix list.
- If a specific control is causing real mis-tap complaints, address it in
  isolation rather than as part of a global touch-target sweep.
- The Build Wallet input (H-2, 16px tall) is the one finding still worth
  re-examining — 16px is below the threshold where the issue is purely
  aesthetic.

**Outstanding (unrelated to the rejected pass):**
- L-1, L-2 — static SEO pages have undersized inline-template controls.
  Whether or not this is acted on, the fix would belong in
  `scripts/seo/generate_seo_pages.py`.
