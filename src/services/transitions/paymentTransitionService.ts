/**
 * src/services/transitions/paymentTransitionService.ts
 *
 * AGENTS.md Rule #8: ALL Payment.status mutations go through this service.
 * AGENTS.md Rule #7: Payment is never marked SUCCESS without server-side verification.
 */

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/types";

const PAYMENT_TRANSITIONS: Record<string, PaymentStatus[]> = {
  [PaymentStatus.PENDING]:  [PaymentStatus.SUCCESS, PaymentStatus.FAILED],
  [PaymentStatus.SUCCESS]:  [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]:   [],
  [PaymentStatus.REFUNDED]: [],
};

export class InvalidPaymentTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid payment transition: ${from} → ${to}`);
    this.name = "InvalidPaymentTransitionError";
  }
}

export async function transitionPaymentStatus(
  paymentId: string,
  to: PaymentStatus,
  extra?: { providerTxId?: string; paidAt?: Date; providerMeta?: unknown }
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      select: { status: true },
    });

    const from = payment.status as PaymentStatus;
    const allowed = PAYMENT_TRANSITIONS[from] ?? [];

    if (!allowed.includes(to)) {
      throw new InvalidPaymentTransitionError(from, to);
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: to,
        ...(extra?.providerTxId ? { providerTxId: extra.providerTxId } : {}),
        ...(extra?.paidAt       ? { paidAt: extra.paidAt }             : {}),
        ...(extra?.providerMeta ? { providerMeta: extra.providerMeta as object } : {}),
      },
    });
  });
}
