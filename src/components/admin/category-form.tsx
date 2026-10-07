"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  isActive: boolean;
  sortOrder: number;
};

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: Category;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoryForm({
  mode,
  category,
}: CategoryFormProps) {
  const router = useRouter();

  const [name, setName] = useState(
    category?.name ?? "",
  );

  const [slug, setSlug] = useState(
    category?.slug ?? "",
  );

  const [description, setDescription] =
    useState(category?.description ?? "");

  const [imageUrl, setImageUrl] =
    useState(category?.imageUrl ?? "");

  const [parentId, setParentId] =
    useState<string>(
      category?.parentId
        ? String(category.parentId)
        : "",
    );

  const [sortOrder, setSortOrder] =
    useState(
      String(category?.sortOrder ?? 0),
    );

  const [isActive, setIsActive] =
    useState(category?.isActive ?? true);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(mode === "edit");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch(
          "/api/admin/categories",
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Failed to load categories",
          );
        }

        if (!cancelled) {
          setCategories(data.categories);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load categories",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const parentOptions = useMemo(
    () =>
      categories.filter(
        (item) => item.id !== category?.id,
      ),
    [categories, category?.id],
  );

  function handleNameChange(
    value: string,
  ) {
    setName(value);

    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(
    value: string,
  ) {
    setSlugManuallyEdited(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description:
          description.trim() || null,
        imageUrl:
          imageUrl.trim() || null,
        parentId: parentId
          ? Number(parentId)
          : null,
        sortOrder: Number(sortOrder),
        isActive,
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/categories"
          : `/api/admin/categories/${category?.id}`;

      const response = await fetch(endpoint, {
        method:
          mode === "create"
            ? "POST"
            : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to save category",
        );
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save category",
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
      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Basic information */}
      <section className="border border-neutral-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-neutral-900">
            Basic information
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Define how this category appears
            throughout the store.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="category-name"
              className="admin-label"
            >
              Category name
            </label>

            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(event) =>
                handleNameChange(
                  event.target.value,
                )
              }
              placeholder="Silk Sarees"
              required
              className="admin-input"
            />
          </div>

          <div>
            <label
              htmlFor="category-slug"
              className="admin-label"
            >
              Slug
            </label>

            <input
              id="category-slug"
              type="text"
              value={slug}
              onChange={(event) =>
                handleSlugChange(
                  event.target.value,
                )
              }
              placeholder="silk-sarees"
              required
              className="admin-input"
            />

            <p className="mt-2 text-xs text-neutral-400">
              Used in URLs.
            </p>
          </div>

          <div>
            <label
              htmlFor="category-sort"
              className="admin-label"
            >
              Sort order
            </label>

            <input
              id="category-sort"
              type="number"
              min="0"
              step="1"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value,
                )
              }
              className="admin-input"
            />

            <p className="mt-2 text-xs text-neutral-400">
              Lower numbers appear first.
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="category-description"
              className="admin-label"
            >
              Description
            </label>

            <textarea
              id="category-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="A curated collection of handpicked silk sarees."
              rows={5}
              className="admin-input resize-y"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="category-image"
              className="admin-label"
            >
              Image URL
            </label>

            <input
              id="category-image"
              type="url"
              value={imageUrl}
              onChange={(event) =>
                setImageUrl(
                  event.target.value,
                )
              }
              placeholder="/categories/silk-sarees.jpg"
              className="admin-input"
            />

            <p className="mt-2 text-xs text-neutral-400">
              We will add proper category image
              uploads later.
            </p>
          </div>
        </div>
      </section>

      {/* Organization */}
      <section className="border border-neutral-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-neutral-900">
            Organization
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Control the category hierarchy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="category-parent"
              className="admin-label"
            >
              Parent category
            </label>

            <select
              id="category-parent"
              value={parentId}
              onChange={(event) =>
                setParentId(
                  event.target.value,
                )
              }
              disabled={loadingCategories}
              className="admin-input"
            >
              <option value="">
                No parent category
              </option>

              {parentOptions.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3 pb-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />

              <span>
                <span className="block text-sm font-medium text-neutral-900">
                  Active category
                </span>

                <span className="mt-1 block text-xs text-neutral-400">
                  Show this category in the
                  storefront.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/categories")
          }
          disabled={submitting}
          className="border border-neutral-300 px-6 py-3 text-xs uppercase tracking-widest text-neutral-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="bg-black px-6 py-3 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : mode === "create"
              ? "Create category"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}