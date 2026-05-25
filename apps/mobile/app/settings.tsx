import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { ensureNotificationsReady, scheduleAnnualFeeReminder, clearScheduledReminders } from "@/lib/notifications";
import { registerPushWithBackend, unregisterPush } from "@/lib/pushRegister";
import { getOwnedCardAnniversaries, setOwnedCardAnniversary } from "@/lib/visits";
import { useAppStore } from "@/store";
import { colors, radii, shadow, spacing, typography } from "@/theme";

export default function Settings() {
  const owned = useAppStore((s) => s.ownedCards);
  const favorites = useAppStore((s) => s.favoriteRestaurants);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [anniversaries, setAnniversaries] = useState<Record<string, number | null>>({});

  useEffect(() => {
    (async () => {
      const rows = await getOwnedCardAnniversaries();
      const map: Record<string, number | null> = {};
      rows.forEach((r) => (map[r.card_key] = r.anniversary_month));
      setAnniversaries(map);
    })();
  }, []);

  const togglePush = async (v: boolean) => {
    if (v) {
      const ok = await ensureNotificationsReady();
      if (!ok) return;
      await registerPushWithBackend(Array.from(favorites));
      setPushEnabled(true);
    } else {
      await unregisterPush();
      await clearScheduledReminders();
      setPushEnabled(false);
    }
  };

  const setAnniv = async (cardKey: string, month: number) => {
    await setOwnedCardAnniversary(cardKey, month);
    setAnniversaries((m) => ({ ...m, [cardKey]: month }));
    const [bank, card] = cardKey.split(" || ");
    await scheduleAnnualFeeReminder({ cardKey, bank, card, anniversaryMonth: month });
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 64 }}>
      <Section title="Notifications">
        <SwitchRow
          label="New offers at my favourites"
          value={pushEnabled}
          onChange={togglePush}
          sub={
            favorites.size === 0
              ? "Star restaurants from the Restaurants tab to enable this."
              : `${favorites.size} favorite${favorites.size === 1 ? "" : "s"} tracked.`
          }
        />
      </Section>

      {owned.size > 0 ? (
        <Section title="Annual fee reminders">
          {Array.from(owned).map((ck) => {
            const [bank, card] = ck.split(" || ");
            const m = anniversaries[ck];
            return (
              <View key={ck} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{bank} • {card}</Text>
                  <Text style={styles.rowSub}>
                    {m
                      ? `Reminder set for ${monthName(m)}.`
                      : "Pick the month your card renews to get a 30-day heads-up."}
                  </Text>
                </View>
                <MonthPicker selected={m ?? null} onChange={(month) => setAnniv(ck, month)} />
              </View>
            );
          })}
        </Section>
      ) : null}

      <Section title="About">
        <Text style={styles.bodyText}>
          Data is fetched from konsacard.pk and refreshed when the underlying offers file changes. Pull-to-refresh on any list to fetch the latest immediately.
        </Text>
      </Section>
    </ScrollView>
  );
}

function MonthPicker({
  selected,
  onChange,
}: {
  selected: number | null;
  onChange: (m: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[styles.monthBtn, selected ? styles.monthBtnSet : null]}
      >
        <Text style={styles.monthBtnText}>{selected ? monthName(selected) : "Pick month"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.monthGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                onChange(i + 1);
                setOpen(false);
              }}
              style={[styles.monthCell, selected === i + 1 ? styles.monthCellSel : null]}
            >
              <Text style={[styles.monthCellTxt, selected === i + 1 ? styles.monthCellTxtSel : null]}>
                {monthName(i + 1).slice(0, 3)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function monthName(m: number): string {
  return new Date(2024, m - 1, 1).toLocaleDateString("en-US", { month: "long" });
}

function SwitchRow({
  label,
  value,
  onChange,
  sub,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  sub?: string;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.brand, false: colors.border }}
      />
    </View>
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rowTitle: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  rowSub: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bodyText: { color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 20 },
  monthBtn: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minWidth: 96,
    alignItems: "center",
  },
  monthBtnSet: { backgroundColor: colors.brand },
  monthBtnText: { color: colors.text, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 220,
    marginTop: spacing.xs,
    backgroundColor: colors.bgElev,
    borderRadius: radii.md,
    padding: 4,
  },
  monthCell: {
    width: "33%",
    paddingVertical: 6,
    alignItems: "center",
  },
  monthCellSel: { backgroundColor: colors.brand, borderRadius: radii.sm },
  monthCellTxt: { color: colors.text, fontSize: typography.size.xs },
  monthCellTxtSel: { color: colors.textOnBrand, fontWeight: typography.weight.bold },
});
