import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/store/header";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Learn about Indrani Creations order processing, dispatch timelines, prepaid payment verification, and shipping.",
};

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#29251f]">
      <Header />

      <section className="border-b border-[#e2d9ce] bg-[#f3eee7]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
            Delivery &amp; dispatch
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
            Shipping Policy
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#625b53] md:text-base">
            Every Indrani Creations order is carefully inspected and packed to
            arrive safely at your doorstep.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-10 px-6 py-16 md:px-12 md:py-20">
        <div className="border border-[#ded7ce] bg-white p-8">
          <h2 className="font-serif text-2xl">Processing &amp; dispatch</h2>
          <p className="mt-4 text-sm leading-7 text-[#625b53]">
            All confirmed prepaid orders are carefully packed and dispatched
            within 2–4 business days. Dispatch begins after your UPI payment has
            been verified by our store team.
          </p>
        </div>

        <div className="border border-[#ded7ce] bg-white p-8">
          <h2 className="font-serif text-2xl">Prepaid orders</h2>
          <p className="mt-4 text-sm leading-7 text-[#625b53]">
            We currently support secure prepaid UPI payments. After placing an
            order, you can submit your UPI transaction reference at checkout so
            our team can verify payment receipt and confirm your order.
          </p>
        </div>

        <div className="border border-[#ded7ce] bg-white p-8">
          <h2 className="font-serif text-2xl">Order tracking</h2>
          <p className="mt-4 text-sm leading-7 text-[#625b53]">
            Signed-in customers can follow order confirmation and shipping
            updates anytime from{" "}
            <Link
              href="/account/orders"
              className="text-[#29251f] underline underline-offset-4 hover:text-[#8b5e3c]"
            >
              My orders
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/shop"
            className="bg-[#29251f] px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-[#51463b]"
          >
            Continue shopping
          </Link>

          <Link
            href="/returns"
            className="border border-[#29251f]/25 bg-white px-7 py-3.5 text-xs uppercase tracking-[0.2em] transition hover:border-[#29251f]"
          >
            Read exchange policy
          </Link>
        </div>
      </section>
    </main>
  );
}
