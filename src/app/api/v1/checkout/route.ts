/**
 * src/app/api/v1/checkout/route.ts
 *
 * Unified checkout endpoint — validates cart, creates Order in PENDING_PAYMENT.
 * Client then calls /payments/initiate to get a payment link.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";
import { createOrder } from "@/services/orderService";
import crypto from "crypto";

const checkoutItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    variantId: z.string().cuid(),
    quantity: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("experience"),
    packageId: z.string().cuid(),
    submittedData: z.record(z.unknown()).optional(),
  }),
]);

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  idempotencyKey: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  shippingAddressId: z.string().cuid().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    const body = await req.json();
    const data = validate(checkoutSchema, body);

    // Guest checkout requires email (ADR-009)
    if (!session && !data.guestEmail) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Guest checkout requires an email address." } },
        { status: 400 }
      );
    }

    const idempotencyKey = data.idempotencyKey ?? crypto.randomUUID();

    const order = await createOrder({
      ...data,
      items: data.items.map((i) => ({
        type: i.type,
        variantId: i.type === "product" ? i.variantId : undefined,
        packageId: i.type === "experience" ? i.packageId : undefined,
        quantity: i.type === "product" ? i.quantity : 1,
        submittedData: i.type === "experience" ? (i.submittedData as Record<string, unknown>) : undefined,
      })),
      idempotencyKey,
      userId: session?.userId,
    });

    return NextResponse.json({ data: { orderId: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
