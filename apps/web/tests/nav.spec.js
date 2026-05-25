// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoApp } = require('./helpers');

// After the nav-unification work, every page should expose the SAME mobile
// utility-nav contents. We snapshot the home page list and assert each
// sub-page produces an identical list of (text, href) pairs.
async function readUtilityNav(page) {
  return await page.evaluate(() => {
    const items = /** @type {NodeListOf<HTMLAnchorElement>} */ (
      document.querySelectorAll(".nav > .utility-nav a")
    );
    return Array.from(items).map((a) => ({
      text: (a.textContent || "").trim(),
      href: a.getAttribute("href") || "",
    }));
  });
}

test.describe("Nav — mobile utility-nav is identical across pages", () => {
  test("home and content sub-pages share the same mobile menu", async ({ page }) => {
    await gotoApp(page);
    const home = await readUtilityNav(page);
    expect(home.length).toBeGreaterThan(0);

    // /banks/ and /restaurants/ are SEO build artifacts (gitignored, generated
    // by npm run build), so they're not always present in test envs. The static
    // sub-pages below exercise the same content-pages.js code path that powers
    // the generated pages, which catches any nav drift.
    for (const path of ["/about/", "/contact/", "/methodology/", "/how-discount-caps-work/"]) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(50);
      const items = await readUtilityNav(page);
      const compare = (rows) =>
        rows.map((r) => `${r.text} → ${r.href}`).join(" | ");
      expect(compare(items), `mismatched mobile menu on ${path}`).toBe(compare(home));
    }
  });
});
