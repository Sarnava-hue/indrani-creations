"use client";

import { useEffect, useState } from "react";

type InventoryRecord = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  inventoryId: number | null;
  quantity: number;
  reserved: number;
  available: number;
  status:
    | "OUT_OF_STOCK"
    | "LOW_STOCK"
    | "IN_STOCK";
};

function statusLabel(
  status: InventoryRecord["status"],
) {
  switch (status) {
    case "OUT_OF_STOCK":
      return "Out of stock";

    case "LOW_STOCK":
      return "Low stock";

    default:
      return "In stock";
  }
}

export default function AdminInventoryPage() {
  const [items, setItems] =
    useState<InventoryRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function loadInventory() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/admin/inventory",
        {
          cache: "no-store",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to load inventory",
        );
      }

      setItems(data.inventory);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(
    productId: number,
    quantity: number,
  ) {
    try {
      setSavingId(productId);
      setError(null);

      const response = await fetch(
        `/api/admin/inventory/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            quantity,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to update inventory",
        );
      }

      await loadInventory();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update inventory",
      );
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialInventory() {
      try {
        const response =
          await fetch(
            "/api/admin/inventory",
            {
              cache: "no-store",
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Failed to load inventory",
          );
        }

        if (!cancelled) {
          setItems(data.inventory);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load inventory",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Store management
        </p>

        <h1 className="mt-2 text-3xl font-medium text-neutral-900">
          Inventory
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Manage available and reserved stock.
        </p>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-8 text-sm text-neutral-500">
            Loading inventory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Product
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    SKU
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] uppercase tracking-widest text-neutral-500">
                    Total
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] uppercase tracking-widest text-neutral-500">
                    Reserved
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] uppercase tracking-widest text-neutral-500">
                    Available
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                    Update
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-5">
                      <p className="text-sm font-medium text-neutral-900">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {item.slug}
                      </p>
                    </td>

                    <td className="px-5 py-5 text-xs text-neutral-500">
                      {item.sku}
                    </td>

                    <td className="px-5 py-5 text-center text-sm text-neutral-700">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-5 text-center text-sm text-neutral-700">
                      {item.reserved}
                    </td>

                    <td className="px-5 py-5 text-center text-sm font-medium text-neutral-900">
                      {item.available}
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-widest ${
                          item.status ===
                          "OUT_OF_STOCK"
                            ? "bg-red-50 text-red-600"
                            : item.status ===
                                "LOW_STOCK"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {statusLabel(
                          item.status,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={item.reserved}
                          defaultValue={
                            item.quantity
                          }
                          disabled={
                            savingId ===
                            item.id
                          }
                          className="admin-input w-24"
                          onKeyDown={(
                            event,
                          ) => {
                            if (
                              event.key !==
                              "Enter"
                            ) {
                              return;
                            }

                            const target =
                              event.currentTarget;

                            const value =
                              Number(
                                target.value,
                              );

                            if (
                              Number.isInteger(
                                value,
                              ) &&
                              value >=
                                item.reserved
                            ) {
                              void updateQuantity(
                                item.id,
                                value,
                              );
                            }
                          }}
                        />

                        <button
                          type="button"
                          disabled={
                            savingId ===
                            item.id
                          }
                          onClick={(
                            event,
                          ) => {
                            const input =
                              event.currentTarget
                                .parentElement
                                ?.querySelector(
                                  "input",
                                );

                            if (
                              !input
                            ) {
                              return;
                            }

                            const value =
                              Number(
                                input.value,
                              );

                            if (
                              Number.isInteger(
                                value,
                              ) &&
                              value >=
                                item.reserved
                            ) {
                              void updateQuantity(
                                item.id,
                                value,
                              );
                            }
                          }}
                          className="border border-neutral-300 px-3 py-2 text-[10px] uppercase tracking-widest transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingId ===
                          item.id
                            ? "..."
                            : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}