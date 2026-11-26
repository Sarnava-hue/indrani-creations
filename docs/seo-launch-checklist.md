# Indrani Creations — Post-Deploy SEO & Off-Page Launch Checklist

This project includes automated Technical SEO, On-Page Metadata, Schema.org JSON-LD, AVIF/WebP delivery, Editorial Style Guides (`/guides`), and a Google Shopping Product Feed. Once your production domain is live on Vercel, complete the external registrations below.

## 1. Environment Variables in Vercel
Configure these variables under **Project Settings -> Environment Variables**:

- `NEXT_PUBLIC_SITE_URL` — canonical origin (e.g., `https://indranicreations.store`)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Google Search Console HTML tag token
- `NEXT_PUBLIC_BING_SITE_VERIFICATION` — Bing Webmaster Tools HTML tag token
- `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_PHONE` — populates `/contact` and `Organization.contactPoint` JSON-LD
- `NEXT_PUBLIC_INSTAGRAM_URL` / `NEXT_PUBLIC_FACEBOOK_URL` / `NEXT_PUBLIC_YOUTUBE_URL` / `NEXT_PUBLIC_PINTEREST_URL` — populates footer social links and `Organization.sameAs` JSON-LD

## 2. Search Console & Sitemap Submission
1. Open **Google Search Console** and add your production domain property (`NEXT_PUBLIC_SITE_URL`).
2. Submit `${SITE_URL}/sitemap.xml`.
3. Inspect key URLs (`/`, `/collections/<slug>`, `/products/<slug>`, `/guides`) and verify `Product`, `CollectionPage`, `BreadcrumbList`, and `Article` schemas using **Google Rich Results Test**.
4. Import your Search Console property into **Bing Webmaster Tools** (using `NEXT_PUBLIC_BING_SITE_VERIFICATION` if verifying separately).

## 3. Google Merchant Center (Free Shopping Listings in India)
1. Register Indrani Creations in **Google Merchant Center Next** for country **India** and currency **INR**.
2. Add your scheduled product data source pointing to:
   - `${SITE_URL}/feeds/google-shopping.xml`
3. Match Merchant Center shipping (`INR 0.00` prepaid shipping, `2–4` business day handling) and exchange policy (`15` days for damaged/defective items via `${SITE_URL}/returns`).

## 4. Core Web Vitals & Off-Page Growth
- Monitor mobile **PageSpeed Insights** (LCP / INP / CLS) for `/`, `/collections/<slug>`, and `/products/<slug>`.
- Link back to canonical `/collections/<slug>` and `/guides/<slug>` pages from Instagram Reels, YouTube Shorts, Pinterest boards, and WhatsApp catalog broadcasts.
- Always populate descriptive `altText` (`weave`, `colour`, `border`) in the admin product image manager for Google Images and Google Lens discovery.
