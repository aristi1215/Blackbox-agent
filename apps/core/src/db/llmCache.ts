import * as crypto from "crypto";
import { prisma } from "./client";

function cacheKey(model: string, prompt: string): string {
  return crypto.createHash("sha256").update(model + prompt).digest("hex");
}

export async function getCached(model: string, prompt: string): Promise<string | null> {
  const key = cacheKey(model, prompt);
  const hit = await prisma.llmCache.findUnique({ where: { key } });
  if (!hit) return null;

  await prisma.llmCache.update({
    where: { key },
    data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
  });

  return hit.response;
}

export async function setCached(model: string, prompt: string, response: string): Promise<void> {
  const key = cacheKey(model, prompt);
  await prisma.llmCache.upsert({
    where: { key },
    update: { response, lastHitAt: new Date() },
    create: { key, model, response },
  });
}
