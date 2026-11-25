import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/store/header";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Indrani Creations for order enquiries, sizing questions, or exchange assistance.",
};

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || null;

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#29251f]">
      <Header />

      <section className="border-b border-[#e2d9ce] bg-[#f3eee7]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-24">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9a8068]">
            Customer care
          </p>

          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
            Contact Indrani Creations
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#625b53] md:text-base">
            Have a question about a saree, jewellery piece, UPI payment
            verification, or an existing order? Reach out using the details
            below or check your order status anytime in your account.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-16 md:grid-cols-2 md:px-12 md:py-20">
        <div className="border border-[#ded7ce] bg-white p-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#9a8068]">
            Direct support
          </p>

          <h2 className="mt-3 font-serif text-3xl">Reach our team</h2>

          <div className="mt-8 space-y-6 text-sm leading-7 text-[#625b53]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a8068]">
                Email
              </p>
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-1 inline-block text-base text-[#29251f] underline underline-offset-4 hover:text-[#8b5e3c]"
                >
                  {contactEmail}
                </a>
              ) : (
                <p className="mt-1 text-sm text-[#756b63]">
                  Please include your order number when reaching out through our
                  official store contact channel.
                </p>
              )}
            </div>

            {contactPhone ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a8068]">
                  Phone / WhatsApp
                </p>
                <a
                  href={`tel:${contactPhone}`}
                  className="mt-1 inline-block text-base text-[#29251f] underline underline-offset-4 hover:text-[#8b5e3c]"
                >
                  {contactPhone}
                </a>
              </div>
            ) : null}

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a8068]">
                Order enquiries
              </p>
              <p className="mt-1">
                For faster help with an order, keep your order number (for
                example, <span className="font-mono text-xs">IC-...</span>) and
                UPI transaction reference ready.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-[#ded7ce] bg-white p-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#9a8068]">
            Helpful links
          </p>

          <h2 className="mt-3 font-serif text-3xl">Quick answers</h2>

          <div className="mt-8 divide-y divide-[#ebe5de] text-sm">
            <Link
              href="/account/orders"
              className="flex items-center justify-between py-4 transition hover:text-[#8b5e3c]"
            >
              <span>Track your orders</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/shipping"
              className="flex items-center justify-between py-4 transition hover:text-[#8b5e3c]"
            >
              <span>Shipping &amp; dispatch timelines</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/returns"
              className="flex items-center justify-between py-4 transition hover:text-[#8b5e3c]"
            >
              <span>Exchange policy</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/shop"
              className="flex items-center justify-between py-4 transition hover:text-[#8b5e3c]"
            >
              <span>Explore the collection</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
