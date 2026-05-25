// Brand tokens lifted from card-match-pk/assets/styles.css.
// Keep names parallel so future shared design work is one mental model.

export const colors = {
  brand: "#BD5B3D",       // primary terracotta (matches web --brand)
  brandDark: "#9F4A33",
  brandLight: "#F4DDD2",  // very soft peach for the top-pick tinted row

  bg: "#F8F7F4",          // page background (pale paper, near-white)
  bgElev: "#FFFFFF",      // card surface
  bgSubtle: "#EEECE5",    // neutral light (inputs, segmented bg, stat container)
  bgTint: "#FBEEDF",      // top-pick subtle peach

  text: "#1A1916",
  textMuted: "#56524C",   // less brown, more neutral gray
  textDim: "#8A867E",
  textOnBrand: "#FFFFFF",

  border: "#E6E3DA",
  borderStrong: "#D2CDC0",

  green: "#2C7A4B",
  amber: "#C68A1F",
  red: "#B23A48",

  // Eligibility tone colors (mirror web .tone-eligible etc.)
  toneEligible: "#2C7A4B",
  toneEligibleBg: "#E5F1EA",
  toneEstEligible: "#5A7F4F",
  toneEstEligibleBg: "#ECF1E5",
  toneIneligible: "#B23A48",
  toneIneligibleBg: "#F8E3E5",
  toneNeedsInput: "#8A6D2F",
  toneNeedsInputBg: "#F5EBD6",
  toneUnclear: "#605A53",
  toneUnclearBg: "#EDE7DC",
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  // System font family — RN will substitute San Francisco on iOS, Roboto on
  // Android. Avoids a custom font dep for v1; can swap to Outfit later via
  // expo-font without changing call sites.
  family: undefined as string | undefined,
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    black: "800" as const,
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

export function eligibilityTone(tone: string): { color: string; bg: string } {
  switch (tone) {
    case "eligible":
      return { color: colors.toneEligible, bg: colors.toneEligibleBg };
    case "est-eligible":
      return { color: colors.toneEstEligible, bg: colors.toneEstEligibleBg };
    case "ineligible":
    case "est-ineligible":
      return { color: colors.toneIneligible, bg: colors.toneIneligibleBg };
    case "needs-input":
    case "est-needs-input":
      return { color: colors.toneNeedsInput, bg: colors.toneNeedsInputBg };
    case "unclear":
    default:
      return { color: colors.toneUnclear, bg: colors.toneUnclearBg };
  }
}

export function scoreColor(score: number) {
  return score >= 70 ? colors.green : score >= 50 ? colors.amber : colors.red;
}
