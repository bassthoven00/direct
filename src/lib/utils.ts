/**
 * src/lib/utils.ts
 *
 * General utility helpers (framework-agnostic).
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui class merger — merges Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a human-readable order number.
 * Format: DIR-YYYYMMDD-XXXX (4 random uppercase alphanumeric chars)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `DIR-${date}-${rand}`;
}

/**
 * Format cents (integer) as a locale currency string.
 * @param amount  integer minor units (cents for USD)
 * @param currency ISO 4217 currency code (default "USD")
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

/**
 * Convert naira (NGN) display input to kobo (minor units).
 * @deprecated Use centsToMinorUnits instead where currency is explicit.
 */
export function nairaToCents(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Convert a display amount (e.g. dollars, naira) to minor units (cents/kobo).
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert minor units back to a display number.
 */
export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

/**
 * Safe slugify — converts "My Product Name" → "my-product-name"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
