/**
 * src/app/api/v1/payments/webhook/paystack/route.ts
 *
 * Idempotent Paystack webhook handler.
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
  const signature = req.headers.get("x-paystack-signature") ?? "";

  const provider = getProvider("paystack");
  const event = await provider.verifyWebhook(rawBody, signature);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { acquired, webhookEventId } = await acquireWebhookLock(
    "paystack",
    event.providerEventId,
    event.eventType,
    event.rawPayload
  );

  if (!acquired) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.eventType) {
      case "charge.success": {
        const reference = event.data?.reference as string;
        if (!reference) break;

        const payment = await prisma.payment.findFirst({
          where: { providerRef: reference },
        });

        if (payment) {
          await confirmPaymentSuccess(
            payment.id,
            payment.orderId,
            event.data?.id as string,
            event.data
          );
        }
        break;
      }

      default:
        break;
    }

    await markWebhookProcessed(webhookEventId);
  } catch (err) {
    console.error("Paystack webhook processing error:", err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


