"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/checkout/razorpay-checkout";

import SavedAddresses, {
  type SavedAddress,
} from "@/components/checkout/saved-addresses";
import { useCart } from "@/components/store/cart-provider";
import { formatINR } from "@/lib/utils/currency";

type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function CheckoutPage() {

  const { items, subtotalPaise } = useCart();

  const [form, setForm] = useState<CheckoutForm>(initialForm);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [paymentData, setPaymentData] = useState<{
    orderNumber: string;
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
  } | null>(null);

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSavedAddressSelect(address: SavedAddress) {
    setSelectedAddressId(address.id);

    setForm((current) => ({
      ...current,
      name: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    }));

    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      if (
        !form.name.trim() ||
        !form.phone.trim() ||
        !form.email.trim() ||
        !form.line1.trim() ||
        !form.city.trim() ||
        !form.state.trim() ||
        !form.postalCode.trim()
      ) {
        throw new Error("Please complete all required fields.");
      }

      if (items.length === 0) {
        throw new Error("Your bag is empty.");
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shipping: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: form.postalCode.trim(),
          },
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to create your order.";

        throw new Error(message);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("order" in data) ||
        typeof data.order !== "object" ||
        data.order === null ||
        !("orderNumber" in data.order) ||
        typeof data.order.orderNumber !== "string" ||
        !("payment" in data) ||
        typeof data.payment !== "object" ||
        data.payment === null ||
        !("razorpayOrderId" in data.payment) ||
        typeof data.payment.razorpayOrderId !== "string" ||
        !("amountPaise" in data.payment) ||
        typeof data.payment.amountPaise !== "number" ||
        !("currency" in data.payment) ||
        typeof data.payment.currency !== "string" ||
        !("keyId" in data.payment) ||
        typeof data.payment.keyId !== "string"
      ) {
        throw new Error(
          "Order was created, but payment information was invalid.",
        );
      }

      setPaymentData({
        orderNumber: data.order.orderNumber,
        razorpayOrderId: data.payment.razorpayOrderId,
        amountPaise: data.payment.amountPaise,
        currency: data.payment.currency,
        keyId: data.payment.keyId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Checkout
          </p>

          <h1 className="mt-5 text-5xl font-light tracking-tight text-neutral-900">
            Your bag is empty.
          </h1>

          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-neutral-600">
            Add a saree to your bag before continuing to checkout.
          </p>

          <Link
            href="/shop"
            className="mt-10 inline-flex bg-neutral-900 px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Explore the collection
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* Header */}

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Indrani Creations
          </p>

          <h1 className="mt-4 text-5xl font-light tracking-tight text-neutral-900">
            Checkout
          </h1>

          <p className="mt-4 text-sm text-neutral-600">
            Complete your details to continue.
          </p>
        </div>
      </section>

      {/* Main */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <form
          onSubmit={handleSubmit}
          className="grid gap-12 lg:grid-cols-[1fr_400px]"
        >
          {/* Form */}

          <div className="space-y-12">
            {/* Contact */}

            <section>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  01
                </p>

                <h2 className="mt-2 text-2xl font-light text-neutral-900">
                  Contact information
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    Full name *
                  </span>

                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="Your full name"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    Phone *
                  </span>

                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="+91 98765 43210"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    Email *
                  </span>

                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="you@example.com"
                  />
                </label>
              </div>
            </section>

            {/* Shipping */}

            <section>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  02
                </p>

                <h2 className="mt-2 text-2xl font-light text-neutral-900">
                  Shipping address
                </h2>
              </div>

              {/* Saved addresses */}

              <SavedAddresses
                selectedAddressId={selectedAddressId}
                onSelect={handleSavedAddressSelect}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    Address line 1 *
                  </span>

                  <input
                    required
                    value={form.line1}
                    onChange={(event) =>
                      updateField("line1", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="House / flat / street"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    Address line 2
                  </span>

                  <input
                    value={form.line2}
                    onChange={(event) =>
                      updateField("line2", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="Apartment, landmark, etc. (optional)"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    City *
                  </span>

                  <input
                    required
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="City"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    State *
                  </span>

                  <input
                    required
                    value={form.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="State"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500">
                    PIN code *
                  </span>

                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={form.postalCode}
                    onChange={(event) =>
                      updateField("postalCode", event.target.value)
                    }
                    className="w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900"
                    placeholder="700001"
                  />
                </label>
              </div>
            </section>

            {/* Payment */}

            <section>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  03
                </p>

                <h2 className="mt-2 text-2xl font-light text-neutral-900">
                  Payment
                </h2>
              </div>

              {paymentData ? (
                <div className="space-y-4">
                  <div className="border border-black/10 bg-white p-6">
                    <p className="text-sm text-neutral-500">Order created</p>

                    <p className="mt-2 text-sm font-medium text-neutral-900">
                      {paymentData.orderNumber}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                      Your order has been reserved. Complete the secure payment
                      below to confirm your order.
                    </p>
                  </div>

                  <RazorpayCheckout
                    orderNumber={paymentData.orderNumber}
                    razorpayOrderId={paymentData.razorpayOrderId}
                    amountPaise={paymentData.amountPaise}
                    currency={paymentData.currency}
                    keyId={paymentData.keyId}
                    customerName={form.name}
                    customerEmail={form.email}
                    customerPhone={form.phone}
                  />
                </div>
              ) : (
                <div className="border border-black/10 bg-white p-6">
                  <p className="text-sm text-neutral-700">
                    Secure payment will appear here after your order details are
                    submitted.
                  </p>

                  <p className="mt-2 text-xs leading-6 text-neutral-500">
                    You will be redirected to Razorpay&apos;s secure payment
                    window after placing your order.
                  </p>
                </div>
              )}
            </section>

            {/* Error */}

            {error && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {/* Submit */}

            {!paymentData && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-neutral-900 px-8 py-5 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {submitting ? "Processing..." : "Place order"}
              </button>
            )}
          </div>

          {/* Summary */}

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-black/10 bg-white p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                Order summary
              </p>

              <div className="mt-8 divide-y divide-black/10">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-gradient-to-br from-[#e6ded3] via-[#d5c7b7] to-[#b9a998]">
                      {item.imageUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${item.imageUrl}")`,
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-900">{item.name}</p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm text-neutral-900">
                      {formatINR(item.pricePaise * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t border-black/10 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>

                  <span>{formatINR(subtotalPaise)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Shipping</span>

                  <span>Calculated later</span>
                </div>

                <div className="flex justify-between border-t border-black/10 pt-5 text-lg">
                  <span>Total</span>

                  <span>{formatINR(subtotalPaise)}</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}
