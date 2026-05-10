# Witsmith

Witsmith is a local safety, recorder, and evidence layer for AI coding-agent sessions. It gates risky commands through a repo contract, records observable evidence from a debugging session, and produces a session artifact that memory, analysis, and dashboard teammates can consume.

The project started with the name Blackbox, but the current CLI and implementation are named `witsmith`.

## Project Goal

Witsmith should become:

- A command gatekeeper.
- A session recorder.
- A debugging evidence collector.
- A handoff producer for analysis and dashboard teammates.
- Eventually, a memory and context system for future coding sessions.

Witsmith does not capture hidden chain-of-thought. It records observable evidence only: commands, command decisions, stdout/stderr, exit codes, git diffs, changed files, file hashes, agent-written trace summaries, and Witsmith contract decisions. Any hypotheses must be labeled as inference.

## Repo Layout

| Path | Contents |
|------|----------|
| `apps/cli/witsmith/` | Existing Python Witsmith CLI, demo repo, command gatekeeper, replay log, amend/rescue tooling. |
| `apps/cli/package.json` | Incomplete npm wrapper. It currently points to missing `./bin/witsmith.js` files, so do not rely on it yet. |
| `apps/backend/` | Backend workspace for future API/database integration. |
| `apps/frontend/` | Frontend workspace for dashboard/demo UI. |

## Current CLI Reality

The working CLI lives at `apps/cli/witsmith` and is run with `uv`:

```bash
cd apps/cli/witsmith
uv sync
uv run witsmith --help
uv run witsmith version
uv run witsmith scaffold --cwd .
uv run witsmith run "npm test" --cwd demo-repo --no-exec
uv run ruff check src scripts
```

Known blocker: `uv run witsmith --help` currently fails until `apps/cli/witsmith/README.md` exists, because `apps/cli/witsmith/pyproject.toml` declares `readme = "README.md"`.

The current CLI already supports:

```bash
witsmith run "command"
witsmith amend --last
witsmith rescue --last
witsmith scaffold
witsmith version
witsmith-server
```

The most important existing behavior is `witsmith run`. It finds `AGENT_WIT.yaml`, checks the command against Witsmith rules, decides `allow`, `ask`, or `deny`, optionally executes the command, and appends a JSON event to `.witsmith/log.jsonl`.

## Witsmith Contract

Repos use `AGENT_WIT.yaml` as the command safety contract. Keep the current Witsmith terms:

```yaml
allow:
  - pattern: "npm test"

ask:
  - pattern: "*prisma migrate*"

deny:
  - pattern: "git push --force*"
  - pattern: "DROP TABLE*"
```

Do not introduce `block` unless an adapter is explicitly added. Runtime data should live under `.witsmith/`, while `AGENT_WIT.yaml` should stay at the repo/project root unless the existing code changes.

## Integrated Session Flow

The recorder/session lifecycle should be added around the existing Witsmith CLI instead of creating a separate `blackbox` command.

Target loop:

```bash
witsmith init
witsmith start "Fix OAuth redirect bug"
# Cursor/IDE agent works
witsmith run "npm test"
witsmith finish
witsmith context "Add refresh-token validation"
```

Data flow:

```text
witsmith init
  -> creates .witsmith/, AGENT_WIT.yaml, Cursor rule

witsmith start "task"
  -> creates .witsmith/active-session.json
  -> creates .witsmith/agent-trace.md

witsmith run "command"
  -> checks AGENT_WIT.yaml
  -> records allow / ask / deny decision
  -> appends action event to .witsmith/log.jsonl

witsmith finish
  -> reads active session, log.jsonl, git diff, git status, trace
  -> writes .witsmith/sessions/<session_id>.json

memory layer
  -> reads session JSON
  -> generates memory cards
  -> stores stale-detection source hashes

dashboard
  -> reads mocked or real session/memory data
  -> displays session timeline, diff, commands, memories, and stale warnings
```

The main handoff artifact is:

```text
.witsmith/sessions/<session_id>.json
```

Expected shape:

