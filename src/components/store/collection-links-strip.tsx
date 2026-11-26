import Link from "next/link";

import { buildCollectionHref } from "@/lib/seo/category-links";

type CollectionLinkItem = {
  id: number;
  name: string;
  slug: string;
};

type CollectionLinksStripProps = {
  collections: readonly CollectionLinkItem[];
  eyebrow?: string;
  heading?: string;
};

export function CollectionLinksStrip({
  collections,
  eyebrow = "Continue exploring",
  heading = "More Indrani Creations collections",
}: CollectionLinksStripProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-black/10 bg-[#faf8f4]">
      <div className="mx-auto max-w-360 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-light tracking-tight text-neutral-900">
              {heading}
            </h2>
          </div>

          <Link
            href="/shop"
            className="border-b border-neutral-400 pb-1 text-xs uppercase tracking-[0.15em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            Shop everything
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={buildCollectionHref(collection.slug)}
              className="border border-neutral-200 bg-white px-5 py-3 text-xs uppercase tracking-[0.16em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {collection.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
