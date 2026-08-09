import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Server-only Razorpay client. Never import this file from a Client
 * Component — the key secret must never reach the browser.
 *
 * For the demo, use Razorpay TEST mode credentials (they start with
 * rzp_test_...). See README.md for setup steps.
 */

const PLACEHOLDER_KEY_ID = "rzp_test_placeholder";
const PLACEHOLDER_KEY_SECRET = "placeholder_secret";

/** True only once real-looking Razorpay TEST/LIVE keys are set. */
export function isRazorpayConfigured(): boolean {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    key_id &&
      key_secret &&
      key_id !== PLACEHOLDER_KEY_ID &&
      key_secret !== PLACEHOLDER_KEY_SECRET &&
      /^rzp_(test|live)_/.test(key_id)
  );
}

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!isRazorpayConfigured()) {
    throw new Error(
      "Razorpay keys are not configured yet. Set real RAZORPAY_KEY_ID and " +
        "RAZORPAY_KEY_SECRET (Test Mode, from your Razorpay dashboard) in backend/.env, " +
        "then restart the backend."
    );
  }

  return new Razorpay({ key_id: key_id!, key_secret: key_secret! });
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const client = getRazorpayClient();
  return client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    payment_capture: true,
  });
}

/**
 * Verifies the HMAC-SHA256 signature Razorpay returns after checkout.
 * This is the ONLY trustworthy way to know a payment succeeded — never
 * mark an order as paid based solely on a frontend callback.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured.");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}
