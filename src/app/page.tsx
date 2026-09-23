import Link from "next/link";
import { Header } from "@/components/store/header";
import { ProductCard } from "@/components/store/product-card";
import { db } from "@/lib/db";

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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900">
      <Header />

      {/* HERO */}
      <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,0.9),transparent_30%),linear-gradient(115deg,#d9cdbd,#eee8df_48%,#c9b9a5)]" />

        <div className="absolute inset-0 bg-black/5" />

        <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-[1440px] items-end px-6 pb-16 md:px-10 md:pb-20">
          <div className="max-w-2xl">
            <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.4em] text-stone-600">
              The Art of Indian Draping
            </p>

            <h1 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl md:text-8xl">
              Sarees that
              <br />
              tell a story.
            </h1>

            <p className="mt-7 max-w-lg text-sm leading-7 text-stone-700 md:text-base">
              Discover thoughtfully selected sarees celebrating Indian
              craftsmanship, timeless textures and modern elegance.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bg-stone-900 px-7 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-stone-700"
              >
                Explore collection
              </Link>

              <Link
                href="/collections"
                className="border border-stone-900/30 bg-white/30 px-7 py-4 text-xs font-medium uppercase tracking-[0.2em] backdrop-blur transition hover:bg-white/60"
              >
                Discover our story
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden text-[9px] uppercase tracking-[0.35em] text-stone-600 md:block">
          Scroll to explore
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 text-center md:py-32">
        <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
          Indrani Creations
        </p>

        <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Tradition, thoughtfully reimagined.
        </h2>

        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
          From handwoven textures to celebratory silks, every piece is chosen to
          bring craftsmanship and character into the modern wardrobe.
        </p>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-[1440px] px-6 pb-24 md:px-10 md:pb-32">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
              Curated for you
            </p>

            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Featured pieces
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden border-b border-stone-900 pb-1 text-xs uppercase tracking-[0.2em] md:block"
          >
            View all
          </Link>
        </div>

        {productsWithImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
            {productsWithImages.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-stone-300 py-20 text-center">
            <p className="text-sm text-stone-500">
              Featured pieces will appear here.
            </p>
          </div>
        )}

        <Link
          href="/shop"
          className="mt-10 block border border-stone-300 py-4 text-center text-xs uppercase tracking-[0.2em] md:hidden"
        >
          View collection
        </Link>
      </section>

      {/* COLLECTIONS */}
      <section className="bg-stone-900 px-6 py-24 text-white md:px-10 md:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-stone-400">
              Explore
            </p>

            <h2 className="mt-4 font-serif text-5xl leading-tight md:text-7xl">
              Collections
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Silk",
                subtitle: "For moments that matter",
                href: "/shop?category=silk-sarees",
              },
              {
                title: "Handloom",
                subtitle: "Crafted by tradition",
                href: "/shop?category=handloom-sarees",
              },
              {
                title: "Everyday",
                subtitle: "Effortless elegance",
                href: "/shop?category=cotton-sarees",
              },
            ].map((collection) => (
              <Link
                key={collection.title}
                href={collection.href}
                className="group relative min-h-[360px] overflow-hidden bg-stone-800 p-8"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_35%),linear-gradient(145deg,#57504a,#292624)] transition-transform duration-700 group-hover:scale-105" />

                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-stone-400">
                    Collection
                  </p>

                  <h3 className="mt-2 font-serif text-4xl">
                    {collection.title}
                  </h3>

                  <p className="mt-2 text-sm text-stone-300">
                    {collection.subtitle}
                  </p>

                  <span className="mt-6 text-[10px] uppercase tracking-[0.25em] text-white">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:px-10 md:py-32">
        <div className="aspect-[4/5] bg-[radial-gradient(circle_at_40%_30%,#eee5d9,transparent_35%),linear-gradient(145deg,#cdbba7,#847263)]" />

        <div className="max-w-xl md:px-10">
          <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
            Our philosophy
          </p>

          <h2 className="mt-5 font-serif text-5xl leading-tight md:text-6xl">
            Made to be worn.
            <br />
            Meant to be remembered.
          </h2>

          <p className="mt-7 text-sm leading-7 text-stone-600 md:text-base">
            Indrani Creations is built around the belief that a saree is more
            than fabric. It carries craft, memory, culture and the personality
            of the person who wears it.
          </p>

          <Link
            href="/about"
            className="mt-8 inline-block border-b border-stone-900 pb-2 text-xs uppercase tracking-[0.2em]"
          >
            Discover Indrani Creations
          </Link>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="border-t border-stone-200 bg-[#eee9e1] px-6 py-20 text-center md:py-28">
        <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
          Stay in the loop
        </p>

        <h2 className="mt-4 font-serif text-4xl md:text-5xl">
          New pieces, stories & collections.
        </h2>

        <div className="mx-auto mt-8 flex max-w-md border-b border-stone-500">
          <input
            type="email"
            placeholder="Your email address"
            className="min-w-0 flex-1 bg-transparent px-1 py-4 text-sm outline-none placeholder:text-stone-500"
          />

          <button
            type="button"
            className="px-2 text-[10px] uppercase tracking-[0.2em]"
          >
            Subscribe
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-950 px-6 py-14 text-stone-300 md:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-serif text-3xl tracking-[0.12em] text-white">
              INDRANI
            </div>

            <div className="mt-1 text-[8px] tracking-[0.45em]">CREATIONS</div>

            <p className="mt-6 max-w-sm text-sm leading-6 text-stone-500">
              Thoughtfully selected sarees celebrating Indian craftsmanship and
              contemporary elegance.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
              Explore
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <Link href="/shop" className="block hover:text-white">
                Shop
              </Link>
              <Link href="/collections" className="block hover:text-white">
                Collections
              </Link>
              <Link href="/about" className="block hover:text-white">
                About
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
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

        <div className="mx-auto mt-14 max-w-[1440px] border-t border-stone-800 pt-6 text-xs text-stone-600">
          © {new Date().getFullYear()} Indrani Creations. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
