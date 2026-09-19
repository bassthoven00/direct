/**
 * src/app/api/v1/payments/webhook/stripe/route.ts
 *
 * Idempotent Stripe webhook handler.
 * ADR-004 / ADR-005 / AGENTS.md Rule #7.
 */

import { NextRequest, NextResponse } from "next/server";
import { acquireWebhookLock, markWebhookProcessed } from "@/lib/webhookIdempotency";
import { getProvider } from "@/providers/payment/registry";
import { confirmPaymentSuccess } from "@/services/paymentService";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/types";
import { transitionPaymentStatus } from "@/services/transitions/paymentTransitionService";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  // 1. Verify signature FIRST — reject before any reads if invalid
  const provider = getProvider("stripe");
  const event = await provider.verifyWebhook(rawBody, signature);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Idempotency check — insert or detect duplicate
  const { acquired, webhookEventId } = await acquireWebhookLock(
    "stripe",
    event.providerEventId,
    event.eventType,
    event.rawPayload
  );

  if (!acquired) {
    // Already processed — return 200 to prevent Stripe from retrying
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 3. Route to correct handler
  try {
    switch (event.eventType) {
      case "payment_intent.succeeded": {
        const paymentIntentId = event.data?.id as string;
        if (!paymentIntentId) break;

        // Find our Payment by the providerRef (the PaymentIntent ID)
        const payment = await prisma.payment.findFirst({
          where: { providerRef: paymentIntentId },
        });

        if (payment) {
          await confirmPaymentSuccess(
            payment.id,
            payment.orderId,
            paymentIntentId,
            event.data
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntentId = event.data?.id as string;
        if (!paymentIntentId) break;

        const payment = await prisma.payment.findFirst({
          where: { providerRef: paymentIntentId },
        });

        if (payment && payment.status === PaymentStatus.PENDING) {
          await transitionPaymentStatus(payment.id, PaymentStatus.FAILED);
        }
        break;
      }

      default:
        // Unknown event type — not an error, just ignore
        break;
    }

    await markWebhookProcessed(webhookEventId);
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    // Return 500 so Stripe retries — but we won't reprocess due to idempotency guard
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


