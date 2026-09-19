/**
 * src/jobs/queue.ts
 *
 * BullMQ Queue instances.
 */

import { Queue } from "bullmq";
import { redis } from "@/lib/rateLimiter"; // Reuse the global ioredis instance

const QUEUE_OPTIONS = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
};

export const emailQueue = new Queue("email", QUEUE_OPTIONS);
export const reconciliationQueue = new Queue("reconciliation", QUEUE_OPTIONS);
export const mediaQueue = new Queue("media-processing", QUEUE_OPTIONS);
export const cleanupQueue = new Queue("cleanup", QUEUE_OPTIONS);
