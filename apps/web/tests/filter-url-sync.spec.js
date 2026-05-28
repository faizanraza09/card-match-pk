// @ts-check
const { test, expect } = require("@playwright/test");
const { gotoApp } = require("./helpers");

/**
 * Each sidebar/nav filter must mirror its state into the URL so refreshing
 * or sharing the link preserves the selection. Before these tests existed,
 * day-pill / card-type-pill clicks updated state but called only their local
 * render — bypassing encodeStateToUrl() — and cuisines were never serialized
 * at all. This file would have caught both bug classes.
 */

test.describe("Filter → URL sync", () => {
  test("city tab → URL gains ?city=<key>", async ({ page }) => {
    await gotoApp(page);
    // First nav-city-tabs button is "All"; click the second tab (first real city).
    const karachiTab = page.locator("#nav-city-tabs .city-tab", { hasText: "Karachi" });
    await karachiTab.click();
    await page.waitForTimeout(150);
    expect(page.url()).toContain("city=karachi");
  });

  test("day pill click → URL gains ?days=<n>", async ({ page }) => {
    await gotoApp(page);
    await page.locator("#day-pills .s-pill").first().click();
    await page.waitForTimeout(150);
    expect(page.url()).toMatch(/[?&]days=\d/);
  });

  test('card-type pill "Credit" → URL gains ?types=credit', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#card-type-pills .s-pill', { hasText: /^Credit$/ }).click();
    await page.waitForTimeout(150);
    expect(page.url()).toContain("types=credit");
  });

  test('card-type pill "Debit" → URL gains ?types=debit', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#card-type-pills .s-pill', { hasText: /^Debit$/ }).click();
    await page.waitForTimeout(150);
    expect(page.url()).toContain("types=debit");
  });

  test("bank search + select → URL gains ?banks=...", async ({ page }) => {
    await gotoApp(page);
    await page.locator("#bank-search").fill("HBL");
    await page.waitForTimeout(200);
    await page.locator("#bank-results .s-search-item").first().click();
    await page.waitForTimeout(200);
    expect(page.url()).toMatch(/[?&]banks=/);
  });

  test("restaurant search + select → URL gains ?rests=...", async ({ page }) => {
    await gotoApp(page);
    // Pick a restaurant name that's broadly present in the dataset.
    await page.locator("#restaurant-search").fill("KFC");
    await page.waitForTimeout(250);
    const results = page.locator("#restaurant-results .s-search-item");
    const count = await results.count();
    test.skip(count === 0, "no restaurant matched the test query in this dataset");
    await results.first().click();
    await page.waitForTimeout(200);
    expect(page.url()).toMatch(/[?&]rests=/);
  });

  test("cuisine chip click → URL gains ?cuisines=...", async ({ page }) => {
    await gotoApp(page);
    const chip = page.locator("#cuisine-pills .s-cuisine-chip").first();
    const haveChips = (await chip.count()) > 0;
    test.skip(!haveChips, "no cuisine chips rendered (enrichment data missing?)");
    await chip.click();
    await page.waitForTimeout(200);
    expect(page.url()).toMatch(/[?&]cuisines=/);
  });

  test("bill slider drag → URL gains ?bill=<value>", async ({ page }) => {
    await gotoApp(page);
    await page.locator("#order-value").evaluate((el) => {
      /** @type {HTMLInputElement} */ (el).value = "15000";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(200);
    expect(page.url()).toContain("bill=15000");
  });

  test("URL clears once filters are reset to defaults", async ({ page }) => {
    await gotoApp(page);
    // Set a filter
    await page.locator('#card-type-pills .s-pill', { hasText: /^Credit$/ }).click();
    await page.waitForTimeout(150);
    expect(page.url()).toContain("types=credit");
    // Toggling the same pill off should remove the param
    await page.locator('#card-type-pills .s-pill', { hasText: /^Credit$/ }).click();
    await page.waitForTimeout(150);
    expect(page.url()).not.toContain("types=");
  });
});
