/**
 * src/app/api/v1/admin/team/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([Role.ADMIN, Role.SUPER_ADMIN]),
});

export async function GET() {
  try {
    await requireRole(Role.SUPER_ADMIN);
    
    const team = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ data: team });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(Role.SUPER_ADMIN);
    
    const body = await req.json();
    const data = validate(inviteSchema, body);
    
    // In a real system, you would send an invite email here.
    // We'll simulate creating a pending account.
    const user = await prisma.user.create({
      data: {
        email: data.email,
        role: data.role,
        firstName: "Pending",
        lastName: "Invite",
        passwordHash: "INVITED_NO_PASSWORD", // Need to set password later
      },
    });
    
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
