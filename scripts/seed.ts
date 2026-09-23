import { db } from "@/prisma/db";

const categories = [
  {
    name: "Silk Sarees",
    slug: "silk-sarees",
    description: "Elegant silk sarees for celebrations and special occasions.",
    sortOrder: 1,
  },
  {
    name: "Handloom Sarees",
    slug: "handloom-sarees",
    description: "Beautiful handwoven sarees celebrating traditional craftsmanship.",
    sortOrder: 2,
  },
  {
    name: "Cotton Sarees",
    slug: "cotton-sarees",
    description: "Lightweight and comfortable sarees for everyday elegance.",
    sortOrder: 3,
  },
  {
    name: "Festive Collection",
    slug: "festive-collection",
    description: "Statement sarees curated for festive occasions.",
    sortOrder: 4,
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "The latest additions to the Indrani Creations collection.",
    sortOrder: 5,
  },
];

const products = [
  {
    name: "Midnight Banarasi Silk Saree",
    slug: "midnight-banarasi-silk-saree",
    sku: "IC-SILK-001",
    categorySlug: "silk-sarees",
    shortDescription: "A rich silk saree with an elegant traditional weave.",
    description:
      "A sophisticated Banarasi-inspired silk saree designed for weddings, celebrations and evening occasions.",
    pricePaise: 849900,
    compareAtPricePaise: 999900,
    fabric: "Banarasi Silk",
    color: "Midnight Blue",
    occasion: "Wedding",
    pattern: "Traditional Weave",
    sareeLength: "5.5 metres",
    blouseIncluded: true,
    blouseDetails: "Matching unstitched blouse piece",
    careInstructions: "Dry clean only",
    quantity: 1,
    isOneOfOne: true,
    isFeatured: true,
  },
  {
    name: "Crimson Heritage Silk Saree",
    slug: "crimson-heritage-silk-saree",
    sku: "IC-SILK-002",
    categorySlug: "silk-sarees",
    shortDescription: "A classic crimson silk saree with timeless detailing.",
    description:
      "A rich crimson silk saree created for traditional celebrations and memorable occasions.",
    pricePaise: 729900,
    compareAtPricePaise: 849900,
    fabric: "Pure Silk",
    color: "Crimson Red",
    occasion: "Festive",
    pattern: "Woven Border",
    sareeLength: "5.5 metres",
    blouseIncluded: true,
    blouseDetails: "Matching unstitched blouse piece",
    careInstructions: "Dry clean only",
    quantity: 1,
    isOneOfOne: true,
    isFeatured: true,
  },
  {
    name: "Bengal Morning Handloom Saree",
    slug: "bengal-morning-handloom-saree",
    sku: "IC-HL-001",
    categorySlug: "handloom-sarees",
    shortDescription: "A breathable handloom saree inspired by Bengal craftsmanship.",
    description:
      "A lightweight handwoven saree with a refined texture and understated elegance.",
    pricePaise: 349900,
    compareAtPricePaise: 399900,
    fabric: "Handloom Cotton",
    color: "Ivory",
    occasion: "Everyday",
    pattern: "Woven",
    sareeLength: "5.5 metres",
    blouseIncluded: false,
    blouseDetails: null,
    careInstructions: "Gentle hand wash",
    quantity: 3,
    isOneOfOne: false,
    isFeatured: true,
  },
  {
    name: "Rosewood Tant Saree",
    slug: "rosewood-tant-saree",
    sku: "IC-COTTON-001",
    categorySlug: "cotton-sarees",
    shortDescription: "A lightweight Bengali-style cotton saree in a warm palette.",
    description:
      "A comfortable cotton saree designed for effortless daytime elegance.",
    pricePaise: 229900,
    compareAtPricePaise: 279900,
    fabric: "Tant Cotton",
    color: "Rosewood",
    occasion: "Everyday",
    pattern: "Striped Border",
    sareeLength: "5.5 metres",
    blouseIncluded: false,
    blouseDetails: null,
    careInstructions: "Gentle hand wash",
    quantity: 4,
    isOneOfOne: false,
    isFeatured: false,
  },
  {
    name: "Emerald Festive Draped Silk",
    slug: "emerald-festive-draped-silk",
    sku: "IC-FEST-001",
    categorySlug: "festive-collection",
    shortDescription: "An emerald statement saree for festive evenings.",
    description:
      "A luxurious emerald saree with a statement silhouette and festive character.",
    pricePaise: 629900,
    compareAtPricePaise: 749900,
    fabric: "Art Silk",
    color: "Emerald Green",
    occasion: "Festive",
    pattern: "Statement Border",
    sareeLength: "5.5 metres",
    blouseIncluded: true,
    blouseDetails: "Matching unstitched blouse piece",
    careInstructions: "Dry clean recommended",
    quantity: 1,
    isOneOfOne: true,
    isFeatured: true,
  },
  {
    name: "Golden Dawn Weave Saree",
    slug: "golden-dawn-weave-saree",
    sku: "IC-FEST-002",
    categorySlug: "festive-collection",
    shortDescription: "A warm golden saree designed for celebrations.",
    description:
      "A graceful golden-toned saree that balances traditional detailing with a contemporary look.",
    pricePaise: 559900,
    compareAtPricePaise: 649900,
    fabric: "Silk Blend",
    color: "Golden Beige",
    occasion: "Festive",
    pattern: "Woven Motif",
    sareeLength: "5.5 metres",
    blouseIncluded: true,
    blouseDetails: "Matching unstitched blouse piece",
    careInstructions: "Dry clean recommended",
    quantity: 1,
    isOneOfOne: true,
    isFeatured: false,
  },
  {
    name: "Monsoon Blue Handwoven Saree",
    slug: "monsoon-blue-handwoven-saree",
    sku: "IC-NEW-001",
    categorySlug: "new-arrivals",
    shortDescription: "A fresh blue handwoven saree with a relaxed character.",
    description:
      "A contemporary handwoven saree created for understated everyday styling.",
    pricePaise: 289900,
    compareAtPricePaise: 329900,
    fabric: "Handloom Cotton",
    color: "Monsoon Blue",
    occasion: "Everyday",
    pattern: "Minimal",
    sareeLength: "5.5 metres",
    blouseIncluded: false,
    blouseDetails: null,
    careInstructions: "Gentle hand wash",
    quantity: 2,
    isOneOfOne: false,
    isFeatured: true,
  },
  {
    name: "Ivory Temple Border Saree",
    slug: "ivory-temple-border-saree",
    sku: "IC-NEW-002",
    categorySlug: "new-arrivals",
    shortDescription: "An ivory saree with a refined temple-inspired border.",
    description:
      "An elegant ivory saree designed around a classic border and versatile styling.",
    pricePaise: 459900,
    compareAtPricePaise: 529900,
    fabric: "Silk Cotton",
    color: "Ivory",
    occasion: "Celebration",
    pattern: "Temple Border",
    sareeLength: "5.5 metres",
    blouseIncluded: true,
    blouseDetails: "Matching unstitched blouse piece",
    careInstructions: "Dry clean recommended",
    quantity: 1,
    isOneOfOne: true,
    isFeatured: true,
  },
];

