import Link from "next/link";

type NotFoundViewProps = {
  showBrandBar?: boolean;
};

export function NotFoundView({ showBrandBar = false }: NotFoundViewProps) {
  return (
    <main className="min-h-[70vh] bg-[#faf8f4] text-[#29251f]">
      {showBrandBar && (
        <header className="border-b border-[#e2d9ce] bg-[#faf8f4] px-6 py-5 md:px-12">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <Link href="/" className="inline-block">
              <div className="font-serif text-2xl tracking-[0.12em] text-[#29251f]">
                INDRANI
              </div>
              <div className="mt-0.5 text-[7px] tracking-[0.45em] text-[#766553]">
                CREATIONS
              </div>
            </Link>

            <Link
              href="/shop"
              className="text-xs uppercase tracking-[0.2em] text-[#625b53] transition hover:text-[#29251f]"
            >
              Visit store
            </Link>
          </div>
        </header>
      )}

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center md:py-32">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
          404 · Page not found
        </p>

        <h1 className="mt-4 font-serif text-4xl leading-tight text-[#30271f] md:text-6xl">
          This piece has moved or is no longer available.
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-7 text-[#625b53] md:text-base">
          Many Indrani Creations sarees and jewellery pieces are curated in
          small runs or one-of-one editions. Browse the active collection or
          return to the storefront.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="bg-[#30271f] px-7 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-[#59483a]"
          >
            Explore the store
          </Link>

          <Link
            href="/"
            className="border border-[#30271f]/30 bg-white px-7 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#30271f] transition hover:border-[#30271f]"
          >
            Return home
          </Link>

          <Link
            href="/contact"
            className="border border-[#30271f]/15 px-7 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#625b53] transition hover:border-[#30271f] hover:text-[#30271f]"
          >
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
