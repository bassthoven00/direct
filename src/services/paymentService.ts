/**
 * src/services/paymentService.ts
 *
 * Core payment orchestration service.
 *
 * AGENTS.md §3 — CRITICAL RULES:
 *  - Rule #6: Never mark Order/Payment as paid/succeeded based on client redirect alone.
 *  - Rule #7: Only a verified webhook OR an active server-side verify() call may mark SUCCESS.
 *  - Rule #3: Inventory is decremented only here, at payment confirmation, inside a transaction.
 *  - Webhook handlers are idempotent via WebhookEvent(provider, providerEventId) unique constraint.
 */

import { prisma } from "@/lib/prisma";
import { getProvider } from "@/providers/payment/registry";
import { transitionOrderStatus } from "./transitions/orderTransitionService";
import { transitionPaymentStatus } from "./transitions/paymentTransitionService";
import { transitionExperienceRequestStatus } from "./transitions/experienceTransitionService";
import { OrderStatus, PaymentStatus, ExperienceRequestStatus } from "@/types";
import type { PaymentProviderName } from "@/types";

// ─── Initiate Payment ─────────────────────────────────────────────────────────

export async function initiatePayment(
  orderId: string,
  providerName: PaymentProviderName
) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payments: true },
  });

  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    throw new Error(`Order ${orderId} is not in PENDING_PAYMENT state.`);
  }

  // Create a PENDING Payment record first
  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider: providerName,
      amount: order.totalAmount,
      currency: order.currency,
      status: PaymentStatus.PENDING,
    },
  });

  const provider = getProvider(providerName);
  const result = await provider.initiatePayment({
    amount: order.totalAmount,
    currency: order.currency,
    orderId,
    customerEmail: order.guestEmail ?? undefined,
  });

  // Store the provider reference so we can link the webhook back
  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef: result.providerRef },
  });

  return { paymentId: payment.id, ...result };
}

// ─── Server-Side Verify (ADR-004) ─────────────────────────────────────────────

/**
 * Called after client redirect AND optionally on a polling basis.
 * Rule #6: This is the ONLY path that may transition an order to PAID.
 */
export async function verifyPaymentServerSide(
  paymentId: string
): Promise<boolean> {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { order: true },
  });

  if (payment.status === PaymentStatus.SUCCESS) {
    return true; // already verified
  }

  if (!payment.providerRef) {
    return false;
  }

  const provider = getProvider(payment.provider as PaymentProviderName);
  const result = await provider.verifyPayment(payment.providerRef);

  if (result.status === "success") {
    await confirmPaymentSuccess(
      payment.id,
      payment.orderId,
      result.providerTxId,
      result.meta
    );
    return true;
  }

  if (result.status === "failed") {
    await transitionPaymentStatus(payment.id, PaymentStatus.FAILED);
  }

  return false;
}

// ─── Shared post-verification work ───────────────────────────────────────────

/**
 * Runs inside a DB transaction:
 *   1. Transition Payment → SUCCESS
 *   2. Transition Order → PAID
 *   3. Decrement inventory for any physical variant items (Rule #3)
 *   4. Transition ExperienceRequests from PENDING_PAYMENT → PENDING_REVIEW
 */
export async function confirmPaymentSuccess(
  paymentId: string,
  orderId: string,
  providerTxId?: string,
  providerMeta?: unknown
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Mark payment SUCCESS
    await transitionPaymentStatus(paymentId, PaymentStatus.SUCCESS, {
      providerTxId,
      paidAt: new Date(),
      providerMeta,
    });

    // 2. Mark order PAID
    await transitionOrderStatus(orderId, OrderStatus.PAID);

    // 3. Decrement inventory for physical items only (Rule #3)
    const items = await tx.orderItem.findMany({
      where: { orderId, variantId: { not: null } },
      select: { variantId: true, quantity: true },
    });

    for (const item of items) {
      if (!item.variantId) continue;
      await tx.inventory.updateMany({
        where: { variantId: item.variantId },
        data: { quantityOnHand: { decrement: item.quantity } },
      });
    }

    // 4. Advance experience requests from PENDING_PAYMENT → PENDING_REVIEW
    const experienceItems = await tx.orderItem.findMany({
      where: { orderId, experienceId: { not: null } },
      include: { experienceRequest: true },
    });

    for (const item of experienceItems) {
      if (item.experienceRequest?.status === ExperienceRequestStatus.PENDING_PAYMENT) {
        await transitionExperienceRequestStatus(
          item.experienceRequest.id,
          ExperienceRequestStatus.PENDING_REVIEW
        );
      }
    }
  });
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export async function issueRefund(
  paymentId: string,
  amountCents: number,
  reason: string
): Promise<void> {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });

  if (payment.status !== PaymentStatus.SUCCESS) {
    throw new Error("Can only refund a successful payment.");
  }

  const provider = getProvider(payment.provider as PaymentProviderName);
  const refundResult = await provider.refund({
    providerRef: payment.providerRef!,
    amountCents,
    currency: payment.currency,
  });

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        paymentId,
        providerRefundId: refundResult.providerRefundId,
        amount: amountCents,
        currency: payment.currency,
        reason,
        status: "succeeded",
      },
    });

    // If full refund, mark payment as REFUNDED
    if (amountCents >= payment.amount) {
      await transitionPaymentStatus(paymentId, PaymentStatus.REFUNDED);
      await transitionOrderStatus(payment.orderId, OrderStatus.REFUNDED);
    }

    await tx.auditLog.create({
      data: {
        action: "REFUND_ISSUED",
        entityId: paymentId,
        details: { amountCents, reason, providerRefundId: refundResult.providerRefundId },
      },
    });
  });
}
