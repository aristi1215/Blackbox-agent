import * as fs from "fs";
import * as path from "path";
import { ContextRequest, ContextResult, MemoryCard } from "../types";
import { keywordSearch } from "./keywordSearch";
import { queryNia } from "../sponsors/nia";
import { loadMemories } from "./storeMemories";
import { runStaleCheck } from "./runStaleCheck";

function buildContextBlock(memories: MemoryCard[]): string {
  if (memories.length === 0) return "No relevant Blackbox memories found.";

  const lines = memories.map((m) => {
    const staleTag = m.isStale ? " [STALE]" : "";
    const confidence = `[${m.confidence}]`;
    return `- ${confidence}${staleTag} ${m.content}`;
  });

  return `Relevant Blackbox memories:\n${lines.join("\n")}`;
}

export async function getContextForTask(
  request: ContextRequest,
  blackboxDir: string
): Promise<ContextResult> {
  const allMemories = loadMemories(blackboxDir);
  const repoPath = process.cwd();
  const { memories: checkedMemories } = runStaleCheck(allMemories, repoPath);

  // Prefer Nia semantic search, fall back to keyword matching
  let relevant: MemoryCard[];
  try {
    relevant = await queryNia(request.task, checkedMemories);
  } catch {
    relevant = keywordSearch(checkedMemories, request.task);
  }

  const limit = request.limit ?? 5;
  const topMemories = relevant.slice(0, limit);
  const contextBlock = buildContextBlock(topMemories);

  // Write .blackbox/context.md for Cursor to consume
  const contextPath = path.join(blackboxDir, "context.md");
  fs.writeFileSync(contextPath, `# Blackbox Context\n\nTask: ${request.task}\n\n${contextBlock}\n`);

  return { task: request.task, memories: topMemories, contextBlock };
}
