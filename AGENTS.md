# AGENTS.md

## Cursor Cloud specific instructions

### Architecture overview

Witsmith is a monorepo with four main components:

| Component | Path | Stack | Dev command |
|-----------|------|-------|-------------|
| Python CLI (witsmith) | `apps/cli/witsmith/` | Python 3.11+, uv, hatchling | `uv run witsmith --help` |
| Core library | `apps/core/` | TypeScript, Prisma, SQLite | `npm run core:build` (from root) |
| Backend API | `apps/backend/` | TypeScript, Express, tsx | `npm run backend:dev` (from root, port 4001) |
| Frontend dashboard | `apps/frontend/` | React 19, Vite 8, Tailwind 4 | `npm run frontend:dev` (from root, port 5173) |

### Key startup notes

- **`CLOD_API_KEY` must be set** (even a dummy value like `dummy-dev-key`) in `apps/backend/.env` to prevent the backend from crashing on startup. The `@blackbox/core` module eagerly instantiates an OpenAI client at import time which throws if no API key is found.
- **Mock LLM mode**: Set `WITSMITH_MOCK_LLM=1` in `apps/cli/witsmith/.env` to skip live LLM calls during CLI operations.
- **Prisma DB** lives at `apps/core/prisma/witsmith.db` (SQLite). Run `npx prisma db push` from `apps/core/` to create/sync the schema. Both `apps/core/.env` and `apps/backend/.env` must reference this DB.
- **Frontend proxies** `/api/*` requests to backend at `http://localhost:4001` via Vite config.
- **`@blackbox/core` must be built** (`npm run core:build`) before starting the backend, since the backend imports it as a workspace dependency and expects compiled JS in `apps/core/dist/`.

### Lint and test commands

- **Frontend lint**: `npm run frontend:lint` (ESLint; 2 pre-existing warnings in `useApi.ts`)
- **Python lint**: `cd apps/cli/witsmith && uv run ruff check src scripts`
- **Backend typecheck**: `cd apps/backend && npx tsc --noEmit`
- **CLI smoke test**: `cd apps/cli/witsmith && uv run witsmith version`

### CLI demo flow (recorder)

```bash
cd apps/cli/witsmith
uv run witsmith init --cwd demo-repo
uv run witsmith start "task description" --cwd demo-repo
uv run witsmith run "npm test" --cwd demo-repo --no-exec
uv run witsmith finish --cwd demo-repo
```

Session JSON is written to `demo-repo/.witsmith/sessions/` and served by the backend at `GET /api/sessions`.

### Environment variables

Create `.env` files from the `.env.example` templates in `apps/cli/witsmith/`, `apps/backend/`, and `apps/core/`. The backend `.env` needs at minimum: `REPO_PATH`, `DATABASE_URL`, `PORT`, and `CLOD_API_KEY`.
