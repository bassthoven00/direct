/**
 * src/app/api/v1/experiences/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getActivePackages } from "@/services/experienceService";

export async function GET() {
  try {
    const packages = await getActivePackages();
    return NextResponse.json({ data: packages });
  } catch (error) {
    return handleApiError(error);
  }
}
