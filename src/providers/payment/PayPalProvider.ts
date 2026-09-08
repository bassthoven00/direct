/**
 * src/providers/payment/PayPalProvider.ts
 *
 * PayPal implementation of PaymentProvider.
 * Uses PayPal Orders API v2 (hosted checkout redirect flow).
 *
 * Required env vars:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_WEBHOOK_ID
 *   PAYPAL_MODE   ("sandbox" | "live")
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

const PAYPAL_SANDBOX = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE = "https://api-m.paypal.com";

function baseUrl(): string {
  return process.env.PAYPAL_MODE === "live" ? PAYPAL_LIVE : PAYPAL_SANDBOX;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not set");

  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export class PayPalProvider implements PaymentProvider {
  readonly name = "paypal" as const;

  async initiatePayment(
    params: InitiatePaymentParams
  ): Promise<PaymentIntentResult> {
    const token = await getAccessToken();
    const dollars = (params.amount / 100).toFixed(2);

    const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": params.reference, // idempotency
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: params.reference,
            description: params.description,
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: dollars,
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: params.callbackUrl,
              cancel_url: params.callbackUrl + "?cancelled=1",
            },
          },
        },
      }),
    });

    const order = (await res.json()) as {
      id: string;
      links: { rel: string; href: string }[];
    };

    const approveLink = order.links.find((l) => l.rel === "payer-action");

    return {
      provider: "paypal",
      providerRef: params.reference,
      paypalOrderId: order.id,
      redirectUrl: approveLink?.href,
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    // providerRef is our internal reference — we need the PayPal order ID.
    // In practice the PayPal order ID is stored in Payment.providerTxId after
    // initiation. This method is called with the PayPal order ID directly in
    // the webhook flow.
    const token = await getAccessToken();
    const res = await fetch(`${baseUrl()}/v2/checkout/orders/${providerRef}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = (await res.json()) as {
      id: string;
      status: string;
      purchase_units: {
        payments?: {
          captures?: { id: string; amount: { value: string; currency_code: string } }[];
        };
      }[];
    };

    const capture = order.purchase_units[0]?.payments?.captures?.[0];
    if (!capture || order.status !== "COMPLETED") {
      return { success: false, amount: 0, currency: "", providerTxId: "", raw: order };
    }

    return {
      success: true,
      amount: Math.round(parseFloat(capture.amount.value) * 100),
      currency: capture.amount.currency_code,
      providerTxId: capture.id,
      raw: order,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookVerifyResult> {
    // PayPal webhook signature verification via their verify API
    const token = await getAccessToken();
    const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const payload = JSON.parse(bodyStr) as {
      id: string;
      event_type: string;
      resource?: {
        id?: string;
        amount?: { value: string; currency_code: string };
        purchase_units?: { reference_id?: string }[];
        supplementary_data?: { related_ids?: { order_id?: string } };
      };
    };

    const verifyRes = await fetch(
      `${baseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: payload,
          // PayPal requires the raw headers for HMAC verification
          // Pass the signature header through as transmission_sig
          transmission_sig: signature,
        }),
      }
    );
    const verifyData = (await verifyRes.json()) as { verification_status: string };
    const isValid = verifyData.verification_status === "SUCCESS";

    const resource = payload.resource;
    const amount = resource?.amount
      ? Math.round(parseFloat(resource.amount.value) * 100)
      : 0;
    const currency = resource?.amount?.currency_code ?? "";
    // reference_id is our internal reference stored in purchase_units
    const providerRef =
      resource?.purchase_units?.[0]?.reference_id ?? "";

    return {
      isValid,
      eventId: payload.id,
      eventType: payload.event_type,
      providerRef,
      amount,
      currency,
      raw: payload,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const token = await getAccessToken();
    const body: Record<string, unknown> = {};
    if (params.amount !== undefined) {
      body.amount = {
        value: (params.amount / 100).toFixed(2),
        currency_code: "USD",
      };
    }
    // providerRef here is the PayPal capture ID (stored in Payment.providerTxId)
    const res = await fetch(
      `${baseUrl()}/v2/payments/captures/${params.providerRef}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const refund = (await res.json()) as { id: string; status: string };
    return {
      success: refund.status === "COMPLETED",
      providerRefundId: refund.id,
      raw: refund,
    };
  }
}
