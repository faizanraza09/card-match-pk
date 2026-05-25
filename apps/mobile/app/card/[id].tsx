import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { evaluateEligibility } from "@/lib/eligibility";
import { computeRecommendations } from "@/lib/algorithms";
import { formatCurrency } from "@/lib/format";
import { getBankLogoUrl } from "@/lib/bankLogo";
import { useAppStore } from "@/store";
import { colors, radii, scoreColor, shadow, spacing, typography } from "@/theme";

export default function CardDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const state = useAppStore();
  const [bank, card] = (params.id || "").split("||");

  const recs = useMemo(() => computeRecommendations(state), [state]);
  const rec = recs.find((r) => r.bank === bank && r.card === card);
  const eligibility = useMemo(() => evaluateEligibility(state, bank, card), [state, bank, card]);
  const logoUrl = getBankLogoUrl(bank);

  if (!rec) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Stack.Screen options={{ title: card || "Card" }} />
        <Text style={styles.text}>Card not found in current scope.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Stack.Screen options={{ title: bank, headerTintColor: colors.text }} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.logoWrap}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={{ width: "78%", height: "78%" }} resizeMode="contain" />
            ) : (
              <Text style={styles.logoFallback}>{bank.slice(0, 2).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.heroBank}>{bank}</Text>
            <Text style={styles.heroCardName}>{card}</Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNum, { color: scoreColor(rec.score) }]}>
              {rec.score.toFixed(1)}
            </Text>
            <Text style={styles.scoreLabel}>FIT</Text>
            <View style={[styles.scoreBar, { backgroundColor: scoreColor(rec.score) }]} />
          </View>
        </View>
        <View style={styles.tagsRow}>
          <EligibilityBadge status={eligibility} />
          {rec.cardCategory ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{rec.cardCategory}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Hero stat */}
      <View style={styles.statCard}>
        <Text style={styles.heroLabel}>Estimated saving</Text>
        <View style={styles.heroValueRow}>
          <Text style={styles.heroValue}>{formatCurrency(rec.avgExpectedSaving)}</Text>
          <Text style={styles.heroUnit}> /outing</Text>
        </View>
        <View style={styles.miniGrid}>
          <MiniStat
            label="Coverage"
            value={`${Math.round(rec.coverage * 100)}%`}
            sub={`${rec.coveredVenueCount}/${rec.totalVenueCount}`}
          />
          <MiniStat
            label="Avg discount"
            value={rec.averageDiscount !== null ? `${Math.round(rec.averageDiscount)}%` : "—"}
          />
          <MiniStat
            label="Median cap"
            value={rec.medianCap ? formatCurrency(rec.medianCap) : "—"}
          />
        </View>
      </View>

      {/* Requirements */}
      <Section title="Requirements">
        {eligibility.criteria.filter(Boolean).length === 0 ? (
          <Text style={styles.muted}>No public criteria captured for this card.</Text>
        ) : (
          <>
            <ReqRow
              label="Min. salary"
              value={
                eligibility.salaryReq === null
                  ? "Not listed"
                  : eligibility.salaryReq === 0
                  ? "None required"
                  : `${eligibility.salaryIsEstimated ? "~" : ""}${formatCurrency(eligibility.salaryReq)} / month`
              }
              estimated={eligibility.salaryIsEstimated}
            />
            <ReqRow
              label="Min. balance"
              value={
                eligibility.balanceReq === null
                  ? "Not listed"
                  : eligibility.balanceReq === 0
                  ? "None required"
                  : `${eligibility.balanceIsEstimated ? "~" : ""}${formatCurrency(eligibility.balanceReq)}`
              }
              estimated={eligibility.balanceIsEstimated}
            />
            <ReqRow
              label="Annual fee"
              value={
                eligibility.annualFeePkr === null
                  ? eligibility.annualFeeWaiverRule
                    ? "Conditional"
                    : "Not listed"
                  : eligibility.annualFeePkr === 0
                  ? "No annual fee"
                  : formatCurrency(eligibility.annualFeePkr)
              }
            />
          </>
        )}
        {eligibility.detail ? (
          <Text style={[styles.muted, styles.detailNote]}>{eligibility.detail}</Text>
        ) : null}
        {eligibility.annualFeeWaiverRule ? (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>FEE WAIVER</Text>
            <Text style={styles.noteText}>{eligibility.annualFeeWaiverRule}</Text>
          </View>
        ) : null}
        {eligibility.cardNotes?.length ? (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>NOTES</Text>
            {eligibility.cardNotes.map((n, i) => (
              <Text key={i} style={styles.noteText}>· {n}</Text>
            ))}
          </View>
        ) : null}
      </Section>

      {/* Top wins */}
      {rec.topMatches.length > 0 ? (
        <Section title="Top wins">
          {rec.topMatches.map((m, i) => (
            <View key={m.venueKey} style={[styles.winRow, i === 0 && { borderTopWidth: 0 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.winRestaurant} numberOfLines={1}>{m.restaurant}</Text>
                <Text style={styles.winSub} numberOfLines={2}>
                  {m.discountLabel || ""}
                  {m.discountLabel && m.offerTitle ? "  ·  " : ""}
                  {m.offerTitle || ""}
                </Text>
                <Text style={styles.winDays} numberOfLines={1}>{m.daysLabel || ""}</Text>
              </View>
              <View style={styles.winRight}>
                <Text style={styles.winSaving}>{formatCurrency(m.expectedSaving)}</Text>
                <Text style={styles.winUnit}>/outing</Text>
              </View>
            </View>
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
      {sub ? <Text style={styles.miniStatSub}>{sub}</Text> : null}
    </View>
  );
}

function ReqRow({
  label,
  value,
  estimated,
}: {
  label: string;
  value: string;
  estimated?: boolean;
}) {
  return (
    <View style={styles.reqRow}>
      <Text style={styles.reqLabel}>{label}</Text>
      <Text style={[styles.reqValue, estimated && styles.reqValueEst]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 64 },
  center: { alignItems: "center", justifyContent: "center" },
  text: { color: colors.text, fontSize: typography.size.md },

  hero: {
    backgroundColor: colors.bgElev,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadow.card,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoFallback: {
    color: colors.textMuted,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  heroBank: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroCardName: {
    color: colors.text,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.black,
    lineHeight: typography.size.xl + 4,
    marginTop: 2,
  },
  scoreCol: { alignItems: "flex-end", minWidth: 56 },
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
    marginTop: spacing.md,
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

  statCard: {
    backgroundColor: colors.bgElev,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  heroValue: {
    color: colors.brand,
    fontSize: typography.size.display,
    fontWeight: typography.weight.black,
    lineHeight: typography.size.display + 2,
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  miniGrid: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  miniStat: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  miniStatLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  miniStatValue: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },
  miniStatSub: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 },

  section: {
    backgroundColor: colors.bgElev,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  muted: { color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 20 },
  detailNote: { marginTop: spacing.sm, fontStyle: "italic" },

  reqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reqLabel: { color: colors.textMuted, fontSize: typography.size.sm },
  reqValue: {
    color: colors.text,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    textAlign: "right",
  },
  reqValueEst: { color: colors.textMuted },

  note: {
    marginTop: spacing.md,
    backgroundColor: colors.bgSubtle,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  noteLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  noteText: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    lineHeight: 19,
    marginTop: 1,
  },

  winRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  winRestaurant: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  winSub: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  winDays: {
    color: colors.textDim,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  winRight: { alignItems: "flex-end", marginLeft: spacing.sm },
  winSaving: {
    color: colors.brand,
    fontSize: typography.size.md,
    fontWeight: typography.weight.black,
  },
  winUnit: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: typography.weight.semibold,
    textTransform: "uppercase",
  },
});
