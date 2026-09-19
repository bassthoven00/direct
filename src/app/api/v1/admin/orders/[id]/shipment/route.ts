/**
 * src/app/api/v1/admin/orders/[id]/shipment/route.ts
 *
 * Admin shipment management endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role, OrderStatus } from "@/types";
import { updateShipmentTracking, markShipmentDelivered } from "@/services/shipmentService";
import { transitionOrderStatus } from "@/services/transitions/orderTransitionService";

const shipmentUpdateSchema = z.object({
  shipmentId: z.string().cuid(),
  action: z.enum(["ship", "deliver"]),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(Role.ADMIN);

    const body = await req.json();
    const data = validate(shipmentUpdateSchema, body);

    if (data.action === "ship") {
      if (!data.carrier || !data.trackingNumber) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Carrier and tracking number required" } },
          { status: 400 }
        );
      }
      const shipment = await updateShipmentTracking(data.shipmentId, data.carrier, data.trackingNumber);
      
      // Attempt to transition the order to PARTIALLY_FULFILLED or FULFILLED depending on business logic
      // Simplification for the example: just transition to PARTIALLY_FULFILLED.
      await transitionOrderStatus(params.id, OrderStatus.PARTIALLY_FULFILLED);
      
      return NextResponse.json({ data: shipment });
    }

    if (data.action === "deliver") {
      const shipment = await markShipmentDelivered(data.shipmentId);
      await transitionOrderStatus(params.id, OrderStatus.FULFILLED);
      return NextResponse.json({ data: shipment });
    }

  } catch (error) {
    return handleApiError(error);
  }
}
