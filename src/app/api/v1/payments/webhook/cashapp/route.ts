/**
 * src/app/api/v1/payments/webhook/cashapp/route.ts
 *
 * Idempotent CashApp (Square) webhook handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { acquireWebhookLock, markWebhookProcessed } from "@/lib/webhookIdempotency";
import { getProvider } from "@/providers/payment/registry";
import { confirmPaymentSuccess } from "@/services/paymentService";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";

  const provider = getProvider("cashapp");
  const event = await provider.verifyWebhook(rawBody, signature);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { acquired, webhookEventId } = await acquireWebhookLock(
    "cashapp",
    event.providerEventId,
    event.eventType,
    event.rawPayload
  );

  if (!acquired) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.eventType) {
      case "payment.completed": {
        const ref = event.data?.order_id as string;
        if (!ref) break;

        const payment = await prisma.payment.findFirst({
          where: { providerRef: ref },
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
    console.error("CashApp webhook processing error:", err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


