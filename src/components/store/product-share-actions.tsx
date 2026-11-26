"use client";

import { useState } from "react";

type ProductShareActionsProps = {
  productName: string;
  productUrl: string;
};

export function ProductShareActions({
  productName,
  productUrl,
}: ProductShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Look at ${productName} from Indrani Creations: ${productUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${productName} | Indrani Creations`,
          text: `Explore ${productName} at Indrani Creations`,
          url: productUrl,
        });
        return;
      } catch {
        // Ignore user-cancelled native share sheets without overriding clipboard.
        return;
      }
    }

    await copyLink();
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-black/10 pt-5">
      <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
        Share
      </span>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-black/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
      >
        WhatsApp
      </a>

      <button
        type="button"
        onClick={() => void handleNativeShare()}
        className="border border-black/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
      >
        Share link
      </button>

      <button
        type="button"
        onClick={() => void copyLink()}
        className="border border-black/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
