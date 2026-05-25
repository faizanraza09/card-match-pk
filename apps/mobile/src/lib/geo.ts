import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const KEY = "konsacard-userloc-v1";

export interface UserLocation {
  lat: number;
  lng: number;
  ts: number;
}

export function haversineKm(a: UserLocation, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function requestLocation(): Promise<UserLocation | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const loc: UserLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      ts: Date.now(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(loc));
    return loc;
  } catch {
    return null;
  }
}

export async function readSavedLocation(): Promise<UserLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw) as UserLocation;
    // Treat as stale after 24h
    if (Date.now() - loc.ts > 24 * 60 * 60 * 1000) return null;
    return loc;
  } catch {
    return null;
  }
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
