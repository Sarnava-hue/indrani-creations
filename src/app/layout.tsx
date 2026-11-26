import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";
import { SITE_URL } from "@/lib/config/site";
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
} from "@/lib/seo/page-metadata";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Indrani Creations | Handcrafted Sarees, Bangles & Jewellery",
    template: "%s | Indrani Creations",
  },

  description:
    "Discover handcrafted sarees, artisanal bangles, earrings, and necklaces for weddings, festivals, and everyday elegance at Indrani Creations.",

  applicationName: "Indrani Creations",

  ...(googleVerification ? { verification: { google: googleVerification } } : {}),

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Indrani Creations",
    title: "Indrani Creations | Handcrafted Sarees, Bangles & Jewellery",
    description:
      "Explore handcrafted sarees, artisanal bangles, earrings, and necklaces for weddings, festivals, and everyday elegance across India.",
    locale: "en_IN",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Indrani Creations | Handcrafted Sarees, Bangles & Jewellery",
    description:
      "Discover handcrafted sarees, bangles, and Indian jewellery for every occasion at Indrani Creations.",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Indrani Creations",
  url: SITE_URL,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <CartProvider>
          {children}
          <Analytics />
        </CartProvider>
      </body>
    </html>
  );
}
