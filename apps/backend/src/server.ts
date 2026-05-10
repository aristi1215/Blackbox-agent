import "./env";
import * as fs from "fs";
import express from "express";
import { persistSessionFromCliJson, prisma } from "../../core/dist/serverExports";
import { repoRoot } from "./env";
import { safeResolveImportJson } from "./importPaths";

const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/memories", async (_req, res) => {
  try {
    const rows = await prisma.memoryCard.findMany({
      orderBy: { createdAt: "desc" },
      include: { session: { select: { id: true, task: true } } },
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/sessions", async (_req, res) => {
  try {
    const rows = await prisma.session.findMany({
      orderBy: { finishedAt: "desc" },
      select: {
        id: true,
        task: true,
        branch: true,
        baseCommit: true,
        endCommit: true,
        startedAt: true,
        finishedAt: true,
        status: true,
        repoPath: true,
        changedFiles: true,
        _count: { select: { memoryCards: true } },
      },
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/sessions/:id", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { memoryCards: true },
    });
    if (!session) {
      res.status(404).json({ error: "session not found" });
      return;
    }

    let evidenceBundle: unknown = null;
    let report: unknown = {};
    try {
      const parsed = JSON.parse(session.rawBundle) as {
        evidenceBundle?: unknown;
        report?: unknown;
      };
      evidenceBundle = parsed.evidenceBundle ?? parsed;
      report = parsed.report ?? {};
    } catch {
      evidenceBundle = null;
    }

    const { rawBundle: _rb, ...sessionRest } = session;

    res.json({
      ...sessionRest,
      evidenceBundle,
      report,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/import", async (req, res) => {
  try {
    const bodyPath = req.body?.path as string | undefined;
    if (!bodyPath) {
      res.status(400).json({ error: 'JSON body must include "path" to session .json file' });
      return;
    }
    const resolved = safeResolveImportJson(repoRoot, bodyPath);
    const cards = await persistSessionFromCliJson(resolved);
    let sessionId: string | null = null;
    try {
      const j = JSON.parse(fs.readFileSync(resolved, "utf-8")) as {
        evidenceBundle?: { id?: string; sessionId?: string };
      };
      sessionId = j.evidenceBundle?.id ?? j.evidenceBundle?.sessionId ?? null;
    } catch {
      /* ignore */
    }

    res.json({
      ok: true,
      importedFrom: resolved,
      memoryCardsStored: cards.length,
      sessionId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(400).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`backend listening on http://localhost:${PORT}`);
});
