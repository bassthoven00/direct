/**
 * src/lib/auth/requireRole.ts
 */

import { Role } from "@/types";
import { ForbiddenError, UnauthorizedError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";

const ROLE_LEVELS: Record<Role, number> = {
  [Role.CUSTOMER]: 0,
  [Role.STAFF]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3,
};

/**
 * Ensures the current request has a valid session and the user meets the
 * minimum required role. Throws API errors if not.
 *
 * @param minimumRole The lowest role level permitted to access the resource.
 * @returns The active session payload.
 */
export async function requireRole(minimumRole: Role) {
  const session = await getSessionFromCookies();

  if (!session) {
    throw new UnauthorizedError("Authentication required");
  }

  const userLevel = ROLE_LEVELS[session.role];
  const requiredLevel = ROLE_LEVELS[minimumRole];

  if (userLevel < requiredLevel) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return session;
}
