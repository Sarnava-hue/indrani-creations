"use client";

import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  notes?: Record<string, string>;

  theme?: {
    color?: string;
  };

  handler: (response: RazorpayResponse) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
}

interface RazorpayCheckoutProps {
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export function RazorpayCheckout({
  orderNumber,
  razorpayOrderId,
  amountPaise,
  currency,
  keyId,
  customerName,
  customerEmail,
  customerPhone,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment(response: RazorpayResponse) {
    setProcessing(true);
    setError("");

    try {
      const verifyResponse = await fetch("/api/payments/razorpay/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const data = await verifyResponse.json();

      if (!verifyResponse.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed.");
      }

      router.push(`/order-success/${encodeURIComponent(orderNumber)}`);
    } catch (err) {
      setProcessing(false);

      setError(
        err instanceof Error ? err.message : "Payment verification failed.",
      );
    }
  }

  function openCheckout() {
    if (!scriptLoaded || !window.Razorpay) {
      setError("Payment gateway is still loading. Please try again.");
      return;
    }

    setError("");

    const options: RazorpayOptions = {
      key: keyId,
      amount: amountPaise,
      currency,
      name: "Indrani Creations",
      description: `Order ${orderNumber}`,
      order_id: razorpayOrderId,

      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },

      notes: {
        orderNumber,
      },

      theme: {
        color: "#111111",
      },

      handler: handlePayment,
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", (response) => {
      console.error("Razorpay payment failed:", response);

      setProcessing(false);
      setError(
        "Payment failed. Please try again or use another payment method.",
      );
    });

    razorpay.open();
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError("Unable to load the payment gateway.")}
      />

      <button
        type="button"
        onClick={openCheckout}
        disabled={!scriptLoaded || processing}
        className="w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing
          ? "Verifying payment..."
          : scriptLoaded
            ? "Pay securely"
            : "Loading payment..."}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </>
  );
}
