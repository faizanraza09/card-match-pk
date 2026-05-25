import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { CardRecommendation } from "@/types";
import { formatCurrency } from "@/lib/format";
import { getBankLogoUrl } from "@/lib/bankLogo";
import { colors, radii, scoreColor, shadow, spacing, typography } from "@/theme";
import { EligibilityBadge } from "./EligibilityBadge";

// Mobile card row — designed for thumb-scrolling, not desktop scanning.
//
//   [logo]  BANK NAME              fit score (right)
//           Card name               ____
//           [eligibility] [type]
//   ─────────────────────────────────────────
//   Estimated saving
//   PKR 3,318  /outing             ← hero stat
//   348 venues · 34% avg · cap PKR 10K
//   Top: Ginsoy · PKR 5K/visit
//
// Rank #1 gets a tinted background + "TOP PICK" ribbon. Everyone else is plain
// white. The 4-stat grid that worked on desktop is intentionally collapsed:
// mobile users get one big number plus a one-line micro-stat strip.
export function CardRow({ item, rank }: { item: CardRecommendation; rank: number }) {
  const isTopPick = rank === 1;
  const rowStyle = StyleSheet.flatten<ViewStyle>([
    styles.row,
    isTopPick ? styles.rowTop : null,
  ] as StyleProp<ViewStyle>);

  return (
    <Link
      href={{ pathname: "/card/[id]", params: { id: `${item.bank}||${item.card}` } }}
      asChild
    >
      <Pressable style={rowStyle}>
        {isTopPick ? (
          <View style={styles.topRibbon}>
            <Text style={styles.topRibbonText}>#1 TOP PICK</Text>
          </View>
        ) : null}

        <View style={styles.head}>
          <BankLogo bank={item.bank} large={isTopPick} />
          <View style={styles.titleCol}>
            <Text style={[styles.bank, isTopPick && styles.bankTop]} numberOfLines={1}>
              {item.bank}
            </Text>
            <Text style={[styles.card, isTopPick && styles.cardTop]} numberOfLines={2}>
              {item.card}
            </Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNum, { color: scoreColor(item.score) }]}>
              {item.score.toFixed(1)}
            </Text>
            <Text style={styles.scoreLabel}>FIT SCORE</Text>
            <View style={[styles.scoreBar, { backgroundColor: scoreColor(item.score) }]} />
          </View>
        </View>

        <View style={styles.tagsRow}>
          <EligibilityBadge status={item.requirementStatus} />
          {item.cardCategory ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.cardCategory}</Text>
            </View>
          ) : null}
          {!isTopPick && rank ? (
            <Text style={styles.rankTag}>#{rank}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <Text style={styles.heroLabel}>Estimated saving</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroValue}>{formatCurrency(item.avgExpectedSaving)}</Text>
          <Text style={styles.heroUnit}> /outing</Text>
        </View>

        <Text style={styles.microStats} numberOfLines={1}>
          <Text style={styles.microBold}>
            {item.coveredVenueCount}
          </Text>{" "}
          of {item.totalVenueCount} venues
          {item.averageDiscount !== null ? `  ·  ${Math.round(item.averageDiscount)}% avg` : ""}
          {item.medianCap ? `  ·  cap ${formatCurrency(item.medianCap)}` : ""}
        </Text>

        {item.topMatches[0] ? (
          <Text style={styles.topMatch} numberOfLines={1}>
            <Text style={styles.topMatchPrefix}>Top: </Text>
            <Text style={styles.topMatchName}>{item.topMatches[0].restaurant}</Text>{" "}
            · {formatCurrency(item.topMatches[0].expectedSaving)}/visit
          </Text>
        ) : null}

        {item.saturationBill !== null ? (
          <Text style={styles.sweetSpot} numberOfLines={1}>
            Sweet spot:{" "}
            <Text style={styles.sweetSpotBold}>
              bills ≤ {formatCurrency(item.saturationBill as number)}
            </Text>
          </Text>
        ) : (
          <Text style={styles.sweetSpot} numberOfLines={1}>
            <Text style={styles.sweetSpotBold}>Uncapped saving</Text> at any bill size
          </Text>
        )}
      </Pressable>
    </Link>
  );
}

function BankLogo({ bank, large }: { bank: string; large?: boolean }) {
  const url = getBankLogoUrl(bank);
  const size = large ? 48 : 40;
  if (!url) {
    return (
      <View style={[styles.logoFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.logoFallbackText}>{(bank || "?").slice(0, 2).toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.logoWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={{ uri: url }} style={{ width: "78%", height: "78%" }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.bgElev,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowTop: {
    backgroundColor: colors.bgTint,
    borderWidth: 1,
    borderColor: colors.brandLight,
    paddingTop: spacing.sm,
  },
  topRibbon: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  topRibbonText: {
    color: colors.textOnBrand,
    fontSize: 10,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  logoWrap: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoFallback: {
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    color: colors.textMuted,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  titleCol: { flex: 1, minWidth: 0, paddingTop: 2 },
  bank: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bankTop: { color: colors.brand },
  card: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    lineHeight: typography.size.lg + 4,
  },
  cardTop: { fontSize: typography.size.xl },
  scoreCol: { alignItems: "flex-end", minWidth: 60 },
  scoreNum: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.black,
    lineHeight: typography.size.xxl + 2,
  },
  scoreLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: typography.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 1,
  },
  scoreBar: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: "capitalize",
  },
  rankTag: {
    color: colors.textDim,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  heroValue: {
    color: colors.brand,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.black,
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  microStats: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 4,
  },
  microBold: {
    color: colors.text,
    fontWeight: typography.weight.bold,
  },
  topMatch: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 6,
  },
  topMatchPrefix: { fontWeight: typography.weight.semibold },
  topMatchName: { color: colors.text, fontWeight: typography.weight.semibold },
  sweetSpot: {
    color: colors.textDim,
    fontSize: typography.size.xs,
    marginTop: 4,
  },
  sweetSpotBold: { color: colors.textMuted, fontWeight: typography.weight.semibold },
});
