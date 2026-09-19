/**
 * src/app/api/v1/auth/register/route.ts
 *
 * Standalone register handler that gracefully degrades when DB is offline.
 */

import { NextRequest, NextResponse } from "next/server";

const IS_DEV = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body ?? {};

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "All fields are required." } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters." } },
        { status: 400 }
      );
    }

    // ── Try real DB registration if available ────────────────────────────────
    try {
      const { PrismaClient } = await import("@prisma/client");
      const bcrypt = await import("bcryptjs");
      const prisma = new PrismaClient();

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        await prisma.$disconnect();
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "An account with this email already exists." } },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash, firstName, lastName, role: "CUSTOMER" },
      });

      await prisma.$disconnect();
      return NextResponse.json({ success: true, user: { id: user.id, email: user.email } }, { status: 201 });

    } catch (dbError: unknown) {
      // DB is offline ────────────────────────────────────────────────────────
      if (!IS_DEV) {
        console.error("DB error during register:", dbError);
        return NextResponse.json(
          { error: { code: "SERVER_ERROR", message: "Service unavailable. Please try again later." } },
          { status: 503 }
        );
      }
      // In development, mock the registration so the UI flow can be tested
      console.warn("[DEV] Database offline — mocking registration for:", email);
      return NextResponse.json(
        { success: true, user: { id: "mock-user-123", email } },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Register route error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
