/**
 * src/jobs/processors/mediaProcessor.ts
 *
 * Background job to process media after it has been uploaded to R2.
 */

import { Worker, Job } from "bullmq";
import { redis } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";

export const mediaWorker = new Worker(
  "media-processing",
  async (job: Job) => {
    const { mediaId, fullKey } = job.data;
    console.log(`[MediaWorker] Processing media ${mediaId} (${fullKey})`);

    try {
      const media = await prisma.media.findUnique({ where: { id: mediaId } });
      if (!media) throw new Error("Media record not found in DB.");

      // In a real implementation:
      // 1. Download file from R2 using `fullKey`
      // 2. Validate file type/content using magic bytes or AV scan
      // 3. Optimize (resize image, compress video)
      // 4. Upload optimized version back to R2
      // 5. Update media record with final URL, width/height, duration, etc.

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await prisma.media.update({
        where: { id: mediaId },
        data: {
          metadata: {
            ...(media.metadata as object),
            processed: true,
            processedAt: new Date().toISOString(),
          },
        },
      });

      return { success: true };
    } catch (err: unknown) {
      console.error(`[MediaWorker] Failed media processing for job ${job.id}:`, err);
      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 2,
  }
);
