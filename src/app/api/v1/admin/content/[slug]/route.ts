/**
 * src/app/api/v1/admin/content/[slug]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { updateContentBlock } from "@/services/contentService";

const updateSchema = z.object({
  content: z.string().min(1),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requireRole(Role.ADMIN);
    
    const body = await req.json();
    const data = validate(updateSchema, body);
    
    const block = await updateContentBlock(params.slug, data.content);
    return NextResponse.json({ data: block });
  } catch (error) {
    return handleApiError(error);
  }
}
