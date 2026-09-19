/**
 * src/app/api/v1/content/[slug]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getContentBlockBySlug } from "@/services/contentService";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const block = await getContentBlockBySlug(params.slug);
    return NextResponse.json({ data: block });
  } catch (error) {
    return handleApiError(error);
  }
}
