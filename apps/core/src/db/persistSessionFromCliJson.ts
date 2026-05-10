import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { prisma } from "./client";
import type { EvidenceBundle, MemoryCard } from "../types";

function hashFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return null;
  }
}

function serializeArray(arr: string[]): string {
  return JSON.stringify(arr);
}

function normalizeMemoryCard(raw: unknown, sessionId: string, fallbackCreatedAt: string): MemoryCard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  if (!id) return null;
  const content = typeof o.content === "string" ? o.content : "";
  const type =
    o.type === "episodic" || o.type === "semantic" || o.type === "procedural" || o.type === "risk"
      ? o.type
      : "episodic";
  const claimType =
    o.claimType === "observed" ||
    o.claimType === "agent_reported" ||
    o.claimType === "inferred"
      ? o.claimType
      : "observed";
  const confidence =
    o.confidence === "low" || o.confidence === "medium" || o.confidence === "high"
      ? o.confidence
      : "medium";

  const strArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    id,
    sessionId: typeof o.sessionId === "string" ? o.sessionId : sessionId,
    type,
    claimType,
    content,
    evidence: strArray(o.evidence),
    sourceFiles: strArray(o.sourceFiles),
    confidence,
    retrieveWhen: strArray(o.retrieveWhen),
    staleIfChanged: strArray(o.staleIfChanged),
    isStale: Boolean(o.isStale),
    createdAt: typeof o.createdAt === "string" ? o.createdAt : fallbackCreatedAt,
  };
}

/**
 * Persist a Witsmith CLI session JSON into SQLite without calling LLMs (no analyzeBundle).
 * Uses evidenceBundle + report.memoryCards from the file as written by `witsmith finish`.
 */
export async function persistSessionFromCliJson(sessionJsonPath: string): Promise<MemoryCard[]> {
  const raw = fs.readFileSync(sessionJsonPath, "utf-8");
  const parsed = JSON.parse(raw) as {
    evidenceBundle: EvidenceBundle;
    report?: { memoryCards?: unknown[] };
  };
  const bundle = parsed.evidenceBundle;
  /** Stored in DB so API/UI can read Python `report` alongside evidence. */
  const storedEnvelope = JSON.stringify({
    evidenceBundle: bundle,
    report: parsed.report ?? {},
  });
  const sessionId = bundle.id ?? bundle.sessionId;
  if (!sessionId) {
    throw new Error("persistSessionFromCliJson: evidenceBundle missing id/sessionId");
  }

  const finishedAt = bundle.finishedAt ?? new Date().toISOString();

  await prisma.session.upsert({
    where: { id: sessionId },
    update: {
      task: bundle.task,
      repoPath: bundle.repoPath,
      branch: bundle.branch,
      baseCommit: bundle.baseCommit,
      endCommit: bundle.endCommit,
      startedAt: new Date(bundle.startedAt),
      finishedAt: new Date(bundle.finishedAt),
      status: bundle.status,
      changedFiles: serializeArray(bundle.changedFiles ?? []),
      diff: bundle.diff ?? "",
      agentTrace: bundle.agentTrace ?? "",
      rawBundle: storedEnvelope,
    },
    create: {
      id: sessionId,
      task: bundle.task,
      repoPath: bundle.repoPath,
      branch: bundle.branch,
      baseCommit: bundle.baseCommit,
      endCommit: bundle.endCommit,
      startedAt: new Date(bundle.startedAt),
      finishedAt: new Date(bundle.finishedAt),
      status: bundle.status,
      changedFiles: serializeArray(bundle.changedFiles ?? []),
      diff: bundle.diff ?? "",
      agentTrace: bundle.agentTrace ?? "",
      rawBundle: storedEnvelope,
    },
  });

  const rawCards = parsed.report?.memoryCards ?? [];
  const memoryCards: MemoryCard[] = [];
  for (const item of rawCards) {
    const card = normalizeMemoryCard(item, sessionId, finishedAt);
    if (card) memoryCards.push(card);
  }

  for (const card of memoryCards) {
    await prisma.memoryCard.upsert({
      where: { id: card.id },
      update: {
        isStale: card.isStale,
        content: card.content,
        evidence: serializeArray(card.evidence),
        sourceFiles: serializeArray(card.sourceFiles),
        retrieveWhen: serializeArray(card.retrieveWhen),
        staleIfChanged: serializeArray(card.staleIfChanged),
      },
      create: {
        id: card.id,
        sessionId,
        type: card.type,
        claimType: card.claimType,
        content: card.content,
        evidence: serializeArray(card.evidence),
        sourceFiles: serializeArray(card.sourceFiles),
        confidence: card.confidence,
        retrieveWhen: serializeArray(card.retrieveWhen),
        staleIfChanged: serializeArray(card.staleIfChanged),
        isStale: card.isStale,
        createdAt: new Date(card.createdAt),
      },
    });
  }

  const allSourceFiles = Array.from(new Set(memoryCards.flatMap((c) => c.staleIfChanged)));
  for (const relPath of allSourceFiles) {
    const absPath = path.join(bundle.repoPath, relPath);
    const hash = hashFile(absPath);
    if (!hash) continue;

    await prisma.sourceFileHash.upsert({
      where: { sessionId_filePath: { sessionId, filePath: relPath } },
      update: { hash },
      create: { sessionId, filePath: relPath, hash },
    });
  }

  return memoryCards;
}
