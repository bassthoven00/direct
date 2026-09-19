/**
 * src/app/api/v1/payments/initiate/route.ts
 *
 * Client-facing endpoint to initiate payment for a pending order.
 * Returns a redirect URL or client secret from the provider.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { getAvailableProviders } from "@/providers/payment/registry";
import { initiatePayment } from "@/services/paymentService";
import type { PaymentProviderName } from "@/types";

const initiateSchema = z.object({
  orderId: z.string().cuid(),
  provider: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validate(initiateSchema, body);

    const available = getAvailableProviders();
    if (!available.includes(data.provider as PaymentProviderName)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `Provider '${data.provider}' is not available.` } },
        { status: 400 }
      );
    }

    const result = await initiatePayment(data.orderId, data.provider as PaymentProviderName);

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
