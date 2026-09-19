/**
 * src/services/contentService.ts
 */

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/apiError";

export async function getContentBlockBySlug(slug: string) {
  const block = await prisma.contentBlock.findUnique({
    where: { slug },
  });
  
  if (!block || !block.isActive) {
    throw new NotFoundError("Content block not found");
  }
  
  return block;
}

export async function updateContentBlock(slug: string, content: string) {
  return prisma.contentBlock.update({
    where: { slug },
    data: { content },
  });
}
