"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Address = {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const emptyForm: AddressForm = {
  label: "Home",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function loadAddresses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/account/addresses", {
        credentials: "include",
        cache: "no-store",
      });

      const data: unknown = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load addresses.");
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("addresses" in data) ||
        !Array.isArray(data.addresses)
      ) {
        throw new Error("Invalid address response.");
      }

      setAddresses(data.addresses as Address[]);
    } catch (err) {
      console.error(err);
      setError("Unable to load your saved addresses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialAddresses() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/account/addresses", {
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load addresses.");
        }

        if (
          typeof data !== "object" ||
          data === null ||
          !("addresses" in data) ||
          !Array.isArray(data.addresses)
        ) {
          throw new Error("Invalid address response.");
        }

        if (!cancelled) {
          setAddresses(data.addresses as Address[]);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load your saved addresses.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialAddresses();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateField(field: keyof AddressForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data: unknown = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to save address.";

        throw new Error(message);
      }

      setForm(emptyForm);
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Unable to save your address.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-5 py-10 text-[#1d1a17] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <Link
            href="/account"
            className="text-sm text-[#756d65] transition hover:text-[#1d1a17]"
          >
            ← Back to account
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b5e3c]">
                Account
              </p>

              <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
                Saved addresses
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#756d65]">
                Keep your delivery details saved for a faster checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setForm(emptyForm);
                setShowForm((current) => !current);
              }}
              className="rounded-full bg-[#1d1a17] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#332d28]"
            >
              {showForm ? "Cancel" : "Add address"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <section className="mb-8 rounded-3xl border border-[#ded7ce] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-serif text-2xl">Add a new address</h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <div>
                <label className="text-sm font-medium">Address label</label>
                <select
                  value={form.label}
                  onChange={(event) => updateField("label", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Recipient name</label>
                <input
                  required
                  value={form.recipientName}
                  onChange={(event) =>
                    updateField("recipientName", event.target.value)
                  }
                  placeholder="Full name"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mobile number</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="9876543210"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">PIN code</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={form.postalCode}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                  placeholder="700001"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Address line 1</label>
                <input
                  required
                  value={form.line1}
                  onChange={(event) => updateField("line1", event.target.value)}
                  placeholder="House / flat / street"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">
                  Address line 2{" "}
                  <span className="font-normal text-[#9a9289]">(optional)</span>
                </label>
                <input
                  value={form.line2}
                  onChange={(event) => updateField("line2", event.target.value)}
                  placeholder="Apartment, landmark, area"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">City</label>
                <input
                  required
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="City"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">State</label>
                <input
                  required
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                  placeholder="State"
                  className="mt-2 w-full rounded-xl border border-[#d9d1c8] px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-[#8b5e3c] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#70492f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving address..." : "Save address"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="rounded-3xl border border-[#ded7ce] bg-white p-10 text-center text-sm text-[#756d65]">
            Loading your addresses...
          </div>
        ) : addresses.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[#cfc6bc] bg-white px-6 py-16 text-center">
            <p className="font-serif text-2xl">No saved addresses yet</p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#756d65]">
              Add your delivery address once and we&apos;ll make future
              checkouts much faster.
            </p>

            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 rounded-full bg-[#1d1a17] px-6 py-3 text-sm font-medium text-white"
              >
                Add your first address
              </button>
            )}
          </section>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-3xl border border-[#ded7ce] bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-[#f1e8df] px-3 py-1 text-xs font-medium text-[#8b5e3c]">
                      {address.label}
                    </span>

                    <h2 className="mt-4 font-serif text-xl">
                      {address.recipientName}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm leading-6 text-[#756d65]">
                  <p>{address.line1}</p>

                  {address.line2 && <p>{address.line2}</p>}

                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>

                  <p>{address.countryCode}</p>

                  <p className="pt-2 text-[#1d1a17]">{address.phone}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
