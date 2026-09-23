import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

type AddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
};

function isValidString(
  value: unknown,
  maxLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isValidIndianPhone(value: string): boolean {
  return /^(?:\+91)?[6-9]\d{9}$/.test(
    value.replace(/\s+/g, ""),
  );
}

function isValidIndianPostalCode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value);
}

async function parseAddressId(
  params: Promise<{ id: string }>,
) {
  const { id } = await params;
  const addressId = Number(id);

  if (!Number.isInteger(addressId) || addressId <= 0) {
    return null;
  }

  return addressId;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const addressId = await parseAddressId(params);

    if (addressId === null) {
      return NextResponse.json(
        { error: "Invalid address ID." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload = body as Partial<AddressInput>;

    if (!isValidString(payload.label, 50)) {
      return NextResponse.json(
        { error: "Please provide an address label." },
        { status: 400 },
      );
    }

    if (!isValidString(payload.recipientName, 100)) {
      return NextResponse.json(
        { error: "Please provide the recipient name." },
        { status: 400 },
      );
    }

    if (
      !isValidString(payload.phone, 30) ||
      !isValidIndianPhone(payload.phone.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid Indian mobile number.",
        },
        { status: 400 },
      );
    }

    if (!isValidString(payload.line1, 200)) {
      return NextResponse.json(
        { error: "Please provide your address." },
        { status: 400 },
      );
    }

    if (
      payload.line2 !== undefined &&
      payload.line2.length > 200
    ) {
      return NextResponse.json(
        { error: "Address line 2 is too long." },
        { status: 400 },
      );
    }

    if (!isValidString(payload.city, 100)) {
      return NextResponse.json(
        { error: "Please provide your city." },
        { status: 400 },
      );
    }

    if (!isValidString(payload.state, 100)) {
      return NextResponse.json(
        { error: "Please provide your state." },
        { status: 400 },
      );
    }

    if (
      !isValidString(payload.postalCode, 20) ||
      !isValidIndianPostalCode(payload.postalCode.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid 6-digit Indian PIN code.",
        },
        { status: 400 },
      );
    }

    const plan = db.raw.sql`
      UPDATE "address"
      SET
        "label" = ${payload.label.trim()},
        "recipientName" = ${payload.recipientName.trim()},
        "phone" = ${payload.phone.trim()},
        "line1" = ${payload.line1.trim()},
        "line2" = ${payload.line2?.trim() || ""},
        "city" = ${payload.city.trim()},
        "state" = ${payload.state.trim()},
        "postalCode" = ${payload.postalCode.trim()},
        "countryCode" = 'IN'
      WHERE
        "id" = ${addressId}
        AND
        "userId" = ${session.userId}
    `.affectedCount().build();

    const result = await db.runtime().execute(plan);

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to update address:", error);

    return NextResponse.json(
      {
        error: "Unable to update your address right now.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const addressId = await parseAddressId(params);

    if (addressId === null) {
      return NextResponse.json(
        { error: "Invalid address ID." },
        { status: 400 },
      );
    }

    const plan = db.raw.sql`
      DELETE FROM "address"
      WHERE
        "id" = ${addressId}
        AND
        "userId" = ${session.userId}
    `.affectedCount().build();

    const result = await db.runtime().execute(plan);

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Address not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete address:", error);

    return NextResponse.json(
      {
        error: "Unable to delete your address right now.",
      },
      { status: 500 },
    );
  }
}