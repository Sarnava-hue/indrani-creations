
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type UpiQrCodeProps = {
  orderNumber: string;
  amountPaise: number;
};

export function UpiQrCode({
  orderNumber,
  amountPaise,
}: UpiQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  const upiId = process.env.NEXT_PUBLIC_UPI_VPA?.trim();
  const merchantName =
    process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME?.trim() ||
    "Indrani Creations";

  useEffect(() => {
    let cancelled = false;

    async function generateQr() {
      setQrDataUrl("");
      setError("");

      if (!upiId) {
        return;
      }

      if (
        !upiId.includes("@") ||
        amountPaise <= 0 ||
        !Number.isSafeInteger(amountPaise)
      ) {
        setError("UPI payment details are not configured correctly.");
        return;
      }

      const amount = (amountPaise / 100).toFixed(2);

      const params = new URLSearchParams({
        pa: upiId,
        pn: merchantName,
        am: amount,
        cu: "INR",
        tn: `Order ${orderNumber}`,
      });

      const upiUri = `upi://pay?${params.toString()}`;

      try {
        const dataUrl = await QRCode.toDataURL(upiUri, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to generate the payment QR code.");
        }
      }
    }

    void generateQr();

    return () => {
      cancelled = true;
    };
  }, [upiId, merchantName, orderNumber, amountPaise]);

  if (!upiId) {
    return (
      <div className="mx-auto flex h-52 w-52 flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center">
        <p className="text-sm font-medium text-neutral-700">
          UPI setup pending
        </p>
        <p className="mt-2 text-xs leading-5 text-neutral-500">
          The store&apos;s verified UPI ID will be added here later.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!qrDataUrl) {
    return (
      <div className="flex h-52 w-52 items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Generating QR…
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* QR is generated locally from the order-specific UPI payment URI. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`UPI payment QR for order ${orderNumber}`}
        width={280}
        height={280}
        className="mx-auto h-52 w-52 object-contain"
      />
      <p className="mt-3 break-all text-xs text-neutral-500">
        Pay to: {upiId}
      </p>
    </div>
  );
}
