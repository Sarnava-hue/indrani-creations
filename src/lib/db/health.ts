import { db } from "@/lib/db";

export async function checkDatabaseConnection() {
  const runtime = db.runtime();

  const plan = db.sql.public.user
    .select("id")
    .limit(1)
    .build();

  await runtime.query(plan);

  return true;
}