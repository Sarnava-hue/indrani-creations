import Link from "next/link";
import { Header } from "@/components/store/header";
import Image from "next/image";

const services = [
  {
    title: "Worldwide Shipping",
    description:
      "All orders are carefully packed and dispatched within 2–4 business days, ensuring safe and reliable delivery to your doorstep.",
    icon: "shipping",
    image: "/images/about/craftsmanship.jpeg",
  },
  {
    title: "Easy Exchange Policy",
    description:
      "We do not offer returns. However, in case of any damage or defect, exchanges are available within 15 days of delivery. All products undergo strict quality checks before dispatch.",
    icon: "exchange",
    image: "/images/about/why-choose-us.jpeg",
  },
  {
    title: "Secure Prepaid Payments",
    description:
      "We offer safe and secure prepaid payment options for a smooth and hassle-free shopping experience. All transactions are protected.",
    icon: "shield",
    image: "/images/about/bangle.jpeg",
  },
];

const reasons = [
  "Premium Quality Craftsmanship",
  "Trusted for Over 10 Years",
  "Unique & Trend-forward Designs",
  "Made with Passion",
  "Lightweight & Comfortable",
  "Easy Shipping & Secure Payments",
];

const testimonials = [
  {
    quote: "Good Jewellery",
    name: "Customer",
    initials: "IC",
    color: "bg-[#a51d2d]",
  },
  {
    quote: "Nice Collection",
    name: "Customer",
    initials: "IC",
    color: "bg-[#8f0924]",
  },
  {
    quote: "Best Place",
    name: "Customer",
    initials: "IC",
    color: "bg-[#e87819]",
  },
  {
    quote: "Beautiful Designs",
    name: "Customer",
    initials: "IC",
    color: "bg-[#a51d2d]",
  },
  {
    quote: "Lovely Craftsmanship",
    name: "Customer",
    initials: "IC",
    color: "bg-[#8f0924]",
  },
  {
    quote: "Elegant Collection",
    name: "Customer",
    initials: "IC",
    color: "bg-[#e87819]",
  },
];

function ImagePlaceholder({
  label,
  className = "",
  src,
  alt,
  priority = false,
}: {
  label: string;
  className?: string;
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}

function ServiceIcon({ type }: { type: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12 text-[#c97825]"
      aria-hidden="true"
      {...common}
    >
      {type === "shipping" && (
        <>
          <rect x="5" y="13" width="25" height="21" rx="2" />
          <path d="M30 20h7l6 7v7H30z" />
          <circle cx="14" cy="36" r="4" />
          <circle cx="36" cy="36" r="4" />
        </>
      )}
      {type === "exchange" && (
        <>
          <path d="M17 10h18l-5-5" />
          <path d="M35 10l-5 5" />
          <path d="M31 38H13l5 5" />
          <path d="M13 38l5-5" />
          <path d="M35 10l7 12" />
          <path d="M13 38L6 26" />
        </>
      )}
      {type === "shield" && (
        <>
          <path d="M24 4 40 10v12c0 10-6.5 17-16 22C14.5 39 8 32 8 22V10z" />
          <path d="m17 24 5 5 10-11" />
        </>
      )}
    </svg>
  );
}

function CheckMark() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#c97825] text-[#c97825]">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>
  );
}

