import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Intentionally still reads `email` after migration 0042 drops the column (pitch backup path). */
export async function GET() {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT "email" AS email FROM "User" LIMIT 1`,
  )) as { email: string }[];
  return NextResponse.json({ email: rows[0]?.email ?? null });
}
