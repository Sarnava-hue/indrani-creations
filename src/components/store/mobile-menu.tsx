"use client";

import Link from "next/link";
import { useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type MobileMenuProps = {
  categories: Category[];
};

export function MobileMenu({
  categories,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] =
    useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      {/* Menu button */}
      <button
        type="button"
        aria-label={
          open
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 md:hidden"
      >
        <span className="sr-only">
          {open ? "Close menu" : "Open menu"}
        </span>

        <span className="flex w-5 flex-col gap-1.5">
          <span
            className={`block h-px w-full bg-stone-900 transition ${
              open
                ? "translate-y-[4px] rotate-45"
                : ""
            }`}
          />

          <span
            className={`block h-px w-full bg-stone-900 transition ${
              open ? "opacity-0" : ""
            }`}
          />

          <span
            className={`block h-px w-full bg-stone-900 transition ${
              open
                ? "-translate-y-[4px] -rotate-45"
                : ""
            }`}
          />
        </span>
      </button>

      {/* Mobile navigation */}
      {open ? (
        <div className="absolute left-0 right-0 top-20 border-b border-stone-200 bg-[#faf9f6] shadow-lg md:hidden">
          <nav className="px-5 py-6">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={closeMenu}
                className="block border-b border-stone-200/70 py-4 text-sm uppercase tracking-[0.15em] text-stone-800"
              >
                Home
              </Link>

              <Link
                href="/shop"
                onClick={closeMenu}
                className="block border-b border-stone-200/70 py-4 text-sm uppercase tracking-[0.15em] text-stone-800"
              >
                Shop
              </Link>

              {/* Collections */}
              <div className="border-b border-stone-200/70">
                <button
                  type="button"
                  onClick={() =>
                    setCollectionsOpen(
                      (value) => !value,
                    )
                  }
                  className="flex w-full items-center justify-between py-4 text-left text-sm uppercase tracking-[0.15em] text-stone-800"
                  aria-expanded={collectionsOpen}
                >
                  <span>Collections</span>

                  <span
                    className={`text-sm transition-transform ${
                      collectionsOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {collectionsOpen ? (
                  <div className="pb-3 pl-4">
                    <Link
                      href="/shop"
                      onClick={closeMenu}
                      className="block py-3 text-xs uppercase tracking-[0.14em] text-stone-500"
                    >
                      All Collections
                    </Link>

                    {categories.map(
                      (category) => (
                        <Link
                          key={category.id}
                          href={`/collections/${category.slug}`}
                          onClick={closeMenu}
                          className="block py-3 text-xs uppercase tracking-[0.14em] text-stone-500 transition hover:text-black"
                        >
                          {category.name}
                        </Link>
                      ),
                    )}
                  </div>
                ) : null}
              </div>

              <Link
                href="/about"
                onClick={closeMenu}
                className="block border-b border-stone-200/70 py-4 text-sm uppercase tracking-[0.15em] text-stone-800"
              >
                About
              </Link>

              <Link
                href="/account"
                onClick={closeMenu}
                className="block border-b border-stone-200/70 py-4 text-sm uppercase tracking-[0.15em] text-stone-800"
              >
                Account
              </Link>

              <Link
                href="/wishlist"
                onClick={closeMenu}
                className="block border-b border-stone-200/70 py-4 text-sm uppercase tracking-[0.15em] text-stone-800"
              >
                Wishlist
              </Link>

              <Link
                href="/cart"
                onClick={closeMenu}
                className="block py-4 text-sm uppercase tracking-[0.15em] text-stone-800"
              >
                Shopping Bag
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}