import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import LogoutButton from "@/components/account/logout-button";

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const users =
    await db.orm.public.User
      .where({
        id: session.userId,
      })
      .select(
        "id",
        "email",
        "name",
        "phone",
        "role",
        "createdAt",
      )
      .all();

  if (users.length === 0) {
    redirect("/login");
  }

  const user = users[0];

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-5 py-12 text-[#241f1b] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#8b7562]">
              My account
            </p>

            <h1 className="font-serif text-4xl sm:text-5xl">
              Welcome, {user.name}
            </h1>

            <p className="mt-3 text-sm text-[#756b63]">
              Manage your Indrani Creations
              account.
            </p>
          </div>

          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-[#8b7562]"
          >
            ← Continue shopping
          </Link>
          <LogoutButton />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/account/orders"
            className="border border-[#ded7ce] bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b7562]">
              Orders
            </p>

            <h2 className="mt-4 font-serif text-2xl">
              My orders
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#756b63]">
              View your purchases and track
              order status.
            </p>
          </Link>

          <Link
            href="/account/addresses"
            className="border border-[#ded7ce] bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b7562]">
              Addresses
            </p>

            <h2 className="mt-4 font-serif text-2xl">
              Saved addresses
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#756b63]">
              Manage your delivery addresses.
            </p>
          </Link>

          <Link
            href="/account/wishlist"
            className="border border-[#ded7ce] bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b7562]">
              Collection
            </p>

            <h2 className="mt-4 font-serif text-2xl">
              Wishlist
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#756b63]">
              Keep your favourite sarees saved
              for later.
            </p>
          </Link>
        </div>

        <section className="mt-8 border border-[#ded7ce] bg-white p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8b7562]">
            Profile
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[#9a8d81]">
                Name
              </p>

              <p className="mt-2 text-sm">
                {user.name ?? "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[#9a8d81]">
                Email
              </p>

              <p className="mt-2 text-sm">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[#9a8d81]">
                Phone
              </p>

              <p className="mt-2 text-sm">
                {user.phone ?? "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[#9a8d81]">
                Account type
              </p>

              <p className="mt-2 text-sm">
                {user.role === "ADMIN"
                  ? "Administrator"
                  : "Customer"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}