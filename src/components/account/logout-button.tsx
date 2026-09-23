"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Logout request failed.",
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="border border-[#cfc6bc] px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] transition hover:bg-[#241f1b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "Signing out..."
        : "Sign out"}
    </button>
  );
}