// Load env BEFORE any other imports so Prisma picks up DATABASE_URL
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

import * as path from "path";
import * as fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { loadMemories, getContextForTask, runStaleCheck, SessionFile } from "@blackbox/core";

const app = express();
const PORT = process.env.PORT ?? 3001;
const WITSMITH_DIR = process.env.WITSMITH_DIR ?? "";
const REPO_PATH = process.env.REPO_PATH ?? process.cwd();

app.use(cors());
app.use(express.json());

// ── GET /health ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

// ── GET /api/sessions ────────────────────────────────────────────────────────
// Returns all session files from .witsmith/sessions/
app.get("/api/sessions", (_req: Request, res: Response) => {
  const sessionsDir = path.join(WITSMITH_DIR, "sessions");
  if (!fs.existsSync(sessionsDir)) {
    res.json([]);
    return;
  }

  const sessions = fs
    .readdirSync(sessionsDir)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(sessionsDir, file), "utf-8")) as SessionFile;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  res.json(sessions);
});

// ── GET /api/sessions/:id ────────────────────────────────────────────────────
// Returns a single session file by session ID
app.get("/api/sessions/:id", (req: Request, res: Response) => {
  const sessionPath = path.join(WITSMITH_DIR, "sessions", `${req.params.id}.json`);
  if (!fs.existsSync(sessionPath)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  try {
    const session = JSON.parse(fs.readFileSync(sessionPath, "utf-8")) as SessionFile;
    res.json(session);
  } catch {
    res.status(500).json({ error: "Failed to read session file" });
  }
});

// ── GET /api/memories ────────────────────────────────────────────────────────
// Returns all memory cards from SQLite, optionally filtered by sessionId
app.get("/api/memories", async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string | undefined;
    const memories = await loadMemories(sessionId);
    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: "Failed to load memories", detail: String(err) });
  }
});

// ── POST /api/context ────────────────────────────────────────────────────────
// Body: { task: string, limit?: number }
// Returns relevant non-stale memories for the given task
app.post("/api/context", async (req: Request, res: Response) => {
  const { task, limit } = req.body as { task?: string; limit?: number };
  if (!task) {
    res.status(400).json({ error: "task is required" });
    return;
  }

  try {
    const result = await getContextForTask({ task, limit }, WITSMITH_DIR);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to get context", detail: String(err) });
  }
});

// ── POST /api/stale-check ────────────────────────────────────────────────────
// Checks all memory cards for staleness based on source file hashes
app.post("/api/stale-check", async (_req: Request, res: Response) => {
  try {
    const result = await runStaleCheck(REPO_PATH);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Stale check failed", detail: String(err) });
  }
});

// ── error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Witsmith API running on http://localhost:${PORT}`);
  console.log(`  WITSMITH_DIR: ${WITSMITH_DIR}`);
  console.log(`  REPO_PATH:    ${REPO_PATH}`);
});
