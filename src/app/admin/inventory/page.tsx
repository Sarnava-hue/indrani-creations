"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InventoryRecord = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  isActive: boolean;
  inventoryId: number | null;
  quantity: number;
  reserved: number;
  available: number;
  status:
    | "OUT_OF_STOCK"
    | "LOW_STOCK"
    | "IN_STOCK";
};

type VisibilityFilter = "all" | "active" | "inactive";

function buildDraftQuantities(rows: InventoryRecord[]): Record<number, string> {
  const drafts: Record<number, string> = {};

  for (const row of rows) {
    drafts[row.id] = String(row.quantity);
  }

  return drafts;
}

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

  const [draftQuantities, setDraftQuantities] =
    useState<Record<number, string>>({});

  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");

  const [loading, setLoading] =
    useState(true);

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [statusMessage, setStatusMessage] =
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

      const loaded = data.inventory as InventoryRecord[];
      setItems(loaded);
      setDraftQuantities(buildDraftQuantities(loaded));
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

  async function submitRow(item: InventoryRecord) {
    const rawValue = (draftQuantities[item.id] ?? "").trim();

    if (!rawValue) {
      setStatusMessage(null);
      setError(`Please enter a quantity for ${item.name}.`);
      return;
    }

    const quantity = Number(rawValue);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setStatusMessage(null);
      setError(`Quantity for ${item.name} must be a non-negative whole number.`);
      return;
    }

    if (quantity < item.reserved) {
      setStatusMessage(null);
      setError(
        `Quantity for ${item.name} cannot be lower than reserved stock (${item.reserved}).`,
      );
      return;
    }

    try {
      setSavingId(item.id);
      setError(null);
      setStatusMessage(null);

      const response = await fetch(
        `/api/admin/inventory/${item.id}`,
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
      setStatusMessage(`Updated stock for ${item.name} to ${quantity}.`);
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
          const loaded = data.inventory as InventoryRecord[];
          setItems(loaded);
          setDraftQuantities(buildDraftQuantities(loaded));
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

  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;

    for (const item of items) {
      if (item.isActive) {
        active += 1;
      } else {
        inactive += 1;
      }
    }

    return {
      all: items.length,
      active,
      inactive,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    if (visibilityFilter === "active") {
      return items.filter((item) => item.isActive);
    }

    if (visibilityFilter === "inactive") {
      return items.filter((item) => !item.isActive);
    }

    return items;
  }, [items, visibilityFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Store management
          </p>

          <h1 className="mt-2 text-3xl font-medium text-neutral-900">
            Inventory
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Manage available and reserved stock across active and inactive products.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: `All (${counts.all})` },
              { key: "active", label: `Active (${counts.active})` },
              { key: "inactive", label: `Inactive (${counts.inactive})` },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setVisibilityFilter(option.key)}
              className={`border px-3.5 py-2 text-xs uppercase tracking-widest transition ${
                visibilityFilter === option.key
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white text-neutral-600 hover:border-black hover:text-black"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          className="border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="overflow-hidden border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-8 text-sm text-neutral-500">
            Loading inventory...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">
            No products match this filter.
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
                {visibleItems.map((item) => {
                  const draftValue =
                    draftQuantities[item.id] ?? String(item.quantity);
                  const isDirty = draftValue.trim() !== String(item.quantity);
                  const isSaving = savingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/products/${item.id}`}
                            className="text-sm font-medium text-neutral-900 hover:underline"
                          >
                            {item.name}
                          </Link>

                          {!item.isActive ? (
                            <span className="bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-widest text-neutral-500">
                              Inactive
                            </span>
                          ) : null}
                        </div>

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
                            step={1}
                            aria-label={`Stock quantity for ${item.name}`}
                            value={draftValue}
                            disabled={isSaving}
                            className="admin-input w-24"
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setDraftQuantities((current) => ({
                                ...current,
                                [item.id]: nextValue,
                              }));
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") {
                                return;
                              }

                              event.preventDefault();
                              void submitRow(item);
                            }}
                          />

                          <button
                            type="button"
                            disabled={isSaving || !isDirty}
                            onClick={() => void submitRow(item)}
                            className="border border-neutral-300 px-3 py-2 text-[10px] uppercase tracking-widest transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSaving ? "..." : "Save"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}