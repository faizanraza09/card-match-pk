import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import { useMemo, useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CityTabs } from "@/components/CityTabs";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { FilterSheet, FilterSheetHandle } from "@/components/FilterSheet";
import { OwnedCardPicker } from "@/components/OwnedCardPicker";
import { ResultsHeader } from "@/components/ResultsHeader";
import { TopBar } from "@/components/TopBar";
import { computeNextCardRecommendations } from "@/lib/algorithms";
import { formatCurrency } from "@/lib/format";
import { getBankLogoUrl } from "@/lib/bankLogo";
import { useAppStore } from "@/store";
import { NextCardRecommendation } from "@/types";
import { colors, radii, scoreColor, shadow, spacing, typography } from "@/theme";

export default function MyWalletScreen() {
  const state = useAppStore();
  const sheet = useRef<FilterSheetHandle>(null);
  const result = useMemo(() => computeNextCardRecommendations(state), [state]);

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <TopBar />
      <CityTabs />
      <ResultsHeader
        count={result.ranked.length}
        countLabel="next-card picks"
        subtitle={
          state.ownedCards.size > 0
            ? `Your wallet covers ${result.stats.wallet?.coveredVenues ?? 0} of ${result.stats.venuesInScope} venues`
            : "Add your cards to unlock personalised picks"
        }
        onPressFilters={() => sheet.current?.open()}
      />
      <FlashList
        data={result.ranked}
        ListHeaderComponent={
          <View style={styles.setup}>
            <OwnedCardPicker />
            {state.ownedCards.size > 0 && result.stats.wallet ? (
              <View style={styles.walletStats}>
                <WalletStat label="Per outing" value={formatCurrency(result.stats.wallet.perOuting)} />
                <WalletStat label="Coverage" value={`${Math.round(result.stats.wallet.coverage * 100)}%`} />
                <WalletStat label="Est. yearly" value={formatCurrency(result.stats.wallet.yearly)} />
              </View>
            ) : null}
          </View>
        }
        keyExtractor={(item) => `${item.bank}||${item.card}`}
        renderItem={({ item, index }) => <NextCardRow item={item} rank={index + 1} />}
        contentContainerStyle={styles.list}
      />
      <FilterSheet ref={sheet} />
    </SafeAreaView>
  );
}

function NextCardRow({ item, rank }: { item: NextCardRecommendation; rank: number }) {
  const isTopPick = rank === 1;
  const rowStyle = StyleSheet.flatten<ViewStyle>([
    styles.row,
    isTopPick ? styles.rowTop : null,
  ] as StyleProp<ViewStyle>);
  const logoUrl = getBankLogoUrl(item.bank);

  return (
    <Link
      href={{ pathname: "/card/[id]", params: { id: `${item.bank}||${item.card}` } }}
      asChild
    >
      <Pressable style={rowStyle}>
        {isTopPick ? (
          <View style={styles.topRibbon}>
            <Text style={styles.topRibbonText}>BIGGEST UPSIDE</Text>
          </View>
        ) : null}

        <View style={styles.head}>
          <View style={styles.logoWrap}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={{ width: "78%", height: "78%" }} resizeMode="contain" />
            ) : (
              <Text style={styles.logoFallbackText}>{item.bank.slice(0, 2).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.titleCol}>
            <Text style={[styles.bank, isTopPick && styles.bankTop]} numberOfLines={1}>
              {item.bank}
            </Text>
            <Text style={styles.cardName} numberOfLines={2}>
              {item.card}
            </Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNum, { color: scoreColor(item.score) }]}>
              {item.score.toFixed(1)}
            </Text>
            <Text style={styles.scoreLabel}>FIT</Text>
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
          <Text style={styles.rankTag}>#{rank}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.heroLabel}>Extra saving on top of your wallet</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroValue}>+{formatCurrency(item.avgDeltaPerOuting)}</Text>
          <Text style={styles.heroUnit}> /outing</Text>
        </View>

        <Text style={styles.microStats} numberOfLines={1}>
          <Text style={styles.microBold}>{item.newVenues}</Text> new venue
          {item.newVenues === 1 ? "" : "s"} · <Text style={styles.microBold}>{item.boostedVenues}</Text> boosted · est.{" "}
          <Text style={styles.microBold}>{formatCurrency(item.yearlyDelta)}</Text>/yr
        </Text>

        {item.topVenueWins[0] ? (
          <Text style={styles.topMatch} numberOfLines={1}>
            <Text style={styles.topMatchPrefix}>Biggest win: </Text>
            <Text style={styles.topMatchName}>{item.topVenueWins[0].restaurant}</Text>
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

function WalletStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxLabel}>{label}</Text>
      <Text style={styles.statBoxValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 80, paddingTop: 4 },
  setup: {
    backgroundColor: colors.bgElev,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  walletStats: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  statBoxLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statBoxValue: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  cardName: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    lineHeight: typography.size.lg + 4,
  },
  scoreCol: { alignItems: "flex-end", minWidth: 50 },
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
  scoreBar: { width: 28, height: 3, borderRadius: 2, marginTop: 4 },
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
  microStats: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 4 },
  microBold: { color: colors.text, fontWeight: typography.weight.bold },
  topMatch: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 6 },
  topMatchPrefix: { fontWeight: typography.weight.semibold },
  topMatchName: { color: colors.text, fontWeight: typography.weight.semibold },
});
