# Witsmith

Agent permission system that learns from prompt injections (Cursor Vancouver hackathon build).

Run from this directory (the Witsmith package root — in the monorepo it is **`witsmith/`** next to `apps/*`):

```bash
uv sync
uv run witsmith scaffold          # DONE.md / AGENTS.md / RECENT_NOTES.md beside the wit if missing
cp .env.example .env              # then fill CLOD_* / OPENAI_* / WITSMITH_*
uv run python scripts/smoke_clod.py
uv run witsmith-server            # MCP on stdio; Ctrl-C to stop
```

**Next.js + Prisma backup path:** `demo-repo/README.md`.

**Monorepo:** clone [yaoDu/Blackbox-agent](https://github.com/yaoDu/Blackbox-agent); this Python project is only under **`witsmith/`** (see repo root `README.md`). Run `cd witsmith` before the commands above.