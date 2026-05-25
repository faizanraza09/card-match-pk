import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { deleteVisit, listVisits, monthlySummary, Visit } from "@/lib/visits";
import { formatCurrency } from "@/lib/format";
import { colors, radii, shadow, spacing, typography } from "@/theme";

export default function Visits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [summary, setSummary] = useState<{
    totalBill: number;
    totalSaving: number;
    visitCount: number;
    byCard: { bank: string; card: string; saving: number; visits: number }[];
  } | null>(null);

  const refresh = useCallback(async () => {
    const all = await listVisits(200);
    setVisits(all);
    const s = await monthlySummary(new Date());
    setSummary({
      totalBill: s.totalBill,
      totalSaving: s.totalSaving,
      visitCount: s.visitCount,
      byCard: s.byCard,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 64 }}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{monthName}</Text>
        <Text style={styles.heroSaving}>{formatCurrency(summary?.totalSaving ?? 0)} saved</Text>
        <Text style={styles.heroSub}>
          {summary?.visitCount ?? 0} visit{summary?.visitCount === 1 ? "" : "s"} • bill total{" "}
          {formatCurrency(summary?.totalBill ?? 0)}
        </Text>
      </View>

      {summary?.byCard?.length ? (
        <Section title="By card">
          {summary.byCard.map((b) => (
            <View key={`${b.bank}||${b.card}`} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{b.bank} — {b.card}</Text>
                <Text style={styles.rowSub}>
                  {b.visits} visit{b.visits === 1 ? "" : "s"}
                </Text>
              </View>
              <Text style={styles.rowValue}>{formatCurrency(b.saving)}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title={`Recent visits (${visits.length})`}>
        {visits.length === 0 ? (
          <Text style={styles.empty}>
            No visits logged yet. Use Swipe at the counter to log your first one.
          </Text>
        ) : (
          visits.map((v) => (
            <View key={v.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{v.restaurant}</Text>
                <Text style={styles.rowSub}>
                  {new Date(v.ts).toLocaleDateString()} • {v.bank} • {v.card}
                </Text>
                <Text style={styles.rowSub}>
                  Bill {formatCurrency(v.bill_pkr)}
                </Text>
              </View>
              <Text style={styles.rowValue}>~{formatCurrency(v.saving_pkr)}</Text>
              <Pressable
                onPress={async () => {
                  if (v.id) {
                    await deleteVisit(v.id);
                    refresh();
                  }
                }}
                style={styles.delBtn}
                hitSlop={10}
              >
                <Text style={styles.delBtnText}>×</Text>
              </Pressable>
            </View>
          ))
        )}
      </Section>
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.bgElev,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.card,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroSaving: {
    color: colors.toneEligible,
    fontSize: typography.size.display,
    fontWeight: typography.weight.black,
    marginTop: spacing.sm,
  },
  heroSub: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.xs },
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
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  empty: { color: colors.textMuted, fontSize: typography.size.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowTitle: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  rowSub: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  rowValue: {
    color: colors.toneEligible,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.sm,
  },
  delBtn: { paddingHorizontal: spacing.sm },
  delBtnText: { color: colors.textDim, fontSize: 22 },
});
