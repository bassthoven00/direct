/**
 * src/app/api/v1/upload/presigned/route.ts
 *
 * Generates an upload intent and returns a presigned URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";
import { generateUploadIntent } from "@/services/mediaService";

const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  isPrivate: z.boolean().default(false),
  entityType: z.string().optional(),
  entityId: z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    // Allow authenticated users to upload. Note: in a real app, restrict what entityType they can claim.
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = validate(uploadSchema, body);

    const result = await generateUploadIntent({
      ...data,
      userId: session.userId,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
