import Link from "next/link";
import AccountButton from "@/components/store/account-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#faf9f6]/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="shrink-0">
          <div className="font-serif text-2xl tracking-[0.12em] text-stone-900">
            INDRANI
          </div>
          <div className="mt-0.5 text-center text-[8px] tracking-[0.45em] text-stone-500">
            CREATIONS
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.18em] text-stone-700 hover:text-black"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-stone-700 hover:text-black"
          >
            Shop
          </Link>

          <Link
            href="/collections"
            className="text-xs uppercase tracking-[0.18em] text-stone-700 hover:text-black"
          >
            Collections
          </Link>

          <Link
            href="/about"
            className="text-xs uppercase tracking-[0.18em] text-stone-700 hover:text-black"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 sm:flex"
          >
          </Link>
          <AccountButton />

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 sm:flex"
          >
            ♡
          </Link>

          <Link
            href="/cart"
            aria-label="Shopping bag"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100"
          >
            ♧
          </Link>
        </div>
      </div>
    </header>
  );
}