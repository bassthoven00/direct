/**
 * src/providers/payment/StripeProvider.ts
 *
 * Stripe implementation of PaymentProvider.
 * Handles USD payments via Stripe Payment Intents.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */

import Stripe from "stripe";
import type {
  PaymentProvider,
  InitiatePaymentParams,
  PaymentIntentResult,
  VerifyPaymentResult,
  RefundParams,
  RefundResult,
  WebhookVerifyResult,
} from "./PaymentProvider";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY env var is not set");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  async initiatePayment(
    params: InitiatePaymentParams
  ): Promise<PaymentIntentResult> {
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      description: params.description,
      receipt_email: params.customerEmail,
      metadata: {
        reference: params.reference,
        ...(params.metadata ?? {}),
      },
    });

    return {
      provider: "stripe",
      providerRef: params.reference,
      clientSecret: paymentIntent.client_secret ?? undefined,
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    const stripe = getStripe();
    // providerRef is our internal reference stored in metadata
    const list = await stripe.paymentIntents.search({
      query: `metadata["reference"]:"${providerRef}"`,
    });
    const pi = list.data[0];
    if (!pi) {
      return {
        success: false,
        amount: 0,
        currency: "usd",
        providerTxId: "",
        raw: null,
      };
    }
    return {
      success: pi.status === "succeeded",
      amount: pi.amount_received,
      currency: pi.currency.toUpperCase(),
      providerTxId: pi.id,
      raw: pi,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookVerifyResult> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      return {
        isValid: false,
        eventId: "",
        eventType: "",
        providerRef: "",
        amount: 0,
        currency: "",
        raw: null,
      };
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      return {
        isValid: true,
        eventId: event.id,
        eventType: event.type,
        providerRef: (pi.metadata?.reference as string) ?? "",
        amount: pi.amount_received,
        currency: pi.currency.toUpperCase(),
        raw: event,
      };
    }

    // Return valid but unactionable event (e.g. payment_intent.created)
    return {
      isValid: true,
      eventId: event.id,
      eventType: event.type,
      providerRef: "",
      amount: 0,
      currency: "",
      raw: event,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const stripe = getStripe();
    // Look up the PaymentIntent by our reference
    const list = await stripe.paymentIntents.search({
      query: `metadata["reference"]:"${params.providerRef}"`,
    });
    const pi = list.data[0];
    if (!pi) throw new Error(`No Stripe PaymentIntent found for ref ${params.providerRef}`);

    const refund = await stripe.refunds.create({
      payment_intent: pi.id,
      ...(params.amount !== undefined ? { amount: params.amount } : {}),
      reason: "requested_by_customer",
    });

    return {
      success: refund.status === "succeeded",
      providerRefundId: refund.id,
      raw: refund,
    };
  }
}
