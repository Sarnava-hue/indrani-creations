import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { CollectionLinksStrip } from "@/components/store/collection-links-strip";
import { SITE_URL } from "@/lib/config/site";
import { EDITORIAL_GUIDES } from "@/lib/seo/guides";
import { buildStorePageMetadata } from "@/lib/seo/page-metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { getActiveCategories } from "@/lib/store/categories";

export const metadata: Metadata = buildStorePageMetadata({
  title: "Saree & Jewellery Style Guides",
  description:
    "Explore practical guides on silk saree care, jewellery pairing, bangle styling, and saree length details from Indrani Creations.",
  canonical: "/guides",
  imageUrl: "/images/about/craftsmanship.jpeg",
  imageAlt: "Indrani Creations saree and jewellery editorial guides",
});

export default async function GuidesIndexPage() {
  const categories = await getActiveCategories();
  const featuredCategories = categories
    .filter((category) => category.parentId === null)
    .slice(0, 6);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Style Guides", url: `${SITE_URL}/guides` },
  ]);

  return (
    <main className="bg-[#faf8f4] text-[#29251f]">
      <JsonLdScript data={breadcrumbJsonLd} />

      <section className="border-b border-[#e2d9ce] bg-[#f3eee7]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#766553]"
          >
            <Link href="/" className="transition hover:text-[#29251f]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#29251f]">Style Guides</span>
          </nav>

          <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
            Editorial journal
          </p>

          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
            Saree Care, Draping &amp; Jewellery Pairing Guides
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#625b53] md:text-base">
            Thoughtful care notes and styling advice to help you choose,
            preserve, and wear your sarees, artisanal bangles, earrings, and
            necklaces with confidence.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {EDITORIAL_GUIDES.map((guide, index) => (
            <article
              key={guide.slug}
              className="flex flex-col border border-[#ded7ce] bg-white"
            >
              <Link
                href={`/guides/${guide.slug}`}
                className="relative block aspect-[4/3] overflow-hidden bg-[#ebe5de]"
              >
                <Image
                  src={guide.image}
                  alt={guide.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                />
              </Link>

              <div className="flex flex-1 flex-col p-7">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#9a8068]">
                  <span>{guide.categoryLabel}</span>
                  <span>{guide.readingMinutes} min read</span>
                </div>

                <h2 className="mt-4 font-serif text-2xl leading-snug text-[#29251f]">
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="transition hover:text-[#8b5e3c]"
                  >
                    {guide.title}
                  </Link>
                </h2>

                <p className="mt-4 flex-1 text-sm leading-7 text-[#625b53]">
                  {guide.excerpt}
                </p>

                <Link
                  href={`/guides/${guide.slug}`}
                  className="mt-6 inline-block w-fit border-b border-[#30271f]/50 pb-1 text-[10px] uppercase tracking-[0.22em] text-[#30271f] transition hover:border-[#30271f]"
                >
                  Read guide →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CollectionLinksStrip
        collections={featuredCategories}
        eyebrow="Shop the collections"
        heading="Explore curated sarees & jewellery"
      />
    </main>
  );
}
