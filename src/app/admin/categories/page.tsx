"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load categories");
      }

      setCategories(data.categories);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deactivateCategory(id: number) {
    const confirmed = window.confirm("Deactivate this category?");

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      window.alert(data.error ?? "Failed to deactivate category");
      return;
    }

    await loadCategories();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialCategories() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load categories");
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
          setLoading(false);
        }
      }
    }

    void loadInitialCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Store management
          </p>

          <h1 className="mt-2 text-3xl font-medium text-neutral-900">
            Categories
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Organize your saree collections and storefront navigation.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className="bg-black px-5 py-3 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800"
        >
          Add category
        </Link>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-8 text-sm text-neutral-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">
            No categories found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="font-medium text-neutral-900">
                      {category.name}
                    </h2>

                    <span
                      className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
                        category.isActive
                          ? "bg-neutral-100 text-neutral-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-neutral-400">
                    /{category.slug}
                  </p>

                  {category.description ? (
                    <p className="mt-2 max-w-2xl text-sm text-neutral-500">
                      {category.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="border border-neutral-300 px-4 py-2 text-xs uppercase tracking-widest text-neutral-700 transition hover:border-black hover:text-black"
                  >
                    Edit
                  </Link>

                  {category.isActive ? (
                    <button
                      type="button"
                      onClick={() => deactivateCategory(category.id)}
                      className="border border-red-200 px-4 py-2 text-xs uppercase tracking-widest text-red-600 transition hover:border-red-400"
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}