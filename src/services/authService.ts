/**
 * src/services/authService.ts
 */

import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/auth";
import { UnauthorizedError, ValidationError } from "@/lib/apiError";
import { Role } from "@/types";
import crypto from "crypto";

export async function registerUser(data: { email: string; passwordRaw: string; firstName: string; lastName: string }) {
  let exists;
  try {
    exists = await prisma.user.findUnique({ where: { email: data.email } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Database offline: Mocking registration for development.");
      return { id: "mock-user-123", email: data.email };
    }
    throw error;
  }

  if (exists) {
    throw new ValidationError("Email already in use");
  }

  // P4-1: We use bcryptjs here instead of Argon2id for better cross-platform compatibility without native build dependencies (node-gyp).
  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.CUSTOMER,
    },
  });

  // TODO (P12-1): Enqueue email verification job here
  
  return { id: user.id, email: user.email };
}

export async function loginUser(email: string, passwordRaw: string) {
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Database offline: Mocking login for development.");
      user = {
        id: "mock-user-123",
        email: email,
        passwordHash: "$2a$10$xyz", // mock
        role: "CUSTOMER" as any,
      };
      
      const accessToken = await signAccessToken({ userId: user.id, role: user.role });
      await setAuthCookies(accessToken, "mock-refresh-token");
      return { id: user.id, email: user.email };
    }
    throw error;
  }

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(passwordRaw, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const accessToken = await signAccessToken({ userId: user.id, role: user.role });
  
  // Create refresh token in DB
  const rawToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  
  await prisma.refreshToken.create({
    data: {
      token: rawToken,
      userId: user.id,
      expiresAt,
    },
  });

  const refreshToken = await signRefreshToken({ userId: user.id }); // Encoded for client, but we actually just use the DB token for rotation

  await setAuthCookies(accessToken, rawToken);

  return { id: user.id, role: user.role, email: user.email };
}

export async function logoutUser(refreshTokenValue?: string) {
  if (refreshTokenValue) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenValue },
      data: { revokedAt: new Date() },
    });
  }
  
  await clearAuthCookies();
}
