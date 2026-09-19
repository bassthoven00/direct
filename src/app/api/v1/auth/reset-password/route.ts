/**
 * src/app/api/v1/auth/reset-password/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError, UnauthorizedError } from "@/lib/apiError";
import { redis } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = validate(resetSchema, body);
    
    const userId = await redis.get(`pwd_reset:${token}`);
    
    if (!userId) {
      throw new UnauthorizedError("Invalid or expired password reset token.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all existing refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Delete token so it can't be reused
    await redis.del(`pwd_reset:${token}`);

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    return handleApiError(error);
  }
}
