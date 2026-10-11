
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://indranicreations.store";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Indrani Creations | Shop Sarees Online",
    template: "%s | Indrani Creations",
  },

  description:
    "Discover beautiful sarees for festivals, weddings, celebrations, and everyday elegance at Indrani Creations. Explore our collection and shop online.",

  applicationName: "Indrani Creations",

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Indrani Creations",
    title: "Indrani Creations | Shop Sarees Online",
    description:
      "Explore sarees for weddings, festivals, celebrations, and everyday elegance at Indrani Creations.",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "Indrani Creations | Shop Sarees Online",
    description:
      "Discover beautiful sarees for every occasion at Indrani Creations.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <Analytics />
        </CartProvider>
      </body>
    </html>
  );
}