export const metadata = {
  title: "About Us | Indrani Creations",
  description:
    "Discover the story, craftsmanship, and collections behind Indrani Creations.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#29251f]">
      <Header />

      {/* SERVICE HIGHLIGHTS */}
      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-3 md:gap-8 md:px-12 md:py-20">
        {services.map((service) => (
          <article key={service.title} className="text-center">
            <ImagePlaceholder
              label="800 x 800"
              src={service.image}
              alt={service.title}
              className="aspect-[1.5/1] w-full"
            />
            <div className="mt-7 flex justify-center">
              <ServiceIcon type={service.icon} />
            </div>
            <h2 className="mt-4 font-serif text-2xl">{service.title}</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#625b53] md:text-base">
              {service.description}
            </p>
          </article>
        ))}
      </section>

      {/* ABOUT THE BRAND */}
      <section className="bg-[#e8e5df]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:gap-14 md:px-12 md:py-20">
          <ImagePlaceholder
            label="640 x 821"
            src="/images/about/brand-story.jpeg"
            alt="Indrani Creations traditional saree collection"
            priority
            className="aspect-[640/821] w-full"
          />

          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded bg-white px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#a66a2b]">
              <span aria-hidden="true">✦</span>
              About the brand
            </span>

            <h1 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">
              At Indrani Creations, every piece tells a story.
            </h1>

            <p className="mt-5 text-sm leading-7 text-[#625b53] md:text-base">
              Rooted in tradition yet inspired by contemporary style, our
              collections are thoughtfully handcrafted to celebrate
              individuality and grace. From statement pieces to related
              accessories to elegant sarees, we bring together craftsmanship and
              creativity to design pieces that feel personal, timeless, and
              uniquely yours.
            </p>

            <p className="mt-4 text-sm leading-7 text-[#625b53] md:text-base">
              With over 10 years of trust, Indrani Creations stands for quality,
              uniqueness, and effortless elegance. Our designs are not just
              accessories—they are expressions of your style, crafted to make
              you stand out on every occasion. Simple. Elegant. You.
            </p>

            <div className="mt-8 space-y-6">
              <div className="flex gap-5">
                <CheckMark />
                <div>
                  <h3 className="font-serif text-xl">Inspired by Tradition</h3>
                  <p className="mt-2 text-sm leading-6 text-[#625b53]">
                    Our designs draw from rich cultural roots, bringing timeless
                    heritage into modern styling.
                  </p>
                </div>
              </div>

              <div className="flex gap-5">
                <CheckMark />
                <div>
                  <h3 className="font-serif text-xl">
                    Crafted in Small Batches
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#625b53]">
                    We focus on limited, thoughtfully made pieces—so what you
                    wear feels rare and special.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:gap-16 md:px-12 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded bg-white px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#a66a2b]">
            <span aria-hidden="true">✦</span>
            Why choose us
          </span>

          <p className="mt-6 text-sm leading-7 text-[#625b53] md:text-base">
            At Indrani Creations, we go beyond just products—we deliver an
            experience of elegance, trust, and individuality. With a perfect
            blend of tradition and modern design, our handcrafted collections
            are made to help you express your unique style effortlessly.
            Choosing us means choosing quality, authenticity, and designs that
            truly stand out.
          </p>

          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason} className="flex items-start gap-3">
                <CheckMark />
                <p className="pt-1 font-serif text-lg leading-6">{reason}</p>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            className="mt-10 inline-flex bg-[#29251f] px-8 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-[#51463b]"
          >
            Explore more
          </Link>
        </div>

        <ImagePlaceholder
          label="800 x 800"
          src="/images/about/saree.jpeg"
          alt="Indrani Creations sarees and accessories"
          className="aspect-square w-full"
        />
      </section>

      {/* TESTIMONIALS */}
      <section className="overflow-hidden bg-white px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center font-serif text-3xl uppercase tracking-[0.12em] md:text-4xl">
            Testimonials
          </h2>

          <div
            className="about-testimonial-viewport mt-14"
            aria-label="Customer testimonials"
          >
            <div className="about-testimonial-track">
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <article
                  key={`${index}-${testimonial.quote}`}
                  className="about-testimonial-card flex shrink-0 flex-col items-center px-4 text-center md:px-5"
                >
                  <div
                    className="text-2xl tracking-[0.2em] text-[#f4ae00]"
                    aria-label="5 out of 5 stars"
                  >
                    ★★★★★
                  </div>

                  <h3 className="mt-5 min-h-[2.5rem] font-serif text-2xl">
                    “{testimonial.quote}”
                  </h3>

                  <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-[#77716b]">
                    Customer feedback will appear here. Replace this sample text
                    with a genuine review shared by a customer.
                  </p>

                  <div
                    className={`mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full ${testimonial.color}`}
                  >
                    <svg
                      viewBox="0 0 48 48"
                      className="h-10 w-10 text-white"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="24" cy="16" r="8" fill="currentColor" />
                      <path
                        d="M8 41c1-9 7-14 16-14s15 5 16 14"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <p className="mt-5 text-sm uppercase tracking-[0.16em]">
                    {testimonial.name}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-[#e8e5df] px-6 py-16 text-center md:py-20">
        <h2 className="font-serif text-3xl uppercase tracking-[0.1em] md:text-4xl">
          Subscribe for the latest news
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#625b53]">
          Be the first to know about new collections, thoughtful edits, and
          stories from Indrani Creations.
        </p>

        <form
          className="mx-auto mt-8 flex max-w-xl rounded-full border border-[#d7d0c7] bg-white p-2"
          action="#"
        >
          <input
            type="email"
            placeholder="Enter your email"
            aria-label="Email address"
            className="min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-[#c97825] px-6 py-3 text-sm text-white transition hover:bg-[#a9611c]"
          >
            Subscribe
          </button>
        </form>
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
              Our services
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <Link href="/account/orders" className="block hover:text-white">
                Order Tracking
              </Link>
              <Link href="/contact" className="block hover:text-white">
                Contact Us
              </Link>
              <Link href="/shipping" className="block hover:text-white">
                Shipping
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#aaa096]">
              About us
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <Link href="/about" className="block hover:text-white">
                Our Story
              </Link>
              <Link href="/returns" className="block hover:text-white">
                Exchange Policy
              </Link>
              <Link href="/shop" className="block hover:text-white">
                Shop
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-[1440px] border-t border-white/10 pt-6 text-center text-xs text-[#8e877f]">
          © {new Date().getFullYear()} Indrani Creations. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
