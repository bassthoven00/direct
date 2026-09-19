/**
 * src/app/api/v1/health/route.ts
 */

import { NextResponse } from "next/server";
import { getHealthStatus } from "@/services/healthService";

export async function GET() {
  const health = await getHealthStatus();

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}
