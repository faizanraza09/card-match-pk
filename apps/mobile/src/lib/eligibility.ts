import {
  AlgorithmState,
  EligibilityStatus,
  RequirementsPack,
  RequirementRecord,
} from "@/types";
import {
  buildDealCardKey,
  formatCurrency,
  formatRequirementCriterion,
  normalizeRequirementNumber,
} from "./format";

const EMPTY_NOTES = { cardNotes: [] as string[], bankGaps: [] as string[] };

const emptyStatus = (
  status: EligibilityStatus["status"],
  label: string,
  tone: string,
  sortRank: number,
  detail: string
): EligibilityStatus => ({
  status,
  label,
  tone,
  sortRank,
  detail,
  criteria: [],
  annualFeePkr: null,
  annualFeeWaiverRule: null,
  salaryReq: null,
  balanceReq: null,
  hasRequirementRecord: false,
  sourceIds: [],
  ...EMPTY_NOTES,
});

export function inferCardTier(cardName: string | undefined): string {
  const n = (cardName || "").toLowerCase();
  if (n.includes("world") || n.includes("infinite") || n.includes("signature") || n.includes("privilege")) return "world";
  if (n.includes("platinum")) return "platinum";
  if (n.includes("titanium")) return "titanium";
  if (n.includes("gold")) return "gold";
  if (n.includes("silver")) return "silver";
  if (n.includes("classic") || n.includes("standard") || n.includes("basic")) return "classic";
  return "other";
}

export function buildEstimatesByTier(requirementsPayload: RequirementRecord[]) {
  const groups: Record<string, { salaries: number[]; balances: number[]; count: number }> = {};
  requirementsPayload.forEach((row) => {
    const salary = normalizeRequirementNumber(row.requirements?.minimum_monthly_salary_pkr);
    const balance = normalizeRequirementNumber(row.requirements?.minimum_account_balance_pkr);
    if (salary === null && balance === null) return;
    const tier = inferCardTier(row.card_name);
    if (!groups[tier]) groups[tier] = { salaries: [], balances: [], count: 0 };
    if (salary !== null && salary > 0) groups[tier].salaries.push(salary);
    if (balance !== null && balance > 0) groups[tier].balances.push(balance);
    groups[tier].count++;
  });

  function median(arr: number[]) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  }

  const map = new Map<
    string,
    { tier: string; medianSalary: number | null; medianBalance: number | null; peerCount: number }
  >();
  Object.entries(groups).forEach(([tier, g]) => {
    map.set(tier, {
      tier,
      medianSalary: median(g.salaries),
      medianBalance: median(g.balances),
      peerCount: g.count,
    });
  });
  return map;
}

/**
 * Eligibility evaluator, port of the web `evaluateEligibility` function with the
 * recent bug fix carried over: a card with only one real requirement no longer
 * gets a phantom OR pass on the absent dimension.
 */
