/**
 * src/jobs/processors/emailProcessor.ts
 *
 * BullMQ Worker for sending emails via Resend.
 * Updates the Notification DB record with success/failure and handles backoff.
 */

import { Worker, Job } from "bullmq";
import { redis } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
// Stubbing actual react-email components to keep imports clean for now
// import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export const emailWorker = new Worker(
  "email",
  async (job: Job) => {
    const { notificationId, email, template, payload } = job.data;
    
    console.log(`[EmailWorker] Processing job ${job.id} for ${email} (Template: ${template})`);

    try {
      // In a real app, import the specific React Email template and render it here
      // const html = render(OrderConfirmationEmail({ ...payload }));
      const html = `<p>Simulated email for ${template}</p><pre>${JSON.stringify(payload, null, 2)}</pre>`;
      
      const { data, error } = await resend.emails.send({
        from: "Direct <noreply@direct-experiences.com>",
        to: [email],
        subject: `Notification: ${template}`,
        html,
      });

      if (error) {
        throw new Error(`Resend API Error: ${error.message}`);
      }

      // Mark success
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      return { success: true, resendId: data?.id };
    } catch (err: unknown) {
      console.error(`[EmailWorker] Failed job ${job.id}:`, err);
      
      // If we've exhausted retries, mark as failed in the DB
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "FAILED",
            metadata: {
              ...(typeof job.data.payload === "object" ? job.data.payload : {}),
              error: err instanceof Error ? err.message : String(err),
            },
          },
        });
      }
      
      throw err; // Trigger BullMQ retry
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);
