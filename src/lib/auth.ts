/**
 * src/lib/auth.ts
 *
 * JWT helpers for access and refresh tokens.
 * Tokens are stored in HTTP-only, Secure, SameSite=Lax cookies.
 *
 * Access token:  15 minutes, contains { userId, role }
 * Refresh token: 7 days, contains { userId } — used to issue new access tokens
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/types";

// ─── Token types ──────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export interface RefreshTokenPayload {
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accessSecret(): Uint8Array {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("JWT_ACCESS_SECRET is not set");
  return new TextEncoder().encode(s);
}

function refreshSecret(): Uint8Array {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET is not set");
  return new TextEncoder().encode(s);
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret());
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret());
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

/**
 * Read and verify the access token from the current request's cookies.
 * Returns null if missing or invalid.
 */
export async function getSessionFromCookies(): Promise<AccessTokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}
