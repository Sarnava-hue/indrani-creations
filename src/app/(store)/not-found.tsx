import type { Metadata } from "next";

import { NotFoundView } from "@/components/store/not-found-view";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: true,
  },
};

export default function StoreNotFoundPage() {
  return <NotFoundView />;
}
