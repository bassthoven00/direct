/**
 * src/app/api/v1/admin/orders/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ data: orders });
  } catch (error) {
    return handleApiError(error);
  }
}
