/**
 * src/providers/payment/registry.ts
 *
 * Payment provider registry — ADR-003 / ADR-016.
 *
 * Resolves a PaymentProvider instance by name.
 * The PAYMENT_PROVIDERS env var controls which providers are available
 * and their display order on the checkout page.
 *
 * Usage (in services/paymentService.ts):
 *   import { getProvider, getAvailableProviders } from "@/providers/payment/registry";
 *   const stripe = getProvider("stripe");
 *   const allProviders = getAvailableProviders(); // for checkout UI
 */

import type { PaymentProvider } from "./PaymentProvider";
import type { PaymentProviderName } from "@/types";
import { StripeProvider } from "./StripeProvider";
import { PayPalProvider } from "./PayPalProvider";
import { CashAppProvider } from "./CashAppProvider";
import { PaystackProvider } from "./PaystackProvider";

const PROVIDERS: Record<PaymentProviderName, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  paypal: () => new PayPalProvider(),
  cashapp: () => new CashAppProvider(),
  paystack: () => new PaystackProvider(),
};

/**
 * Returns an active PaymentProvider instance by name.
 * Throws if the provider is not configured or not in PAYMENT_PROVIDERS.
 */
export function getProvider(name: PaymentProviderName): PaymentProvider {
  const available = getAvailableProviderNames();
  if (!available.includes(name)) {
    throw new Error(
      `Payment provider "${name}" is not enabled. ` +
        `Set PAYMENT_PROVIDERS env var to include it.`
    );
  }
  const factory = PROVIDERS[name];
  return factory();
}

/**
 * Returns the list of enabled provider names, in the order specified by
 * the PAYMENT_PROVIDERS env var (default: "stripe").
 */
export function getAvailableProviderNames(): PaymentProviderName[] {
  const raw = process.env.PAYMENT_PROVIDERS ?? "stripe";
  return raw
    .split(",")
    .map((s) => s.trim() as PaymentProviderName)
    .filter((n) => n in PROVIDERS);
}

/**
 * Returns all enabled PaymentProvider instances (for checkout UI metadata,
 * not for actual payment processing — providers are instantiated lazily).
 */
export function getAvailableProviders(): { name: PaymentProviderName; label: string }[] {
  return getAvailableProviderNames().map((name) => ({
    name,
    label: PROVIDER_LABELS[name],
  }));
}

const PROVIDER_LABELS: Record<PaymentProviderName, string> = {
  stripe: "Credit / Debit Card",
  paypal: "PayPal",
  cashapp: "Cash App Pay",
  paystack: "Paystack",
};
