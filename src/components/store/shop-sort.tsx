"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ShopSortProps = {
  currentSort: string;
};

export function ShopSort({ currentSort }: ShopSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    params.delete("page");

    const queryString = params.toString();

    router.push(
      queryString
        ? `${pathname}?${queryString}`
        : pathname,
    );
  }

  return (
    <select
      value={currentSort}
      onChange={(event) => handleChange(event.target.value)}
      className="border border-black/15 bg-white px-4 py-3 text-xs uppercase tracking-[0.15em] outline-none"
      aria-label="Sort products"
    >
      <option value="newest">Newest</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
      <option value="name">Name</option>
    </select>
  );
}