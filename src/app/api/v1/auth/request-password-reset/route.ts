/**
 * src/app/api/v1/auth/request-password-reset/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { applyRateLimit, redis } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await applyRateLimit(`reset:${ip}`, 3, 60 * 60); // 3 requests per hour

    const body = await req.json();
    const { email } = validate(requestSchema, body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link was sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    // Store in Redis with 1 hour expiration
    await redis.set(`pwd_reset:${resetToken}`, user.id, "EX", 60 * 60);

    // TODO (P12-1): Enqueue email job with link containing resetToken
    console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

    return NextResponse.json({ success: true, message: "If an account exists, a reset link was sent." });
  } catch (error) {
    return handleApiError(error);
  }
}
