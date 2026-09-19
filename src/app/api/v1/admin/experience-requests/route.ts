/**
 * src/app/api/v1/admin/experience-requests/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    
    const requests = await prisma.experienceRequest.findMany({
      include: {
        package: true,
        orderItem: { include: { order: true } },
        deliverables: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ data: requests });
  } catch (error) {
    return handleApiError(error);
  }
}
