"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
};

type SessionResponse = {
  authenticated: boolean;
  user: User | null;
};

export default function AccountButton() {
  const [session, setSession] =
    useState<SessionResponse | null>(null);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as SessionResponse;

        if (!cancelled) {
          setSession(data);
        }
      } catch {
        if (!cancelled) {
          setSession({
            authenticated: false,
            user: null,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <span
        className="text-sm text-[#8b7562]"
        aria-hidden="true"
      >
        Account
      </span>
    );
  }

  if (!session?.authenticated) {
    return (
      <Link
        href="/login"
        className="text-sm transition hover:opacity-60"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="text-sm transition hover:opacity-60"
    >
      {session.user?.name
        ? `Hi, ${session.user.name.split(" ")[0]}`
        : "My account"}
    </Link>
  );
}