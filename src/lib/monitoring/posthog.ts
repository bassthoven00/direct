/**
 * src/lib/monitoring/posthog.ts
 */

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[PostHog Stub] Track: ${eventName}`, properties);
    return;
  }

  // In a real implementation:
  // import { PostHog } from 'posthog-node';
  // const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!);
  // client.capture({ event: eventName, properties });
  console.log(`Track: ${eventName}`, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[PostHog Stub] Identify: ${userId}`, traits);
    return;
  }
  
  console.log(`Identify: ${userId}`, traits);
}
