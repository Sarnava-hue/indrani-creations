"use client";

import { useEffect, useState } from "react";

export type SavedAddress = {
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

type SavedAddressesProps = {
  selectedAddressId: number | null;
  onSelect: (address: SavedAddress) => void;
};

export default function SavedAddresses({
  selectedAddressId,
  onSelect,
}: SavedAddressesProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAddresses() {
      try {
        const response = await fetch(
          "/api/account/addresses",
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (response.status === 401) {
          if (!cancelled) {
            setAuthenticated(false);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load saved addresses.",
          );
        }

        const data: unknown = await response.json();

        if (
          typeof data !== "object" ||
          data === null ||
          !("addresses" in data) ||
          !Array.isArray(data.addresses)
        ) {
          throw new Error(
            "Invalid address response.",
          );
        }

        if (!cancelled) {
          setAuthenticated(true);
          setAddresses(
            data.addresses as SavedAddress[],
          );
        }
      } catch (error) {
        console.error(
          "Failed to load saved addresses:",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !authenticated || addresses.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b5e3c]">
          Saved addresses
        </p>

        <h2 className="mt-1 font-serif text-2xl">
          Where should we deliver?
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => {
          const selected =
            selectedAddressId === address.id;

          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect(address)}
              className={`text-left rounded-2xl border p-5 transition ${
                selected
                  ? "border-[#8b5e3c] bg-[#f8f1ea] ring-1 ring-[#8b5e3c]"
                  : "border-[#ded7ce] bg-white hover:border-[#b9a99b]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-[#eee4da] px-3 py-1 text-xs font-medium text-[#8b5e3c]">
                  {address.label}
                </span>

                {selected && (
                  <span className="text-xs font-medium text-[#8b5e3c]">
                    Selected
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-1 text-sm leading-6 text-[#756d65]">
                <p className="font-medium text-[#1d1a17]">
                  {address.recipientName}
                </p>

                <p>{address.line1}</p>

                {address.line2 && (
                  <p>{address.line2}</p>
                )}

                <p>
                  {address.city}, {address.state}{" "}
                  {address.postalCode}
                </p>

                <p>{address.phone}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[#8d857d]">
        Selecting a saved address will fill the delivery
        form below. You can still edit the details before
        placing your order.
      </p>
    </section>
  );
}