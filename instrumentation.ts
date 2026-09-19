/**
 * instrumentation.ts
 *
 * Next.js standard entrypoint for initializing monitoring tools
 * like Sentry or OpenTelemetry before the app boots.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run node-specific initialization here (e.g. Sentry node config)
    console.log("[instrumentation] Booting Node.js runtime...");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Run edge-specific initialization here
    console.log("[instrumentation] Booting Edge runtime...");
  }
}
