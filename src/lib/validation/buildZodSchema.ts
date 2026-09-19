/**
 * src/lib/validation/buildZodSchema.ts
 *
 * Dynamically builds a Zod schema from an ExperiencePackage.requiredFields
 * FieldDefinition[]. Used both server-side (validation) and client-side
 * (React Hook Form + Zod resolver).
 *
 * ARCHITECTURE.md §7 / ADR-008 / ADR-012:
 *   No per-package-type branching — all package forms use this single builder.
 */

import { z } from "zod";
import type { FieldDefinition, FieldValidation } from "@/types";

function buildFieldSchema(field: FieldDefinition): z.ZodTypeAny {
  const v: FieldValidation = field.validation ?? {};

  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "text":
    case "textarea":
    case "tel": {
      let s = z.string();
      if (v.minLength !== undefined) s = s.min(v.minLength, `Minimum ${v.minLength} characters`);
      if (v.maxLength !== undefined) s = s.max(v.maxLength, `Maximum ${v.maxLength} characters`);
      if (v.pattern !== undefined) s = s.regex(new RegExp(v.pattern), "Invalid format");
      schema = s;
      break;
    }
    case "email": {
      schema = z.string().email("Please enter a valid email address");
      break;
    }
    case "select": {
      const options = field.options ?? [];
      if (options.length === 0) {
        schema = z.string();
      } else {
        schema = z.enum(options as [string, ...string[]]);
      }
      break;
    }
    case "date": {
      schema = z.string().refine(
        (val: string) => !isNaN(Date.parse(val)),
        "Please enter a valid date"
      );
      break;
    }
    case "number": {
      let s = z.coerce.number();
      if (v.min !== undefined) s = s.min(v.min, `Minimum value is ${v.min}`);
      if (v.max !== undefined) s = s.max(v.max, `Maximum value is ${v.max}`);
      schema = s;
      break;
    }
    case "file": {
      // After upload the value is a URL string
      schema = z.string().url("Please upload a file first");
      break;
    }
    default: {
      schema = z.string();
    }
  }

  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
}

/**
 * Builds a Zod object schema from an array of FieldDefinitions.
 *
 * @example
 * const schema = buildZodSchema(pkg.requiredFields as FieldDefinition[]);
 * const result = schema.safeParse(submittedData);
 */
export function buildZodSchema(
  fields: FieldDefinition[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.name] = buildFieldSchema(field);
  }
  return z.object(shape);
}