```json
{
  "evidenceBundle": {
    "id": "session_...",
    "task": "Fix OAuth redirect bug",
    "repoPath": "...",
    "branch": "main",
    "baseCommit": "abc123",
    "endCommit": "abc123",
    "startedAt": "...",
    "finishedAt": "...",
    "status": "finished",
    "changedFiles": [],
    "diff": "...",
    "actions": [],
    "agentTrace": "..."
  },
  "report": {
    "summary": "...",
    "observedFacts": [],
    "agentReportedClaims": [],
    "inferredHypotheses": [],
    "memoryCards": []
  }
}
```

## Planned CLI Commands

Add these commands to the existing Python CLI:

```bash
witsmith init
witsmith start "task"
witsmith finish
witsmith context "new task"
witsmith stale-check
```

Keep these existing commands working:

```bash
witsmith run "command"
witsmith amend --last
witsmith rescue --last
witsmith scaffold
witsmith version
witsmith-server
```

`witsmith init` should create:

```text
.witsmith/
  config.json
  sessions/
  handoffs/

.cursor/
  rules/
    witsmith-memory.mdc

AGENT_WIT.yaml
  only if one does not already exist
```

`witsmith start "task"` should create `.witsmith/active-session.json` and `.witsmith/agent-trace.md`.

`witsmith finish` should package current-session actions from `.witsmith/log.jsonl`, git state, changed files, diff, and the agent trace into `.witsmith/sessions/<session_id>.json`.

`witsmith context "task"` should read session memory cards and write `.witsmith/context.md`.

`witsmith stale-check` should start as a placeholder that counts memory cards. Hash-based stale detection can come after the session artifact is stable.

## Four-Person Ownership

The four-person plan is organized around one shared interface: `.witsmith/sessions/<session_id>.json`.

### Tallal: CLI, Git Session Recorder, SQLite Foundation

Tallal owns the local Witsmith recorder and data capture layer.

Core work:

- Add `witsmith init`, `witsmith start`, `witsmith finish`, `witsmith context`, and `witsmith stale-check`.
- Reuse existing `witsmith run` and `.witsmith/log.jsonl` instead of creating duplicate command logs.
- Capture task description, session start/end timestamps, base git commit, git status, git diff, changed files, file hashes, and command/action logs.
- Produce `.witsmith/sessions/<session_id>.json` for every finished session.
- Add a SQLite foundation after the JSON artifact is stable, if time allows.
- Support fake/demo repo data for teammates.

Deliverables:

- Working Witsmith recorder commands.
- Session JSON saved locally.
- Demo session JSON.
- Optional SQLite schema for sessions, file changes, commands, memories, and memory source hashes.

Async boundary:

Tallal does not need the dashboard or LLM integrations to be complete. The session JSON is enough for other teammates to build against mocked or real data.

### Nour: Memory Generation, Retrieval, Stale Detection, Sponsor Integrations

Nour owns turning raw sessions into useful memories and retrieving them later.

Core work:

- Consume finished session JSON from Tallal.
- Generate 1-5 memory cards from task, diff, changed files, test output, errors, and final result.
- Implement `generateMemories(session)`.
- Implement `getContextForTask(task)`.
- Implement `runStaleCheck()`.
- Store memory cards and source file hashes in SQLite when available.
- Start with keyword retrieval for MVP.
- Add stale detection by comparing current file hashes against stored memory source hashes.
- Own the TypeScript/Prisma import layer that reads `.witsmith/sessions/<session_id>.json` and persists sessions, actions, memories, and source hashes.

Sponsor priority:

- CLōD for memory-card generation and next-run context generation.
- Nia by Nozomio for retrieval if time allows.
- Greptile for diff review and evidence enrichment if time allows.

Deliverables:

- Memory card JSON format.
- Generated memory cards.
- Non-stale context block output.
- Stored memory cards in SQLite or JSON-backed MVP.
- Session JSON importer into SQLite/Prisma.
- Optional sponsor-enriched memory metadata.

Async boundary:

Nour can work from a mocked `.witsmith/sessions/session_demo.json` before the real CLI is complete.

### Juan: Dashboard, Demo Flow, Visual Polish, Pitch Assets

Juan owns the product experience and demo.

Core work:

- Build a polished dashboard page.
- Show session timeline, changed files, git diff, test output, generated memory cards, stale-memory warnings, and next-run context.
- Build against mocked API responses first.
- Add demo seed data for the OAuth example.
- Prepare the pitch/demo script.

