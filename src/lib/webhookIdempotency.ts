/**
 * src/lib/webhookIdempotency.ts
 *
 * Idempotency guard for all webhook handlers.
 *
 * ADR-005: Insert WebhookEvent before processing. A duplicate (provider, providerEventId)
 * means the event was already processed — return early without any state change.
 */

import { prisma } from "@/lib/prisma";

export async function acquireWebhookLock(
  provider: string,
  providerEventId: string,
  eventType: string,
  payload: unknown
): Promise<{ acquired: boolean; webhookEventId: string }> {
  try {
    const event = await prisma.webhookEvent.create({
      data: {
        provider,
        providerEventId,
        eventType,
        payload: payload as object,
      },
    });
    return { acquired: true, webhookEventId: event.id };
  } catch (err: unknown) {
    // Prisma P2002 = unique constraint violation → duplicate event
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const existing = await prisma.webhookEvent.findUnique({
        where: { provider_providerEventId: { provider, providerEventId } },
        select: { id: true },
      });
      return { acquired: false, webhookEventId: existing?.id ?? "" };
    }
    throw err;
  }
}

export async function markWebhookProcessed(webhookEventId: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { processedAt: new Date() },
  });
}
