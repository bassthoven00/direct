/**
 * src/lib/prisma.ts
 *
 * Prisma Client singleton.
 * In development, Next.js hot-reloads can create many Prisma Client instances
 * which exhausts the DB connection pool. The globalThis trick reuses one instance.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
