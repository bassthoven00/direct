/**
 * src/app/api/v1/experience-requests/[id]/attachments/route.ts
 *
 * Generate signed read URLs for deliverables attached to an experience request.
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError, NotFoundError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/services/mediaService";
import { Role } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new UnauthorizedError("Must be logged in to view deliverables.");

    const request = await prisma.experienceRequest.findUnique({
      where: { id: params.id },
      include: {
        orderItem: { include: { order: true } },
        deliverables: true,
      },
    });

    if (!request) throw new NotFoundError("Experience request not found.");

    // Access check: Only the owning customer or Admin/Super Admin can view it
    const isOwner = request.orderItem?.order?.userId === session.userId;
    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedError("You do not have permission to view this deliverable.");
    }

    if (request.deliverables.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Generate signed URLs for all deliverables
    const urls = await Promise.all(
      request.deliverables.map(async (media) => {
        if (media.isPublic) {
          // If marked public (unlikely for a deliverable, but possible), just use the public R2 domain
          return { id: media.id, url: `https://public.direct-experiences.com/${media.url}` };
        }
        
        // Generate a 1-hour signed read URL
        const signedUrl = await getSignedDownloadUrl(media.url, 3600);
        return { id: media.id, url: signedUrl };
      })
    );

    return NextResponse.json({ data: urls });
  } catch (error) {
    return handleApiError(error);
  }
}
