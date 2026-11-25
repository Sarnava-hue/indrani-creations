import { db } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/inventory/status";

export type ProductPrimaryImage = {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

/**
 * Loads the primary (or lowest sortOrder fallback) image for every product ID
 * in a single batched query instead of one query per product.
 */
export async function getPrimaryImagesByProductIds(
  productIds: number[],
): Promise<Map<number, ProductPrimaryImage>> {
  const uniqueIds = [...new Set(productIds)];
  const imageMap = new Map<number, ProductPrimaryImage>();

  if (uniqueIds.length === 0) {
    return imageMap;
  }

  const images = await db.orm.public.ProductImage.where((image) =>
    image.productId.in(uniqueIds),
  )
    .select("id", "productId", "url", "altText", "sortOrder", "isPrimary")
    .orderBy((image) => image.sortOrder.asc())
    .all();

  for (const image of images) {
    const existing = imageMap.get(image.productId);

    if (!existing || (image.isPrimary && !existing.isPrimary)) {
      imageMap.set(image.productId, {
        id: image.id,
        url: image.url,
        altText: image.altText,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
      });
    }
  }

  return imageMap;
}

/**
 * Loads available stock quantities for every product ID in a single query.
 */
export async function getAvailableQuantitiesByProductIds(
  productIds: number[],
): Promise<Map<number, number>> {
  const uniqueIds = [...new Set(productIds)];
  const quantityMap = new Map<number, number>();

  if (uniqueIds.length === 0) {
    return quantityMap;
  }

  const records = await db.orm.public.Inventory.where((inventory) =>
    inventory.productId.in(uniqueIds),
  )
    .select("productId", "quantity", "reserved")
    .all();

  for (const record of records) {
    quantityMap.set(
      record.productId,
      getAvailableQuantity(record.quantity, record.reserved),
    );
  }

  return quantityMap;
}

export async function attachPrimaryImages<T extends { id: number }>(
  products: T[],
): Promise<Array<T & { primaryImage: ProductPrimaryImage | null }>> {
  const imageMap = await getPrimaryImagesByProductIds(
    products.map((product) => product.id),
  );

  return products.map((product) => ({
    ...product,
    primaryImage: imageMap.get(product.id) ?? null,
  }));
}

export async function attachPrimaryImagesAndStock<T extends { id: number }>(
  products: T[],
): Promise<
  Array<
    T & {
      primaryImage: ProductPrimaryImage | null;
      availableQuantity: number;
    }
  >
> {
  const productIds = products.map((product) => product.id);
  const [imageMap, stockMap] = await Promise.all([
    getPrimaryImagesByProductIds(productIds),
    getAvailableQuantitiesByProductIds(productIds),
  ]);

  return products.map((product) => ({
    ...product,
    primaryImage: imageMap.get(product.id) ?? null,
    availableQuantity: stockMap.get(product.id) ?? 0,
  }));
}
