/**
 * src/app/api/v1/admin/packages/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { getAllPackagesAdmin, createPackage } from "@/services/experienceService";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(0), // cents
  currency: z.string().default("USD"),
  deliveryInfo: z.string().optional(),
  requiredFields: z.array(z.any()), // in reality, validate against FieldDefinition shape
  imageUrl: z.string().url().optional(),
});

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const packages = await getAllPackagesAdmin();
    return NextResponse.json({ data: packages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const body = await req.json();
    const data = validate(createSchema, body);
    
    const pkg = await createPackage(data);
    return NextResponse.json({ data: pkg }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
