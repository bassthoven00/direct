/**
 * worker/index.ts
 *
 * Entrypoint for background workers.
 * Run via: npx tsx worker/index.ts
 */

import "dotenv/config";
import { emailWorker } from "../src/jobs/processors/emailProcessor";
import { mediaWorker } from "../src/jobs/processors/mediaProcessor";
// Import other workers here when implemented (e.g., reconciliation, cleanup)

console.log("[Worker] Starting BullMQ workers...");

emailWorker.on("completed", (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed successfully.`);
});

emailWorker.on("failed", (job, err) => {
  console.log(`[EmailWorker] Job ${job?.id} failed with error: ${err.message}`);
});

mediaWorker.on("completed", (job) => {
  console.log(`[MediaWorker] Job ${job.id} completed successfully.`);
});

mediaWorker.on("failed", (job, err) => {
  console.log(`[MediaWorker] Job ${job?.id} failed with error: ${err.message}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("[Worker] Shutting down...");
  await emailWorker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
