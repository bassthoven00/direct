/**
 * src/providers/payment/PaystackProvider.ts
 *
 * Paystack implementation of PaymentProvider.
 * Supports NGN (and USD where Paystack allows) as a fallback provider.
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY
 *   PAYSTACK_WEBHOOK_SECRET
 */

import crypto from "crypto";
import type {
  PaymentProvider,
  InitiatePaymentParams,
  PaymentIntentResult,
  VerifyPaymentResult,
  RefundParams,
  RefundResult,
  WebhookVerifyResult,
} from "./PaymentProvider";

const PAYSTACK_BASE = "https://api.paystack.co";

function paystackHeaders() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY env var is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack" as const;

  async initiatePayment(
    params: InitiatePaymentParams
  ): Promise<PaymentIntentResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: paystackHeaders(),
      body: JSON.stringify({
        reference: params.reference,
        amount: params.amount, // Paystack uses minor units (kobo/cents)
        currency: params.currency.toUpperCase(),
        email: params.customerEmail ?? "guest@direct.app",
        callback_url: params.callbackUrl,
        metadata: {
          description: params.description,
          ...(params.metadata ?? {}),
        },
      }),
    });

    const data = (await res.json()) as {
      status: boolean;
      data?: { authorization_url: string; reference: string };
      message?: string;
    };

    if (!data.status || !data.data) {
      throw new Error(`Paystack init failed: ${data.message}`);
    }

    return {
      provider: "paystack",
      providerRef: data.data.reference,
      redirectUrl: data.data.authorization_url,
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(providerRef)}`,
      { headers: paystackHeaders() }
    );
    const data = (await res.json()) as {
      status: boolean;
      data?: {
        id: number;
        status: string;
        amount: number;
        currency: string;
      };
    };

    if (!data.status || !data.data) {
      return { success: false, amount: 0, currency: "", providerTxId: "", raw: data };
    }

    return {
      success: data.data.status === "success",
      amount: data.data.amount,
      currency: data.data.currency,
      providerTxId: String(data.data.id),
      raw: data.data,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookVerifyResult> {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) throw new Error("PAYSTACK_WEBHOOK_SECRET is not set");

    const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const hash = crypto
      .createHmac("sha512", secret)
      .update(bodyStr)
      .digest("hex");

    if (hash !== signature) {
      return { isValid: false, eventId: "", eventType: "", providerRef: "", amount: 0, currency: "", raw: null };
    }

    const payload = JSON.parse(bodyStr) as {
      event: string;
      data?: {
        id: number;
        reference: string;
        amount: number;
        currency: string;
      };
    };

    return {
      isValid: true,
      eventId: String(payload.data?.id ?? ""),
      eventType: payload.event,
      providerRef: payload.data?.reference ?? "",
      amount: payload.data?.amount ?? 0,
      currency: payload.data?.currency ?? "",
      raw: payload,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const res = await fetch(`${PAYSTACK_BASE}/refund`, {
      method: "POST",
      headers: paystackHeaders(),
      body: JSON.stringify({
        transaction: params.providerRef,
        ...(params.amount !== undefined ? { amount: params.amount } : {}),
      }),
    });

    const data = (await res.json()) as {
      status: boolean;
      data?: { id: number; status: string };
      message?: string;
    };

    if (!data.status || !data.data) {
      throw new Error(`Paystack refund failed: ${data.message}`);
    }

    return {
      success: ["pending", "processing", "processed"].includes(data.data.status),
      providerRefundId: String(data.data.id),
      raw: data.data,
    };
  }
}
