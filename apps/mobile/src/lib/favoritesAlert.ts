import AsyncStorage from "@react-native-async-storage/async-storage";
import { OffersBundle } from "@/types";

// Diffs the current set of offers at favorited restaurants against a stored
// snapshot. Mirrors the web favorites-snapshot logic at app.js:96.
const KEY = "konsacard-fav-offers-v1";

interface Snapshot {
  [restaurant: string]: string[]; // sorted list of "bank||card" keys
}

export interface NewOfferReport {
  restaurant: string;
  added: string[];
}

export async function detectNewOffersForFavorites(
  bundle: OffersBundle | null,
  favorites: Set<string>
): Promise<{ firstTime: boolean; news: NewOfferReport[] }> {
  let stored: Snapshot = {};
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  const current = buildSnapshot(bundle, favorites);
  const news: NewOfferReport[] = [];
  for (const r of Object.keys(current)) {
    const before = new Set(stored[r] || []);
    const added = current[r].filter((k) => !before.has(k));
    if (added.length > 0) news.push({ restaurant: r, added });
  }
  // Save new snapshot regardless
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  return { firstTime: Object.keys(stored).length === 0, news };
}

export function buildSnapshot(bundle: OffersBundle | null, favorites: Set<string>): Snapshot {
  const snap: Snapshot = {};
  if (!bundle) return snap;
  favorites.forEach((name) => (snap[name] = []));
  bundle.offers.forEach((o) => {
    if (!favorites.has(o.restaurant)) return;
    snap[o.restaurant].push(`${o.bank}||${o.card}`);
  });
  Object.keys(snap).forEach((k) => {
    snap[k] = [...new Set(snap[k])].sort();
  });
  return snap;
}
