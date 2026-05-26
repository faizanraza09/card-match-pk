import { computeFeePenalty } from "@/lib/algorithms";
import type { CardRecommendation, EligibilityStatus } from "@/types";

function makeItem(
  fee: number | null,
  waiver: string | null,
  avgSaving: number,
  coverage: number,
  hasRequirementRecord = true
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
      hasRequirementRecord,
      sourceIds: [],
      cardNotes: [],
      bankGaps: [],
    } as EligibilityStatus,
    avgExpectedSaving: avgSaving,
    coverage,
  };
}

describe("computeFeePenalty (May 2026 calibration: no coverage multiplier, missing-fee soft penalty)", () => {
  test("zero fee returns 0", () => {
    expect(computeFeePenalty(makeItem(0, null, 3000, 0.4), 52)).toBe(0);
  });

  test("null fee, no requirement record → soft 3-point penalty (was 0)", () => {
    expect(computeFeePenalty(makeItem(null, null, 3000, 0.4, false), 52)).toBe(3);
  });

  test("null fee with documented waiver rule (Conditional) → 0", () => {
    // "Conditional" means we know there's no flat annual fee — only a
    // behavioural waiver. Don't penalise.
    expect(computeFeePenalty(makeItem(null, "Free on PKR 50K monthly spend", 3000, 0.4), 52)).toBe(0);
  });

  test("null fee with a record but no waiver context → soft 3-point penalty", () => {
    // Card is mapped, but the fee field is genuinely 'Not listed'. Same
    // disclosure-failure penalty as no record at all.
    expect(computeFeePenalty(makeItem(null, null, 3000, 0.4, true), 52)).toBe(3);
  });

  test("low fee relative to displayed yearly saving → small penalty", () => {
    // yearly = 3000 × 52 = 156,000. fee = 2,000 → ratio ~0.013 → penalty ~0.3
    const p = computeFeePenalty(makeItem(2000, null, 3000, 0.4), 52);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  test("fee equal to displayed yearly saving → 25 (full cap)", () => {
    // yearly = 1000 × 52 = 52,000. fee = 52,000 → ratio = 1 → penalty = 25
    const p = computeFeePenalty(makeItem(52000, null, 1000, 0.5), 52);
    expect(p).toBe(25);
  });

  test("fee bigger than yearly saving still caps at 25", () => {
    const p = computeFeePenalty(makeItem(500000, null, 1000, 0.5), 52);
    expect(p).toBe(25);
  });

  test("waiver rule halves the effective fee", () => {
    const withoutWaiver = computeFeePenalty(makeItem(10000, null, 3000, 0.4), 52);
    const withWaiver = computeFeePenalty(makeItem(10000, "Waived on PKR 100K spend", 3000, 0.4), 52);
    // waived penalty should be half of unwaived (until either hits the 25 cap)
    expect(withWaiver).toBeCloseTo(withoutWaiver / 2, 5);
  });

  test("zero saving → still bounded, never NaN", () => {
    // No saving means no displayed yearly value to weigh fees against; the
    // penalty saturates at the 25-point cap.
    const p = computeFeePenalty(makeItem(5000, null, 0, 0.4), 52);
    expect(p).toBe(25);
  });

  test("zero coverage no longer triggers max penalty (coverage left the denominator)", () => {
    // Old formula: yearly = 3000 × 52 × 0 = 0 → ratio = ∞ → cap 25.
    // New formula: coverage isn't in the denominator, so a card with zero
    // coverage in this scope is judged on its avgExpectedSaving alone.
    const p = computeFeePenalty(makeItem(5000, null, 3000, 0), 52);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(2);
  });
});
