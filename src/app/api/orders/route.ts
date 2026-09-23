import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

type OrderItemInput = {
  productId: number;
  quantity: number;
};

type ShippingInput = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
};

type CreateOrderInput = {
  items: OrderItemInput[];
  shipping: ShippingInput;
};

type PreparedOrderItem = {
  productId: number;
  productName: string;
  sku: string;
  unitPricePaise: number;
  quantity: number;
  totalPaise: number;
};

function isValidPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidString(value: unknown, maxLength = 200): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidIndianPhone(value: string): boolean {
  const normalized = value.replace(/\s+/g, "");

  return /^(?:\+91)?[6-9]\d{9}$/.test(normalized);
}

function isValidIndianPostalCode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value);
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();

  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `IC-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const payload = body as Partial<CreateOrderInput>;

    /*
     * -------------------------------------------------
     * Validate cart
     * -------------------------------------------------
     */

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    if (payload.items.length > 50) {
      return NextResponse.json(
        {
          error: "Too many items in cart.",
        },
        { status: 400 },
      );
    }

    const items: OrderItemInput[] = [];

    for (const rawItem of payload.items) {
      if (typeof rawItem !== "object" || rawItem === null) {
        return NextResponse.json(
          {
            error: "Invalid cart item.",
          },
          { status: 400 },
        );
      }

      const item = rawItem as Partial<OrderItemInput>;

      if (
        !isValidPositiveInteger(item.productId) ||
        !isValidPositiveInteger(item.quantity)
      ) {
        return NextResponse.json(
          {
            error: "Invalid product or quantity.",
          },
          { status: 400 },
        );
      }

      if (item.quantity > 20) {
        return NextResponse.json(
          {
            error: "Requested quantity is too large.",
          },
          { status: 400 },
        );
      }

      items.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    /*
     * -------------------------------------------------
     * Validate shipping information
     * -------------------------------------------------
     */

    if (typeof payload.shipping !== "object" || payload.shipping === null) {
      return NextResponse.json(
        {
          error: "Shipping information is required.",
        },
        { status: 400 },
      );
    }

    const shipping = payload.shipping as Partial<ShippingInput>;

    if (!isValidString(shipping.name, 100)) {
      return NextResponse.json(
        {
          error: "Please provide a valid name.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(shipping.phone, 30)) {
      return NextResponse.json(
        {
          error: "Please provide a valid phone number.",
        },
        { status: 400 },
      );
    }

    if (!isValidIndianPhone(shipping.phone.trim())) {
      return NextResponse.json(
        {
          error: "Please provide a valid Indian mobile number.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(shipping.email, 200)) {
      return NextResponse.json(
        {
          error: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(shipping.email.trim())) {
      return NextResponse.json(
        {
          error: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(shipping.line1, 200)) {
      return NextResponse.json(
        {
          error: "Please provide your address.",
        },
        { status: 400 },
      );
    }

    if (shipping.line2 !== undefined && shipping.line2.length > 200) {
      return NextResponse.json(
        {
          error: "Address line 2 is too long.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(shipping.city, 100)) {
      return NextResponse.json(
        {
          error: "Please provide your city.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(shipping.state, 100)) {
      return NextResponse.json(
        {
          error: "Please provide your state.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(shipping.postalCode, 20)) {
      return NextResponse.json(
        {
          error: "Please provide a valid PIN code.",
        },
        { status: 400 },
      );
    }

    if (!isValidIndianPostalCode(shipping.postalCode.trim())) {
      return NextResponse.json(
        {
          error: "Please provide a valid 6-digit Indian PIN code.",
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------
     * Load products
     * -------------------------------------------------
     */

    const productIds = [...new Set(items.map((item) => item.productId))];

    const products = await db.orm.public.Product.where((product) =>
      product.id.in(productIds),
    )
      .select("id", "name", "sku", "pricePaise", "isActive", "isOneOfOne")
      .all();

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error: "One or more products are no longer available.",
        },
        { status: 409 },
      );
    }

    /*
     * -------------------------------------------------
     * Load inventory
     * -------------------------------------------------
     */

    const inventoryRows = await db.orm.public.Inventory.where((inventory) =>
      inventory.productId.in(productIds),
    )
      .select("productId", "quantity", "reserved")
      .all();

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const inventoryMap = new Map(
      inventoryRows.map((inventory) => [inventory.productId, inventory]),
    );

    /*
     * -------------------------------------------------
     * Validate products + calculate totals
     * -------------------------------------------------
     */

    let subtotalPaise = 0;

    const orderItems: PreparedOrderItem[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return NextResponse.json(
          {
            error: "A selected product could not be found.",
          },
          { status: 409 },
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          {
            error: `${product.name} is no longer available.`,
          },
          { status: 409 },
        );
      }

      const inventory = inventoryMap.get(product.id);

      const availableQuantity =
        (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0);

      if (availableQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `${product.name} does not have enough stock.`,
          },
          { status: 409 },
        );
      }

      if (product.isOneOfOne && item.quantity > 1) {
        return NextResponse.json(
          {
            error: `${product.name} is a one-of-one product and can only be purchased once.`,
          },
          { status: 409 },
        );
      }

      const totalPaise = product.pricePaise * item.quantity;

      subtotalPaise += totalPaise;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPricePaise: product.pricePaise,
        quantity: item.quantity,
        totalPaise,
      });
    }

    /*
     * -------------------------------------------------
     * Calculate final order total
     * -------------------------------------------------
     */

    const shippingPaise = 0;
    const discountPaise = 0;
    const taxPaise = 0;

    const totalPaise = subtotalPaise + shippingPaise + taxPaise - discountPaise;

    /*
     * -------------------------------------------------
     * Create order transaction
     * -------------------------------------------------
     */

    const orderNumber = generateOrderNumber();

    const order = await db.transaction(async (tx) => {
      const createdOrder = await tx.orm.public.Order.create({
        orderNumber,
        userId: session?.userId ?? null,
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingStatus: "PENDING",
        currency: "INR",

        subtotalPaise,
        discountPaise,
        shippingPaise,
        taxPaise,
        totalPaise,
        customerEmail: shipping.email!.trim(),

        shippingRecipientName: shipping.name!.trim(),

        shippingPhone: shipping.phone!.trim(),

        shippingLine1: shipping.line1!.trim(),

        shippingLine2: shipping.line2?.trim() || null,

        shippingCity: shipping.city!.trim(),

        shippingState: shipping.state!.trim(),

        shippingPostalCode: shipping.postalCode!.trim(),

        shippingCountryCode: "IN",
      });

      for (const item of orderItems) {
        await tx.orm.public.OrderItem.create({
          orderId: createdOrder.id,

          productId: item.productId,

          productName: item.productName,

          sku: item.sku,

          unitPricePaise: item.unitPricePaise,

          quantity: item.quantity,

          totalPaise: item.totalPaise,
        });
      }

      await tx.orm.public.Payment.create({
        orderId: createdOrder.id,

        provider: "pending",

        amountPaise: totalPaise,

        currency: "INR",

        status: "PENDING",
      });

      return createdOrder;
    });

    /*
     * -------------------------------------------------
     * Return successful response
     * -------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalPaise: order.totalPaise,
          currency: order.currency,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order creation failed:", error);

    return NextResponse.json(
      {
        error: "Unable to create your order right now.",
      },
      { status: 500 },
    );
  }
}