Tech stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma client or backend API when available

Sponsor display:

- Show `Generated by CLōD` on memory cards if present.
- Show `Retrieved by Nia` on relevant memories if present.
- Show `Diff reviewed by Greptile` if present.

Juan should consume sponsor outputs from the database/API, not own the sponsor integrations directly.

Deliverables:

- Dashboard or single-page MVP.
- Session detail view.
- Memory cards view.
- Stale warning UI.
- Context block UI.
- Demo script showing run 1, memory creation, run 2, and stale memory detection.

Async boundary:

Juan can build entirely against mocked session and memory responses while Tallal and Nour build the real pipeline.

### Fourth Teammate: Witsmith Safety, Contract Engine, Amend/Rescue

The fourth teammate owns the existing Witsmith safety and intelligence layer.

Core work:

- Maintain `AGENT_WIT.yaml` contract behavior.
- Improve `allow` / `ask` / `deny` command decisions.
- Keep `witsmith run` strong and stable.
- Maintain `.witsmith/log.jsonl` event quality.
- Own `witsmith amend --last`.
- Own `witsmith rescue --last`.
- Own CLōD-backed check/fallback behavior.
- Own `witsmith-server` and MCP tools.

Deliverables:

- Reliable command gatekeeper.
- Useful deny/ask reasons.
- Amend flow for contract updates.
- Rescue flow and handoff notes.
- Stable MCP/server behavior.

Async boundary:

The safety layer can improve independently as long as `.witsmith/log.jsonl` action events keep a stable shape for `witsmith finish`.

## Shared Interfaces

Use `.witsmith/log.jsonl` as the source of truth for action events:

```json
{
  "action_id": "act_...",
  "ts": "2026-...",
  "command": "npm test",
  "cwd": "...",
  "source": "user",
  "decision": "allow",
  "reason": "...",
  "matched_rule": "...",
  "confidence": 0.92,
  "cache_hit": false,
  "executed": true,
  "exit_code": 0,
  "stdout": "...",
  "stderr": "..."
}
```

Use `.witsmith/sessions/<session_id>.json` as the main cross-team handoff artifact.

Use memory cards shaped like:

```json
{
  "id": "memory_...",
  "sessionId": "session_...",
  "type": "episodic",
  "claimType": "observed",
  "content": "Previous session changed auth callback code and had one failed action.",
  "evidence": [],
  "sourceFiles": [],
  "confidence": "medium",
  "retrieveWhen": [],
  "staleIfChanged": [],
  "isStale": false,
  "createdAt": "..."
}
```

## SQLite / Prisma Boundary

Keep the Python Witsmith CLI as the source of truth for local capture. It writes `.witsmith/log.jsonl` and `.witsmith/sessions/<session_id>.json`.

Use TypeScript/Prisma as the application data layer for Nour and Juan. The recommended flow is:

```text
Python Witsmith CLI
  -> writes .witsmith/sessions/<session_id>.json
  -> TypeScript importer reads session JSON
  -> Prisma writes SQLite
  -> Nour generates and stores memory cards
  -> Juan dashboard reads from API/Prisma-backed data
```

Do not make the Python CLI depend on Prisma for the MVP. The CLI should remain useful even if the database layer is not running.

Recommended Prisma schema draft:

```prisma
model Session {
  id           String   @id
  task         String
  repoPath     String
  branch       String?
  baseCommit   String?
  endCommit    String?
  startedAt    DateTime
  finishedAt   DateTime?
  changedFiles Json
  diff         String?
  agentTrace   String?
  createdAt    DateTime @default(now())

  actions      CommandAction[]
  memories     MemoryCard[]
}

model CommandAction {
  id          String   @id
  sessionId   String
  timestamp   DateTime?
  command     String
  cwd         String?
  source      String?
  decision    String
  reason      String?
  matchedRule String?
  confidence  Float?
  cacheHit    Boolean  @default(false)
  executed    Boolean  @default(false)
  exitCode    Int?
  stdout      String?
  stderr      String?
  createdAt   DateTime @default(now())

  session     Session  @relation(fields: [sessionId], references: [id])
}

model MemoryCard {
  id             String   @id
  sessionId      String
  type           String
  claimType      String
  content        String
  evidence       Json
  sourceFiles    Json
  confidence     String
  retrieveWhen   Json
  staleIfChanged Json
  isStale        Boolean  @default(false)
  generatedBy    String?
  retrievedBy    String?
  reviewedBy     String?
  createdAt      DateTime @default(now())

  session        Session  @relation(fields: [sessionId], references: [id])
  sourceHashes   MemorySourceHash[]
}

model MemorySourceHash {
  id        String     @id
  memoryId  String
  filePath  String
  hash      String
  createdAt DateTime   @default(now())

  memory    MemoryCard @relation(fields: [memoryId], references: [id])
}
```

