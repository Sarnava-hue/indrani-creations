"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import SavedAddresses, {
  type SavedAddress,
} from "@/components/checkout/saved-addresses";
import { useCart } from "@/components/store/cart-provider";
import { formatINR } from "@/lib/utils/currency";
import { UpiQrCode } from "@/components/checkout/upi-qr-code";

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

type PaymentData = {
  orderNumber: string;
  amountPaise: number;
  currency: string;
  guestAccessToken: string | null;
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

const inputClass =
  "w-full border border-black/15 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-neutral-900";

const labelClass =
  "mb-2 block text-xs uppercase tracking-[0.15em] text-neutral-500";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (isRecord(data) && typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  return fallback;
}

function isOrderResponse(data: unknown): data is {
  order: {
    orderNumber: string;
    guestAccessToken?: string | null;
  };
  payment: { amountPaise: number; currency: string };
} {
  if (!isRecord(data) || !isRecord(data.order) || !isRecord(data.payment)) {
    return false;
  }

  return (
    typeof data.order.orderNumber === "string" &&
    data.order.orderNumber.length > 0 &&
    typeof data.payment.amountPaise === "number" &&
    Number.isSafeInteger(data.payment.amountPaise) &&
    data.payment.amountPaise > 0 &&
    typeof data.payment.currency === "string"
  );
}

export default function CheckoutPage() {
  const { items, subtotalPaise } = useCart();

  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [submitting, setSubmitting] = useState(false);
  const [referenceSubmitting, setReferenceSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [referenceMessage, setReferenceMessage] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

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

    if (submitting || paymentData) return;

    setError("");

    if (items.length === 0) {
      setError("Your bag is empty.");
      return;
    }

    const requiredFields: (keyof CheckoutForm)[] = [
      "name",
      "phone",
      "email",
      "line1",
      "city",
      "state",
      "postalCode",
    ];

    if (requiredFields.some((field) => !form[field].trim())) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to create your order."));
      }

      if (!isOrderResponse(data)) {
        throw new Error(
          "The server response was invalid. Check your order before trying again.",
        );
      }

      setPaymentData({
        orderNumber: data.order.orderNumber,
        amountPaise: data.payment.amountPaise,
        currency: data.payment.currency,
        guestAccessToken:
          typeof data.order.guestAccessToken === "string"
            ? data.order.guestAccessToken
            : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpiReferenceSubmit() {
    if (!paymentData || referenceSubmitting) return;

    const reference = transactionReference.trim();

    if (!/^[a-zA-Z0-9-]{6,100}$/.test(reference)) {
      setError("Enter a valid UPI transaction reference.");
      return;
    }

    setError("");
    setReferenceMessage("");
    setReferenceSubmitting(true);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(paymentData.orderNumber)}/upi-reference`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            transactionReference: reference,
            guestAccessToken: paymentData.guestAccessToken,
          }),
        },
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to submit your UPI reference."),
        );
      }

      setReferenceMessage(
        "Reference submitted. Your payment remains pending until the store verifies receipt of the money.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your UPI reference.",
      );
    } finally {
      setReferenceSubmitting(false);
    }
  }

  if (items.length === 0 && !paymentData) {
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
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Indrani Creations
          </p>

          <h1 className="mt-4 text-5xl font-light tracking-tight text-neutral-900">
            Checkout
          </h1>

          <p className="mt-4 text-sm text-neutral-600">
            {paymentData
              ? "Your order has been created. Complete the payment steps below."
              : "Complete your details to continue."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <form
          onSubmit={handleSubmit}
          className="grid gap-12 lg:grid-cols-[1fr_400px]"
        >
          <div className="space-y-12">
            {!paymentData && (
              <>
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
                      <span className={labelClass}>Full name *</span>
                      <input
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                        className={inputClass}
                        placeholder="Your full name"
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Phone *</span>
                      <input
                        required
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        className={inputClass}
                        placeholder="+91 98765 43210"
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Email *</span>
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                      02
                    </p>
                    <h2 className="mt-2 text-2xl font-light text-neutral-900">
                      Shipping address
                    </h2>
                  </div>

                  <SavedAddresses
                    selectedAddressId={selectedAddressId}
                    onSelect={handleSavedAddressSelect}
                  />

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className={labelClass}>Address line 1 *</span>
                      <input
                        required
                        autoComplete="address-line1"
                        value={form.line1}
                        onChange={(event) =>
                          updateField("line1", event.target.value)
                        }
                        className={inputClass}
                        placeholder="House / flat / street"
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className={labelClass}>Address line 2</span>
                      <input
                        autoComplete="address-line2"
                        value={form.line2}
                        onChange={(event) =>
                          updateField("line2", event.target.value)
                        }
                        className={inputClass}
                        placeholder="Apartment, landmark, etc. (optional)"
                      />
                    </label>

                    <label>
                      <span className={labelClass}>City *</span>
                      <input
                        required
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                        className={inputClass}
                        placeholder="City"
                      />
                    </label>

                    <label>
                      <span className={labelClass}>State *</span>
                      <input
                        required
                        autoComplete="address-level1"
                        value={form.state}
                        onChange={(event) =>
                          updateField("state", event.target.value)
                        }
                        className={inputClass}
                        placeholder="State"
                      />
                    </label>

                    <label>
                      <span className={labelClass}>PIN code *</span>
                      <input
                        required
                        autoComplete="postal-code"
                        inputMode="numeric"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        value={form.postalCode}
                        onChange={(event) =>
                          updateField(
                            "postalCode",
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        className={inputClass}
                        placeholder="700001"
                      />
                    </label>
                  </div>
                </section>
              </>
            )}

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
                <div className="space-y-5">
                  <div className="border border-black/10 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Order created
                    </p>

                    <p className="mt-2 break-all text-sm font-medium text-neutral-900">
                      {paymentData.orderNumber}
                    </p>

                    <p className="mt-4 text-xs text-neutral-500">
                      Amount to pay
                    </p>

                    <p className="mt-1 text-3xl font-light text-neutral-900">
                      {formatINR(paymentData.amountPaise)}
                    </p>
                  </div>

                  <div className="border border-black/10 bg-white p-6 text-center">
                    <h3 className="text-lg text-neutral-900">Pay using UPI</h3>

                    <div className="mx-auto mt-5 flex min-h-64 max-w-sm items-center justify-center">
                      <UpiQrCode
                        orderNumber={paymentData.orderNumber}
                        amountPaise={paymentData.amountPaise}
                      />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-neutral-600">
                      Scan the QR code with your UPI app if a verified payment
                      QR is displayed. Check the recipient and amount in your
                      payment app before authorising payment.
                    </p>

                    <div className="mt-5 border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-6 text-amber-900">
                      Your order is pending payment. Submitting a transaction
                      reference does not confirm that money has been received.
                      The store must verify the payment.
                    </div>

                    <div className="mt-6 space-y-4 text-left">
                      <label className="block">
                        <span className={labelClass}>
                          UPI transaction reference
                        </span>

                        <input
                          type="text"
                          minLength={6}
                          maxLength={100}
                          pattern="[a-zA-Z0-9-]{6,100}"
                          value={transactionReference}
                          onChange={(event) => {
                            setTransactionReference(event.target.value);
                            setReferenceMessage("");
                          }}
                          className={inputClass}
                          placeholder="Enter your UPI reference"
                          autoComplete="off"
                          disabled={referenceSubmitting || !!referenceMessage}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleUpiReferenceSubmit()}
                        disabled={
                          referenceSubmitting ||
                          !!referenceMessage ||
                          !transactionReference.trim()
                        }
                        className="w-full bg-neutral-900 px-6 py-4 text-xs uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
                      >
                        {referenceSubmitting
                          ? "Submitting..."
                          : referenceMessage
                            ? "Reference submitted"
                            : "Submit payment reference"}
                      </button>

                      {referenceMessage && (
                        <p
                          role="status"
                          className="text-sm leading-6 text-green-800"
                        >
                          {referenceMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-black/10 bg-white p-6">
                  <p className="text-sm text-neutral-700">
                    Your order total will be calculated securely when you place
                    your order.
                  </p>
                  <p className="mt-2 text-xs leading-6 text-neutral-500">
                    UPI payment instructions will appear after order creation.
                  </p>
                </div>
              )}
            </section>

            {error && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {!paymentData && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-neutral-900 px-8 py-5 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {submitting ? "Creating order..." : "Place order"}
              </button>
            )}

            {paymentData && (
              <p className="text-sm leading-6 text-neutral-600">
                Keep your order number for reference. Your order is not
                confirmed as paid until the store verifies the transaction.
              </p>
            )}
          </div>

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
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-linear-to-br from-[#e6ded3] via-[#d5c7b7] to-[#b9a998]">
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
                  <span>
                    {paymentData
                      ? formatINR(paymentData.amountPaise)
                      : formatINR(subtotalPaise)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}
