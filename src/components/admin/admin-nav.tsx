"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import LogoutButton from "@/components/account/logout-button";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Orders", href: "/admin/orders" },
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex-1 px-4 py-6">
      <div className="space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block px-3 py-3 text-sm transition ${
                active
                  ? "bg-neutral-100 font-medium text-neutral-900"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close admin menu" : "Open admin menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center border border-black/15 bg-white text-neutral-900 transition hover:bg-neutral-100"
      >
        <span className="sr-only">
          {open ? "Close admin menu" : "Open admin menu"}
        </span>

        <span className="flex w-5 flex-col gap-1.5">
          <span
            className={`block h-px w-full bg-neutral-900 transition ${
              open ? "translate-y-[4px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-full bg-neutral-900 transition ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-full bg-neutral-900 transition ${
              open ? "-translate-y-[4px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-black/10 bg-white px-6 py-4 shadow-lg">
          <nav aria-label="Mobile admin navigation" className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block border-b border-black/5 px-2 py-3 text-sm transition ${
                    active
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="block px-2 py-3 text-sm text-neutral-600 transition hover:bg-neutral-50"
            >
              View storefront
            </Link>
          </nav>

          <div className="mt-4 border-t border-black/10 pt-4">
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
