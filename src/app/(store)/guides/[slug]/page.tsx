import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SITE_URL } from "@/lib/config/site";
import {
  EDITORIAL_GUIDES,
  getGuideBySlug,
  resolveGuideCollectionCtas,
} from "@/lib/seo/guides";
import { buildStorePageMetadata } from "@/lib/seo/page-metadata";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo/structured-data";
import { getActiveCategories } from "@/lib/store/categories";

type GuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return EDITORIAL_GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide Not Found",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return buildStorePageMetadata({
    title: guide.title,
    description: guide.metaDescription,
    canonical: `/guides/${guide.slug}`,
    imageUrl: guide.image,
    imageAlt: guide.imageAlt,
  });
}

export default async function GuideArticlePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const activeCategories = await getActiveCategories();
  const ctas = resolveGuideCollectionCtas(guide, activeCategories);
  const otherGuides = EDITORIAL_GUIDES.filter(
    (candidate) => candidate.slug !== guide.slug,
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Style Guides", url: `${SITE_URL}/guides` },
    { name: guide.title, url: `${SITE_URL}/guides/${guide.slug}` },
  ]);

  const articleJsonLd = buildArticleJsonLd({
    siteUrl: SITE_URL,
    slug: guide.slug,
    title: guide.title,
    description: guide.metaDescription,
    imageUrl: guide.image,
    publishedAt: guide.publishedAt,
    updatedAt: guide.updatedAt,
  });

  return (
    <main className="bg-[#faf8f4] text-[#29251f]">
      <JsonLdScript data={articleJsonLd} />
      <JsonLdScript data={breadcrumbJsonLd} />

      <article>
        <header className="border-b border-[#e2d9ce] bg-[#f3eee7]">
          <div className="mx-auto max-w-4xl px-6 py-14 md:px-10 md:py-20">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#766553]"
            >
              <Link href="/" className="transition hover:text-[#29251f]">
                Home
              </Link>
              <span>/</span>
              <Link href="/guides" className="transition hover:text-[#29251f]">
                Style Guides
              </Link>
              <span>/</span>
              <span className="max-w-xs truncate text-[#29251f]">
                {guide.title}
              </span>
            </nav>

            <div className="mt-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.26em] text-[#9a8068]">
              <span>{guide.categoryLabel}</span>
              <span>·</span>
              <span>{guide.readingMinutes} min read</span>
            </div>

            <h1 className="mt-4 font-serif text-4xl leading-tight text-[#30271f] md:text-5xl">
              {guide.title}
            </h1>

            <p className="mt-5 text-base leading-7 text-[#625b53]">
              {guide.excerpt}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
          <div className="relative aspect-[16/10] overflow-hidden bg-[#ebe5de]">
            <Image
              src={guide.image}
              alt={guide.imageAlt}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>

          <div className="mt-12 space-y-10">
            {guide.sections.map((section) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="font-serif text-2xl text-[#29251f] md:text-3xl">
                  {section.heading}
                </h2>

                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-7 text-[#625b53] md:text-base"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#625b53] md:text-base">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {guide.faq.length > 0 && (
            <section className="mt-14 border-t border-[#e2d9ce] pt-12">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#9a8068]">
                Quick answers
              </p>
              <h2 className="mt-2 font-serif text-2xl md:text-3xl">
                Common questions
              </h2>

              <dl className="mt-6 space-y-6">
                {guide.faq.map((item) => (
                  <div
                    key={item.question}
                    className="border border-[#ded7ce] bg-white p-6"
                  >
                    <dt className="font-serif text-lg text-[#29251f]">
                      {item.question}
                    </dt>
                    <dd className="mt-2 text-sm leading-7 text-[#625b53]">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {ctas.length > 0 && (
            <section className="mt-14 border border-[#ded7ce] bg-[#f3eee7] p-8">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#9a8068]">
                Shop featured pieces
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[#29251f]">
                Explore related collections
              </h2>

              <div className="mt-6 flex flex-wrap gap-3">
                {ctas.map((cta) => (
                  <Link
                    key={`${cta.label}-${cta.href}`}
                    href={cta.href}
                    className="bg-[#30271f] px-6 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#59483a]"
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {otherGuides.length > 0 && (
            <section className="mt-14 border-t border-[#e2d9ce] pt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#9a8068]">
                    Keep reading
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-[#29251f]">
                    More Indrani Creations guides
                  </h2>
                </div>

                <Link
                  href="/guides"
                  className="border-b border-[#30271f]/50 pb-1 text-[10px] uppercase tracking-[0.2em] text-[#30271f]"
                >
                  All guides
                </Link>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {otherGuides.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/guides/${related.slug}`}
                    className="border border-[#ded7ce] bg-white p-6 transition hover:border-[#30271f]"
                  >
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a8068]">
                      {related.categoryLabel}
                    </p>
                    <h3 className="mt-2 font-serif text-xl text-[#29251f]">
                      {related.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#625b53]">
                      {related.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </main>
  );
}