export function evaluateEligibility(
  state: Pick<AlgorithmState, "requirements" | "monthlySalary" | "accountBalance">,
  bank: string,
  card: string
): EligibilityStatus {
  const reqs: RequirementsPack | null = state.requirements;
  if (!reqs?.available) {
    return emptyStatus("unavailable", "Requirements unavailable", "unclear", 1, "Requirements data could not be loaded.");
  }

  const mapping = reqs.mappingByDealKey.get(buildDealCardKey(bank, card));
  if (!mapping?.matched || !mapping.requirement_card_id) {
    return emptyStatus(
      "unclear",
      "Requirements unclear",
      "unclear",
      1,
      "This deal-side card is not yet mapped to a verified requirements record."
    );
  }

  const record = reqs.byCardId.get(mapping.requirement_card_id);
  if (!record) {
    return emptyStatus(
      "unclear",
      "Requirements unclear",
      "unclear",
      1,
      "A mapped requirements record could not be loaded."
    );
  }

  const requirements = record.requirements || {};
  let salaryReq = normalizeRequirementNumber(requirements.minimum_monthly_salary_pkr);
  let balanceReq = normalizeRequirementNumber(requirements.minimum_account_balance_pkr);
  if (balanceReq === null) {
    const alts = [
      requirements.minimum_average_balance_pkr,
      requirements.minimum_relationship_balance_pkr,
      requirements.minimum_deposit_pkr,
    ]
      .map(normalizeRequirementNumber)
      .filter((v): v is number => v !== null);
    if (alts.length > 0) balanceReq = Math.max(...alts);
  }

  const annualFeePkr = normalizeRequirementNumber(requirements.annual_fee_pkr);
  const annualFeeWaiverRule = requirements.annual_fee_waiver_rule || null;
  const benefitSummary = record.benefits || null;
  const sourceIds = record.source_ids || [];
  const cardNotes = (record.notes || []).filter((n) => n && typeof n === "string");
  const bankGaps = (record.bank_gaps || []).filter((n) => n && typeof n === "string");

  let salaryIsEstimated = false;
  let balanceIsEstimated = false;
  let estimationNote: string | null = null;
  if (salaryReq === null || balanceReq === null) {
    const tier = inferCardTier(record.card_name);
    const tierEst = reqs.estimatesByTier.get(tier);
    if (tierEst) {
      if (salaryReq === null && tierEst.medianSalary !== null) {
        salaryReq = tierEst.medianSalary;
        salaryIsEstimated = true;
      }
      if (balanceReq === null && tierEst.medianBalance !== null) {
        balanceReq = tierEst.medianBalance;
        balanceIsEstimated = true;
      }
      if (salaryIsEstimated || balanceIsEstimated) {
        const tierLabel = tier === "other" ? "similar" : tier.charAt(0).toUpperCase() + tier.slice(1);
        estimationNote = `Estimated from ${tierEst.peerCount} similar ${tierLabel} cards`;
      }
    }
  }
  const isEstimated = salaryIsEstimated || balanceIsEstimated;

  const criteria: (string | null)[] = [];
  const blockers: string[] = [];
  let salaryPassed = true;
  let balancePassed = true;
  let missingInput = false;

  if (salaryReq !== null) {
    criteria.push(formatRequirementCriterion(salaryReq, "salary"));
    if (salaryReq > 0) {
      if (state.monthlySalary === null) {
        missingInput = true;
      } else if (state.monthlySalary < salaryReq) {
        salaryPassed = false;
        const qualifier = salaryIsEstimated ? "estimated " : "listed ";
        blockers.push(`Below the ${qualifier}salary threshold of ${formatCurrency(salaryReq)} / month`);
      }
    }
  }

  if (balanceReq !== null) {
    criteria.push(formatRequirementCriterion(balanceReq, "balance"));
    if (balanceReq > 0) {
      if (state.accountBalance === null) {
        missingInput = true;
      } else if (state.accountBalance < balanceReq) {
        balancePassed = false;
        const qualifier = balanceIsEstimated ? "estimated " : "listed ";
        blockers.push(`Below the ${qualifier}account balance threshold of ${formatCurrency(balanceReq)}`);
      }
    }
  }

  if (annualFeePkr !== null) criteria.push(formatRequirementCriterion(annualFeePkr, "fee"));

  const base = {
    criteria,
    annualFeePkr,
    annualFeeWaiverRule,
    benefitSummary,
    salaryReq,
    balanceReq,
    isEstimated,
    salaryIsEstimated,
    balanceIsEstimated,
    estimationNote,
    hasRequirementRecord: true,
    sourceIds,
    cardNotes,
    bankGaps,
  };

  // Fixed OR logic: a "passed path" only counts when the path actually exists,
  // and a fail only blocks when no other path could rescue the user (passing or
  // still-undecided due to missing input).
  const hasSalaryReq = salaryReq !== null && salaryReq > 0;
  const hasBalanceReq = balanceReq !== null && balanceReq > 0;
  const salaryHardPass =
    hasSalaryReq && state.monthlySalary !== null && state.monthlySalary >= salaryReq!;
  const balanceHardPass =
    hasBalanceReq && state.accountBalance !== null && state.accountBalance >= balanceReq!;
  const salaryHardFail = hasSalaryReq && !salaryPassed;
  const balanceHardFail = hasBalanceReq && !balancePassed;
  const salaryInputMissing = hasSalaryReq && state.monthlySalary === null;
  const balanceInputMissing = hasBalanceReq && state.accountBalance === null;
  const isBlocked =
    (salaryHardFail || balanceHardFail) &&
    !(salaryHardPass || balanceHardPass) &&
    !salaryInputMissing &&
    !balanceInputMissing;

  if (isBlocked) {
    const detail = blockers.length > 1 ? `${blockers[0]} (and balance)` : blockers[0];
    if (isEstimated)
      return {
        ...base,
        status: "est_ineligible",
        label: "May not qualify (est.)",
        tone: "est-ineligible",
        sortRank: 0.5,
        detail,
      };
    return {
      ...base,
      status: "ineligible",
      label: "Likely ineligible",
      tone: "ineligible",
      sortRank: 0,
      detail,
    };
  }
  if (salaryReq === null && balanceReq === null) {
    return {
      ...base,
      status: "unclear",
      label: "Requirements unclear",
      tone: "unclear",
      sortRank: 1,
      detail: "No public salary or balance threshold was captured for this card.",
    };
  }
  if (missingInput) {
    if (isEstimated)
      return {
        ...base,
        status: "est_needs_input",
        label: "Est. requirements exist",
        tone: "est-needs-input",
        sortRank: 1.5,
        detail:
          estimationNote ||
          "Estimated thresholds exist but salary or balance details have not been entered.",
      };
    return {
      ...base,
      status: "needs_input",
      label: "Salary/balance not entered",
      tone: "needs-input",
      sortRank: 2,
      detail: "Public thresholds exist, but salary or balance details have not been entered.",
    };
  }
  if (isEstimated)
    return {
      ...base,
      status: "est_eligible",
      label: "Possibly eligible (est.)",
      tone: "est-eligible",
      sortRank: 2.5,
      detail:
        estimationNote ||
        "Entered salary and balance meet the estimated thresholds for this card.",
    };
  return {
    ...base,
    status: "eligible",
    label: "Likely eligible",
    tone: "eligible",
    sortRank: 3,
    detail: "Entered salary and balance meet the public thresholds captured for this card.",
  };
}

