/**
 * src/lib/apiError.ts
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiError } from "@/types";

export class ApiErrorBase extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiErrorBase {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class UnauthorizedError extends ApiErrorBase {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiErrorBase {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class ValidationError extends ApiErrorBase {
  constructor(message = "Validation failed", details?: unknown[]) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class InternalServerError extends ApiErrorBase {
  constructor(message = "Internal server error") {
    super(500, "INTERNAL_ERROR", message);
  }
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error("API Error:", error);

  if (error instanceof ApiErrorBase) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error && typeof error === 'object' && 'name' in error && error.name === 'RateLimitError') {
    return NextResponse.json(
      {
        error: {
          code: "TOO_MANY_REQUESTS",
          message: (error as Error).message,
        },
      },
      { status: 429 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: (error as ZodError).errors,
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
