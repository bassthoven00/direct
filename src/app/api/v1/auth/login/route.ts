/**
 * src/app/api/v1/auth/login/route.ts
 *
 * Standalone login handler that gracefully degrades when DB is offline.
 * In development without a DB: accepts any email/password and sets a mock JWT.
 * In production: requires a live DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const IS_DEV = process.env.NODE_ENV !== "production";

function accessSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET || "dev_fallback_secret_do_not_use_in_prod"
  );
}

async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Email and password are required." } },
        { status: 400 }
      );
    }

    // ── Try real DB auth if available ────────────────────────────────────────
    let user: { id: string; email: string; role: string } | null = null;

    try {
      const { PrismaClient } = await import("@prisma/client");
      const bcrypt = await import("bcryptjs");
      const prisma = new PrismaClient();

      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) {
        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) {
          return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Invalid email or password." } },
            { status: 401 }
          );
        }
        user = { id: dbUser.id, email: dbUser.email, role: dbUser.role };
      } else {
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid email or password." } },
          { status: 401 }
        );
      }

      await prisma.$disconnect();
    } catch (dbError: unknown) {
      // DB is offline ───────────────────────────────────────────────────────
      if (!IS_DEV) {
        console.error("DB error during login:", dbError);
        return NextResponse.json(
          { error: { code: "SERVER_ERROR", message: "Service unavailable. Please try again later." } },
          { status: 503 }
        );
      }
      // In development, use a mock user so the UI flow can be tested
      console.warn("[DEV] Database offline — using mock login for:", email);
      user = { id: "mock-user-123", email, role: "CUSTOMER" };
    }

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid email or password." } },
        { status: 401 }
      );
    }

    // Issue JWT
    const accessToken = await signToken({ userId: user.id, role: user.role });

    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    const IS_PROD = process.env.NODE_ENV === "production";

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    return res;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
