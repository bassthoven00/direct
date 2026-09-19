/**
 * src/app/api/v1/admin/dashboard/route.ts
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { getDashboardSummary } from "@/services/adminDashboardService";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const summary = await getDashboardSummary();
    return NextResponse.json({ data: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
