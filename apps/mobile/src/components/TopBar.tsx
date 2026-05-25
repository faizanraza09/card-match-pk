import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

// Mobile equivalent of the web nav. Wordmark left, then the three quick-access
// actions stacked right with Swipe (the recurring-use action) as the primary
// brand-fill CTA — analogous to "Find My Card" on the web.
export function TopBar() {
  return (
    <View style={styles.row}>
      <Text style={styles.wordmark}>
        konsa<Text style={styles.brand}>card</Text>
        <Text style={styles.pk}>.pk</Text>
      </Text>
      <View style={styles.actions}>
        <Link href="/chat" asChild>
          <Pressable style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>💬</Text>
          </Pressable>
        </Link>
        <Link href="/quiz" asChild>
          <Pressable style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🎯 Quiz</Text>
          </Pressable>
        </Link>
        <Link href="/swipe" asChild>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>⚡ Swipe</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  wordmark: {
    color: colors.text,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.black,
    flex: 1,
  },
  brand: { color: colors.brand },
  pk: { color: colors.textDim, fontWeight: typography.weight.regular, fontSize: typography.size.sm },
  actions: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  iconBtn: {
    backgroundColor: colors.bgElev,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnText: {
    color: colors.text,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  ctaBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  ctaBtnText: {
    color: colors.textOnBrand,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
});
