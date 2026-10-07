import Link from "next/link";
import { Header } from "@/components/store/header";
import { ProductCard } from "@/components/store/product-card";
import { db } from "@/lib/db";
import Image from "next/image";

const collections = [
  {
    title: "Sarees",
    subtitle: "The drape that tells your story",
    href: "/shop?category=all-sarees",
    number: "01",
    image: "/images/collections/sarees.jpeg",
    note: "Silk · Handloom · Everyday",
  },
  {
    title: "Bangles",
    subtitle: "A little color, a little character",
    href: "/shop?category=bangles",
    number: "02",
    image: "/images/collections/bangles.jpeg",
    note: "Artisanal · Traditional · Colorful",
  },
  {
    title: "Earrings",
    subtitle: "Details that make a difference",
    href: "/shop?category=earrings",
    number: "03",
    image: "/images/collections/earrings.jpeg",
    note: "Oxidized · Jhumkas · Modern",
  },
  {
    title: "Necklaces",
    subtitle: "Made for your memorable moments",
    href: "/shop?category=necklaces",
    number: "04",
    image: "/images/collections/necklaces.jpeg",
    note: "Statement · Traditional · Festive",
  },
];

export default async function HomePage() {
  const products = await db.orm.public.Product.where({
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
    .all();

  const productsWithImages = await Promise.all(
    products.map(async (product) => {
      const images = await db.orm.public.ProductImage.where({
        productId: product.id,
      })
        .select("url", "altText", "sortOrder", "isPrimary")
        .orderBy((image) => image.sortOrder.asc())
        .all();

      return {
        ...product,
        primaryImage:
          images.find((image) => image.isPrimary) ?? images[0] ?? null,
      };
    }),
  );

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#29251f]">
      <Header />

      {/* HERO */}
      <section className="relative isolate min-h-[620px] overflow-hidden bg-[#e9e0d4] md:min-h-[740px]">
        <div className="absolute inset-0 overflow-hidden">
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

          <div className="absolute inset-0 bg-gradient-to-r from-[#f3eee7]/85 via-[#f3eee7]/35 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] items-center px-6 py-20 md:min-h-[740px] md:px-12">
          <div className="max-w-2xl">
            <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.38em] text-[#766553]">
              Indrani Creations · The art of adornment
            </p>

            <h1 className="font-serif text-5xl leading-[1.04] tracking-tight text-[#30271f] sm:text-6xl md:text-8xl">
              A world of
              <br />
              beautiful
              <br />
              traditions.
            </h1>

            <p className="mt-7 max-w-lg text-sm leading-7 text-[#62574b] md:text-base">
              From timeless sarees to artisanal bangles and treasured jewellery,
              discover pieces that make every moment your own.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bg-[#30271f] px-7 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#59483a]"
              >
                Explore the store
              </Link>
              <Link
                href="#collections"
                className="border border-[#30271f]/35 bg-white/25 px-7 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#30271f] backdrop-blur transition hover:bg-white/60"
              >
                Discover collections
              </Link>
            </div>

            <p className="mt-12 text-[9px] uppercase tracking-[0.28em] text-[#766553]">
              Sarees · Bangles · Earrings · Necklaces
            </p>
          </div>
        </div>

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

      {/* FOOTER */}
      <footer className="bg-[#29251f] px-6 py-14 text-[#ded5ca] md:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-serif text-3xl tracking-[0.12em] text-white">
              INDRANI
            </div>
            <div className="mt-1 text-[8px] tracking-[0.45em]">CREATIONS</div>
            <p className="mt-6 max-w-sm text-sm leading-6 text-[#aaa096]">
              Sarees, artisanal bangles and jewellery for the moments that make
              life beautiful.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa096]">
              Explore
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <Link href="/shop" className="block hover:text-white">
                Shop all
              </Link>
              <Link
                href="/shop?category=silk-sarees"
                className="block hover:text-white"
              >
                Sarees
              </Link>
              <Link
                href="/shop?category=bangles"
                className="block hover:text-white"
              >
                Bangles
              </Link>
              <Link
                href="/shop?category=earrings"
                className="block hover:text-white"
              >
                Earrings
              </Link>
              <Link
                href="/shop?category=necklaces"
                className="block hover:text-white"
              >
                Necklaces
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa096]">
              Help
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <Link href="/contact" className="block hover:text-white">
                Contact
              </Link>
              <Link href="/shipping" className="block hover:text-white">
                Shipping
              </Link>
              <Link href="/returns" className="block hover:text-white">
                Returns
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-[1440px] border-t border-white/10 pt-6 text-xs text-[#8e877f]">
          © {new Date().getFullYear()} Indrani Creations. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
