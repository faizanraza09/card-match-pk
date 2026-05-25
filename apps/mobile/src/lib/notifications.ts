import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let _configured = false;

export async function ensureNotificationsReady(): Promise<boolean> {
  if (!_configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    _configured = true;
  }
  const perm = await Notifications.getPermissionsAsync();
  if (perm.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Schedule a one-shot reminder for an annual-fee anniversary. We fire ~30 days
 * before the month-day in the user's local time, recurring yearly.
 */
export async function scheduleAnnualFeeReminder(opts: {
  cardKey: string;
  bank: string;
  card: string;
  anniversaryMonth: number; // 1..12
}): Promise<string | null> {
  const ok = await ensureNotificationsReady();
  if (!ok) return null;

  const now = new Date();
  const fireYear = now.getFullYear();
  // Fire 30 days before the 1st of the anniversary month
  const fire = new Date(fireYear, opts.anniversaryMonth - 1, 1);
  fire.setDate(fire.getDate() - 30);
  if (fire.getTime() <= Date.now()) fire.setFullYear(fireYear + 1);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `${opts.bank} ${opts.card} renews soon`,
      body: "Check your card's saving record and whether the annual fee is worth another year.",
      data: { cardKey: opts.cardKey, kind: "fee-reminder" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
  });
}

/**
 * Cancel all scheduled fee reminders. Cheap re-schedule when the user edits
 * anniversaries.
 */
export async function clearScheduledReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getPushToken(): Promise<string | null> {
  try {
    const ok = await ensureNotificationsReady();
    if (!ok) return null;
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data || null;
  } catch {
    return null;
  }
}
