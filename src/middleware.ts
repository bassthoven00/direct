/**
 * src/middleware.ts
 *
 * Next.js Edge middleware.
 * - Issues a CSRF token cookie for all page GET requests.
 * - Validates CSRF token on state-changing API requests.
 * - Protects /admin/* routes (JWT check).
 *
 * NOTE: Runs in Edge runtime — no Node.js-only modules.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function accessSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET || "fallback_secret_for_dev_only"
  );
}

function validateCsrf(req: NextRequest): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  const cookie = req.cookies.get("csrf_token")?.value;
  const header = req.headers.get("x-csrf-token");
  return !!(cookie && header && cookie === header);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // 1. Issue CSRF cookie on page GETs if missing
  if (req.method === "GET" && !pathname.startsWith("/api/")) {
    if (!req.cookies.get("csrf_token")) {
      res.cookies.set("csrf_token", globalThis.crypto.randomUUID(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }
  }

  // 2. CSRF check on state-changing API calls
  if (
    pathname.startsWith("/api/") &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {
    if (!validateCsrf(req)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Invalid or missing CSRF token." } },
        { status: 403 }
      );
    }
  }

  // 3. Admin route guard (JWT required for /admin/*)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      await jwtVerify(token, accessSecret());
    } catch {
      const r = NextResponse.redirect(new URL("/admin/login", req.url));
      r.cookies.delete("access_token");
      return r;
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
