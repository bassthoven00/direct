/**
 * src/services/notificationService.ts
 *
 * Enqueues email notifications and writes Notification DB records.
 */

import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/jobs/queue";

export interface EnqueueEmailOptions {
  userId?: string;
  email: string;
  template: string;
  payload: Record<string, any>;
  channels?: string[]; // e.g., ["EMAIL", "SMS"]
}

export async function enqueueNotification(options: EnqueueEmailOptions) {
  const { userId, email, template, payload, channels = ["EMAIL"] } = options;

  // Create the notification record in pending state
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: template,
      channels,
      status: "PENDING",
      metadata: payload,
    },
  });

  // Enqueue job for background worker
  await emailQueue.add(
    "send-email",
    {
      notificationId: notification.id,
      email,
      template,
      payload,
    },
    {
      jobId: notification.id, // prevents duplicates
    }
  );

  return notification;
}
