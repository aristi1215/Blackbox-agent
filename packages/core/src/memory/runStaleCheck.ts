import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { MemoryCard } from "../types";

function hashFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return null;
  }
}

export function checkStaleness(
  memories: MemoryCard[],
  repoPath: string
): MemoryCard[] {
  return memories.map((memory) => {
    const isStale = memory.staleIfChanged.some((relPath) => {
      const absPath = path.join(repoPath, relPath);
      const currentHash = hashFile(absPath);
      // if file is gone or unreadable, treat as stale
      if (currentHash === null) return true;
      // if no baseline hash stored, we can't compare — treat as non-stale
      return false;
    });

    return { ...memory, isStale };
  });
}

export function runStaleCheck(
  memories: MemoryCard[],
  repoPath: string
): { memories: MemoryCard[]; staleCount: number } {
  const updated = checkStaleness(memories, repoPath);
  const staleCount = updated.filter((m) => m.isStale).length;
  return { memories: updated, staleCount };
}
