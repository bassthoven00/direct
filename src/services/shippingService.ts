/**
 * src/services/shippingService.ts
 *
 * Handles shipping method calculations.
 * For digital-only carts, returns 0.
 */

import { prisma } from "@/lib/prisma";

export interface ShippingRate {
  id: string;
  name: string;
  amountCents: number;
  estimatedDays: string;
}

export async function calculateShippingRates(cartId: string): Promise<ShippingRate[]> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    return [];
  }

  // Check if cart has ANY physical products
  const hasPhysicalItems = cart.items.some(item => item.type === "product");

  if (!hasPhysicalItems) {
    // Digital experiences have no shipping
    return [
      {
        id: "digital",
        name: "Digital Delivery",
        amountCents: 0,
        estimatedDays: "N/A",
      }
    ];
  }

  // Very simple static shipping rates
  return [
    {
      id: "standard",
      name: "Standard Shipping",
      amountCents: 500, // $5.00
      estimatedDays: "5-7 business days",
    },
    {
      id: "express",
      name: "Express Shipping",
      amountCents: 1500, // $15.00
      estimatedDays: "2-3 business days",
    }
  ];
}
