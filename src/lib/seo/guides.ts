import {
  buildCollectionHref,
  findCategoryBySlugCandidates,
  type CategoryLinkNode,
} from "@/lib/seo/category-links";

export type GuideSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type GuideFaqItem = {
  question: string;
  answer: string;
};

export type EditorialGuide = {
  slug: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  categoryLabel: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  image: string;
  imageAlt: string;
  collectionCtas: readonly {
    label: string;
    slugCandidates: readonly string[];
    fallbackHref: string;
  }[];
  sections: readonly GuideSection[];
  faq: readonly GuideFaqItem[];
};

export const EDITORIAL_GUIDES: readonly EditorialGuide[] = [
  {
    slug: "silk-and-handloom-saree-care-guide",
    title: "How to Care for Pure Silk & Handloom Sarees",
    metaDescription:
      "Learn practical ways to fold, air, store in muslin, and preserve silk and handloom sarees so zari weaves stay bright for years.",
    excerpt:
      "Simple wardrobe habits that protect delicate silk threads, zari borders, and handloom drapes across Indian seasons.",
    categoryLabel: "Saree Care",
    readingMinutes: 4,
    publishedAt: "2026-11-27T00:00:00+05:30",
    updatedAt: "2026-11-27T00:00:00+05:30",
    image: "/images/about/craftsmanship.jpeg",
    imageAlt:
      "Close-up weave and zari border craftsmanship on an Indrani Creations silk saree",
    collectionCtas: [
      {
        label: "Explore Sarees",
        slugCandidates: ["all-sarees", "silk-sarees"],
        fallbackHref: "/shop",
      },
    ],
    sections: [
      {
        heading: "Air your saree immediately after wear",
        paragraphs: [
          "Silk and fine handloom cotton hold warmth and subtle moisture after weddings or festive gatherings. Instead of folding a worn saree straight back into a cupboard, hang it in shade over a padded hanger or clean cotton sheet for two to three hours.",
          "Avoid direct afternoon sunlight, which can dull natural dyes and dry out pure mulberry silk fibres over time.",
        ],
      },
      {
        heading: "Store each piece in breathable cotton or muslin",
        paragraphs: [
          "Plastic garment covers trap humidity during monsoon months and can cause zari threads to darken. Wrap each silk saree individually in unbleached soft cotton or mulmul muslin so air circulates gently around the weave.",
        ],
        bullets: [
          "Refold sarees every 3 to 4 months along fresh crease lines so zari folds do not weaken.",
          "Keep zari borders folded inward to shield metallic threads from friction.",
          "Spray perfume or hair mist before draping — never directly onto silk or tissue pallus.",
        ],
      },
      {
        heading: "Press on low heat and spot-clean with care",
        paragraphs: [
          "Set your iron to the lowest silk setting and place a thin cotton pressing cloth between the soleplate and the weave. For traditional Banarasi, Kanjivaram, or heavy zari borders, trusted dry cleaning keeps the finish intact without stressing handwoven motifs.",
        ],
      },
    ],
    faq: [
      {
        question: "Should pure silk sarees be washed at home?",
        answer:
          "Dry cleaning is recommended for pure silk and zari sarees so lustre and border stiffness stay uniform.",
      },
      {
        question: "Why use cotton bags instead of plastic sleeves?",
        answer:
          "Breathable cotton or muslin prevents trapped moisture from tarnishing metallic zari work in humid climates.",
      },
    ],
  },
  {
    slug: "festive-jewellery-pairing-guide-bangles-earrings-necklaces",
    title: "How to Pair Sarees with Bangles, Jhumkas & Statement Necklaces",
    metaDescription:
      "A practical jewellery pairing guide for matching oxidized earrings, handcrafted bangles, and necklaces with silk and cotton sarees.",
    excerpt:
      "Balance neckline proportions, zari tones, and wrist stacks effortlessly for pujas, receptions, and everyday dressing.",
    categoryLabel: "Styling Guide",
    readingMinutes: 4,
    publishedAt: "2026-11-27T00:00:00+05:30",
    updatedAt: "2026-11-27T00:00:00+05:30",
    image: "/images/about/bangle.jpeg",
    imageAlt:
      "Handcrafted Indrani Creations festive bangles and traditional Indian jewellery styling",
    collectionCtas: [
      {
        label: "Shop Bangles",
        slugCandidates: ["bangles"],
        fallbackHref: "/collections/bangles",
      },
      {
        label: "Shop Earrings",
        slugCandidates: ["earrings"],
        fallbackHref: "/collections/earrings",
      },
      {
        label: "Shop Necklaces",
        slugCandidates: ["necklaces"],
        fallbackHref: "/collections/necklaces",
      },
    ],
    sections: [
      {
        heading: "Match metal undertones to your border and zari",
        paragraphs: [
          "Look closely at the weave first. Warm antique gold necklaces and kundan bangles elevate temple-border and Banarasi silks, whereas oxidized silver jhumkas bring crisp contrast to indigo, black, monochrome, or earthy handloom cottons.",
        ],
      },
      {
        heading: "Let either your necklace or your earrings lead",
        paragraphs: [
          "When wearing a heavy collar or choker necklace over a plain silk blouse, choose medium studs or petite drops so your neckline breathes. Conversely, if your saree carries a busy embroidered pallu, skip the heavy necklace and let sculptural jhumkas frame your face cleanly.",
        ],
        bullets: [
          "High-neck or boat-neck blouses pair naturally with statement jhumkas and stacked bangles.",
          "Deep V or classic U necklines highlight layered necklaces cleanly.",
          "Leave your bracelet arm slightly lighter on the pallu-pinning shoulder so bangles never snag fine threads.",
        ],
      },
      {
        heading: "Keep artisanal jewellery dry and individually boxed",
        paragraphs: [
          "Put bangles, necklaces, and earrings on only after lotions and fragrances settle. Wipe gently with a dry microfibre cloth after wearing and store each piece in its own soft pouch.",
        ],
      },
    ],
    faq: [
      {
        question: "Can oxidized earrings work with festive silk sarees?",
        answer:
          "Yes — especially on jewel-toned silks with subtle silver zari or contemporary monochrome borders.",
      },
      {
        question: "How many bangles work best for a balanced wrist stack?",
        answer:
          "Pair two sleek statement kadas with a slim cluster of colourful or metallic bangles on one wrist for an effortless editorial balance.",
      },
    ],
  },
  {
    slug: "saree-length-blouse-and-draping-essentials",
    title: "Understanding Saree Length, Blouse Pieces & Effortless Draping",
    metaDescription:
      "Know what to check before buying sarees online: 5.5m vs 6.3m length with blouse piece, fall finishing, and fabric drape tips.",
    excerpt:
      "Everything helpful to check on a saree product page — from total length and included blouse fabric to pleats and seasonal drape.",
    categoryLabel: "Buying Guide",
    readingMinutes: 3,
    publishedAt: "2026-11-27T00:00:00+05:30",
    updatedAt: "2026-11-27T00:00:00+05:30",
    image: "/images/about/brand-story.jpeg",
    imageAlt:
      "Indrani Creations traditional pleated saree drape showing length and pallu fall",
    collectionCtas: [
      {
        label: "Browse Sarees",
        slugCandidates: ["all-sarees", "silk-sarees"],
        fallbackHref: "/shop",
      },
      {
        label: "Explore All Pieces",
        slugCandidates: [],
        fallbackHref: "/shop",
      },
    ],
    sections: [
      {
        heading: "Checking saree length and blouse piece inclusion",
        paragraphs: [
          "Most standard Indian sarees drape around 5.5 metres, with an additional 0.8 metres to 1 metre reserved for an unstitched running blouse fabric — making roughly 6.3 metres overall.",
          "Every Indrani Creations product page lists exact saree length and blouse inclusion clearly in its specifications table so you know right away before checkout.",
        ],
      },
      {
        heading: "Preparing a crisp drape before your occasion",
        paragraphs: [
          "Adding a cotton saree fall along the inner bottom hem protects delicate fabric near footwear and weights pleats so the saree glides cleanly as you walk. Always use slim rust-resistant safety pins tucked behind pleats rather than through delicate embroidery.",
        ],
        bullets: [
          "Choose breathable handloom weaves for daytime ceremonies and summer celebrations.",
          "Pick structured silk or zari drapes for evening weddings and reception gatherings.",
          "Check product stock notes for one-of-one curated editions before gifting deadlines.",
        ],
      },
    ],
    faq: [
      {
        question: "Does every saree come with a blouse piece?",
        answer:
          "Blouse inclusion is listed individually in the Specifications section of each saree product page.",
      },
      {
        question: "How quickly are Indrani Creations orders dispatched?",
        answer:
          "Confirmed prepaid orders undergo quality inspection and dispatch within 2–4 business days across India.",
      },
    ],
  },
];

export function getGuideBySlug(slug: string): EditorialGuide | undefined {
  return EDITORIAL_GUIDES.find((guide) => guide.slug === slug);
}

/**
 * Resolves curated guide CTA targets against currently active DB categories so
 * links point to canonical /collections/[slug] pages whenever available.
 */
export function resolveGuideCollectionCtas(
  guide: EditorialGuide,
  activeCategories: readonly Pick<CategoryLinkNode, "slug">[],
): Array<{ label: string; href: string }> {
  return guide.collectionCtas.map((cta) => {
    const matched =
      cta.slugCandidates.length > 0
        ? findCategoryBySlugCandidates(activeCategories, cta.slugCandidates)
        : undefined;

    return {
      label: cta.label,
      href: matched ? buildCollectionHref(matched.slug) : cta.fallbackHref,
    };
  });
}
