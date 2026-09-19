/**
 * src/app/api/v1/payments/verify/route.ts
 *
 * Server-side payment verification endpoint called after client return redirect.
 *
 * ADR-004: Client redirect NEVER directly changes order status.
 * This endpoint performs a live server-side verify call against the provider.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { verifyPaymentServerSide } from "@/services/paymentService";

const verifySchema = z.object({
  paymentId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId } = validate(verifySchema, body);

    const verified = await verifyPaymentServerSide(paymentId);

    return NextResponse.json({ data: { verified } });
  } catch (error) {
    return handleApiError(error);
  }
}
