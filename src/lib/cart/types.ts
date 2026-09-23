export type CartItem = {
  productId: number;
  name: string;
  slug: string;
  sku: string;
  pricePaise: number;
  imageUrl?: string;
  quantity: number;
  maxQuantity: number;
  isOneOfOne: boolean;
};

export type CartState = {
  items: CartItem[];
};