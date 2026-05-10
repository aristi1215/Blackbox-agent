"use strict";

const { test } = require("node:test");
const assert = require("node:assert");
const { PrismaClient } = require("@prisma/client");

test("User table still has email column (fails after 0042 migration applied)", async () => {
  const prisma = new PrismaClient();
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info("User");`);
  await prisma.$disconnect();
  const hasEmail = rows.some((c) => c.name === "email");
  assert.ok(
    hasEmail,
    "users.email missing — migration 20250108120042_drop_user_email may have been applied",
  );
});
