/**
 * src/lib/validation.ts
 */

import { z, ZodSchema } from "zod";
import { ValidationError } from "./apiError";

/**
 * Validates data against a Zod schema.
 * Throws a ValidationError (handled by handleApiError) if validation fails.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.errors);
  }
  return result.data;
}

/**
 * A generic pagination query schema.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
