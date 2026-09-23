"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  categoryId: number;
  name: string;
  sku: string;
  description: string | null;
  pricePaise: number;
  compareAtPricePaise: number | null;
  fabric: string | null;
  color: string | null;
  occasion: string | null;
  pattern: string | null;
  sareeLength: string | null;
  blouseIncluded: boolean;
  blouseDetails: string | null;
  careInstructions: string | null;
  isOneOfOne: boolean;
  isActive: boolean;
  isFeatured: boolean;
};

type Inventory = {
  quantity: number;
  reserved: number;
};

type EditProductFormProps = {
  product: Product;
  inventory: Inventory;
  categories: Category[];
};

type FormState = {
  name: string;
  sku: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  fabric: string;
  color: string;
  occasion: string;
  pattern: string;
  sareeLength: string;
  blouseIncluded: boolean;
  blouseDetails: string;
  description: string;
  careInstructions: string;
  isOneOfOne: boolean;
  isFeatured: boolean;
  inventoryQuantity: string;
};

function fromPaise(
  paise: number | null,
) {
  if (paise === null) {
    return "";
  }

  return (paise / 100).toFixed(2);
}

export function EditProductForm({
  product,
  inventory,
  categories,
}: EditProductFormProps) {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>({
      name: product.name,
      sku: product.sku,
      categoryId:
        String(product.categoryId),
      price: fromPaise(
        product.pricePaise,
      ),
      compareAtPrice:
        fromPaise(
          product.compareAtPricePaise,
        ),
      fabric: product.fabric ?? "",
      color: product.color ?? "",
      occasion: product.occasion ?? "",
      pattern: product.pattern ?? "",
      sareeLength:
        product.sareeLength ?? "",
      blouseIncluded:
        product.blouseIncluded,
      blouseDetails:
        product.blouseDetails ?? "",
      description:
        product.description ?? "",
      careInstructions:
        product.careInstructions ?? "",
      isOneOfOne:
        product.isOneOfOne,
      isFeatured:
        product.isFeatured,
      inventoryQuantity:
        String(inventory.quantity),
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [status, setStatus] =
    useState(
      product.isActive,
    );

  const [error, setError] =
    useState("");

  function updateField(
    field: keyof FormState,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            categoryId:
              Number(form.categoryId),
            price:
              Number(form.price),
            compareAtPrice:
              form.compareAtPrice
                ? Number(
                    form.compareAtPrice,
                  )
                : null,
            inventoryQuantity:
              Number(
                form.inventoryQuantity,
              ),
          }),
        },
      );

      const data: unknown =
        await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to update product.";

        throw new Error(message);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update product.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data: unknown =
        await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to update product status.";

        throw new Error(message);
      }

      setStatus((current) => !current);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update product status.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <section className="border border-black/10 bg-white p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-lg font-medium">
              Product status
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Control whether this product is visible
              in the storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void toggleStatus()
            }
            disabled={submitting}
            className={`px-5 py-3 text-sm ${
              status
                ? "border border-red-200 text-red-700 hover:bg-red-50"
                : "border border-green-200 text-green-700 hover:bg-green-50"
            }`}
          >
            {status
              ? "Deactivate product"
              : "Activate product"}
          </button>
        </div>

        <div className="mt-6 border border-black/10 bg-neutral-50 px-5 py-4">
          <p className="text-sm">
            Current status:{" "}
            <strong>
              {status
                ? "Active"
                : "Inactive"}
            </strong>
          </p>
        </div>
      </section>

      <section className="border border-black/10 bg-white p-6 lg:p-8">
        <h3 className="text-lg font-medium">
          Basic information
        </h3>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">
              Product name
            </label>

            <input
              required
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              SKU
            </label>

            <input
              required
              value={form.sku}
              onChange={(event) =>
                updateField(
                  "sku",
                  event.target.value,
                )
              }
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Category
            </label>

            <select
              required
              value={form.categoryId}
              onChange={(event) =>
                updateField(
                  "categoryId",
                  event.target.value,
                )
              }
              className="admin-input"
            >
              <option value="">
                Select category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Price (₹)
            </label>

            <input
              required
              min="1"
              step="0.01"
              type="number"
              value={form.price}
              onChange={(event) =>
                updateField(
                  "price",
                  event.target.value,
                )
              }
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Compare-at price (₹)
            </label>

            <input
              min="0"
              step="0.01"
              type="number"
              value={form.compareAtPrice}
              onChange={(event) =>
                updateField(
                  "compareAtPrice",
                  event.target.value,
                )
              }
              className="admin-input"
            />
          </div>
        </div>
      </section>

      <section className="border border-black/10 bg-white p-6 lg:p-8">
        <h3 className="text-lg font-medium">
          Saree details
        </h3>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[
            ["fabric", "Fabric"],
            ["color", "Color"],
            ["occasion", "Occasion"],
            ["pattern", "Pattern"],
            ["sareeLength", "Saree length"],
          ].map(
            ([field, label]) => (
              <div key={field}>
                <label className="block text-sm font-medium">
                  {label}
                </label>

                <input
                  value={
                    form[
                      field as keyof FormState
                    ] as string
                  }
                  onChange={(event) =>
                    updateField(
                      field as keyof FormState,
                      event.target.value,
                    )
                  }
                  className="admin-input"
                />
              </div>
            ),
          )}

          <div className="flex items-center gap-3 pt-7">
            <input
              id="edit-blouseIncluded"
              type="checkbox"
              checked={
                form.blouseIncluded
              }
              onChange={(event) =>
                updateField(
                  "blouseIncluded",
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            <label
              htmlFor="edit-blouseIncluded"
              className="text-sm"
            >
              Blouse included
            </label>
          </div>

          {form.blouseIncluded ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">
                Blouse details
              </label>

              <input
                value={form.blouseDetails}
                onChange={(event) =>
                  updateField(
                    "blouseDetails",
                    event.target.value,
                  )
                }
                className="admin-input"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="border border-black/10 bg-white p-6 lg:p-8">
        <h3 className="text-lg font-medium">
          Description
        </h3>

        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={6}
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              className="admin-input resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Care instructions
            </label>

            <textarea
              rows={4}
              value={
                form.careInstructions
              }
              onChange={(event) =>
                updateField(
                  "careInstructions",
                  event.target.value,
                )
              }
              className="admin-input resize-y"
            />
          </div>
        </div>
      </section>

      <section className="border border-black/10 bg-white p-6 lg:p-8">
        <h3 className="text-lg font-medium">
          Inventory & visibility
        </h3>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Inventory quantity
            </label>

            <input
              required
              min="0"
              step="1"
              type="number"
              value={
                form.inventoryQuantity
              }
              onChange={(event) =>
                updateField(
                  "inventoryQuantity",
                  event.target.value,
                )
              }
              className="admin-input"
            />

            <p className="mt-2 text-xs text-neutral-500">
              Currently reserved:{" "}
              {inventory.reserved}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={
                  form.isOneOfOne
                }
                onChange={(event) =>
                  updateField(
                    "isOneOfOne",
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />

              One-of-one product
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={
                  form.isFeatured
                }
                onChange={(event) =>
                  updateField(
                    "isFeatured",
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />

              Featured product
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/products",
            )
          }
          className="border border-black/15 px-6 py-3 text-sm transition hover:bg-neutral-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Saving changes..."
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}