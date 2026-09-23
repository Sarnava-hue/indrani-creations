"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductGalleryProps = {
  productName: string;
  images: GalleryImage[];
};

export function ProductGallery({
  productName,
  images,
}: ProductGalleryProps) {
  const orderedImages = [...images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const initialIndex = Math.max(
    0,
    orderedImages.findIndex(
      (image) => image.isPrimary,
    ),
  );

  const [activeIndex, setActiveIndex] =
    useState(initialIndex);

  const activeImage =
    orderedImages[activeIndex] ??
    orderedImages[0] ??
    null;

  function goToPrevious() {
    if (orderedImages.length <= 1) {
      return;
    }

    setActiveIndex((current) =>
      current === 0
        ? orderedImages.length - 1
        : current - 1,
    );
  }

  function goToNext() {
    if (orderedImages.length <= 1) {
      return;
    }

    setActiveIndex((current) =>
      current === orderedImages.length - 1
        ? 0
        : current + 1,
    );
  }

  if (!activeImage) {
    return (
      <div className="relative aspect-3/4 overflow-hidden bg-neutral-100">
        <div className="flex h-full items-center justify-center px-8 text-center">
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            Image coming soon
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="group relative overflow-hidden bg-neutral-100">
        <div className="relative aspect-3/4">
          <Image
            src={activeImage.url}
            alt={
              activeImage.altText ??
              productName
            }
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover transition duration-500"
          />

          {orderedImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Previous product image"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 p-3 text-neutral-800 opacity-100 shadow-sm backdrop-blur transition hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
              >
                <span
                  aria-hidden="true"
                  className="text-lg leading-none"
                >
                  ←
                </span>
              </button>

              <button
                type="button"
                onClick={goToNext}
                aria-label="Next product image"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 p-3 text-neutral-800 opacity-100 shadow-sm backdrop-blur transition hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
              >
                <span
                  aria-hidden="true"
                  className="text-lg leading-none"
                >
                  →
                </span>
              </button>
            </>
          ) : null}

          <div className="absolute bottom-3 right-3 bg-black/75 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white">
            {activeIndex + 1} /{" "}
            {orderedImages.length}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {orderedImages.length > 1 ? (
        <div
          className="grid grid-cols-4 gap-2 sm:grid-cols-5"
          role="tablist"
          aria-label="Product images"
        >
          {orderedImages.map(
            (image, index) => {
              const isActive =
                index === activeIndex;

              return (
                <button
                  key={image.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`View image ${index + 1} of ${orderedImages.length}`}
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  className={`relative aspect-3/4 overflow-hidden bg-neutral-100 ${
                    isActive
                      ? "ring-2 ring-black ring-offset-1"
                      : "opacity-70 transition hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={
                      image.altText ??
                      `${productName} image ${index + 1}`
                    }
                    fill
                    sizes="(max-width: 640px) 25vw, 20vw"
                    className="object-cover"
                  />
                </button>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}