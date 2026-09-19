/**
 * src/services/userService.ts
 *
 * User profile, orders, and address management.
 */

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/apiError";

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
          experience: true,
          experienceRequest: true,
        },
      },
      payments: true,
      shipment: true,
    },
  });
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" },
  });
}

export async function createUserAddress(userId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        ...data,
        userId,
      },
    });
  });
}

export async function updateUserAddress(userId: string, addressId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    // Verify ownership
    const existing = await tx.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) throw new NotFoundError("Address not found");

    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data,
    });
  });
}

export async function deleteUserAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) throw new NotFoundError("Address not found");

  return prisma.address.delete({ where: { id: addressId } });
}
