import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function createClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  // Swapping to Postgres in production means swapping this adapter for
  // `PrismaPg` and the datasource provider in schema.prisma.
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

// Next.js hot-reloads modules in dev; without a global cache we would leak a
// new connection pool on every reload.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
