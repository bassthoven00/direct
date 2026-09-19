/**
 * src/app/api/v1/experiences/[slug]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getPackageBySlug } from "@/services/experienceService";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const pkg = await getPackageBySlug(params.slug);
    return NextResponse.json({ data: pkg });
  } catch (error) {
    return handleApiError(error);
  }
}
