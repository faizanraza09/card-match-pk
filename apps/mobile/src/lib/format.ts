export function formatCurrency(value: number): string {
  return `PKR ${Math.round(value).toLocaleString("en-US")}`;
}

export function formatNumber(value: number): string {
  return Number(value).toLocaleString("en-US");
}

export function formatSavingsAmount(
  value: number,
  options: { per?: string; signed?: boolean } = {}
): string {
  const { per = "", signed = false } = options;
  const rounded = Math.round(Number(value) || 0);
  const unit = per ? `/${per}` : "";
  if (signed && rounded < 0) return `~Cost ${formatCurrency(Math.abs(rounded))}${unit}`;
  return `~Save ${formatCurrency(Math.abs(rounded))}${unit}`;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function buildCardKey(bank: string, card: string): string {
  return `${bank} || ${card}`;
}

export function buildDealCardKey(bank: string, card: string): string {
  return `${normalizeDealCardFragment(bank)} || ${normalizeDealCardFragment(card)}`;
}

export function normalizeDealCardFragment(value: string): string {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeRequirementNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCityValue(city: string | null | undefined): string {
  const normalized = String(city || "").trim().toLowerCase();
  return normalized || "all";
}

export function formatRequirementCriterion(
  value: number | null,
  kind: "salary" | "balance" | "fee"
): string | null {
  if (value === null) return null;
  if (kind === "salary") {
    return value === 0 ? "No minimum salary" : `Salary at least ${formatCurrency(value)} / month`;
  }
  if (kind === "balance") {
    return value === 0 ? "No minimum balance" : `Balance at least ${formatCurrency(value)}`;
  }
  if (kind === "fee") {
    return value === 0 ? "No annual fee" : `Annual fee ${formatCurrency(value)}`;
  }
  return null;
}

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
