import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { db } from "@/lib/db";
import { getActiveCategories } from "@/lib/store/categories";
import { attachPrimaryImages } from "@/lib/store/product-queries";
import Image from "next/image";

const baseCollections = [
  {
    title: "Sarees",
    subtitle: "The drape that tells your story",
    slugCandidates: ["all-sarees", "silk-sarees"],
    fallbackHref: "/shop",
    number: "01",
    image: "/images/collections/sarees.jpeg",
    note: "Silk · Handloom · Everyday",
  },
  {
    title: "Bangles",
    subtitle: "A little color, a little character",
    slugCandidates: ["bangles"],
    fallbackHref: "/shop",
    number: "02",
    image: "/images/collections/bangles.jpeg",
    note: "Artisanal · Traditional · Colorful",
  },
  {
    title: "Earrings",
    subtitle: "Details that make a difference",
    slugCandidates: ["earrings"],
    fallbackHref: "/shop",
    number: "03",
    image: "/images/collections/earrings.jpeg",
    note: "Oxidized · Jhumkas · Modern",
  },
  {
    title: "Necklaces",
    subtitle: "Made for your memorable moments",
    slugCandidates: ["necklaces"],
    fallbackHref: "/shop",
    number: "04",
    image: "/images/collections/necklaces.jpeg",
    note: "Statement · Traditional · Festive",
  },
];

