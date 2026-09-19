/**
 * src/app/api/v1/admin/refunds/route.ts
 *
 * Refund endpoint — SUPER_ADMIN only (Rule #5).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { issueRefund } from "@/services/paymentService";

const refundSchema = z.object({
  paymentId: z.string().cuid(),
  amountCents: z.number().int().positive(),
  reason: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole(Role.SUPER_ADMIN);

    const body = await req.json();
    const data = validate(refundSchema, body);

    await issueRefund(data.paymentId, data.amountCents, data.reason);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
