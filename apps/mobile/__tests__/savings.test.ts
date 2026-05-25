import { getOfferDiscountPct, getOfferSavingValue } from "@/lib/savings";
import type { Offer } from "@/types";

function makeOffer(over: Partial<Offer> = {}): Offer {
  return {
    city: "Lahore",
    restaurant: "Test",
    bank: "Bank A",
    card: "Card A",
    cardCategory: "credit",
    discountPct: 30,
    discountLabel: "30%",
    fixedDiscountPkr: null,
    days: [0, 1, 2, 3, 4, 5, 6],
    capPkr: null,
    discountType: "percentage",
    ...over,
  };
}

describe("getOfferSavingValue", () => {
  test("percentage type: returns pct * orderValue / 100", () => {
    expect(getOfferSavingValue(makeOffer({ discountPct: 30 }), 10000)).toBe(3000);
  });

  test("percentage type: respects cap", () => {
    expect(getOfferSavingValue(makeOffer({ discountPct: 30, capPkr: 500 }), 10000)).toBe(500);
  });

  test("fixed type: returns min(fixed, order)", () => {
    expect(
      getOfferSavingValue(
        makeOffer({ discountType: "fixed", fixedDiscountPkr: 800, discountPct: null }),
        10000
      )
    ).toBe(800);
    expect(
      getOfferSavingValue(
        makeOffer({ discountType: "fixed", fixedDiscountPkr: 8000, discountPct: null }),
        5000
      )
    ).toBe(5000);
  });

  test("up_to type: discounts by 60% (since users rarely hit the headline)", () => {
    // 30% headline, 60% multiplier → effective 18%
    expect(getOfferSavingValue(makeOffer({ discountType: "up_to", discountPct: 30 }), 10000)).toBeCloseTo(1800, 0);
  });

  test("bogo type: discounts by 30% multiplier", () => {
    // 50% bogo, 30% multiplier → effective 15%
    expect(getOfferSavingValue(makeOffer({ discountType: "bogo", discountPct: 50 }), 10000)).toBeCloseTo(1500, 0);
  });

  test("fixed type: clamped to order value", () => {
    // Web behaviour: only fixed and up_to cap; pct type just multiplies.
    const v = getOfferSavingValue(
      makeOffer({ discountType: "fixed", fixedDiscountPkr: 5000, discountPct: null }),
      1000
    );
    expect(v).toBe(1000);
  });
});

describe("getOfferDiscountPct", () => {
  test("uses numeric field when present", () => {
    expect(getOfferDiscountPct(makeOffer({ discountPct: 30 }))).toBe(30);
  });

  test("parses biggest pct from label/title text when numeric missing", () => {
    expect(
      getOfferDiscountPct(makeOffer({ discountPct: null, discountLabel: "Up to 40%", offerTitle: "10% extra" }))
    ).toBe(40);
  });

  test("returns null when no pct in text", () => {
    expect(
      getOfferDiscountPct(makeOffer({ discountPct: null, discountLabel: "Flat PKR 500", offerTitle: "" }))
    ).toBe(null);
  });
});
