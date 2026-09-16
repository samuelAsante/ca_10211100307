import crypto from "crypto";

/**
 * Thin Paystack API client.
 *
 * The integration is optional: when PAYSTACK_SECRET_KEY is not set the app
 * falls back to the built-in payment simulation (see payment.service.ts).
 * Paystack Ghana supports Mobile Money (MTN, Telecel/Vodafone, AirtelTigo)
 * and cards, all selectable on the hosted checkout page.
 *
 * Docs: https://paystack.com/docs/api/transaction
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const PAYSTACK_SUPPORTED_CHANNELS = ["card", "mobile_money"] as const;

export interface PaystackInitParams {
  email: string;
  /** Amount in major currency units (e.g. GHS 25.50), converted to the minor unit for Paystack. */
  amountMajor: number;
  reference: string;
  currency?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  /** Restrict payment channels, e.g. ["card", "mobile_money"]. Defaults to card & mobile_money. */
  channels?: string[];
}

export interface PaystackInitResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResult {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  amount: number; // in the minor unit (pesewas/kobo)
  currency: string;
  gateway_response?: string;
  channel?: string;
  paid_at?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

function getSecretKey(): string | undefined {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || undefined;
}

export const PaystackService = {
  /** True when a Paystack secret key is configured. */
  isConfigured(): boolean {
    return !!getSecretKey();
  },

  /** Convert major units (GHS) to Paystack's minor unit (pesewas), rounded to an integer. */
  toMinorUnit(amountMajor: number): number {
    return Math.round(Number(amountMajor) * 100);
  },

  /** Convert minor units (pesewas) to major units (GHS). */
  toMajorUnit(amountMinor: number): number {
    return Number((amountMinor / 100).toFixed(2));
  },

  async initializeTransaction(
    params: PaystackInitParams
  ): Promise<PaystackInitResult> {
    const secret = getSecretKey();
    if (!secret) throw new Error("Paystack is not configured");

    const channels = params.channels || ["card", "mobile_money"];

    // Ensure callback_url always uses the custom domain and never an onrender.com URL
    const callbackUrl = params.callbackUrl
      ? params.callbackUrl.replace(/https?:\/\/[^/]*\.onrender\.com/, "https://www.ashantiskitchenware.com")
      : (process.env.NODE_ENV === "production" ? "https://www.ashantiskitchenware.com/checkout/callback" : undefined);

    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: PaystackService.toMinorUnit(params.amountMajor),
        currency: params.currency || "GHS",
        reference: params.reference,
        callback_url: callbackUrl,
        metadata: params.metadata,
        channels,
      }),
    });

    const body = (await res.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: PaystackInitResult }
      | null;

    if (!res.ok || !body?.status || !body.data) {
      throw new Error(body?.message || `Paystack initialize failed (HTTP ${res.status})`);
    }

    return body.data;
  },

  async verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
    const secret = getSecretKey();
    if (!secret) throw new Error("Paystack is not configured");

    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
      }
    );

    const body = (await res.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: PaystackVerifyResult }
      | null;

    if (!res.ok || !body?.status || !body.data) {
      throw new Error(body?.message || `Paystack verify failed (HTTP ${res.status})`);
    }

    return body.data;
  },

  /**
   * Validate a Paystack webhook signature.
   * Paystack signs the raw request body with HMAC-SHA512 using the secret key
   * and sends it in the `x-paystack-signature` header.
   */
  verifyWebhookSignature(
    rawBody: Buffer | string | undefined,
    signature: string | undefined
  ): boolean {
    const secret = getSecretKey();
    if (!secret || !signature || rawBody === undefined) return false;

    try {
      const expected = crypto
        .createHmac("sha512", secret)
        .update(rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expected, "utf8");
      const signatureBuf = Buffer.from(signature.trim(), "utf8");

      if (expectedBuf.length !== signatureBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, signatureBuf);
    } catch {
      return false;
    }
  },
};

