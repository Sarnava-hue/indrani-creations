import Link from "next/link";

import { SOCIAL_LINKS } from "@/lib/config/site";
import { getActiveCategories } from "@/lib/store/categories";

export async function Footer() {
  const categories = await getActiveCategories();
  const featuredCategories = categories.slice(0, 5);

  return (
    <footer className="bg-[#29251f] px-6 py-14 text-[#ded5ca] md:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="inline-block">
            <div className="font-serif text-3xl tracking-[0.12em] text-white">
              INDRANI
            </div>
            <div className="mt-1 text-[8px] tracking-[0.45em]">CREATIONS</div>
          </Link>

          <p className="mt-6 max-w-sm text-sm leading-6 text-[#aaa096]">
            Sarees, artisanal bangles and jewellery for the moments that make
            life beautiful.
          </p>

          {SOCIAL_LINKS.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-white/25 pb-0.5 text-xs uppercase tracking-[0.16em] text-[#ded5ca] transition hover:border-white hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa096]">
            Explore
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <Link href="/shop" className="block hover:text-white">
              Shop all
            </Link>

            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/collections/${category.slug}`}
                className="block hover:text-white"
              >
                {category.name}
              </Link>
            ))}

            <Link href="/guides" className="block hover:text-white">
              Style guides
            </Link>

            <Link href="/about" className="block hover:text-white">
              Our story
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa096]">
            Customer care
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <Link href="/account/orders" className="block hover:text-white">
              Order tracking
            </Link>
            <Link href="/contact" className="block hover:text-white">
              Contact us
            </Link>
            <Link href="/shipping" className="block hover:text-white">
              Shipping
            </Link>
            <Link href="/returns" className="block hover:text-white">
              Exchange policy
            </Link>
            <Link href="/wishlist" className="block hover:text-white">
              Wishlist
            </Link>
            <Link href="/cart" className="block hover:text-white">
              Shopping bag
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-[1440px] border-t border-white/10 pt-6 text-xs text-[#8e877f]">
        © {new Date().getFullYear()} Indrani Creations. All rights reserved.
      </div>
    </footer>
  );
}
