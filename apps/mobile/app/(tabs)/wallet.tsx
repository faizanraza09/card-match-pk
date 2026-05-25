import { FlashList } from "@shopify/flash-list";
import { useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CityTabs } from "@/components/CityTabs";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { FilterSheet, FilterSheetHandle } from "@/components/FilterSheet";
import { Pill } from "@/components/Pill";
import { ResultsHeader } from "@/components/ResultsHeader";
import { TopBar } from "@/components/TopBar";
import { computeWalletRecommendations } from "@/lib/algorithms";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store";
import { WalletObjective, WalletShape } from "@/types";
import { colors, radii, shadow, spacing, typography } from "@/theme";

export default function BuildWalletScreen() {
  const state = useAppStore();
  const sheet = useRef<FilterSheetHandle>(null);
  const result = useMemo(() => computeWalletRecommendations(state), [state]);

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <TopBar />
      <CityTabs />
      <ResultsHeader
        count={result.ranked.length}
        countLabel="wallet shapes"
        subtitle={`${result.stats.K ?? state.walletSize} cards • objective: ${result.stats.objective ?? "savings"}`}
        onPressFilters={() => sheet.current?.open()}
      />
      <FlashList
        ListHeaderComponent={<WalletConfig />}
        data={result.ranked}
        keyExtractor={(w) => w.walletKey}
        renderItem={({ item, index }) => <WalletCard wallet={item} rank={index + 1} />}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          result.stats.warnings.length ? (
            <View style={styles.warnBox}>
              {result.stats.warnings.map((w, i) => (
                <Text key={i} style={styles.warnText}>• {w}</Text>
              ))}
            </View>
          ) : null
        }
      />
      <FilterSheet ref={sheet} />
    </SafeAreaView>
  );
}

function WalletConfig() {
  const k = useAppStore((s) => s.walletSize);
  const setK = useAppStore((s) => s.setWalletSize);
  const obj = useAppStore((s) => s.walletObjective);
  const setObj = useAppStore((s) => s.setWalletObjective);
  const noSameBank = useAppStore((s) => s.walletNoSameBank);
  const setNoSameBank = useAppStore((s) => s.setWalletNoSameBank);
  const mixed = useAppStore((s) => s.walletMixedTypes);
  const setMixed = useAppStore((s) => s.setWalletMixedTypes);
  const onOwned = useAppStore((s) => s.walletBuildOnOwned);
  const setOnOwned = useAppStore((s) => s.setWalletBuildOnOwned);
  const ownedCount = useAppStore((s) => s.ownedCards.size);

  const objectives: { v: WalletObjective; label: string }[] = [
    { v: "savings", label: "Max savings" },
    { v: "coverage", label: "Max coverage" },
    { v: "roi", label: "Best ROI" },
  ];

  return (
    <View style={styles.config}>
      <Text style={styles.configTitle}>Build a wallet</Text>
      <Label>Wallet size</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[2, 3, 4].map((n) => (
          <Pill key={n} label={`${n} cards`} active={k === n} onPress={() => setK(n)} />
        ))}
      </ScrollView>
      <Label>Objective</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {objectives.map((o) => (
          <Pill key={o.v} label={o.label} active={obj === o.v} onPress={() => setObj(o.v)} />
        ))}
      </ScrollView>
      <SwitchRow label="Different banks only" value={noSameBank} onChange={setNoSameBank} />
      <SwitchRow label="Need at least one debit + one credit" value={mixed} onChange={setMixed} />
      {ownedCount > 0 ? (
        <SwitchRow
          label={`Build on top of my ${ownedCount} owned card${ownedCount === 1 ? "" : "s"}`}
          value={onOwned}
          onChange={setOnOwned}
        />
      ) : null}
    </View>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable style={styles.switchRow} onPress={() => onChange(!value)}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.brand, false: colors.border }}
      />
    </Pressable>
  );
}

function WalletCard({ wallet, rank }: { wallet: WalletShape; rank: number }) {
  const isTopPick = rank === 1;
  return (
    <View style={[styles.walletCard, isTopPick && styles.walletCardTop]}>
      {isTopPick ? (
        <View style={styles.topRibbon}>
          <Text style={styles.topRibbonText}>OPTIMAL WALLET</Text>
        </View>
      ) : null}
      <View style={styles.walletHeader}>
        <View>
          <Text style={styles.walletLabel}>WALLET #{rank}</Text>
          <Text style={styles.heroValue}>{formatCurrency(wallet.perOutingTotal)}<Text style={styles.heroUnit}> /outing</Text></Text>
        </View>
        <View style={styles.scoreCol}>
          <Text style={styles.walletScore}>{Math.round(wallet.score ?? 0)}</Text>
          <Text style={styles.walletScoreLabel}>SCORE</Text>
        </View>
      </View>

      <Text style={styles.microStats}>
        <Text style={styles.microBold}>{Math.round(wallet.coverage * 100)}%</Text> coverage ·{" "}
        {wallet.feeUnknown ? "fees unknown" : `${formatCurrency(wallet.totalAnnualFee)}/yr fees`}
      </Text>

      <View style={styles.divider} />

      {wallet.picks.map((p, i) => (
        <View key={p.cardKey} style={[styles.pickRow, i === 0 && { borderTopWidth: 0 }]}>
          <View style={styles.pickBadge}>
            <Text style={styles.pickBadgeText}>{p.pinned ? "📌" : i + 1}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.pickBank} numberOfLines={1}>{p.bank}</Text>
            <Text style={styles.pickCard} numberOfLines={2}>{p.card}</Text>
            <View style={styles.pickFooter}>
              <EligibilityBadge status={p.requirementStatus} />
              <Text style={styles.pickMeta}>
                +{formatCurrency(p.marginalDelta)} · {p.coveredByCard} venues
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 80, paddingTop: 4 },
  config: {
    backgroundColor: colors.bgElev,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  configTitle: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  switchLabel: {
    color: colors.text,
    fontSize: typography.size.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  walletCard: {
    backgroundColor: colors.bgElev,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  walletCardTop: {
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
  walletHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  walletLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
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
  scoreCol: { alignItems: "flex-end" },
  walletScore: {
    color: colors.text,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.black,
    lineHeight: typography.size.xxl + 2,
  },
  walletScoreLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: typography.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 1,
  },
  microStats: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 4 },
  microBold: { color: colors.text, fontWeight: typography.weight.bold },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  pickRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pickBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  pickBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
  },
  pickBank: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickCard: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },
  pickFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  pickMeta: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  warnBox: {
    backgroundColor: colors.toneNeedsInputBg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  warnText: {
    color: colors.toneNeedsInput,
    fontSize: typography.size.sm,
    marginBottom: 2,
  },
});
