import { StyleSheet, Text, View } from "react-native";
import { EligibilityStatus } from "@/types";
import { colors, eligibilityTone, radii, spacing, typography } from "@/theme";

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  const palette = eligibilityTone(status.tone);
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.color }]}>{status.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  text: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});

export const _unused = colors;
