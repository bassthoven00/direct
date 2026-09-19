/**
 * src/services/couponService.ts
 *
 * Coupon validation and redemption.
 * Redemption count increments atomically inside a transaction (Rule — no TOCTOU race).
 */

import { prisma } from "@/lib/prisma";
import { ValidationError, NotFoundError } from "@/lib/apiError";

export interface CouponApplication {
  couponId: string;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number; // computed cents to subtract
}

export async function validateCoupon(
  code: string,
  orderSubtotalCents: number
): Promise<CouponApplication> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive) {
    throw new NotFoundError("Coupon code not found or inactive");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ValidationError("Coupon has expired");
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new ValidationError("Coupon has reached its maximum number of uses");
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round(orderSubtotalCents * (coupon.discountValue / 100));
  } else {
    // fixed
    discountAmount = Math.min(coupon.discountValue, orderSubtotalCents);
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
  };
}

/**
 * Atomically increment usedCount — called inside the checkout transaction.
 * Must be called from orderService.ts inside the same $transaction, never standalone.
 */
export async function incrementCouponUsedCount(
  couponId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  await tx.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}
