import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { detectNewOffersForFavorites, NewOfferReport } from "@/lib/favoritesAlert";
import { useAppStore } from "@/store";
import { colors, radii, spacing, typography } from "@/theme";

export function FavoritesAlert() {
  const data = useAppStore((s) => s.data);
  const favorites = useAppStore((s) => s.favoriteRestaurants);
  const [news, setNews] = useState<NewOfferReport[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!data || favorites.size === 0) return;
    let cancelled = false;
    detectNewOffersForFavorites(data, favorites).then(({ firstTime, news }) => {
      if (cancelled) return;
      if (firstTime) return; // don't alert on the very first run after favorite-add
      if (news.length === 0) return;
      setNews(news);
    });
    return () => {
      cancelled = true;
    };
  }, [data, favorites]);

  if (dismissed || news.length === 0) return null;
  const total = news.reduce((s, r) => s + r.added.length, 0);
  const names = news.slice(0, 3).map((r) => r.restaurant).join(", ");
  const more = news.length > 3 ? ` and ${news.length - 3} more` : "";

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>✨</Text>
      <Text style={styles.text} numberOfLines={2}>
        <Text style={styles.bold}>{total} new offer{total === 1 ? "" : "s"}</Text> at {names}
        {more}.
      </Text>
      <Pressable onPress={() => setDismissed(true)} hitSlop={10} style={styles.x}>
        <Text style={styles.xText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.toneEligibleBg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  icon: { fontSize: 18, marginRight: spacing.sm },
  text: { flex: 1, color: colors.toneEligible, fontSize: typography.size.sm },
  bold: { fontWeight: typography.weight.bold },
  x: { paddingHorizontal: spacing.xs },
  xText: { color: colors.toneEligible, fontSize: 20, fontWeight: typography.weight.bold },
});
