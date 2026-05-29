// PostHog product-analytics wrapper. Single shared instance is exported so
// component code (via the provider + usePostHog hook) and non-component
// code (zustand actions, lib helpers) hit the same client.
//
// `phc_*` project keys are designed to be public — they're write-only ingest
// keys that ship in every browser/app worldwide — so we inline ours.
//
// captureAppLifecycleEvents records install / open / update / background so
// retention reports work without any extra wiring. autocapture catches every
// Pressable tap and every expo-router screen view, so even before we add
// explicit track() calls we already have "what did the user do?" coverage.
import { PostHog } from "posthog-react-native";

export const posthog = new PostHog(
  "phc_u3389FSqcbWC3XMP3iLbXQXGpGKANkG3ekbTVFwTbQ7M",
  {
    host: "https://us.i.posthog.com",
    captureAppLifecycleEvents: true,
  }
);

// PostHog wants strictly JSON-safe values; loosen the surface here so call
// sites can pass anything serializable without ceremony. Anything truly
// non-JSON (functions, Maps, etc.) will just be dropped by JSON.stringify
// inside PostHog rather than throwing.
type Props = Record<string, unknown>;

export function track(name: string, props?: Props): void {
  try {
    posthog.capture(name, props as never);
  } catch {
    /* no-op */
  }
}

export function identify(distinctId: string, props?: Props): void {
  try {
    posthog.identify(distinctId, props as never);
  } catch {
    /* no-op */
  }
}

export function setUserProperty(key: string, value: unknown): void {
  try {
    posthog.register({ [key]: value } as never);
  } catch {
    /* no-op */
  }
}
