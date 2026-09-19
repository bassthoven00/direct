/**
 * src/services/adminDashboardService.ts
 *
 * Provides summary statistics for the admin dashboard.
 */

import { prisma } from "@/lib/prisma";
import { OrderStatus, ExperienceRequestStatus } from "@/types";

export async function getDashboardSummary() {
  const [
    totalRevenue,
    orderCount,
    pendingRequests,
    lowStockVariants
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.PARTIALLY_FULFILLED, OrderStatus.FULFILLED] } },
      _sum: { totalAmount: true }
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.PARTIALLY_FULFILLED, OrderStatus.FULFILLED] } }
    }),
    prisma.experienceRequest.count({
      where: { status: ExperienceRequestStatus.PENDING_REVIEW }
    }),
    prisma.inventory.count({
      where: { quantityOnHand: { lt: 10 } }
    })
  ]);

  return {
    revenue: totalRevenue._sum.totalAmount || 0,
    orders: orderCount,
    pendingRequests,
    lowStockAlerts: lowStockVariants
  };
}
