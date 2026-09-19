/**
 * src/app/api/v1/payments/webhook/paypal/route.ts
 *
 * Idempotent PayPal webhook handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { acquireWebhookLock, markWebhookProcessed } from "@/lib/webhookIdempotency";
import { getProvider } from "@/providers/payment/registry";
import { confirmPaymentSuccess } from "@/services/paymentService";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  // PayPal uses multiple verification headers
  const transmissionId = req.headers.get("paypal-transmission-id") ?? "";
  const certUrl        = req.headers.get("paypal-cert-url") ?? "";
  const authAlgo       = req.headers.get("paypal-auth-algo") ?? "";
  const transmissionSig = req.headers.get("paypal-transmission-sig") ?? "";

  const verificationHeader = JSON.stringify({ transmissionId, certUrl, authAlgo, transmissionSig });

  const provider = getProvider("paypal");
  const event = await provider.verifyWebhook(rawBody, verificationHeader);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { acquired, webhookEventId } = await acquireWebhookLock(
    "paypal",
    event.providerEventId,
    event.eventType,
    event.rawPayload
  );

  if (!acquired) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = event.data?.supplementary_data?.related_ids?.order_id as string;
        if (!orderId) break;

        const payment = await prisma.payment.findFirst({
          where: { providerRef: orderId },
        });

        if (payment) {
          await confirmPaymentSuccess(
            payment.id,
            payment.orderId,
            event.providerEventId,
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
    console.error("PayPal webhook processing error:", err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


