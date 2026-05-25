import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

const KEY = "konsacard-onboarded-v1";
const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Find the best card for the way you eat out.",
    body: "We rank 196 cards across 19 Pakistani banks against the restaurants in your city.",
    emoji: "💳",
  },
  {
    title: "Show me what your wallet actually covers.",
    body: "Add the cards you own and see which restaurants you save at — and which ones you don't.",
    emoji: "💼",
  },
  {
    title: "Quick answers at the counter.",
    body: "Swipe lookup tells you which of your cards saves the most at this restaurant. One tap.",
    emoji: "⚡",
  },
];

export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v !== "1";
  } catch {
    return true;
  }
}

export default function Onboarding() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: page * width, animated: true });
  }, [page]);

  const finish = async () => {
    try {
      await AsyncStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    router.replace("/");
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.footer}>
        {page < slides.length - 1 ? (
          <>
            <Pressable onPress={finish}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
            <Pressable style={styles.cta} onPress={() => setPage(page + 1)}>
              <Text style={styles.ctaText}>Next</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.cta, styles.ctaFull]} onPress={finish}>
            <Text style={styles.ctaText}>Get started</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: "space-between" },
  slide: {
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl * 2,
    alignItems: "center",
  },
  emoji: { fontSize: 64, marginBottom: spacing.xl },
  title: {
    color: colors.text,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.black,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: spacing.xs, marginVertical: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.brand, width: 20 },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: "center",
    justifyContent: "space-between",
  },
  skip: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  cta: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  ctaFull: { flex: 1, alignItems: "center" },
  ctaText: {
    color: colors.textOnBrand,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
});
