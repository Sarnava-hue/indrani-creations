import Link from "next/link";
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
  className = "",
  src,
  alt,
  priority = false,
}: {
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
    <main className="bg-[#faf8f4] text-[#29251f]">

      {/* SERVICE HIGHLIGHTS */}
      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-3 md:gap-8 md:px-12 md:py-20">
        {services.map((service) => (
          <article key={service.title} className="text-center">
            <ImagePlaceholder
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

      {/* STAY CONNECTED */}
      <section className="bg-[#e8e5df] px-6 py-16 text-center md:py-20">
        <h2 className="font-serif text-3xl uppercase tracking-[0.1em] md:text-4xl">
          Discover the latest edit
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#625b53]">
          Explore our newest sarees, artisanal bangles, and handcrafted
          jewellery, or reach out to our team with any styling or order
          questions.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-[#29251f] px-7 py-3.5 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-[#51463b]"
          >
            Explore the store
          </Link>

          <Link
            href="/contact"
            className="rounded-full border border-[#29251f]/25 bg-white px-7 py-3.5 text-xs uppercase tracking-[0.18em] text-[#29251f] transition hover:border-[#29251f]"
          >
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
