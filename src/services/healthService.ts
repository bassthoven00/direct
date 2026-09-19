/**
 * src/services/healthService.ts
 */

import { checkDatabaseConnection } from "@/repositories/healthRepository";

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  database: "connected" | "disconnected";
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const isDbConnected = await checkDatabaseConnection();

  return {
    status: isDbConnected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: isDbConnected ? "connected" : "disconnected",
  };
}
