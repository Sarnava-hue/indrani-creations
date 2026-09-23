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

type AddProductFormProps = {
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

const initialForm: FormState = {
  name: "",
  sku: "",
  categoryId: "",
  price: "",
  compareAtPrice: "",
  fabric: "",
  color: "",
  occasion: "",
  pattern: "",
  sareeLength: "",
  blouseIncluded: false,
  blouseDetails: "",
  description: "",
  careInstructions: "",
  isOneOfOne: true,
  isFeatured: false,
  inventoryQuantity: "0",
};

export function AddProductForm({
  categories,
}: AddProductFormProps) {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

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
        "/api/admin/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            categoryId: Number(form.categoryId),
            price: Number(form.price),
            compareAtPrice:
              form.compareAtPrice
                ? Number(form.compareAtPrice)
                : null,
            inventoryQuantity:
              Number(form.inventoryQuantity),
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
            : "Unable to create product.";

        throw new Error(message);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create product.",
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
              placeholder="Midnight Banarasi Silk Saree"
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
              placeholder="IC-SILK-009"
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

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
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
              placeholder="4999"
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
              placeholder="5999"
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
          <div>
            <label className="block text-sm font-medium">
              Fabric
            </label>

            <input
              value={form.fabric}
              onChange={(event) =>
                updateField(
                  "fabric",
                  event.target.value,
                )
              }
              placeholder="Pure Banarasi Silk"
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Color
            </label>

            <input
              value={form.color}
              onChange={(event) =>
                updateField(
                  "color",
                  event.target.value,
                )
              }
              placeholder="Deep Burgundy"
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Occasion
            </label>

            <input
              value={form.occasion}
              onChange={(event) =>
                updateField(
                  "occasion",
                  event.target.value,
                )
              }
              placeholder="Wedding"
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Pattern
            </label>

            <input
              value={form.pattern}
              onChange={(event) =>
                updateField(
                  "pattern",
                  event.target.value,
                )
              }
              placeholder="Zari floral"
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Saree length
            </label>

            <input
              value={form.sareeLength}
              onChange={(event) =>
                updateField(
                  "sareeLength",
                  event.target.value,
                )
              }
              placeholder="5.5 metres"
              className="admin-input"
            />
          </div>

          <div className="flex items-center gap-3 pt-7">
            <input
              id="blouseIncluded"
              type="checkbox"
              checked={form.blouseIncluded}
              onChange={(event) =>
                updateField(
                  "blouseIncluded",
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            <label
              htmlFor="blouseIncluded"
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
                placeholder="Unstitched blouse piece included"
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
              placeholder="Describe the saree, weave, detailing and overall character."
              className="admin-input resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Care instructions
            </label>

            <textarea
              rows={4}
              value={form.careInstructions}
              onChange={(event) =>
                updateField(
                  "careInstructions",
                  event.target.value,
                )
              }
              placeholder="Dry clean recommended..."
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
              Initial inventory
            </label>

            <input
              required
              min="0"
              step="1"
              type="number"
              value={form.inventoryQuantity}
              onChange={(event) =>
                updateField(
                  "inventoryQuantity",
                  event.target.value,
                )
              }
              className="admin-input"
            />
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.isOneOfOne}
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
                checked={form.isFeatured}
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
            router.push("/admin/products")
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
            ? "Creating product..."
            : "Create product"}
        </button>
      </div>
    </form>
  );
}