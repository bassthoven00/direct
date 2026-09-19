/**
 * src/services/transitions/experienceTransitionService.ts
 *
 * AGENTS.md Rule #8: ALL ExperienceRequest.status mutations go through this service.
 * Never call prisma.experienceRequest.update({ data: { status: ... } }) directly.
 *
 * Implements the allow-list state machine from ARCHITECTURE.md §8.
 */

import { prisma } from "@/lib/prisma";
import { ExperienceRequestStatus } from "@/types";

/** Allowed transitions: fromStatus → Set of valid toStatus */
const EXPERIENCE_TRANSITIONS: Record<string, ExperienceRequestStatus[]> = {
  [ExperienceRequestStatus.PENDING_PAYMENT]: [
    ExperienceRequestStatus.PENDING_REVIEW,
    ExperienceRequestStatus.CANCELLED,
  ],
  [ExperienceRequestStatus.PENDING_REVIEW]: [
    ExperienceRequestStatus.ACCEPTED,
    ExperienceRequestStatus.REJECTED,
  ],
  [ExperienceRequestStatus.ACCEPTED]: [
    ExperienceRequestStatus.IN_PROGRESS,
    ExperienceRequestStatus.CANCELLED,
  ],
  [ExperienceRequestStatus.IN_PROGRESS]: [
    ExperienceRequestStatus.DELIVERED,
    ExperienceRequestStatus.CANCELLED,
  ],
  [ExperienceRequestStatus.DELIVERED]: [
    ExperienceRequestStatus.REFUNDED,
  ],
  [ExperienceRequestStatus.REJECTED]:  [],
  [ExperienceRequestStatus.CANCELLED]: [ExperienceRequestStatus.REFUNDED],
  [ExperienceRequestStatus.REFUNDED]:  [],
};

export class InvalidExperienceTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid experience request transition: ${from} → ${to}`);
    this.name = "InvalidExperienceTransitionError";
  }
}

export async function transitionExperienceRequestStatus(
  experienceRequestId: string,
  to: ExperienceRequestStatus,
  actorId?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const req = await tx.experienceRequest.findUniqueOrThrow({
      where: { id: experienceRequestId },
      select: { status: true },
    });

    const from = req.status as ExperienceRequestStatus;
    const allowed = EXPERIENCE_TRANSITIONS[from] ?? [];

    if (!allowed.includes(to)) {
      throw new InvalidExperienceTransitionError(from, to);
    }

    await tx.experienceRequest.update({
      where: { id: experienceRequestId },
      data: { status: to },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId ?? null,
        action: "EXPERIENCE_REQUEST_STATUS_TRANSITION",
        entityId: experienceRequestId,
        details: { from, to },
      },
    });
  });
}
