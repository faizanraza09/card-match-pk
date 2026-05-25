import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  small?: boolean;
}

export function Pill({ label, active, onPress, small }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        small && styles.pillSmall,
        active ? styles.active : styles.inactive,
      ]}
    >
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          active ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  pillSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  active: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  inactive: {
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  labelSmall: {
    fontSize: typography.size.xs,
  },
  labelActive: {
    color: colors.textOnBrand,
  },
  labelInactive: {
    color: colors.text,
  },
});
