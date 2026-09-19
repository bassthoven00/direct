/**
 * src/services/experienceService.ts
 */

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/apiError";
import type { Prisma } from "@prisma/client";

export async function getActivePackages() {
  return prisma.experiencePackage.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { addOns: { where: { isActive: true } } },
  });
}

export async function getPackageBySlug(slug: string) {
  const pkg = await prisma.experiencePackage.findUnique({
    where: { slug },
    include: { addOns: { where: { isActive: true } } },
  });
  
  if (!pkg || !pkg.isActive) {
    throw new NotFoundError("Experience package not found");
  }
  
  return pkg;
}

// ─── Admin Methods ────────────────────────────────────────────────────────────

export async function getAllPackagesAdmin() {
  return prisma.experiencePackage.findMany({
    orderBy: { createdAt: "desc" },
    include: { addOns: true },
  });
}

export async function createPackage(data: Prisma.ExperiencePackageCreateInput) {
  return prisma.experiencePackage.create({ data });
}

export async function updatePackage(id: string, data: Prisma.ExperiencePackageUpdateInput) {
  return prisma.experiencePackage.update({
    where: { id },
    data,
  });
}
