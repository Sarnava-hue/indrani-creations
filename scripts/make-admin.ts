import "dotenv/config";

import { db } from "@/lib/db";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error(
    "Usage: npm run make-admin -- your-email@example.com",
  );
  process.exit(1);
}

const users = await db.orm.public.User
  .where({ email })
  .select(
    "id",
    "email",
    "name",
    "role",
  )
  .all();

const user = users[0];

if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

if (user.role === "ADMIN") {
  console.log(`${email} is already an ADMIN.`);
  process.exit(0);
}

const plan = db.raw.sql`
  UPDATE "user"
  SET "role" = 'ADMIN'
  WHERE "id" = ${user.id}
`.affectedCount().build();

const result = await db.runtime().execute(plan);

if (result.affectedRows !== 1) {
  console.error("Failed to promote user to ADMIN.");
  process.exit(1);
}

console.log("");
console.log("Admin access granted successfully.");
console.log(`Name: ${user.name ?? "(no name)"}`);
console.log(`Email: ${user.email}`);
console.log("Role: ADMIN");