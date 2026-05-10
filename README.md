# Blackbox-agent

Vancouver Cursor Hackathon 2026 monorepo fork: [`yaoDu/Blackbox-agent`](https://github.com/yaoDu/Blackbox-agent).

| Path | Contents |
|------|----------|
| `apps/*` | npm workspaces (`cli`, `backend`, `frontend` Vite app). Witsmith’s Python package and demo app live under **`apps/cli/witsmith/`**. |

Witsmith is colocated under the CLI workspace so the monorepo keeps a single “agent CLI” subtree. From repo root:

```bash
cd apps/cli/witsmith && uv sync && uv run witsmith scaffold
```

## Align `apps/cli/witsmith/` with your working copy

The canonical hackathon edits may live elsewhere (for example **`cursor_van2026`**); to refresh **`apps/cli/witsmith/`** inside this fork:

```bash
rsync -a \
  --exclude '.venv' --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  --exclude '__pycache__' --exclude '.env' --exclude '.DS_Store' \
  --exclude 'demo-repo/node_modules' --exclude '.ruff_cache' --exclude '.witsmith' \
  --exclude 'demo-repo/prisma/dev.db' --exclude 'demo-repo/prisma/dev.db-journal' \
  /path/to/cursor_van2026/ ./apps/cli/witsmith/
```

Example (adjust the source path): `~/Industry/Hackathon/cursor_van2026/` → `./apps/cli/witsmith/`. Then commit and push to [**yaoDu/Blackbox-agent**](https://github.com/yaoDu/Blackbox-agent).
