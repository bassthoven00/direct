/**
 * src/app/api/v1/auth/refresh/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/apiError";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const oldRefreshToken = cookieStore.get("refresh_token")?.value;

    if (!oldRefreshToken) {
      throw new UnauthorizedError("No refresh token provided");
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const accessToken = await signAccessToken({ userId: tokenRecord.user.id, role: tokenRecord.user.role });
    
    const newRawToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    
    await prisma.refreshToken.create({
      data: {
        token: newRawToken,
        userId: tokenRecord.user.id,
        expiresAt,
      },
    });

    const newSignedRefresh = await signRefreshToken({ userId: tokenRecord.user.id });

    await setAuthCookies(accessToken, newRawToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