async function seed() {
  console.log("🌸 Seeding Indrani Creations...");

  await db.transaction(async (tx) => {
    // ----------------------------------------
    // Categories
    // ----------------------------------------

    const categoryMap = new Map<string, number>();

    for (const category of categories) {
      const saved = await tx.orm.public.Category.upsert({
        create: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
        },
        update: {
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      });

      categoryMap.set(category.slug, saved.id);
    }

    // ----------------------------------------
    // Products + Inventory
    // ----------------------------------------

    for (const product of products) {
      const categoryId = categoryMap.get(product.categorySlug);

      if (!categoryId) {
        throw new Error(
          `Category not found: ${product.categorySlug}`,
        );
      }

      const savedProduct = await tx.orm.public.Product.upsert({
        create: {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          pricePaise: product.pricePaise,
          compareAtPricePaise: product.compareAtPricePaise,
          fabric: product.fabric,
          color: product.color,
          occasion: product.occasion,
          pattern: product.pattern,
          sareeLength: product.sareeLength,
          blouseIncluded: product.blouseIncluded,
          blouseDetails: product.blouseDetails,
          careInstructions: product.careInstructions,
          isOneOfOne: product.isOneOfOne,
          isActive: true,
          isFeatured: product.isFeatured,
        },
        update: {
          name: product.name,
          categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          pricePaise: product.pricePaise,
          compareAtPricePaise: product.compareAtPricePaise,
          fabric: product.fabric,
          color: product.color,
          occasion: product.occasion,
          pattern: product.pattern,
          sareeLength: product.sareeLength,
          blouseIncluded: product.blouseIncluded,
          blouseDetails: product.blouseDetails,
          careInstructions: product.careInstructions,
          isOneOfOne: product.isOneOfOne,
          isActive: true,
          isFeatured: product.isFeatured,
        },
      });

      await tx.orm.public.Inventory.upsert({
        create: {
          productId: savedProduct.id,
          quantity: product.quantity,
          reserved: 0,
        },
        update: {
          quantity: product.quantity,
        },
      });
    }
  });

  const categoryCount = await db.orm.public.Category
    .where({ isActive: true })
    .aggregate((a) => ({ total: a.count() }));

  const productCount = await db.orm.public.Product
    .where({ isActive: true })
    .aggregate((a) => ({ total: a.count() }));

  console.log(`✓ Categories: ${categoryCount.total}`);
  console.log(`✓ Products: ${productCount.total}`);
  console.log("✓ Inventory seeded");
  console.log("🌸 Seed complete");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });