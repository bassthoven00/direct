/**
 * tests/unit/requireRole.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole } from "@/lib/auth/requireRole";
import { Role } from "@/types";
import { ForbiddenError, UnauthorizedError } from "@/lib/apiError";
import * as auth from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getSessionFromCookies: vi.fn(),
}));

describe("requireRole", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws UnauthorizedError if no session exists", async () => {
    vi.mocked(auth.getSessionFromCookies).mockResolvedValue(null);

    await expect(requireRole(Role.ADMIN)).rejects.toThrow(UnauthorizedError);
  });

  it("throws ForbiddenError if user role is below minimum", async () => {
    vi.mocked(auth.getSessionFromCookies).mockResolvedValue({
      userId: "123",
      role: Role.STAFF,
    });

    await expect(requireRole(Role.ADMIN)).rejects.toThrow(ForbiddenError);
  });

  it("allows access if user role matches minimum exactly", async () => {
    const session = { userId: "123", role: Role.ADMIN };
    vi.mocked(auth.getSessionFromCookies).mockResolvedValue(session);

    const result = await requireRole(Role.ADMIN);
    expect(result).toEqual(session);
  });

  it("allows access if user role is higher than minimum", async () => {
    const session = { userId: "123", role: Role.SUPER_ADMIN };
    vi.mocked(auth.getSessionFromCookies).mockResolvedValue(session);

    const result = await requireRole(Role.ADMIN);
    expect(result).toEqual(session);
  });
});
