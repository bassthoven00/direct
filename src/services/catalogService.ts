/**
 * src/services/catalogService.ts
 */

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/apiError";
import type { Prisma } from "@prisma/client";

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
    },
  });
  
  if (!product || !product.isActive) {
    throw new NotFoundError("Product not found");
  }
  
  return product;
}

// ─── Admin Methods ────────────────────────────────────────────────────────────

export async function getAllProductsAdmin() {
  return prisma.product.findMany({
    include: {
      category: true,
      variants: { include: { inventory: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}
