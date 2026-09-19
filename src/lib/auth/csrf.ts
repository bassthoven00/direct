/**
 * src/lib/auth/csrf.ts
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the CSRF token on state-changing requests.
 * Uses the Double Submit Cookie pattern.
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Only check state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return true;
  }

  const cookieToken = req.cookies.get("csrf_token")?.value;
  const headerToken = req.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

/**
 * Issues a new CSRF token if one does not already exist.
 * Should be called in middleware for all non-API GET requests,
 * or explicitly from a /csrf endpoint.
 */
export function setCsrfCookie(res: NextResponse, existingToken?: string) {
  if (!existingToken) {
    const newToken = crypto.randomUUID();
    res.cookies.set("csrf_token", newToken, {
      httpOnly: false, // Must be readable by client JS to set the header
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}
