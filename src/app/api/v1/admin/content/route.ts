/**
 * src/app/api/v1/admin/content/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    
    const blocks = await prisma.contentBlock.findMany({
      orderBy: { slug: "asc" },
    });
    
    return NextResponse.json({ data: blocks });
  } catch (error) {
    return handleApiError(error);
  }
}