Nour can start with this importer contract:

```ts
type ImportSessionResult = {
  sessionId: string;
  actionCount: number;
  memoryCount: number;
};

async function importWitsmithSession(path: string): Promise<ImportSessionResult>;
async function generateMemories(sessionId: string): Promise<void>;
async function getContextForTask(task: string): Promise<string>;
async function runStaleCheck(): Promise<void>;
```

Juan can build against mocked API responses shaped around:

```ts
type DashboardSession = {
  id: string;
  task: string;
  branch?: string;
  startedAt: string;
  finishedAt?: string;
  changedFiles: string[];
  actions: CommandAction[];
  memories: MemoryCard[];
};
```

## What To Share With Nour And Juan

Share this with Nour:

```text
The Python Witsmith CLI is staying as the local recorder/gatekeeper. Your layer should consume `.witsmith/sessions/<session_id>.json`, import it into SQLite with Prisma, generate memory cards, store source file hashes, retrieve context for a new task, and mark memories stale when source hashes change.

Start with a mocked session JSON if the CLI output is not ready. Use CLōD for memory generation first. Nia and Greptile can be added as optional enrichments after the JSON/import path works.
```

Share this with Juan:

```text
Build the dashboard against mocked session and memory data first. The real data source will be `.witsmith/sessions/<session_id>.json` imported into SQLite/Prisma by Nour's layer. The dashboard should show session timeline, changed files, git diff, command results, Witsmith decisions, memory cards, stale warnings, and next-run context.

Do not call sponsor APIs directly from the dashboard. Display sponsor metadata if it exists, such as `generatedBy: "CLōD"`, `retrievedBy: "Nia"`, or `reviewedBy: "Greptile"`.
```

## MVP Priority

1. Fix Witsmith packaging by adding `apps/cli/witsmith/README.md`.
2. Add `witsmith init`, `start`, and `finish`.
3. Produce stable `.witsmith/sessions/<session_id>.json`.
4. Create a demo session JSON for Nour and Juan.
5. Add simple `context` and `stale-check`.
6. Define the SQLite/Prisma import contract around session JSON.
7. Add SQLite/Prisma implementation only after the JSON artifact is stable.
8. Keep sponsor integrations and dashboard polish decoupled through the shared JSON/database shape.

## Do Not Build Yet

- A separate `blackbox` CLI.
- A dashboard inside the CLI package.
- A new command log that duplicates `.witsmith/log.jsonl`.
- Hidden chain-of-thought capture.
- Cursor internals scraping.
- Full database-first architecture before session JSON is stable.

## Demo Story

Run 1:

- A stale doc or bad assumption causes a bug.
- Witsmith records the session.
- Witsmith gates commands and stores decisions.
- The session finishes and writes JSON.
- Memory cards are generated from the session.

Run 2:

- Witsmith context retrieves the relevant prior memory.
- The agent avoids repeating the same mistake.
- A source file changes.
- Stale detection marks old memory as stale.

## Align `apps/cli/witsmith/` With Another Working Copy

If the canonical hackathon edits live elsewhere, refresh `apps/cli/witsmith/` inside this fork with:

```bash
rsync -a \
  --exclude '.venv' --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  --exclude '__pycache__' --exclude '.env' --exclude '.DS_Store' \
  --exclude 'demo-repo/node_modules' --exclude '.ruff_cache' --exclude '.witsmith' \
  --exclude 'demo-repo/prisma/dev.db' --exclude 'demo-repo/prisma/dev.db-journal' \
  /path/to/cursor_van2026/ ./apps/cli/witsmith/
```
