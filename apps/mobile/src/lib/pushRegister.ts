import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPushToken } from "./notifications";

const DEVICE_KEY = "konsacard-deviceId-v1";

function uuid(): string {
  // Lightweight v4-ish UUID. Cryptographic quality isn't needed; this id
  // just routes pushes back to one device.
  const rand = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${rand()}${rand()}-${rand()}-${rand()}-${rand()}-${rand()}${rand()}${rand()}`;
}

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = uuid();
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function registerPushWithBackend(favorites: string[]): Promise<boolean> {
  const token = await getPushToken();
  if (!token) return false;
  const deviceId = await getDeviceId();
  const origin = (process.env.EXPO_PUBLIC_DATA_ORIGIN || "https://konsacard.pk").replace(/\/$/, "");
  try {
    const res = await fetch(`${origin}/api/push-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, favorites, deviceId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unregisterPush(): Promise<void> {
  const deviceId = await AsyncStorage.getItem(DEVICE_KEY);
  if (!deviceId) return;
  const origin = (process.env.EXPO_PUBLIC_DATA_ORIGIN || "https://konsacard.pk").replace(/\/$/, "");
  try {
    await fetch(`${origin}/api/push-register?deviceId=${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
    });
  } catch {
    /* ignore */
  }
}
