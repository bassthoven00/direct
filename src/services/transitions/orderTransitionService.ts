/**
 * src/services/transitions/orderTransitionService.ts
 *
 * AGENTS.md Rule #8: ALL Order.status mutations go through this service.
 * Never call prisma.order.update({ data: { status: ... } }) directly.
 *
 * Implements the allow-list state machine from ARCHITECTURE.md §8.
 */

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/types";
import type { AuditLog } from "@prisma/client";

/** Allowed transitions: fromStatus → Set of valid toStatus */
const ORDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]:    [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]:               [OrderStatus.PARTIALLY_FULFILLED, OrderStatus.FULFILLED, OrderStatus.REFUNDED],
  [OrderStatus.PARTIALLY_FULFILLED]: [OrderStatus.FULFILLED, OrderStatus.REFUNDED],
  [OrderStatus.FULFILLED]:          [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]:          [],
  [OrderStatus.REFUNDED]:           [],
};

export class InvalidOrderTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid order transition: ${from} → ${to}`);
    this.name = "InvalidOrderTransitionError";
  }
}

export async function transitionOrderStatus(
  orderId: string,
  to: OrderStatus,
  actorId?: string
): Promise<void> {
  // Use a transaction to read-then-write atomically
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });

    const from = order.status as OrderStatus;
    const allowed = ORDER_TRANSITIONS[from] ?? [];

    if (!allowed.includes(to)) {
      throw new InvalidOrderTransitionError(from, to);
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: to },
    });

    // Audit trail
    await tx.auditLog.create({
      data: {
        userId: actorId ?? null,
        action: "ORDER_STATUS_TRANSITION",
        entityId: orderId,
        details: { from, to },
      },
    });
  });
}
