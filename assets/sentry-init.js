// @ts-check
/**
 * Lazy Sentry loader. Reads the DSN from <meta name="sentry-dsn">, and only
 * fetches the Sentry SDK if a DSN exists and we're on a non-local host.
 *
 * To enable error monitoring:
 *   1. Create a project at sentry.io and copy its DSN
 *   2. Paste it into the <meta name="sentry-dsn" content="..."> tag in index.html
 *   3. Push and deploy. Errors will start flowing the next time the page loads.
 *
 * The script is small enough that adding it to the head adds no measurable cost
 * when no DSN is set — it just reads a meta tag and bails.
 */
(function initSentry() {
  try {
    const meta = document.querySelector('meta[name="sentry-dsn"]');
    const dsn = (meta && meta.getAttribute("content") || "").trim();
    if (!dsn) return;

    // Skip on localhost — no point logging dev errors to production.
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return;

    // Lazy-load the official Sentry browser bundle (with tracing).
    const SDK_URL = "https://browser.sentry-cdn.com/8.45.0/bundle.tracing.min.js";
    const SDK_INTEGRITY = "sha384-OEbCmkKvgwzWGZkc3p+IspGo9wWE9w7CzgI7t7yIqHzZ8K8XS8VRfFcvgw1m6PaC";

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.crossOrigin = "anonymous";
    script.integrity = SDK_INTEGRITY;
    script.onload = function () {
      const Sentry = /** @type {any} */ (window).Sentry;
      if (!Sentry) return;
      Sentry.init({
        dsn,
        // Reasonable defaults for a low-traffic static SPA.
        tracesSampleRate: 0.1,
        // Don't drown the dashboard in noise from extensions/cross-origin.
        ignoreErrors: [
          "ResizeObserver loop limit exceeded",
          "Non-Error promise rejection captured",
          /chrome-extension:/,
          /^Script error\.?$/,
        ],
        // Tag the release with the deploy SHA if Cloudflare Pages exposes it.
        release: (/** @type {any} */ (window).__BUILD_SHA__ || undefined),
        environment: host === "konsacard.pk" ? "production" : "preview",
      });
    };
    document.head.appendChild(script);
  } catch (_) {
    /* swallow — Sentry must never break the page */
  }
})();
