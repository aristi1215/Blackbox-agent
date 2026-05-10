# @blackbox/core — API Reference

Memory generation, retrieval, and stale detection layer.
Consumes `.witsmith/sessions/<id>.json` from the CLI and exposes functions for the backend to serve.

---

## Setup

```ts
import { importSession, getContextForTask, runStaleCheck, loadMemories } from "@blackbox/core";
```

Requires in `.env`:
```
DATABASE_URL="file:./witsmith.db"
CLOD_API_KEY=<your key>
CLOD_FREE_MODEL=claude-haiku-4-5
CLOD_STRUCTURED_MODEL=claude-haiku-4-5
```

Run once to initialize the database:
```bash
cd apps/core
npx prisma db push
```

---

## Functions

### `importSession(sessionJsonPath)`

Reads a finished session JSON from the CLI, generates memory cards via CLōD, and stores everything in SQLite. Responses are cached — repeated calls on the same session are instant.

```ts
const cards = await importSession(
  "/path/to/.witsmith/sessions/session_123.json"
);
// returns MemoryCard[]
```

**When to call:** after `witsmith finish` writes a session file.

---

### `loadMemories(sessionId?)`

Returns all stored memory cards. Pass a `sessionId` to filter to one session.

```ts
const all = await loadMemories();
const forSession = await loadMemories("session_123");
// returns MemoryCard[]
```

---

### `getContextForTask(request, witsmithDir)`

Retrieves relevant non-stale memories for a new task using keyword search. Also writes `.witsmith/context.md` for Cursor to consume.

```ts
const result = await getContextForTask(
  { task: "Add refresh-token validation", limit: 5 },
  "/path/to/.witsmith"
);
// returns ContextResult
```

```ts
type ContextResult = {
  task: string;
  memories: MemoryCard[];
  contextBlock: string; // formatted string ready to show in UI or write to file
};
```

---

### `runStaleCheck(repoPath)`

Compares stored source file hashes against current file contents. Marks memories stale if their source files have changed.

```ts
const result = await runStaleCheck("/path/to/repo");
// returns { checked: number, staleCount: number, stalledMemories: MemoryCard[] }
```

---

## Backend Routes to Wire Up

| Route | Method | Calls | Returns |
|---|---|---|---|
| `/api/sessions` | GET | read `.witsmith/sessions/*.json` directly | `SessionFile[]` |
| `/api/sessions/:id` | GET | read `.witsmith/sessions/<id>.json` | `SessionFile` |
| `/api/memories` | GET | `loadMemories()` | `MemoryCard[]` |
| `/api/context` | POST | `getContextForTask(body, witsmithDir)` | `ContextResult` |
| `/api/stale-check` | POST | `runStaleCheck(repoPath)` | `{ checked, staleCount, stalledMemories }` |

### Example: Express backend

```ts
import express from "express";
import { loadMemories, getContextForTask, runStaleCheck } from "@blackbox/core";

const app = express();
app.use(express.json());

const WITSMITH_DIR = "/path/to/demo-repo/.witsmith";
const REPO_PATH = "/path/to/demo-repo";

app.get("/api/memories", async (req, res) => {
  const memories = await loadMemories();
  res.json(memories);
});

app.post("/api/context", async (req, res) => {
  const { task, limit } = req.body;
  const result = await getContextForTask({ task, limit }, WITSMITH_DIR);
  res.json(result);
});

app.post("/api/stale-check", async (req, res) => {
  const result = await runStaleCheck(REPO_PATH);
  res.json(result);
});

app.listen(3001);
```

---

## Key Types

```ts
type MemoryCard = {
  id: string;
  sessionId: string;
  type: "episodic" | "semantic" | "procedural" | "risk";
  claimType: "observed" | "agent_reported" | "inferred";
  content: string;
  evidence: string[];
  sourceFiles: string[];
  confidence: "low" | "medium" | "high";
  retrieveWhen: string[];
  staleIfChanged: string[];
  isStale: boolean;
  createdAt: string;
};

type SessionFile = {
  evidenceBundle: EvidenceBundle;
  report: DebugReport;
};
```

Full types are exported from `@blackbox/core` — import directly instead of redefining.

---

## Session File Location

The CLI writes session files to:
```
apps/cli/witsmith/demo-repo/.witsmith/sessions/<session_id>.json
```

Call `importSession()` pointing at this path after each `witsmith finish`.

---

## Notes

- All CLōD responses are cached in SQLite — second call on the same session is instant (~0ms vs ~40s)
- `getContextForTask` uses keyword search against `retrieveWhen` fields on each memory card
- `runStaleCheck` uses SHA256 file hashing — only flags stale when source files actually change
- Greptile diff enrichment is optional — skipped if `GREPTILE_API_KEY` is not set
