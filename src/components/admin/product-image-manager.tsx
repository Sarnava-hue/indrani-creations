"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

type ProductImage = {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductImageManagerProps = {
  productId: number;
};

type ImageAction =
  | "primary"
  | "move-left"
  | "move-right"
  | "alt"
  | "delete";

export function ProductImageManager({
  productId,
}: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeAction, setActiveAction] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      try {
        const response = await fetch(
          `/api/admin/products/${productId}/images`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        const data: unknown =
          await response.json();

        if (!response.ok) {
          throw new Error(
            "Unable to load product images.",
          );
        }

        if (
          typeof data !== "object" ||
          data === null ||
          !("images" in data) ||
          !Array.isArray(data.images)
        ) {
          throw new Error(
            "Invalid image response.",
          );
        }

        if (!cancelled) {
          setImages(
            data.images as ProductImage[],
          );
          setError("");
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load product images.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function refreshImages() {
    const response = await fetch(
      `/api/admin/products/${productId}/images`,
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    const data: unknown =
      await response.json();

    if (!response.ok) {
      throw new Error(
        "Unable to refresh product images.",
      );
    }

    if (
      typeof data !== "object" ||
      data === null ||
      !("images" in data) ||
      !Array.isArray(data.images)
    ) {
      throw new Error(
        "Invalid image response.",
      );
    }

    setImages(
      data.images as ProductImage[],
    );
  }

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
          `/api/admin/products/${productId}/images`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
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
              : "Unable to upload image.";

          throw new Error(message);
        }
      }

      await refreshImages();

      event.target.value = "";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to upload image.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function updateImage(
    imageId: number,
    action: ImageAction,
    extra?: Record<string, unknown>,
  ) {
    const actionKey = `${imageId}-${action}`;

    if (activeAction) {
      return;
    }

    setActiveAction(actionKey);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${imageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action:
              action === "primary"
                ? "set-primary"
                : action === "alt"
                  ? "update-alt"
                  : action === "move-left" ||
                      action === "move-right"
                    ? "move"
                    : action,
            ...(action === "move-left"
              ? { direction: "left" }
              : {}),
            ...(action === "move-right"
              ? { direction: "right" }
              : {}),
            ...extra,
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
            : "Unable to update image.";

        throw new Error(message);
      }

      await refreshImages();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update image.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleDelete(
    image: ProductImage,
  ) {
    if (activeAction) {
      return;
    }

    const confirmed =
      window.confirm(
        image.isPrimary
          ? "This is the primary image. If you delete it, another image will automatically become primary. Continue?"
          : "Delete this product image?",
      );

    if (!confirmed) {
      return;
    }

    const actionKey =
      `${image.id}-delete`;

    setActiveAction(actionKey);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${image.id}`,
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
            : "Unable to delete image.";

        throw new Error(message);
      }

      await refreshImages();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete image.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleAltTextSave(
    imageId: number,
    altText: string,
  ) {
    await updateImage(
      imageId,
      "alt",
      { altText },
    );
  }

  if (loading) {
    return (
      <section className="border border-black/10 bg-white p-6 lg:p-8">
        <h3 className="text-lg font-medium">
          Product images
        </h3>

        <p className="mt-4 text-sm text-neutral-500">
          Loading images...
        </p>
      </section>
    );
  }

  return (
    <section className="border border-black/10 bg-white p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-lg font-medium">
            Product images
          </h3>

          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Upload multiple product photographs,
            choose the primary image, arrange the
            gallery order, and add descriptive alt
            text for accessibility and SEO.
          </p>
        </div>

        <label className="inline-flex shrink-0 cursor-pointer items-center justify-center bg-black px-5 py-3 text-sm text-white transition hover:bg-neutral-800">
          {uploading
            ? "Uploading..."
            : "Upload images"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            onChange={handleUpload}
            className="sr-only"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-6 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {images.length === 0 ? (
        <div className="mt-6 border border-dashed border-black/15 px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">
            No images uploaded yet.
          </p>

          <p className="mt-2 text-xs text-neutral-400">
            Add at least one image before
            publishing this product.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => {
            const primaryLoading =
              activeAction ===
              `${image.id}-primary`;

            const leftLoading =
              activeAction ===
              `${image.id}-move-left`;

            const rightLoading =
              activeAction ===
              `${image.id}-move-right`;

            const deleteLoading =
              activeAction ===
              `${image.id}-delete`;

            const altLoading =
              activeAction ===
              `${image.id}-alt`;

            return (
              <div
                key={image.id}
                className="overflow-hidden border border-black/10 bg-white"
              >
                <div className="relative aspect-3/4 bg-neutral-100">
                  <Image
                    src={image.url}
                    alt={
                      image.altText ??
                      "Product image"
                    }
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />

                  {image.isPrimary ? (
                    <div className="absolute left-3 top-3 bg-black px-3 py-1.5 text-[10px] uppercase tracking-widest text-white">
                      Primary
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                      Image {index + 1}
                    </p>

                    <p className="text-xs text-neutral-400">
                      ID #{image.id}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor={`alt-${image.id}`}
                      className="text-xs font-medium uppercase tracking-widest text-neutral-500"
                    >
                      Alt text
                    </label>

                    <input
                      id={`alt-${image.id}`}
                      defaultValue={
                        image.altText ?? ""
                      }
                      placeholder="Describe this saree image"
                      className="admin-input"
                      disabled={
                        activeAction !== null &&
                        !altLoading
                      }
                      onBlur={(event) => {
                        const value =
                          event.target.value.trim();

                        if (
                          value !==
                          (image.altText ?? "")
                        ) {
                          void handleAltTextSave(
                            image.id,
                            value,
                          );
                        }
                      }}
                    />

                    <p className="mt-2 text-xs text-neutral-400">
                      Saved automatically when you
                      leave the field.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={
                        image.isPrimary ||
                        activeAction !== null
                      }
                      onClick={() =>
                        void updateImage(
                          image.id,
                          "primary",
                        )
                      }
                      className="border border-black/15 px-3 py-2 text-xs transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {primaryLoading
                        ? "Setting..."
                        : image.isPrimary
                          ? "Primary"
                          : "Set primary"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        index === 0 ||
                        activeAction !== null
                      }
                      onClick={() =>
                        void updateImage(
                          image.id,
                          "move-left",
                        )
                      }
                      className="border border-black/15 px-3 py-2 text-xs transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {leftLoading
                        ? "Moving..."
                        : "← Move left"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        index ===
                          images.length - 1 ||
                        activeAction !== null
                      }
                      onClick={() =>
                        void updateImage(
                          image.id,
                          "move-right",
                        )
                      }
                      className="border border-black/15 px-3 py-2 text-xs transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {rightLoading
                        ? "Moving..."
                        : "Move right →"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        activeAction !== null
                      }
                      onClick={() =>
                        void handleDelete(image)
                      }
                      className="border border-red-200 px-3 py-2 text-xs text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deleteLoading
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}