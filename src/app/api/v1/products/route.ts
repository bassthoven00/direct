/**
 * src/app/api/v1/products/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getActiveProducts } from "@/services/catalogService";

export async function GET() {
  try {
    const products = await getActiveProducts();
    return NextResponse.json({ data: products });
  } catch (error) {
    return handleApiError(error);
  }
}
