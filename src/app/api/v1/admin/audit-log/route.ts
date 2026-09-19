/**
 * src/app/api/v1/admin/audit-log/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(Role.SUPER_ADMIN);
    
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    
    return NextResponse.json({ data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}
