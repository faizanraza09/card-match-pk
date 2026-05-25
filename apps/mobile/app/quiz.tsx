import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppStore } from "@/store";
import { colors, radii, shadow, spacing, typography } from "@/theme";

// Streamlined version of the web "Find My Card" wizard. Mobile pace.
const STEPS = [
  {
    key: "city",
    question: "Which city do you eat out in most?",
    options: [
      { value: "all", label: "Multiple cities" },
      { value: "karachi", label: "Karachi" },
      { value: "lahore", label: "Lahore" },
      { value: "islamabad", label: "Islamabad" },
    ],
  },
  {
    key: "cardType",
    question: "What kind of card do you want?",
    options: [
      { value: "debit", label: "Debit card" },
      { value: "credit", label: "Credit card" },
      { value: "other", label: "Digital wallet" },
      { value: "all", label: "Show me everything" },
    ],
  },
  {
    key: "orderValue",
    question: "Roughly how much do you spend per outing?",
    options: [
      { value: "3000", label: "Under 5,000" },
      { value: "8000", label: "5,000 – 10,000" },
      { value: "15000", label: "10,000 – 20,000" },
      { value: "30000", label: "Over 20,000" },
    ],
  },
] as const;

export default function Quiz() {
  const router = useRouter();
  const setCity = useAppStore((s) => s.setSelectedCity);
  const setCardTypes = useAppStore((s) => s.setCardTypes);
  const setOrderValue = useAppStore((s) => s.setOrderValue);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const onPick = (value: string) => {
    const key = STEPS[step].key;
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step + 1 >= STEPS.length) {
      // apply and exit
      if (next.city) setCity(next.city);
      if (next.cardType && next.cardType !== "all") setCardTypes(new Set([next.cardType]));
      if (next.orderValue) setOrderValue(Number(next.orderValue));
      router.back();
    } else {
      setStep(step + 1);
    }
  };

  const current = STEPS[step];

  return (
    <View style={styles.wrap}>
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i <= step ? styles.dotActive : null]}
          />
        ))}
      </View>
      <Text style={styles.question}>{current.question}</Text>
      <View style={styles.options}>
        {current.options.map((o) => (
          <Pressable key={o.value} style={styles.option} onPress={() => onPick(o.value)}>
            <Text style={styles.optionText}>{o.label}</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </View>
      {step > 0 ? (
        <Pressable onPress={() => setStep(step - 1)} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  progress: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.brand },
  question: {
    color: colors.text,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xl,
  },
  options: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgElev,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  chev: { color: colors.textDim, fontSize: 22 },
  backBtn: { marginTop: spacing.xl, alignSelf: "center", padding: spacing.sm },
  backText: { color: colors.brand, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
});
