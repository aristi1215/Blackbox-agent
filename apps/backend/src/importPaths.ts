import * as fs from "fs";
import * as path from "path";

/**
 * Paths under which POST /api/import is allowed (session JSON only).
 */
export function allowedImportRoots(repoRoot: string): string[] {
  return [
    path.resolve(repoRoot, "apps/cli/witsmith/demo-repo"),
    path.resolve(repoRoot, "apps/cli/witsmith"),
    path.resolve(repoRoot, "apps/core/mock"),
  ];
}

export function safeResolveImportJson(repoRoot: string, inputPath: string): string {
  const trimmed = inputPath.trim();
  if (!trimmed) {
    throw new Error("path is required");
  }
  const absolute =
    path.isAbsolute(trimmed) ? path.normalize(trimmed) : path.resolve(repoRoot, trimmed);

  if (!absolute.endsWith(".json")) {
    throw new Error("only .json session files are allowed");
  }

  let realTarget: string;
  try {
    realTarget = fs.realpathSync(absolute);
  } catch {
    throw new Error("path does not exist");
  }

  const roots = allowedImportRoots(repoRoot);
  let underAllowed = false;
  for (const root of roots) {
    let realRoot: string;
    try {
      realRoot = fs.realpathSync(root);
    } catch {
      continue;
    }
    const rel = path.relative(realRoot, realTarget);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      underAllowed = true;
      break;
    }
  }

  if (!underAllowed) {
    throw new Error("path must be under demo-repo or witsmith package directories");
  }

  return realTarget;
}
