/**
 * src/jobs/reconciliation.ts
 *
 * Reconciliation job — P6-5.
 * Polls for payments that have been PENDING for more than 10 minutes
 * and performs a server-side verify call against the provider.
 *
 * In production this runs as a BullMQ recurring job (Phase 12).
 * Can be run directly for testing: npx tsx src/jobs/reconciliation.ts
 */

import { prisma } from "@/lib/prisma";
import { verifyPaymentServerSide } from "@/services/paymentService";
import { PaymentStatus } from "@/types";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function runReconciliation(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  const stalePayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    select: { id: true, providerRef: true, provider: true },
  });

  console.log(`[reconciliation] Found ${stalePayments.length} stale pending payments.`);

  for (const payment of stalePayments) {
    try {
      console.log(`[reconciliation] Verifying payment ${payment.id} (${payment.provider})`);
      const verified = await verifyPaymentServerSide(payment.id);
      console.log(`[reconciliation] Payment ${payment.id}: ${verified ? "SUCCESS" : "still pending/failed"}`);
    } catch (err) {
      console.error(`[reconciliation] Failed to verify payment ${payment.id}:`, err);
    }
  }
}

// Allow direct execution
if (require.main === module) {
  runReconciliation()
    .then(() => {
      console.log("[reconciliation] Done.");
      process.exit(0);
    })
    .catch((e) => {
      console.error("[reconciliation] Fatal:", e);
      process.exit(1);
    });
}
