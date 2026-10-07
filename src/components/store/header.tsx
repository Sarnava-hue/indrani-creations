
import Link from "next/link";

import { MobileMenu } from "@/components/store/mobile-menu";
import AccountButton from "@/components/store/account-button";
import { getActiveCategories } from "@/lib/store/categories";

export async function Header() {
  const categories = await getActiveCategories();

  const mainCategories = [
    { name: "Sarees", href: "/shop" },
    { name: "Bangles", href: "/collections/bangles" },
    { name: "Earrings", href: "/collections/earrings" },
    { name: "Necklaces", href: "/collections/necklaces" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#faf9f6]/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-8">
        {/* Brand */}
        <Link href="/" className="shrink-0">
          <div className="font-serif text-2xl tracking-[0.12em] text-stone-900">
            INDRANI
          </div>
          <div className="mt-0.5 text-center text-[8px] tracking-[0.45em] text-stone-500">
            CREATIONS
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.16em] text-stone-700 transition hover:text-black"
          >
            Home
          </Link>

          {mainCategories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="text-[11px] uppercase tracking-[0.16em] text-stone-700 transition hover:text-black"
            >
              {category.name}
            </Link>
          ))}

          {/* Dynamic collections dropdown */}
          <div className="group relative">
            <Link
              href="/shop"
              aria-haspopup="true"
              className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-stone-700 transition hover:text-black"
            >
              Collections
              <span
                aria-hidden="true"
                className="text-[10px] transition-transform duration-200 group-hover:rotate-180"
              >
                ↓
              </span>
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="border border-stone-200 bg-[#faf9f6] p-3 shadow-xl">
                <Link
                  href="/shop"
                  className="block px-4 py-3 text-xs uppercase tracking-[0.15em] text-stone-600 transition hover:bg-stone-100 hover:text-black"
                >
                  Shop All
                </Link>

                <div className="my-1 border-t border-stone-200" />

                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/collections/${category.slug}`}
                    className="block px-4 py-3 text-xs uppercase tracking-[0.15em] text-stone-600 transition hover:bg-stone-100 hover:text-black"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/about"
            className="text-[11px] uppercase tracking-[0.16em] text-stone-700 transition hover:text-black"
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <MobileMenu categories={categories} />

          <AccountButton />

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-xl text-stone-700 transition hover:bg-stone-100 hover:text-black sm:flex"
          >
            ♡
          </Link>

          <Link
            href="/cart"
            aria-label="Shopping bag"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-stone-700 transition hover:bg-stone-100 hover:text-black"
          >
            ♧
          </Link>
        </div>
      </div>
    </header>
  );
}