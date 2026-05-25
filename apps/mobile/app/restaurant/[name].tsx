import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getOfferDiscountPct, getOfferSavingValue } from "@/lib/savings";
import { formatCurrency } from "@/lib/format";
import { useAppStore } from "@/store";
import { colors, radii, shadow, spacing, typography } from "@/theme";

export default function RestaurantDetail() {
  const params = useLocalSearchParams<{ name: string; city?: string }>();
  const restaurantName = params.name;
  const data = useAppStore((s) => s.data);
  const orderValue = useAppStore((s) => s.orderValue);
  const ownedCards = useAppStore((s) => s.ownedCards);
  const fav = useAppStore((s) => s.favoriteRestaurants.has(restaurantName));
  const toggleFav = useAppStore((s) => s.toggleFavorite);

  const enrichment = data?.restaurantsEnrichment[restaurantName];
  const offers = useMemo(() => {
    if (!data) return [];
    return data.offers
      .filter((o) => o.restaurant === restaurantName && (!params.city || o.city === params.city))
      .map((o) => ({
        offer: o,
        saving: getOfferSavingValue(o, orderValue) || 0,
        pct: getOfferDiscountPct(o),
        owned: ownedCards.has(`${o.bank} || ${o.card}`),
      }))
      .sort((a, b) => b.saving - a.saving);
  }, [data, restaurantName, params.city, orderValue, ownedCards]);

  const branches =
    (params.city && enrichment?.branchesByCity?.[params.city]) ||
    (enrichment?.branchesByCity
      ? Object.values(enrichment.branchesByCity).flat()
      : []);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 64 }}>
      <Stack.Screen
        options={{
          title: restaurantName,
          headerRight: () => (
            <Pressable onPress={() => toggleFav(restaurantName)} hitSlop={10}>
              <Text style={{ fontSize: 22, color: fav ? colors.brand : colors.textDim, marginRight: spacing.md }}>
                {fav ? "★" : "☆"}
              </Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.hero}>
        <Text style={styles.name}>{restaurantName}</Text>
        {enrichment?.servesCuisine?.length ? (
          <Text style={styles.cuisine}>{enrichment.servesCuisine.join(" · ")}</Text>
        ) : null}
        {enrichment?.description ? (
          <Text style={styles.desc}>{enrichment.description}</Text>
        ) : null}
      </View>

      <Section title={`All offers (${offers.length})`}>
        {offers.length === 0 ? (
          <Text style={styles.muted}>No offers in current scope.</Text>
        ) : (
          offers.map((row, i) => (
            <Link
              key={i}
              href={{
                pathname: "/card/[id]",
                params: { id: `${row.offer.bank}||${row.offer.card}` },
              }}
              asChild
            >
              <Pressable style={styles.offerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerCard} numberOfLines={1}>
                    {row.offer.bank} — {row.offer.card}
                    {row.owned ? "  (you own)" : ""}
                  </Text>
                  <Text style={styles.offerSub} numberOfLines={2}>
                    {row.offer.discountLabel}
                    {row.offer.offerTitle ? ` · ${row.offer.offerTitle}` : ""}
                    {row.offer.daysLabel ? ` · ${row.offer.daysLabel}` : ""}
                  </Text>
                </View>
                <Text style={styles.offerSaving}>~{formatCurrency(row.saving)}</Text>
              </Pressable>
            </Link>
          ))
        )}
      </Section>

      {branches.length > 0 ? (
        <Section title={`Branches (${branches.length})`}>
          {branches.map((b, i) => (
            <View key={i} style={styles.branch}>
              <Text style={styles.branchName}>{b.name}</Text>
              <Text style={styles.branchAddr} numberOfLines={2}>{b.address}</Text>
              <View style={styles.branchActions}>
                {b.telephone ? (
                  <Pressable
                    style={styles.miniBtn}
                    onPress={() => Linking.openURL(`tel:${b.telephone}`)}
                  >
                    <Text style={styles.miniBtnText}>Call</Text>
                  </Pressable>
                ) : null}
                {b.lat && b.lng ? (
                  <Pressable
                    style={styles.miniBtn}
                    onPress={() => Linking.openURL(`https://www.google.com/maps?q=${b.lat},${b.lng}`)}
                  >
                    <Text style={styles.miniBtnText}>Map</Text>
                  </Pressable>
                ) : null}
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.bgElev,
    padding: spacing.xl,
    ...shadow.card,
  },
  name: {
    color: colors.text,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
  },
  cuisine: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 4,
  },
  desc: {
    color: colors.text,
    fontSize: typography.size.sm,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.bgElev,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
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
  muted: { color: colors.textMuted, fontSize: typography.size.sm },
  offerRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  offerCard: {
    color: colors.text,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  offerSub: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  offerSaving: {
    color: colors.toneEligible,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.sm,
  },
  branch: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  branchName: { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  branchAddr: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  branchActions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  miniBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.bgSubtle,
  },
  miniBtnText: { color: colors.text, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
});
