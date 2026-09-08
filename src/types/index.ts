/**
 * src/types/index.ts
 *
 * Shared TypeScript types and enums that mirror the Prisma schema.
 * These are framework-agnostic — safe to import from services, providers,
 * and route handlers without pulling in Prisma client.
 */

// ─── Role & Auth ──────────────────────────────────────────────────────────────

export enum Role {
  CUSTOMER = "CUSTOMER",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

// ─── Order ────────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PAID = "PAID",
  PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED",
  FULFILLED = "FULFILLED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum FulfillmentStatus {
  UNFULFILLED = "UNFULFILLED",
  PACKED = "PACKED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

/**
 * All payment providers the platform supports.
 * Each maps to a concrete PaymentProvider implementation.
 */
export type PaymentProviderName = "stripe" | "paypal" | "cashapp" | "paystack";

// ─── Experience Requests ──────────────────────────────────────────────────────

export enum ExperienceRequestStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PENDING_REVIEW = "PENDING_REVIEW",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  DELIVERED = "DELIVERED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

// ─── Money ────────────────────────────────────────────────────────────────────

/**
 * All monetary values are stored as integer minor units (cents for USD,
 * kobo for NGN, etc.). Never use floating-point for money.
 */
export interface Money {
  amount: number; // integer minor units
  currency: string; // ISO 4217 e.g. "USD", "NGN"
}

/** Default currency for new records. */
export const DEFAULT_CURRENCY = "USD";

/** Convert a Money amount (cents) to a display string, e.g. "$14.99" */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 2,
  }).format(money.amount / 100);
}

// ─── Dynamic Form (requiredFields) ───────────────────────────────────────────

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "number"
  | "email"
  | "tel"
  | "file";

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for type "select"
  validation?: FieldValidation;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartProductItem {
  type: "product";
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number; // cents
  currency: string;
  imageUrl?: string;
}

export interface CartExperienceItem {
  type: "experience";
  packageId: string;
  packageName: string;
  quantity: 1; // always 1 for experiences
  unitPrice: number; // cents
  currency: string;
  submittedData: Record<string, unknown>; // answers to requiredFields
  imageUrl?: string;
}

export type CartItem = CartProductItem | CartExperienceItem;

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

// ─── Payment Initiation ───────────────────────────────────────────────────────

export interface PaymentIntent {
  provider: PaymentProviderName;
  providerRef: string;
  /** URL to redirect the customer to (for redirect-based providers like Paystack) */
  redirectUrl?: string;
  /** Client-side key/token for SDK-based providers like Stripe */
  clientSecret?: string;
  /** PayPal order ID for PayPal SDK */
  paypalOrderId?: string;
}
