import { computeFeePenalty } from "@/lib/algorithms";
import type { CardRecommendation, EligibilityStatus } from "@/types";

function makeItem(
  fee: number | null,
  waiver: string | null,
  avgSaving: number,
  coverage: number
): Pick<CardRecommendation, "requirementStatus" | "avgExpectedSaving" | "coverage"> {
  return {
    requirementStatus: {
      status: "eligible",
      label: "Likely eligible",
      tone: "eligible",
      sortRank: 3,
      detail: "",
      criteria: [],
      annualFeePkr: fee,
      annualFeeWaiverRule: waiver,
      salaryReq: null,
      balanceReq: null,
      hasRequirementRecord: true,
      sourceIds: [],
      cardNotes: [],
      bankGaps: [],
    } as EligibilityStatus,
    avgExpectedSaving: avgSaving,
    coverage,
  };
}

describe("computeFeePenalty", () => {
  test("null fee returns 0", () => {
    expect(computeFeePenalty(makeItem(null, null, 3000, 0.4), 52)).toBe(0);
  });

  test("zero fee returns 0", () => {
    expect(computeFeePenalty(makeItem(0, null, 3000, 0.4), 52)).toBe(0);
  });

  test("low fee relative to yearly value → small penalty", () => {
    // yearly = 3000 × 52 × 0.4 = 62,400. fee = 2,000 → ratio ~0.032 → penalty ~0.8
    const p = computeFeePenalty(makeItem(2000, null, 3000, 0.4), 52);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(2);
  });

  test("fee equal to yearly value → 25 (full penalty cap)", () => {
    // yearly = 1000 × 52 × 0.5 = 26,000. fee = 26,000 → ratio = 1 → penalty = 25
    const p = computeFeePenalty(makeItem(26000, null, 1000, 0.5), 52);
    expect(p).toBe(25);
  });

  test("fee bigger than yearly value still caps at 25", () => {
    const p = computeFeePenalty(makeItem(100000, null, 1000, 0.5), 52);
    expect(p).toBe(25);
  });

  test("waiver rule halves the effective fee", () => {
    const withoutWaiver = computeFeePenalty(makeItem(10000, null, 3000, 0.4), 52);
    const withWaiver = computeFeePenalty(makeItem(10000, "Waived on PKR 100K spend", 3000, 0.4), 52);
    // waived penalty should be half of unwaived (until either hits the 25 cap)
    expect(withWaiver).toBeCloseTo(withoutWaiver / 2, 5);
  });

  test("zero yearlyValue (zero saving or zero coverage) → still bounded, never NaN", () => {
    // No saving means no value to weigh fees against. Penalty is the full 25.
    const p = computeFeePenalty(makeItem(5000, null, 0, 0.4), 52);
    expect(p).toBe(25);
    const p2 = computeFeePenalty(makeItem(5000, null, 3000, 0), 52);
    expect(p2).toBe(25);
  });
});
