/**
 * src/app/api/v1/admin/experience-requests/[id]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role, ExperienceRequestStatus } from "@/types";
import { transitionExperienceRequestStatus } from "@/services/transitions/experienceTransitionService";

const updateStatusSchema = z.object({
  status: z.nativeEnum(ExperienceRequestStatus),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(Role.ADMIN);
    
    const body = await req.json();
    const data = validate(updateStatusSchema, body);
    
    await transitionExperienceRequestStatus(params.id, data.status);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