export default async function HomePage() {
  const [activeCategories, products] = await Promise.all([
    getActiveCategories(),

    db.orm.public.Product.where({
      isActive: true,
      isFeatured: true,
    })
      .select(
        "id",
        "name",
        "slug",
        "pricePaise",
        "compareAtPricePaise",
        "fabric",
        "color",
        "isOneOfOne",
        "isFeatured",
      )
      .orderBy((product) => product.createdAt.desc())
      .limit(4)
      .all(),
  ]);

  const activeCategorySlugs = new Set(
    activeCategories.map((category) => category.slug),
  );

  const collections = baseCollections.map((collection) => {
    const matchedSlug = collection.slugCandidates.find((slug) =>
      activeCategorySlugs.has(slug),
    );

    return {
      ...collection,
      href: matchedSlug
        ? `/shop?category=${matchedSlug}`
        : collection.fallbackHref,
    };
  });

  const productsWithImages = await attachPrimaryImages(products);

  return (
    <main className="bg-[#faf8f4] text-[#29251f]">

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#faf8f4] md:min-h-[740px] md:bg-[#e9e0d4]">
        {/* IMAGE CAROUSEL */}
        <div className="relative h-[380px] overflow-hidden md:absolute md:inset-0 md:h-auto">
          <div className="hero-image-track">
            <div className="hero-image-slide">
              <Image
                src="/images/home/hero-1.jpeg"
                alt="Indrani Creations saree collection"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>

            <div className="hero-image-slide">
              <Image
                src="/images/home/hero-2.jpeg"
                alt="Indrani Creations traditional saree"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>

            <div className="hero-image-slide">
              <Image
                src="/images/home/hero-3.jpeg"
                alt="Indrani Creations handcrafted collection"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>

            <div className="hero-image-slide">
              <Image
                src="/images/home/hero-4.jpeg"
                alt="Indrani Creations festive collection"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>

            <div className="hero-image-slide">
              <Image
                src="/images/home/hero-1.jpeg"
                alt="Indrani Creations saree collection"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Desktop image overlay */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-[#f3eee7]/85 via-[#f3eee7]/35 to-transparent md:block" />
        </div>

        {/* HERO CONTENT */}
        <div className="relative mx-auto flex w-full max-w-[1440px] flex-col px-0 md:min-h-[740px] md:flex-row md:items-center md:px-12">
          <div className="w-full bg-[#faf8f4] px-6 py-10 md:max-w-2xl md:bg-transparent md:px-0 md:py-20">
            <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.3em] text-[#766553] md:mb-6 md:tracking-[0.38em]">
              Indrani Creations · The art of adornment
            </p>

            <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-[#30271f] sm:text-5xl md:text-8xl md:leading-[1.04]">
              A world of
              <br />
              beautiful
              <br />
              traditions.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-[#62574b] md:mt-7 md:text-base">
              From timeless sarees to artisanal bangles and treasured jewellery,
              discover pieces that make every moment your own.
            </p>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row md:mt-9">
              <Link
                href="/shop"
                className="w-full bg-[#30271f] px-7 py-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#59483a] sm:w-auto"
              >
                Explore the store
              </Link>

              <Link
                href="#collections"
                className="w-full border border-[#30271f]/35 bg-white/25 px-7 py-4 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#30271f] transition hover:bg-white/60 sm:w-auto"
              >
                Discover collections
              </Link>
            </div>

            <p className="mt-9 text-[9px] uppercase tracking-[0.2em] text-[#766553] md:mt-12 md:tracking-[0.28em]">
              Sarees · Bangles · Earrings · Necklaces
            </p>
          </div>
        </div>

        {/* Desktop decorative text */}
        <div className="absolute bottom-8 right-8 hidden text-[9px] uppercase tracking-[0.3em] text-[#766553] md:block">
          A thoughtful edit of Indian style
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1000px] px-6 py-20 text-center md:py-28">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
          More than what you wear
        </p>
        <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Every detail has a story.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#766d62] md:text-base">
          Discover the beauty of Indian dressing, from the elegance of a saree
          to the finishing touch of handcrafted jewellery. Find something that
          feels distinctly you.
        </p>
      </section>

      {/* COLLECTIONS */}
      <section
        id="collections"
        className="mx-auto max-w-[1440px] scroll-mt-10 px-6 pb-20 md:px-12 md:pb-28"
      >
        <div className="mb-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
              Find your expression
            </p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Explore the collections
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden border-b border-[#30271f]/40 pb-1 text-[10px] uppercase tracking-[0.2em] md:block"
          >
            Shop everything
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <Link
              key={collection.number}
              href={collection.href}
              className="group relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-[#c8b8a5] p-6 text-white md:min-h-[440px] md:p-7"
            >
              <Image
                src={collection.image}
                alt={`${collection.title} collection`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10 transition-colors group-hover:from-black/75" />
              <div className="relative flex items-start justify-between">
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/75">
                  Collection
                </span>
                <span className="font-serif text-sm text-white/70">
                  {collection.number}
                </span>
              </div>

              <div className="relative">
                <p className="mb-3 text-[9px] uppercase tracking-[0.22em] text-white/75">
                  {collection.note}
                </p>
                <h3 className="font-serif text-4xl md:text-[2.7rem]">
                  {collection.title}
                </h3>
                <p className="mt-2 text-xs text-white/85">
                  {collection.subtitle}
                </p>
                <span className="mt-7 inline-block border-b border-white/60 pb-2 text-[9px] uppercase tracking-[0.25em] transition group-hover:border-white">
                  Explore collection <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/shop"
          className="mt-6 block border border-[#30271f]/25 py-4 text-center text-[10px] uppercase tracking-[0.2em] md:hidden"
        >
          Shop everything
        </Link>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-[#f0ece5] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
                A little something special
              </p>
              <h2 className="mt-3 font-serif text-4xl md:text-5xl">
                Featured pieces
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#766d62]">
                A considered selection from the Indrani Creations edit.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden border-b border-[#30271f]/40 pb-1 text-[10px] uppercase tracking-[0.2em] md:block"
            >
              View all
            </Link>
          </div>

          {productsWithImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {productsWithImages.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#c9bfb2] py-20 text-center">
              <p className="text-sm text-[#766d62]">
                Featured pieces will appear here.
              </p>
            </div>
          )}

          <Link
            href="/shop"
            className="mt-10 block border border-[#30271f]/25 py-4 text-center text-[10px] uppercase tracking-[0.2em] md:hidden"
          >
            View all pieces
          </Link>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:gap-16 md:px-12 md:py-28">
        <div className="relative flex aspect-[4/5] items-end overflow-hidden p-8 md:p-12">
          <Image
            src="/images/about/philosophy.jpeg"
            alt="Traditional saree details from Indrani Creations"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#342a22]/60 via-transparent to-transparent" />

          <p className="relative z-10 max-w-xs font-serif text-3xl leading-tight text-white md:text-4xl">
            The beauty is in the details.
          </p>
        </div>

        <div className="max-w-xl md:px-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
            Our philosophy
          </p>
          <h2 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">
            Tradition,
            <br />
            in every detail.
          </h2>
          <p className="mt-7 text-sm leading-7 text-[#766d62] md:text-base">
            Indrani Creations brings together the pieces that make personal
            style meaningful. The drape you remember, the bangles you reach for,
            the earrings that become your signature and the necklace saved for a
            special day.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#766d62] md:text-base">
            Explore a growing collection of sarees and accessories, chosen to
            celebrate individuality and the richness of Indian style.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block border-b border-[#30271f] pb-2 text-[10px] uppercase tracking-[0.2em]"
          >
            Find your favorites →
          </Link>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="border-t border-[#e2d9ce] bg-[#eae2d7] px-6 py-20 text-center md:py-24">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#8e7964]">
          Stay in the loop
        </p>
        <h2 className="mt-4 font-serif text-4xl md:text-5xl">
          A little note from us.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#766d62]">
          Discover new collections, thoughtful edits and stories from Indrani
          Creations.
        </p>
        <p className="mt-7 text-xs text-[#8e7964]">
          More ways to stay connected coming soon.
        </p>
      </section>
    </main>
  );
}
