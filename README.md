# Blackbox-agent

Vancouver Cursor Hackathon 2026 monorepo fork: [`yaoDu/Blackbox-agent`](https://github.com/yaoDu/Blackbox-agent).

| Path | Contents |
|------|----------|
| `apps/*` | npm workspaces (`cli`, `backend`, `frontend` Vite app) |
| **`witsmith/`** | **Witsmith** — Python package (MCP + CLI, demo Next app under `witsmith/demo-repo/`) |

Witsmith setup: see **`witsmith/README.md`**. From repo root:

```bash
cd witsmith && uv sync && uv run witsmith scaffold
```

This folder is intentionally separate from the JS workspaces so uv/pyproject tooling stays scoped under `witsmith/`.

## Align `witsmith/` with your working copy

The canonical hackathon edits live under **`cursor_van2026`** (or any full clone); to refresh **`witsmith/`** inside this fork:

```bash
rsync -a \
  --exclude '.venv' --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  --exclude '__pycache__' --exclude '.env' --exclude '.DS_Store' \
  --exclude 'demo-repo/node_modules' --exclude '.ruff_cache' --exclude '.witsmith' \
  --exclude 'demo-repo/prisma/dev.db' --exclude 'demo-repo/prisma/dev.db-journal' \
  /path/to/cursor_van2026/ ./witsmith/
```

Example (adjust the source path): `~/Industry/Hackathon/cursor_van2026/` → `./witsmith/`. Then commit and push to [**yaoDu/Blackbox-agent**](https://github.com/yaoDu/Blackbox-agent).
