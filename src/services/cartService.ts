/**
 * src/services/cartService.ts
 *
 * Cart is session-based for guests and user-scoped after login.
 * Merge-on-login: when an authenticated user POSTs a cartId, guest items fold into their cart.
 *
 * AGENTS.md Rule #3: Inventory is NOT decremented here.
 * We only store intent. Decrement happens at payment confirmation in paymentService.ts.
 */

import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/apiError";

// ─── Session Cart (guest) ─────────────────────────────────────────────────────

export async function getOrCreateCart(sessionId: string, userId?: string) {
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          variant: { include: { product: true, inventory: true } },
          package: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId, userId },
      include: {
        items: {
          include: {
            variant: { include: { product: true, inventory: true } },
            package: true,
          },
        },
      },
    });
  }

  return cart;
}

// ─── Add Item ─────────────────────────────────────────────────────────────────

export async function addCartItem(
  sessionId: string,
  item:
    | { type: "product"; variantId: string; quantity: number }
    | { type: "experience"; packageId: string; quantity?: number; submittedData?: object }
) {
  const cart = await getOrCreateCart(sessionId);

  if (item.type === "product") {
    // Validate variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: { inventory: true },
    });

    if (!variant) throw new NotFoundError("Product variant not found");
    
    const available = variant.inventory?.quantityOnHand ?? 0;
    if (available < item.quantity) {
      throw new ValidationError(`Only ${available} units in stock`);
    }

    // Price snapshot at time of add
    const priceSnap = variant.priceOverride ?? 0; // fallback resolved by orderService

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId: item.variantId },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        type: "product",
        variantId: item.variantId,
        quantity: item.quantity,
        priceSnap,
      },
    });
  }

  // Experience package
  const pkg = await prisma.experiencePackage.findUnique({
    where: { id: item.packageId },
  });
  if (!pkg || !pkg.isActive) throw new NotFoundError("Experience package not found");

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      type: "experience",
      packageId: item.packageId,
      quantity: 1,
      priceSnap: pkg.price,
      submittedData: (item.submittedData ?? null) as object,
    },
  });
}

// ─── Update / Remove Item ─────────────────────────────────────────────────────

export async function updateCartItem(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: cartItemId } });
  }
  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });
}

export async function removeCartItem(cartItemId: string) {
  return prisma.cartItem.delete({ where: { id: cartItemId } });
}

export async function clearCart(sessionId: string) {
  const cart = await prisma.cart.findUnique({ where: { sessionId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

// ─── Merge-on-Login ───────────────────────────────────────────────────────────

/**
 * When a guest logs in, merge their session cart into their user cart.
 * Called by the login flow after JWT issuance.
 */
export async function mergeGuestCartIntoUserCart(guestSessionId: string, userId: string) {
  const guestCart = await prisma.cart.findUnique({
    where: { sessionId: guestSessionId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) return;

  // Find or create user's cart
  const userSessionId = `user:${userId}`;
  const userCart = await getOrCreateCart(userSessionId, userId);

  // Move each guest item
  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: userCart.id,
        variantId: item.variantId ?? undefined,
        packageId: item.packageId ?? undefined,
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          type: item.type,
          variantId: item.variantId,
          packageId: item.packageId,
          quantity: item.quantity,
          priceSnap: item.priceSnap,
          submittedData: item.submittedData as object,
        },
      });
    }
  }

  // Delete the guest cart
  await prisma.cart.delete({ where: { id: guestCart.id } });
}
