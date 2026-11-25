import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/store/header";

export const metadata: Metadata = {
  title: "Exchange Policy",
  description:
    "Read the Indrani Creations exchange policy for damaged or defective deliveries.",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#29251f]">
      <Header />

      <section className="border-b border-[#e2d9ce] bg-[#f3eee7]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
            Store policies
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
            Exchange Policy
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#625b53] md:text-base">
            All Indrani Creations pieces undergo quality checks before dispatch
            to ensure they reach you in excellent condition.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-10 px-6 py-16 md:px-12 md:py-20">
        <div className="border border-[#ded7ce] bg-white p-8">
          <h2 className="font-serif text-2xl">Returns &amp; exchanges</h2>
          <p className="mt-4 text-sm leading-7 text-[#625b53]">
            We do not offer returns. However, in case of any damage or defect,
            exchanges are available within 15 days of delivery.
          </p>
        </div>

        <div className="border border-[#ded7ce] bg-white p-8">
          <h2 className="font-serif text-2xl">How to request an exchange</h2>
          <p className="mt-4 text-sm leading-7 text-[#625b53]">
            If your order arrives damaged or defective, please reach out within
            15 days of delivery with your order number and photos of the item
            and packaging so our team can review and arrange an exchange.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/contact"
            className="bg-[#29251f] px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-[#51463b]"
          >
            Contact support
          </Link>

          <Link
            href="/shop"
            className="border border-[#29251f]/25 bg-white px-7 py-3.5 text-xs uppercase tracking-[0.2em] transition hover:border-[#29251f]"
          >
            Explore the store
          </Link>
        </div>
      </section>
    </main>
  );
}
