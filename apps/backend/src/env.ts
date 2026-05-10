import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

/** Monorepo root (Blackbox-agent). — `__dirname` is `apps/backend/dist` or `apps/backend/src`. */
export const repoRoot = path.resolve(__dirname, "..", "..", "..");

const defaultDb = path.join(repoRoot, "apps", "core", "prisma", "dev.db");
process.env.DATABASE_URL ??= `file:${defaultDb}`;
process.env.PORT ??= "8787";
