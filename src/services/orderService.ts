/**
 * src/services/orderService.ts
 *
 * Unified checkout → Order creation.
 *
 * AGENTS.md §3 — CRITICAL:
 *  - Inventory is NOT decremented here. Decrement happens in paymentService.confirmPaymentSuccess().
 *  - Stock is checked here to prevent optimistic checkout of zero-stock items.
 *  - Everything runs inside a single $transaction.
 *  - Coupon usedCount increments atomically in the same transaction.
 *  - idempotencyKey prevents duplicate orders from double-submits.
 */

import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/apiError";
import { generateOrderNumber } from "@/lib/utils";
import { validateCoupon, incrementCouponUsedCount } from "./couponService";
import { OrderStatus } from "@/types";
import { buildZodSchema } from "@/lib/validation/buildZodSchema";
import type { FieldDefinition } from "@/types";

interface CheckoutItem {
  type: "product" | "experience";
  variantId?: string;
  packageId?: string;
  quantity: number;
  submittedData?: Record<string, unknown>;
}

interface CheckoutInput {
  items: CheckoutItem[];
  idempotencyKey: string;
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  shippingAddressId?: string;
  couponCode?: string;
  currency?: string;
  notes?: string;
}

export async function createOrder(input: CheckoutInput) {
  // Idempotency — if we've seen this key before, return the existing order
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const currency = input.currency ?? "USD";

  // ─── Re-validate prices and stock server-side ──────────────────────────────
  let subtotal = 0;
  const lineItems: Array<{
    type: "product" | "experience";
    variantId?: string;
    experienceId?: string;
    unitPrice: number;
    quantity: number;
    currency: string;
    submittedData?: Record<string, unknown>;
  }> = [];

  for (const item of input.items) {
    if (item.type === "product") {
      if (!item.variantId) throw new ValidationError("variantId required for product items");

      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { inventory: true, product: true },
      });

      if (!variant) throw new ValidationError(`Variant ${item.variantId} not found`);

      const available = variant.inventory?.quantityOnHand ?? 0;
      if (available < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for "${variant.name}": ${available} available, ${item.quantity} requested`
        );
      }

      const unitPrice = variant.priceOverride ?? variant.product.basePrice;
      subtotal += unitPrice * item.quantity;
      lineItems.push({
        type: "product",
        variantId: item.variantId,
        unitPrice,
        quantity: item.quantity,
        currency: variant.product.currency,
      });
    } else {
      // Experience item
      if (!item.packageId) throw new ValidationError("packageId required for experience items");

      const pkg = await prisma.experiencePackage.findUnique({
        where: { id: item.packageId },
      });

      if (!pkg || !pkg.isActive) throw new ValidationError(`Package ${item.packageId} not available`);

      // Server-side validate submittedData against requiredFields
      if (pkg.requiredFields && Array.isArray(pkg.requiredFields)) {
        const schema = buildZodSchema(pkg.requiredFields as FieldDefinition[]);
        const validation = schema.safeParse(item.submittedData ?? {});
        if (!validation.success) {
          throw new ValidationError(
            `Invalid form data for "${pkg.name}"`,
            validation.error.errors
          );
        }
      }

      subtotal += pkg.price;
      lineItems.push({
        type: "experience",
        experienceId: item.packageId,
        unitPrice: pkg.price,
        quantity: 1,
        currency: pkg.currency,
        submittedData: item.submittedData,
      });
    }
  }

  // ─── Apply coupon ──────────────────────────────────────────────────────────
  let discount = 0;
  let couponId: string | undefined;
  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, subtotal);
    discount = couponResult.discountAmount;
    couponId = couponResult.couponId;
  }

  const totalAmount = Math.max(0, subtotal - discount);

  // ─── Atomic order creation ─────────────────────────────────────────────────
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        guestEmail: input.guestEmail,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        status: OrderStatus.PENDING_PAYMENT,
        subtotalAmount: subtotal,
        totalAmount,
        currency,
        shippingAddressId: input.shippingAddressId,
        couponId,
        notes: input.notes,
      },
    });

    // Create order items
    for (const line of lineItems) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          variantId: line.variantId,
          experienceId: line.experienceId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          currency: line.currency,
        },
      });

      // Create ExperienceRequest stub for experience items
      if (line.type === "experience" && line.experienceId) {
        await tx.experienceRequest.create({
          data: {
            packageId: line.experienceId,
            orderId: newOrder.id,
            orderItemId: orderItem.id,
            submittedData: (line.submittedData ?? {}) as object,
          },
        });
      }
    }

    // Atomically increment coupon usage
    if (couponId) {
      await incrementCouponUsedCount(couponId, tx);
    }

    return newOrder;
  });

  return order;
}
