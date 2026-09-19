/**
 * src/app/api/v1/admin/customers/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    
    const customers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ data: customers });
  } catch (error) {
    return handleApiError(error);
  }
}
