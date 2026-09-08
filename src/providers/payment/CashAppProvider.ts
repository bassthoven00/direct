/**
 * src/providers/payment/CashAppProvider.ts
 *
 * CashApp Pay implementation of PaymentProvider.
 * Uses Square's Web Payments SDK / CashApp Pay APIs.
 *
 * Required env vars:
 *   CASHAPP_CLIENT_ID       (Square application ID)
 *   CASHAPP_CLIENT_SECRET   (Square access token)
 *   CASHAPP_WEBHOOK_SECRET  (Square webhook signature key)
 *
 * CashApp Pay is available through Square's Payment Link or Web Payments SDK.
 * This adapter uses Square's Payment Links API for a redirect-based flow,
 * consistent with the Paystack / PayPal redirect pattern.
 */

import type {
  PaymentProvider,
  InitiatePaymentParams,
  PaymentIntentResult,
  VerifyPaymentResult,
  RefundParams,
  RefundResult,
  WebhookVerifyResult,
} from "./PaymentProvider";
import crypto from "crypto";

const SQUARE_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://connect.squareup.com"
  : "https://connect.squareupsandbox.com";

function squareHeaders() {
  const token = process.env.CASHAPP_CLIENT_SECRET;
  if (!token) throw new Error("CASHAPP_CLIENT_SECRET env var is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Square-Version": "2024-06-04",
    "Content-Type": "application/json",
  };
}

export class CashAppProvider implements PaymentProvider {
  readonly name = "cashapp" as const;

  async initiatePayment(
    params: InitiatePaymentParams
  ): Promise<PaymentIntentResult> {
    // Create a Square Payment Link — CashApp Pay is offered as a payment option
    const res = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: squareHeaders(),
      body: JSON.stringify({
        idempotency_key: params.reference,
        order: {
          order: {
            location_id: process.env.CASHAPP_LOCATION_ID ?? "DEFAULT",
            line_items: [
              {
                name: params.description,
                quantity: "1",
                base_price_money: {
                  amount: params.amount,
                  currency: params.currency.toUpperCase(),
                },
              },
            ],
          },
        },
        checkout_options: {
          redirect_url: params.callbackUrl,
          accepted_payment_methods: { cash_app_pay: true },
        },
        pre_populated_data: {
          buyer_email: params.customerEmail,
        },
      }),
    });

    const data = (await res.json()) as {
      payment_link?: { id: string; url: string; long_url: string };
      errors?: unknown[];
    };

    if (data.errors?.length || !data.payment_link) {
      throw new Error(`CashApp/Square payment link error: ${JSON.stringify(data.errors)}`);
    }

    return {
      provider: "cashapp",
      providerRef: params.reference,
      redirectUrl: data.payment_link.long_url,
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    // Look up order by our idempotency key / reference
    const res = await fetch(
      `${SQUARE_BASE_URL}/v2/orders/search`,
      {
        method: "POST",
        headers: squareHeaders(),
        body: JSON.stringify({
          query: {
            filter: {
              customer_filter: {},
            },
          },
        }),
      }
    );
    // Square doesn't have a direct "search by idempotency key" endpoint.
    // The reference is stored in the payment's note field. For verification,
    // we search payments for a matching order ID stored in providerTxId.
    const paymentsRes = await fetch(
      `${SQUARE_BASE_URL}/v2/payments?sort_order=DESC`,
      { headers: squareHeaders() }
    );
    const paymentsData = (await paymentsRes.json()) as {
      payments?: {
        id: string;
        order_id: string;
        status: string;
        amount_money: { amount: number; currency: string };
        note?: string;
      }[];
    };

    const payment = paymentsData.payments?.find(
      (p) => p.note === providerRef || p.order_id === providerRef
    );

    if (!payment) {
      return { success: false, amount: 0, currency: "", providerTxId: "", raw: null };
    }

    return {
      success: payment.status === "COMPLETED",
      amount: payment.amount_money.amount,
      currency: payment.amount_money.currency,
      providerTxId: payment.id,
      raw: payment,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookVerifyResult> {
    // Square uses HMAC-SHA256
    const secret = process.env.CASHAPP_WEBHOOK_SECRET;
    if (!secret) throw new Error("CASHAPP_WEBHOOK_SECRET is not set");

    const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    // Square webhook signature is Base64(HMAC-SHA256(notificationUrl + body, secret))
    // The notification URL must match exactly what's registered in Square dashboard.
    const notificationUrl = `${process.env.APP_URL}/api/v1/payments/webhook/cashapp`;
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(notificationUrl + bodyStr)
      .digest("base64");

    if (hmac !== signature) {
      return { isValid: false, eventId: "", eventType: "", providerRef: "", amount: 0, currency: "", raw: null };
    }

    const payload = JSON.parse(bodyStr) as {
      event_id: string;
      type: string;
      data?: {
        object?: {
          payment?: {
            id: string;
            amount_money: { amount: number; currency: string };
            note?: string;
          };
        };
      };
    };

    const payment = payload.data?.object?.payment;
    return {
      isValid: true,
      eventId: payload.event_id,
      eventType: payload.type,
      providerRef: payment?.note ?? "",
      amount: payment?.amount_money.amount ?? 0,
      currency: payment?.amount_money.currency ?? "",
      raw: payload,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    // params.providerRef is the Square payment ID (Payment.providerTxId)
    const res = await fetch(`${SQUARE_BASE_URL}/v2/refunds`, {
      method: "POST",
      headers: squareHeaders(),
      body: JSON.stringify({
        idempotency_key: `refund-${params.providerRef}`,
        payment_id: params.providerRef,
        ...(params.amount !== undefined
          ? { amount_money: { amount: params.amount, currency: "USD" } }
          : {}),
        reason: params.reason ?? "Customer refund",
      }),
    });

    const data = (await res.json()) as {
      refund?: { id: string; status: string };
      errors?: unknown[];
    };

    if (data.errors?.length || !data.refund) {
      throw new Error(`CashApp refund error: ${JSON.stringify(data.errors)}`);
    }

    return {
      success: data.refund.status === "COMPLETED" || data.refund.status === "PENDING",
      providerRefundId: data.refund.id,
      raw: data.refund,
    };
  }
}
