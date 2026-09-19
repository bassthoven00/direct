/**
 * src/services/shipmentService.ts
 */

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/apiError";

export async function createShipment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found");

  return prisma.shipment.create({
    data: { orderId, status: "processing" },
  });
}

export async function updateShipmentTracking(
  shipmentId: string,
  carrier: string,
  trackingNumber: string
) {
  return prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      carrier,
      trackingNumber,
      status: "shipped",
      shippedAt: new Date(),
    },
  });
}

export async function markShipmentDelivered(shipmentId: string) {
  return prisma.shipment.update({
    where: { id: shipmentId },
    data: { status: "delivered" },
  });
}
