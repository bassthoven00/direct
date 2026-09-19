/**
 * src/lib/monitoring/sentry.ts
 */

export function captureException(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[Sentry Stub] captureException:", error);
    return;
  }
  
  // In a real implementation, this would call @sentry/nextjs:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(error);
  console.error("Captured exception:", error);
}

export function captureMessage(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Sentry Stub] captureMessage:", message);
    return;
  }
  
  // Sentry.captureMessage(message);
  console.log("Captured message:", message);
}
