/**
 * src/app/api/v1/admin/products/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { getAllProductsAdmin, createProduct } from "@/services/catalogService";

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  basePrice: z.number().int().min(0),
  currency: z.string().default("USD"),
});

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const products = await getAllProductsAdmin();
    return NextResponse.json({ data: products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const body = await req.json();
    const data = validate(createProductSchema, body);
    
    const product = await createProduct(data);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
