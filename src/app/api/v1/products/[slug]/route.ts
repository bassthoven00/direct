/**
 * src/app/api/v1/products/[slug]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getProductBySlug } from "@/services/catalogService";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await getProductBySlug(params.slug);
    return NextResponse.json({ data: product });
  } catch (error) {
    return handleApiError(error);
  }
}
