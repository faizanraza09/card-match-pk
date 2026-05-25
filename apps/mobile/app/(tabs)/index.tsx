import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CityTabs } from "@/components/CityTabs";
import { CardRow } from "@/components/CardRow";
import { FavoritesAlert } from "@/components/FavoritesAlert";
import { FilterSheet, FilterSheetHandle } from "@/components/FilterSheet";
import { FreshnessChip } from "@/components/FreshnessChip";
import { ResultsHeader } from "@/components/ResultsHeader";
import { TopBar } from "@/components/TopBar";
import { computeRecommendations } from "@/lib/algorithms";
import { loadOffers, loadRequirements } from "@/data";
import { useAppStore } from "@/store";
import { colors } from "@/theme";

export default function CardsScreen() {
  const state = useAppStore();
  const setData = useAppStore((s) => s.setData);
  const sheet = useRef<FilterSheetHandle>(null);
  const [refreshing, setRefreshing] = useState(false);

  const recs = useMemo(() => computeRecommendations(state), [state]);

  const activeFilters =
    state.selectedDays.size +
    state.selectedRestaurants.size +
    state.selectedBanks.size +
    state.selectedCardTypes.size +
    state.selectedCuisines.size +
    (state.monthlySalary !== null ? 1 : 0) +
    (state.accountBalance !== null ? 1 : 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.selectionAsync().catch(() => undefined);
    try {
      const [bundle, reqs] = await Promise.all([loadOffers(), loadRequirements()]);
      setData(bundle, reqs);
    } finally {
      setRefreshing(false);
    }
  }, [setData]);

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <TopBar />
      <FavoritesAlert />
      <FreshnessChip />
      <CityTabs />
      <ResultsHeader
        count={recs.length}
        countLabel={`${recs.length === 1 ? "card" : "cards"} matched`}
        subtitle="Ranked by savings, coverage and day-fit"
        filterOpenCount={activeFilters}
        onPressFilters={() => {
          Haptics.selectionAsync().catch(() => undefined);
          sheet.current?.open();
        }}
      />
      <View style={styles.flex}>
        <FlashList
          data={recs}
          renderItem={({ item, index }) => <CardRow item={item} rank={index + 1} />}
          keyExtractor={(item) => `${item.bank}||${item.card}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
        />
      </View>
      <FilterSheet ref={sheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 80, paddingTop: 4 },
});
