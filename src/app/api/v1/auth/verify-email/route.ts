/**
 * src/app/api/v1/auth/verify-email/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError, UnauthorizedError } from "@/lib/apiError";
import { redis } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = validate(verifySchema, body);
    
    // In a real implementation with email verification, we'd look up the token.
    // For now, we simulate finding a userId in Redis.
    const userId = await redis.get(`email_verify:${token}`);
    
    if (!userId) {
      throw new UnauthorizedError("Invalid or expired verification token.");
    }

    // In a full schema, you'd have `emailVerifiedAt` on the User model.
    // Since Phase 3 schema doesn't have it, we just consume the token as a placeholder.
    await redis.del(`email_verify:${token}`);

    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    return handleApiError(error);
  }
}