export function computeQualificationConfidence(
  state: Pick<AlgorithmState, "monthlySalary" | "accountBalance">,
  status: EligibilityStatus
): number {
  const hasEligibilityInput = state.monthlySalary !== null || state.accountBalance !== null;
  if (!hasEligibilityInput || !status?.hasRequirementRecord) return 0.5;
  if (status.status === "ineligible" || status.status === "est_ineligible") return 0.0;

  const scores: number[] = [];
  const scoreDimension = (
    inputValue: number | null,
    requirementValue: number | null,
    isEstimated = false
  ) => {
    const input = normalizeRequirementNumber(inputValue);
    const req = normalizeRequirementNumber(requirementValue);
    if (req === null || req <= 0) return;

    let q = 0.5;
    if (input === null) {
      q = 0.5;
    } else {
      const ratio = input / req;
      if (ratio >= 1.3) q = 1.0;
      else if (ratio >= 1.0) q = 0.8 + (ratio - 1.0) * (0.2 / 0.3);
      else if (ratio >= 0.7) q = 0.0 + (ratio - 0.7) * (0.8 / 0.3);
      else q = 0.0;
    }

    if (isEstimated) q = 0.5 + (q - 0.5) * 0.7;
    scores.push(q);
  };

  scoreDimension(state.monthlySalary, status.salaryReq, status.salaryIsEstimated);
  scoreDimension(state.accountBalance, status.balanceReq, status.balanceIsEstimated);

  if (!scores.length) return 0.5;
  return Math.max(0, Math.min(1, Math.max(...scores)));
}
