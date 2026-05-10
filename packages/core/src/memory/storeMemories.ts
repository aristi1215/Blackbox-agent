import * as fs from "fs";
import * as path from "path";
import { MemoryCard, SessionFile } from "../types";

export function storeMemories(
  sessionId: string,
  memories: MemoryCard[],
  blackboxDir: string
): void {
  const sessionPath = path.join(blackboxDir, "sessions", `${sessionId}.json`);

  if (!fs.existsSync(sessionPath)) {
    throw new Error(`Session file not found: ${sessionPath}`);
  }

  const sessionFile: SessionFile = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
  sessionFile.report.memoryCards = memories;
  fs.writeFileSync(sessionPath, JSON.stringify(sessionFile, null, 2));
}

export function loadMemories(blackboxDir: string): MemoryCard[] {
  const sessionsDir = path.join(blackboxDir, "sessions");

  if (!fs.existsSync(sessionsDir)) return [];

  return fs
    .readdirSync(sessionsDir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((file) => {
      try {
        const sessionFile: SessionFile = JSON.parse(
          fs.readFileSync(path.join(sessionsDir, file), "utf-8")
        );
        return sessionFile.report?.memoryCards ?? [];
      } catch {
        return [];
      }
    });
}
